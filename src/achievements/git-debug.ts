import * as vscode from 'vscode';
import { unlockAchievement } from '../utils/unlockAchievement';
import { achievements, achievementsFilePath, sidebarProvider } from '../extension';

// Track Git operations
vscode.commands.registerCommand('git.commit', () => {
    setTimeout(() => {
        unlockAchievement(achievements, 'Commit Champion', achievementsFilePath, sidebarProvider);
    }, 1000); // Small delay to ensure the git command runs first
});

// Track debugging sessions
vscode.debug.onDidStartDebugSession(() => {
    unlockAchievement(achievements, 'Bug Squasher', achievementsFilePath, sidebarProvider);
});

// Reset git and debug tracking
export function resetGitDebugTracking() {
    // Nothing to reset for these one-time achievements
}