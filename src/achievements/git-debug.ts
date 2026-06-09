import * as vscode from 'vscode';
import { unlockAchievement } from '../utils/unlockAchievement';
import { achievements, achievementsFilePath, sidebarProvider } from '../extension';
import { recordDebugFix } from './daily-streaks';

let commitChampionUnlocked = false;

export function resetGitDebugTracking() {
    commitChampionUnlocked = false;
}

export function init(): vscode.Disposable[] {
    const achievement = achievements.find(a => a.name === '💾 Commit Champion');
    if (achievement?.unlocked) {
        commitChampionUnlocked = true;
    }

    const disposables: vscode.Disposable[] = [];

    try {
        const gitExtension = vscode.extensions.getExtension<{ getAPI(version: number): { onDidChangeRepository: (callback: (e: unknown) => void) => vscode.Disposable; repositories: Array<{ rootUri: vscode.Uri; state: { HEADChanges: number; indexChanges: number } }> } }>('vscode.git');
        if (gitExtension) {
            const gitApi = gitExtension.exports.getAPI(1);

            disposables.push(
                gitApi.onDidChangeRepository((repo: any) => {
                    if (commitChampionUnlocked) {
                        return;
                    }

                    if (repo?.state?.HEADChanges > 0 || repo?.state?.indexChanges > 0) {
                        unlockAchievement(achievements, '💾 Commit Champion', achievementsFilePath, sidebarProvider);
                        commitChampionUnlocked = true;
                    }
                })
            );
        }
    } catch {
        console.log('Git extension API not available — Commit Champion will not auto-unlock');
    }

    disposables.push(
        vscode.debug.onDidStartDebugSession(() => {
            unlockAchievement(achievements, '🐛 Bug Squasher', achievementsFilePath, sidebarProvider);
        }),

        vscode.debug.onDidTerminateDebugSession(() => {
            recordDebugFix();
        })
    );

    return disposables;
}
