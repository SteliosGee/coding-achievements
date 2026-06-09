import * as vscode from 'vscode';
import { loadTracking, saveTracking } from '../utils/storage';
import { updateUpgradableAchievement } from '../utils/upgradeableAchievement';
import { achievements, achievementsFilePath, sidebarProvider } from '../extension';

let totalCharacters = 0;
let saveTimeout: NodeJS.Timeout | null = null;

interface TypingData {
    totalCharacters: number;
}

function loadData() {
    const data = loadTracking<TypingData>('typing', { totalCharacters: 0 });
    totalCharacters = data.totalCharacters || 0;
}

function saveData() {
    saveTracking('typing', { totalCharacters });
}

function debouncedSave() {
    if (saveTimeout) {
        clearTimeout(saveTimeout);
    }
    saveTimeout = setTimeout(() => {
        saveData();
        saveTimeout = null;
    }, 2000);
}

export function resetCharacterCounts() {
    totalCharacters = 0;
    if (saveTimeout) {
        clearTimeout(saveTimeout);
        saveTimeout = null;
    }
    saveData();
}

export function init(): vscode.Disposable[] {
    loadData();

    return [
        vscode.workspace.onDidChangeTextDocument((event) => {
            let changeAmount = 0;

            event.contentChanges.forEach(change => {
                if (change.text.length > 0) {
                    changeAmount += change.text.length;
                }
            });

            if (changeAmount > 0) {
                totalCharacters += changeAmount;
                debouncedSave();
                updateUpgradableAchievement(achievements, 'typing', totalCharacters, achievementsFilePath, sidebarProvider);
            }
        })
    ];
}
