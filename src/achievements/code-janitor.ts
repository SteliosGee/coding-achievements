import * as vscode from 'vscode';
import { unlockAchievement } from '../utils/unlockAchievement';
import { achievements, achievementsFilePath, sidebarProvider } from '../extension';

let linesAdded = 0;
let linesDeleted = 0;
let unlocked = false;

export function resetCodeJanitorTracking() {
    linesAdded = 0;
    linesDeleted = 0;
    unlocked = false;
}

export function init(): vscode.Disposable[] {
    const achievement = achievements.find(a => a.name === '🧹 Code Janitor');
    if (achievement?.unlocked) {
        unlocked = true;
    }

    return [
        vscode.workspace.onDidChangeTextDocument((event) => {
            if (unlocked) {
                return;
            }

            event.contentChanges.forEach(change => {
                const addedLines = change.text.split('\n').length - 1;
                const deletedLines = change.range.end.line - change.range.start.line;

                linesAdded += addedLines;
                linesDeleted += deletedLines;
            });

            if (linesDeleted > linesAdded && linesDeleted > 10) {
                unlockAchievement(achievements, '🧹 Code Janitor', achievementsFilePath, sidebarProvider);
                unlocked = true;
            }
        })
    ];
}
