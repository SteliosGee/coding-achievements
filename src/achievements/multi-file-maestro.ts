import * as vscode from 'vscode';
import { unlockAchievement } from '../utils/unlockAchievement';
import { achievements, achievementsFilePath, sidebarProvider } from '../extension';

const editedFiles = new Set<string>();
let unlocked = false;

export function resetMultiFileMaestroTracking() {
    editedFiles.clear();
    unlocked = false;
}

export function init(): vscode.Disposable[] {
    const achievement = achievements.find(a => a.name === '🧩 Multi-File Maestro');
    if (achievement?.unlocked) {
        unlocked = true;
    }

    return [
        vscode.workspace.onDidChangeTextDocument((event) => {
            if (unlocked) {
                return;
            }

            editedFiles.add(event.document.uri.toString());

            if (editedFiles.size >= 20) {
                unlockAchievement(achievements, '🧩 Multi-File Maestro', achievementsFilePath, sidebarProvider);
                unlocked = true;
            }
        })
    ];
}
