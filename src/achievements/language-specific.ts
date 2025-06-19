import * as vscode from 'vscode';
import { unlockAchievement } from '../utils/unlockAchievement';
import { updateUpgradableAchievement } from '../utils/upgradeableAchievement';
import { achievements, achievementsFilePath, sidebarProvider } from '../extension';

// Track unique languages used
const usedLanguages = new Set<string>();

vscode.window.onDidChangeActiveTextEditor((editor) => {
    if (editor) {
        const languageId = editor.document.languageId;
        if (languageId && languageId !== 'plaintext') {
            usedLanguages.add(languageId);
            checkLanguageAchievements();
        }
    }
});

function checkLanguageAchievements() {
    // Update upgradable language achievements
    updateUpgradableAchievement(achievements, 'languages', usedLanguages.size, achievementsFilePath, sidebarProvider);
}

// Reset tracking
export function resetLanguageTracking() {
    usedLanguages.clear();
}