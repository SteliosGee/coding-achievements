import * as vscode from 'vscode';
import { unlockAchievement } from '../utils/unlockAchievement';
import { achievements, achievementsFilePath, sidebarProvider } from '../extension';

let unlocked = false;

export function resetDocumentationHeroTracking() {
    unlocked = false;
}

export function init(): vscode.Disposable[] {
    const achievement = achievements.find(a => a.name === '📝 Documentation Hero');
    if (achievement?.unlocked) {
        unlocked = true;
    }

    return [
        vscode.workspace.onDidSaveTextDocument((document) => {
            if (unlocked) {
                return;
            }

            if (document.uri.path.endsWith('.md')) {
                unlockAchievement(achievements, '📝 Documentation Hero', achievementsFilePath, sidebarProvider);
                unlocked = true;
            }
        })
    ];
}
