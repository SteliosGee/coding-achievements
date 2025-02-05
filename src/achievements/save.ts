import * as vscode from 'vscode';
import { unlockAchievement } from '../utils/unlockAchievement'; // Import the unlockAchievement function
import { achievements, achievementsFilePath, sidebarProvider } from '../extension'; // Import necessary variables

vscode.workspace.onDidSaveTextDocument(() => {
    unlockAchievement(achievements, '🏆 Achievement Unlocked: First Save!', achievementsFilePath, sidebarProvider);
});