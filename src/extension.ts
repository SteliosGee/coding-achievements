import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { unlockAchievement } from './utils/unlockAchievement';
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

    // Function to reset all achievement trackers
    function resetAllAchievements() {
        try {
            // Reset all achievements to unlocked=false
            achievements.forEach(a => a.unlocked = false);
            
            // Save to file with pretty formatting
            fs.writeFileSync(achievementsFilePath, JSON.stringify(achievements, null, 2), 'utf8');
            console.log('💾 Achievements file reset and saved successfully');
            
            // Make sure we reload the achievements array from the file
            achievements = JSON.parse(fs.readFileSync(achievementsFilePath, 'utf8'));
            
            // Reset all tracking modules
            try {
                const typingModule = require('./achievements/typing');
                typingModule.resetCharacterCounts();
                
                const timeModule = require('./achievements/time-based');
                if (timeModule && typeof timeModule.resetTimeTracking === 'function') {
                    timeModule.resetTimeTracking();
                }
                
                const languageModule = require('./achievements/language-specific');
                if (languageModule && typeof languageModule.resetLanguageTracking === 'function') {
                    languageModule.resetLanguageTracking();
                }
                
                const timeOfDayModule = require('./achievements/time-of-day');
                if (timeOfDayModule && typeof timeOfDayModule.resetTimeOfDayTracking === 'function') {
                    timeOfDayModule.resetTimeOfDayTracking();
                }
                
                const gitDebugModule = require('./achievements/git-debug');
                if (gitDebugModule && typeof gitDebugModule.resetGitDebugTracking === 'function') {
                    gitDebugModule.resetGitDebugTracking();
                }
                
                console.log('🔄 All achievement tracker modules reset successfully');
            } catch (moduleError) {
                console.error('Error resetting achievement tracker modules:', moduleError);
            }
            
            vscode.window.showInformationMessage('All achievements have been reset! Starting from scratch.');
            return true;
        } catch (error) {
            console.error('Error resetting achievements:', error);
            vscode.window.showErrorMessage('Failed to reset achievements. Check console for details.');
            return false;
        }
    }

    class SidebarProvider implements vscode.WebviewViewProvider {
        public readonly viewType = 'coding-achievements-sidebar';
        private _view?: vscode.WebviewView;
    
        constructor(private readonly _context: vscode.ExtensionContext) {}
    
        resolveWebviewView(webviewView: vscode.WebviewView) {
            this._view = webviewView;
            webviewView.webview.options = { 
                enableScripts: true,
                localResourceRoots: [this._context.extensionUri]
            };
            
            // Handle messages from the webview
            webviewView.webview.onDidReceiveMessage(message => {
                console.log('Received message from webview:', message);
                switch (message.command) {
                    case 'refresh':
                        console.log('Refreshing webview');
                        this.updateWebview();
                        break;
                    case 'reset':
                        console.log('Resetting achievements from webview');
                        const success = resetAllAchievements();
                        if (success) {
                            // Force reload the achievements first to ensure we have updated data
                            achievements = JSON.parse(fs.readFileSync(achievementsFilePath, 'utf8'));
                            this.updateWebview();
                            updateStatusBar();
                        }
                        break;
                }
            });
            
            this.updateWebview();
        }
    
        private updateWebview() {
            if (this._view) {
                // Make sure we're working with the latest data
                this._view.webview.html = getWebviewContent(this._view, this._context);
            }
        }
    
        public refresh() {
            // Make sure we're working with the latest data before refreshing
            try {
                achievements = JSON.parse(fs.readFileSync(achievementsFilePath, 'utf8'));
            } catch (e) {
                console.error('Error reloading achievements during refresh:', e);
            }
            this.updateWebview();
        }
    }
    
    sidebarProvider = new SidebarProvider(context);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('coding-achievements-sidebar', sidebarProvider)
    );

    // Register status bar item to show quick stats
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.text = "$(star) Achievements";
    statusBarItem.tooltip = `${achievements.filter(a => a.unlocked).length}/${achievements.length} achievements unlocked`;
    statusBarItem.command = 'workbench.view.extension.codingAchievements';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);

    // Update status bar when achievements change
    function updateStatusBar() {
        statusBarItem.tooltip = `${achievements.filter(a => a.unlocked).length}/${achievements.length} achievements unlocked`;
    }

    // Manual activation command
    let activateCommand = vscode.commands.registerCommand('coding-achievements.activate', () => {
        unlockAchievement(achievements, '🏆 Achievement Unlocked: First Save!', achievementsFilePath, sidebarProvider);
        updateStatusBar();
    });

    // Reset command to reset achievements
    let resetCommand = vscode.commands.registerCommand('coding-achievements.reset', () => {
        resetAllAchievements();
        sidebarProvider.refresh();
        updateStatusBar();
    });

    context.subscriptions.push(activateCommand, resetCommand);

    // Register all achievement modules
    require('./achievements/save');
    require('./achievements/typing');
    require('./achievements/time-based');
    require('./achievements/language-specific');
    require('./achievements/time-of-day');
    require('./achievements/git-debug');
    
    // Update status bar on activation
    updateStatusBar();
}

export function deactivate() {
    console.log('❌ Code Achievements extension is now deactivated.');
}