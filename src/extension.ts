import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { unlockAchievement } from './utils/unlockAchievement';
import { getWebviewContent } from './webviewContent';
import { setContext, loadAchievementDefs, loadAchievementProgress, saveAchievementDefs, saveAchievementProgress, migrateFromFileStorage, isFirstRun, markInitialized, resetAllTracking, getLastSeenVersion, setLastSeenVersion } from './utils/storage';

// Static imports for all achievement modules (esbuild bundles them into one file)
import { init as initSave } from './achievements/save';
import { init as initTyping, resetCharacterCounts } from './achievements/typing';
import { init as initTimeBased, resetTimeTracking } from './achievements/time-based';
import { init as initLanguageSpecific, resetLanguageTracking } from './achievements/language-specific';
import { init as initTimeOfDay, resetTimeOfDayTracking, disposeTimeOfDayTracking } from './achievements/time-of-day';
import { init as initGitDebug, resetGitDebugTracking } from './achievements/git-debug';
import { init as initDailyStreaks, resetStreakData } from './achievements/daily-streaks';
import { init as initFileExplorer, resetFileExplorerTracking } from './achievements/file-explorer';
import { init as initWeekendWarrior, resetWeekendTracking } from './achievements/weekend-warrior';
import { init as initFlowState, resetFlowStateTracking } from './achievements/flow-state';
import { init as initWorkaholic, resetWorkaholicTracking } from './achievements/workaholic';

