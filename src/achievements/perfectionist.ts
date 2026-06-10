import * as vscode from 'vscode';
import { unlockAchievement } from '../utils/unlockAchievement';
import { achievements, achievementsFilePath, sidebarProvider } from '../extension';

const saveCounts = new Map<string, number>();
let unlocked = false;

export function resetPerfectionistTracking() {
    saveCounts.clear();
    unlocked = false;
}

export function init(): vscode.Disposable[] {
    const achievement = achievements.find(a => a.name === '🎯 Perfectionist');
    if (achievement?.unlocked) {
        unlocked = true;
    }

    return [
        vscode.workspace.onDidSaveTextDocument((document) => {
            if (unlocked) {
                return;
            }

            const key = document.uri.toString();
            const count = (saveCounts.get(key) || 0) + 1;
            saveCounts.set(key, count);

            if (count >= 20) {
                unlockAchievement(achievements, '🎯 Perfectionist', achievementsFilePath, sidebarProvider);
                unlocked = true;
            }
        })
    ];
}
