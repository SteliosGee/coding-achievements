import * as vscode from 'vscode';
import { unlockAchievement } from '../utils/unlockAchievement';
import { achievements, achievementsFilePath, sidebarProvider } from '../extension';

export function init() {
    vscode.workspace.onDidSaveTextDocument(() => {
        unlockAchievement(achievements, '🏆 First Save!', achievementsFilePath, sidebarProvider);
    });
}
