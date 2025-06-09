import * as vscode from 'vscode';
import { unlockAchievement } from '../utils/unlockAchievement';
import { achievements, achievementsFilePath, sidebarProvider } from '../extension';

// Track unique languages used
const usedLanguages = new Set<string>();

vscode.window.onDidChangeActiveTextEditor((editor) => {
    if (editor) {
        const languageId = editor.document.languageId;
        if (languageId) {
            usedLanguages.add(languageId);
            checkLanguageAchievements();
        }
    }
});

function checkLanguageAchievements() {
    if (usedLanguages.size >= 3) {
        unlockAchievement(achievements, 'Polyglot Programmer', achievementsFilePath, sidebarProvider);
    }
    if (usedLanguages.size >= 5) {
        unlockAchievement(achievements, 'Language Master', achievementsFilePath, sidebarProvider);
    }
}

// Reset tracking
export function resetLanguageTracking() {
    usedLanguages.clear();
}