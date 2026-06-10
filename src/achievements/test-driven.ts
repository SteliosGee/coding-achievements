import * as vscode from 'vscode';
import { unlockAchievement } from '../utils/unlockAchievement';
import { achievements, achievementsFilePath, sidebarProvider } from '../extension';

let unlocked = false;

const TEST_PATTERNS = [/\.test\./i, /\.spec\./i, /test_.*\.py$/i, /.*_test\.go$/i];

export function resetTestDrivenTracking() {
    unlocked = false;
}

export function init(): vscode.Disposable[] {
    const achievement = achievements.find(a => a.name === '🧪 Test-Driven');
    if (achievement?.unlocked) {
        unlocked = true;
    }

    return [
        vscode.workspace.onDidSaveTextDocument((document) => {
            if (unlocked) {
                return;
            }

            const filename = document.uri.path.split('/').pop() || '';
            if (TEST_PATTERNS.some(pattern => pattern.test(filename))) {
                unlockAchievement(achievements, '🧪 Test-Driven', achievementsFilePath, sidebarProvider);
                unlocked = true;
            }
        })
    ];
}
