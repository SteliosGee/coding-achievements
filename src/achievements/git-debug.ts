import * as vscode from 'vscode';
import { unlockAchievement } from '../utils/unlockAchievement';
import { achievements, achievementsFilePath, sidebarProvider } from '../extension';
import { loadTracking, saveTracking } from '../utils/storage';
import { recordDebugFix } from './daily-streaks';

export function resetGitDebugTracking() {
    // One-time achievements — nothing to reset
}

export function init() {
    // Track Git commits via the Git extension API
    try {
        const gitExtension = vscode.extensions.getExtension<{ getAPI(version: number): { onDidChangeRepository: (callback: (e: unknown) => void) => vscode.Disposable; repositories: unknown[] } }>('vscode.git');
        if (gitExtension) {
            const gitApi = gitExtension.exports.getAPI(1);

            gitApi.onDidChangeRepository((repo: any) => {
                if (repo?.rootUri) {
                    unlockAchievement(achievements, '💾 Commit Champion', achievementsFilePath, sidebarProvider);
                }
            });

            if (gitApi.repositories?.length > 0) {
                unlockAchievement(achievements, '💾 Commit Champion', achievementsFilePath, sidebarProvider);
            }
        }
    } catch {
        console.log('Git extension API not available — Commit Champion will not auto-unlock');
    }

    // Track debug sessions
    vscode.debug.onDidStartDebugSession(() => {
        unlockAchievement(achievements, '🐛 Bug Squasher', achievementsFilePath, sidebarProvider);
    });

    vscode.debug.onDidTerminateDebugSession(() => {
        recordDebugFix();
    });
}
