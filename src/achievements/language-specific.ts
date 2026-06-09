import * as vscode from 'vscode';
import { loadTracking, saveTracking } from '../utils/storage';
import { updateUpgradableAchievement } from '../utils/upgradeableAchievement';
import { achievements, achievementsFilePath, sidebarProvider } from '../extension';

const usedLanguages = new Set<string>();

interface LanguagesData {
    languages: string[];
}

function loadData() {
    const data = loadTracking<LanguagesData>('languages', { languages: [] });
    usedLanguages.clear();
    if (Array.isArray(data.languages)) {
        data.languages.forEach(lang => usedLanguages.add(lang));
    }
}

function saveData() {
    saveTracking('languages', { languages: Array.from(usedLanguages) });
}

function checkLanguageAchievements() {
    updateUpgradableAchievement(achievements, 'languages', usedLanguages.size, achievementsFilePath, sidebarProvider);
}

export function resetLanguageTracking() {
    usedLanguages.clear();
    saveData();
}

export function init(): vscode.Disposable[] {
    loadData();

    return [
        vscode.window.onDidChangeActiveTextEditor((editor) => {
            if (editor) {
                const languageId = editor.document.languageId;
                if (languageId && languageId !== 'plaintext') {
                    if (!usedLanguages.has(languageId)) {
                        usedLanguages.add(languageId);
                        saveData();
                    }
                    checkLanguageAchievements();
                }
            }
        })
    ];
}
