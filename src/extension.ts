import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { unlockAchievement } from './utils/unlockAchievement';
import { getWebviewContent } from './webviewContent';
import { initializeUpgradableAchievements } from './utils/initializeAchievements';

export interface Achievement {
    name: string;
    icon: string;
    description: string;
    unlocked: boolean;
    tier: 'diamond' | 'gold' | 'silver' | 'bronze';
    type?: 'upgradable' | 'unique';
    baseId?: string; // For upgradable achievements
    currentValue?: number; // Current progress value
    currentTier?: number; // Current tier index (0-3)
    tiers?: Array<{
        name: string;
        target: number;
        tier: 'diamond' | 'gold' | 'silver' | 'bronze';
        description: string;
    }>;
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
            console.log('🔄 Starting achievement reset process...');              // Reset all achievements to unlocked=false and reset progress
            achievements.forEach(a => {
                a.unlocked = false;
                if (a.type === 'upgradable') {
                    a.currentValue = 0;
                    a.currentTier = 0;
                    // Reset to bronze tier for display
                    if (a.tiers && a.tiers.length > 0) {
                        a.tier = a.tiers[0].tier;
                    }
                }
            });
            
            // Save to file with pretty formatting
            fs.writeFileSync(achievementsFilePath, JSON.stringify(achievements, null, 2), 'utf8');
            console.log('💾 Achievements file reset and saved successfully to:', achievementsFilePath);
            
            // Make sure we reload the achievements array from the file
            try {
                achievements = JSON.parse(fs.readFileSync(achievementsFilePath, 'utf8'));
                console.log('📄 Reloaded achievements from file, count:', achievements.length);
            } catch (readError) {
                console.error('❌ Failed to reload achievements from file:', readError);
            }
            
            // Reset all tracking modules
            try {
                console.log('🔄 Resetting tracking modules...');
                
                const typingModule = require('./achievements/typing');
                if (typingModule && typeof typingModule.resetCharacterCounts === 'function') {
                    typingModule.resetCharacterCounts();
                    console.log('✅ Typing module reset');
                }
                
                const timeModule = require('./achievements/time-based');
                if (timeModule && typeof timeModule.resetTimeTracking === 'function') {
                    timeModule.resetTimeTracking();
                    console.log('✅ Time module reset');
                }
                
                const languageModule = require('./achievements/language-specific');
                if (languageModule && typeof languageModule.resetLanguageTracking === 'function') {
                    languageModule.resetLanguageTracking();
                    console.log('✅ Language module reset');
                }
                
                const timeOfDayModule = require('./achievements/time-of-day');
                if (timeOfDayModule && typeof timeOfDayModule.resetTimeOfDayTracking === 'function') {
                    timeOfDayModule.resetTimeOfDayTracking();
                    console.log('✅ Time of day module reset');
                }
                
                const gitDebugModule = require('./achievements/git-debug');
                if (gitDebugModule && typeof gitDebugModule.resetGitDebugTracking === 'function') {
                    gitDebugModule.resetGitDebugTracking();
                    console.log('✅ Git/Debug module reset');
                }
                
                const dailyStreaksModule = require('./achievements/daily-streaks');
                if (dailyStreaksModule && typeof dailyStreaksModule.resetStreakData === 'function') {
                    dailyStreaksModule.resetStreakData();
                    console.log('✅ Daily streaks module reset');
                }
                
                const fileExplorerModule = require('./achievements/file-explorer');
                if (fileExplorerModule && typeof fileExplorerModule.resetFileExplorerTracking === 'function') {
                    fileExplorerModule.resetFileExplorerTracking();
                    console.log('✅ File explorer module reset');
                }
                
                const workaholicModule = require('./achievements/workaholic');
                if (workaholicModule && typeof workaholicModule.resetWorkaholicTracking === 'function') {
                    workaholicModule.resetWorkaholicTracking();
                    console.log('✅ Workaholic module reset');
                }
                
                const weekendWarriorModule = require('./achievements/weekend-warrior');
                if (weekendWarriorModule && typeof weekendWarriorModule.resetWeekendTracking === 'function') {
                    weekendWarriorModule.resetWeekendTracking();
                    console.log('✅ Weekend Warrior module reset');
                }
                
                console.log('✅ All achievement tracker modules reset successfully');
            } catch (moduleError) {
                console.error('❌ Error resetting achievement tracker modules:', moduleError);
            }
            
            vscode.window.showInformationMessage('All achievements have been reset! Starting from scratch.');
            console.log('✅ Reset process completed successfully');
            return true;
        } catch (error) {
            console.error('❌ Error resetting achievements:', error);
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
                console.log('📨 Received message from webview:', message);
                switch (message.command) {
                    case 'refresh':
                        console.log('🔄 Refreshing webview');
                        this.updateWebview();
                        break;
                    case 'reset':
                        console.log('🔄 Resetting achievements from webview');
                        const success = resetAllAchievements();
                        console.log(`Reset operation ${success ? 'succeeded' : 'failed'}`);
                        if (success) {
                            try {
                                // Force reload the achievements first to ensure we have updated data
                                achievements = JSON.parse(fs.readFileSync(achievementsFilePath, 'utf8'));
                                console.log('📄 Reloaded achievements after reset, unlocked count:', 
                                    achievements.filter(a => a.unlocked).length);
                            } catch (error) {
                                console.error('❌ Failed to reload achievements after reset:', error);
                            }
                            this.updateWebview();
                            updateStatusBar();
                            // Send confirmation back to webview
                            webviewView.webview.postMessage({ command: 'resetComplete', success: true });
                        } else {
                            // Send error message back to webview
                            webviewView.webview.postMessage({ command: 'resetComplete', success: false });
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
        const unlockedCount = achievements.filter(a => a.unlocked).length;
        const totalCount = achievements.length;
        statusBarItem.tooltip = `${unlockedCount}/${totalCount} achievements unlocked`;
        console.log(`📊 Status bar updated: ${unlockedCount}/${totalCount} achievements`);
    }    // Manual activation command
    let activateCommand = vscode.commands.registerCommand('coding-achievements.activate', () => {
        unlockAchievement(achievements, '🏆 First Save!', achievementsFilePath, sidebarProvider);
        updateStatusBar();
    });

    // Reset command to reset achievements
    let resetCommand = vscode.commands.registerCommand('coding-achievements.reset', () => {
        resetAllAchievements();
        sidebarProvider.refresh();
        updateStatusBar();
    });

    context.subscriptions.push(activateCommand, resetCommand);    // Register all achievement modules
    require('./achievements/save');
    require('./achievements/typing');
    require('./achievements/time-based');
    require('./achievements/language-specific');
    require('./achievements/time-of-day');
    require('./achievements/git-debug');
    require('./achievements/daily-streaks');
    require('./achievements/file-explorer');
    require('./achievements/workaholic');
    require('./achievements/weekend-warrior');
    
    // Initialize upgradable achievements with current progress
    initializeUpgradableAchievements();
    
    // Update status bar on activation
    updateStatusBar();
}

export function deactivate() {
    console.log('❌ Code Achievements extension is now deactivated.');
}