export interface Achievement {
    name: string;
    icon: string;
    description: string;
    unlocked: boolean;
    tier: 'diamond' | 'gold' | 'silver' | 'bronze';
    type?: 'upgradable' | 'unique';
    baseId?: string;
    currentValue?: number;
    currentTier?: number;
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

const RESET_FNS: Array<() => void> = [
    resetCharacterCounts,
    resetTimeTracking,
    resetLanguageTracking,
    resetTimeOfDayTracking,
    resetGitDebugTracking,
    resetStreakData,
    resetFileExplorerTracking,
    resetWeekendTracking,
    resetFlowStateTracking,
    resetWorkaholicTracking,
];

const INIT_FNS: Array<() => void> = [
    initSave,
    initTyping,
    initTimeBased,
    initLanguageSpecific,
    initTimeOfDay,
    initGitDebug,
    initDailyStreaks,
    initFileExplorer,
    initWeekendWarrior,
    initFlowState,
    initWorkaholic,
];

function loadAchievementsFromStorage(): Achievement[] {
    const defs = loadAchievementDefs();
    const progress = loadAchievementProgress();

    return defs.map(def => {
        const key = def.baseId || def.name;
        const user = progress[key];

        return {
            ...def,
            unlocked: user?.unlocked || false,
            currentValue: user?.currentValue || 0,
            currentTier: user?.currentTier || 0,
            tier: (user?.tier as Achievement['tier']) || def.tier
        };
    });
}

function saveAchievementsToStorage(): void {
    const progress: Record<string, { unlocked: boolean; currentValue: number; currentTier: number; tier: string }> = {};

    achievements.forEach(ach => {
        const key = ach.baseId || ach.name;
        progress[key] = {
            unlocked: ach.unlocked,
            currentValue: ach.currentValue || 0,
            currentTier: ach.currentTier || 0,
            tier: ach.tier
        };
    });

    saveAchievementProgress(progress);
    saveAchievementDefs(achievements);
}

export function activate(context: vscode.ExtensionContext) {
    console.log('Code Achievements extension is now active!');

    // 1. Initialize storage with VS Code context
    setContext(context);
    achievementsFilePath = path.join(context.extensionPath, 'achievements.json');

    // 2. Migrate data from old file-based storage (one-time)
    migrateFromFileStorage();

    // 3. Load achievements with user progress
    achievements = loadAchievementsFromStorage();

    // 4. First-run onboarding
    const firstRun = isFirstRun();
    if (firstRun) {
        markInitialized();
    }

    // 4b. Changelog notification on update
    try {
        const pkgPath = path.join(context.extensionPath, 'package.json');
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        const currentVersion: string = pkg.version;
        const lastSeen = getLastSeenVersion();

        if (lastSeen && lastSeen !== currentVersion) {
            vscode.window.showInformationMessage(
                `Coding Achievements updated to v${currentVersion}! Progress is now stored persistently and survives updates.`
            );
        }
        setLastSeenVersion(currentVersion);
    } catch {
        // Ignore errors reading package.json
    }

    // 5. Reset all achievement trackers
    function resetAllAchievements(): boolean {
        try {
            achievements.forEach(a => {
                a.unlocked = false;
                if (a.type === 'upgradable') {
                    a.currentValue = 0;
                    a.currentTier = 0;
                    if (a.tiers && a.tiers.length > 0) {
                        a.tier = a.tiers[0].tier;
                    }
                }
            });

            saveAchievementsToStorage();
            resetAllTracking();

            // Reset all tracking modules
            RESET_FNS.forEach(fn => fn());

            vscode.window.showInformationMessage('All achievements have been reset! Starting from scratch.');
            return true;
        } catch (error) {
            console.error('Error resetting achievements:', error);
            vscode.window.showErrorMessage('Failed to reset achievements. Check console for details.');
            return false;
        }
    }

    // 6. Sidebar webview provider
    class SidebarProvider implements vscode.WebviewViewProvider {
        public readonly viewType = 'coding-achievements-sidebar';
        public _view?: vscode.WebviewView;

        constructor(private readonly _context: vscode.ExtensionContext) {}

        resolveWebviewView(webviewView: vscode.WebviewView) {
            this._view = webviewView;
            webviewView.webview.options = {
                enableScripts: true,
                localResourceRoots: [this._context.extensionUri]
            };

            webviewView.webview.onDidReceiveMessage(message => {
                switch (message.command) {
                    case 'refresh':
                        this.updateWebview();
                        break;
                    case 'reset':
                        if (resetAllAchievements()) {
                            achievements = loadAchievementsFromStorage();
                            this.updateWebview();
                            updateStatusBar();
                            webviewView.webview.postMessage({ command: 'resetComplete', success: true });
                        } else {
                            webviewView.webview.postMessage({ command: 'resetComplete', success: false });
                        }
                        break;
                    case 'dismissOnboarding':
                        // First-run onboarding dismissed — no action needed
                        break;
                }
            });

            // Show onboarding on first run
            if (firstRun) {
                webviewView.webview.postMessage({ command: 'showOnboarding' });
            }

            this.updateWebview();
        }

        private updateWebview() {
            if (this._view) {
                this._view.webview.html = getWebviewContent(this._view, this._context);
            }
        }

        public refresh() {
            achievements = loadAchievementsFromStorage();
            this.updateWebview();
        }
    }

    sidebarProvider = new SidebarProvider(context);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('coding-achievements-sidebar', sidebarProvider)
    );

    // 7. Status bar
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.text = "$(star) Achievements";
    statusBarItem.tooltip = `${achievements.filter(a => a.unlocked).length}/${achievements.length} achievements unlocked`;
    statusBarItem.command = 'workbench.view.extension.codingAchievements';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);

    function updateStatusBar() {
        const unlockedCount = achievements.filter(a => a.unlocked).length;
        const totalCount = achievements.length;
        statusBarItem.tooltip = `${unlockedCount}/${totalCount} achievements unlocked`;
    }

    // 8. Commands
    const activateCommand = vscode.commands.registerCommand('coding-achievements.activate', () => {
        unlockAchievement(achievements, '🏆 First Save!', achievementsFilePath, sidebarProvider);
        updateStatusBar();
    });

    const resetCommand = vscode.commands.registerCommand('coding-achievements.reset', () => {
        resetAllAchievements();
        sidebarProvider?.refresh();
        updateStatusBar();
    });

    context.subscriptions.push(activateCommand, resetCommand);

    // 9. Initialize all achievement modules (load data + register listeners)
    INIT_FNS.forEach(fn => fn());

    updateStatusBar();
}

export function deactivate() {
    disposeTimeOfDayTracking();
    console.log('Code Achievements extension is now deactivated.');
}
