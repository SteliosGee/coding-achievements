import * as vscode from 'vscode';
import { unlockAchievement } from '../utils/unlockAchievement';
import { achievements, achievementsFilePath, sidebarProvider } from '../extension';

// Track Git operations - use a unique command name
const disposable = vscode.commands.registerCommand('coding-achievements.trackGitCommit', () => {
    unlockAchievement(achievements, 'Commit Champion', achievementsFilePath, sidebarProvider);
});

// Listen to git extension's commit event instead of trying to override it
vscode.commands.executeCommand('setContext', 'git.commitCommand', 'coding-achievements.trackGitCommit');

// Track when Git commits happen by watching for repository changes
try {
    // Use the git extension API if available
    const gitExtension = vscode.extensions.getExtension('vscode.git')?.exports;
    if (gitExtension) {
        const api = gitExtension.getAPI(1);
        if (api) {
            api.onDidChangeRepository((e: any) => {
                // This will fire when repository state changes (like after commits)
                unlockAchievement(achievements, 'Commit Champion', achievementsFilePath, sidebarProvider);
            });
        }
    }
} catch (error) {
    console.log('Git extension API not available, using fallback tracking');
}

// Track debugging sessions
vscode.debug.onDidStartDebugSession(() => {
    unlockAchievement(achievements, 'Bug Squasher', achievementsFilePath, sidebarProvider);
});

// Reset git and debug tracking
export function resetGitDebugTracking() {
    // Nothing to reset for these one-time achievements
}