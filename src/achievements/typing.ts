import * as vscode from 'vscode';
import { loadTracking, saveTracking } from '../utils/storage';
import { updateUpgradableAchievement } from '../utils/upgradeableAchievement';
import { achievements, achievementsFilePath, sidebarProvider } from '../extension';

let totalCharacters = 0;

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

export function resetCharacterCounts() {
    totalCharacters = 0;
    saveData();
}

export function init() {
    loadData();

    vscode.workspace.onDidChangeTextDocument((event) => {
        let changeAmount = 0;

        event.contentChanges.forEach(change => {
            if (change.text.length > 0) {
                changeAmount += change.text.length;
            }
        });

        if (changeAmount > 0) {
            totalCharacters += changeAmount;
            saveData();
            updateUpgradableAchievement(achievements, 'typing', totalCharacters, achievementsFilePath, sidebarProvider);
        }
    });
}
