import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { unlockAchievement } from './utils/unlockAchievement'; // Import the unlockAchievement function
import { getWebviewContent } from './webviewContent';

export interface Achievement {
    name: string;
    icon: string;
    description: string;
    unlocked: boolean;
    tier: 'diamond' | 'gold' | 'silver' | 'bronze';
}

export let achievements: Achievement[] = [];
export let achievementsFilePath: string;
export let sidebarProvider: any;

export function activate(context: vscode.ExtensionContext) {
    console.log('✅ Code Achievements extension is now active!');

    achievementsFilePath = path.join(context.extensionPath, 'achievements.json');

    if (fs.existsSync(achievementsFilePath)) {
        console.log('📄 Achievements file found:', achievementsFilePath);
        achievements = JSON.parse(fs.readFileSync(achievementsFilePath, 'utf8'));
    } else {
        console.error('⚠️ Achievements file not found:', achievementsFilePath);
    }


    class SidebarProvider implements vscode.WebviewViewProvider {
        public readonly viewType = 'coding-achievements-sidebar';
        private _view?: vscode.WebviewView;
    
        constructor(private readonly _context: vscode.ExtensionContext) {}
    
        resolveWebviewView(webviewView: vscode.WebviewView) {
            this._view = webviewView;
            webviewView.webview.options = { enableScripts: true };
            this.updateWebview();
        }
    
        private updateWebview() {
            if (this._view) {
                this._view.webview.html = getWebviewContent(this._view, this._context);
            }
        }
    
        public refresh() {
            this.updateWebview();
        }
    }
    

    sidebarProvider = new SidebarProvider(context);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('coding-achievements-sidebar', sidebarProvider)
    );

    // Manual activation command
    let activateCommand = vscode.commands.registerCommand('coding-achievements.activate', () => {
        unlockAchievement(achievements, '✅ Code Achievements manually activated!', achievementsFilePath, sidebarProvider);
    });

    // Reset command to reset achievements
    let resetCommand = vscode.commands.registerCommand('coding-achievements.reset', () => {
        achievements.forEach(a => a.unlocked = false);
        fs.writeFileSync(achievementsFilePath, JSON.stringify(achievements, null, 2));
        sidebarProvider.refresh();

        // Reset totalCharacters and addedCharacters
        const typingModule = require('./achievements/typing');
        typingModule.resetCharacterCounts();
    });

    context.subscriptions.push(activateCommand, resetCommand);

    // Register save.ts functionality
    require('./achievements/save');
    require('./achievements/typing');
}

export function deactivate() {
    console.log('❌ Code Achievements extension is now deactivated.');
}