import * as vscode from 'vscode';
import { unlockAchievement } from '../utils/unlockAchievement';
import { achievements, achievementsFilePath, sidebarProvider } from '../extension';
import { recordDebugFix } from './daily-streaks';

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

// Listen for commit message that contains "fix" or "bug"
vscode.commands.registerCommand('git.commitWithInput', async (args: any) => {
    const originalCommand = args.getOriginalCommand();
    const message = await vscode.window.showInputBox({ prompt: "Enter commit message" });
    
    if (message && (message.toLowerCase().includes('fix') || message.toLowerCase().includes('bug'))) {
        // This likely indicates a bug fix
        recordDebugFix();
    }
    
    return vscode.commands.executeCommand(originalCommand, args);
});

// Track debugging sessions
vscode.debug.onDidStartDebugSession(() => {
    unlockAchievement(achievements, 'Bug Squasher', achievementsFilePath, sidebarProvider);
});

// When debugging ends successfully, there's a chance it was fixing a bug
vscode.debug.onDidTerminateDebugSession((session) => {
    if (session.type !== 'node') {  // Skip Node.js runtime debugging
        // 50% chance to count as a bug fix when a debug session ends successfully
        // This is a heuristic approach - you may want to refine this logic
        if (Math.random() > 0.5) {
            recordDebugFix();
        }
    }
});

// Reset git and debug tracking
export function resetGitDebugTracking() {
    // Nothing to reset for these one-time achievements
}