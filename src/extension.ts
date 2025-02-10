import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { unlockAchievement } from './utils/unlockAchievement'; // Import the unlockAchievement function

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
                this._view.webview.html = this.getWebviewContent();
            }
        }

        private getWebviewContent(): string {
            return `
                <html>
                    <head>
                        <style>
                            body {
                                display: flex;
                                flex-direction: column;
                                align-items: center;
                                justify-content: center;
                                text-align: center;
                            }
                            .achievement {
                                position: relative;
                                display: inline-block;
                                margin: 10px;
                            }
                            .achievement .tooltip {
                                visibility: hidden;
                                width: 120px;
                                background-color: black;
                                color: #fff;
                                text-align: center;
                                border-radius: 6px;
                                padding: 5px;
                                position: absolute;
                                z-index: 1;
                                bottom: 125%;
                                left: 50%;
                                margin-left: -60px;
                                opacity: 0;
                                transition: opacity 0.3s;
                            }
                            .achievement:hover {
                                transform: scale(1.2);
                            }
                            .achievement:hover .tooltip {
                                visibility: visible;
                                opacity: 1;
                            }
                            .gold {
                                border: 2px solid gold;
                            }
                            .silver {
                                border: 2px solid silver;
                            }
                            .bronze {
                                border: 2px solid bronze;
                            }
                        </style>
                    </head>
                    <body>
                        <h1>Achievements</h1>
                        <h3>Unlocked: ${achievements.filter(a => a.unlocked).length} / ${achievements.length}</h3>
                        <ul style="list-style-type:none; padding: 0;">
                            ${achievements.filter(a => a.unlocked).map(ach => `
                                <li class="achievement">
                                    <img src="${this._view?.webview.asWebviewUri(vscode.Uri.joinPath(this._context.extensionUri, ach.icon))}" width="50" height="50" class="${ach.tier}" />
                                    <div class="tooltip">${ach.description}</div>
                                </li>
                            `).join('')}
                        </ul>
                        <h3>Locked: ${achievements.filter(a => !a.unlocked).length}</h3>
                        <ul style="list-style-type:none; padding: 0;">
                            ${achievements.filter(a => !a.unlocked).map(ach => `
                                <li class="achievement">
                                    <img src="${this._view?.webview.asWebviewUri(vscode.Uri.joinPath(this._context.extensionUri, ach.icon))}" width="50" height="50" class="${ach.tier}" />
                                    <div class="tooltip">${ach.description}</div>
                                </li>
                            `).join('')}
                        </ul>
                    </body>
                </html>
            `;
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