import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { unlockAchievement } from '../utils/unlockAchievement';
import { updateUpgradableAchievement } from '../utils/upgradeableAchievement';
import { achievements, achievementsFilePath, sidebarProvider } from '../extension';

let totalCharacters: number = 0;
const totalCharactersFilePath = path.join(__dirname, 'totalCharacters.json');

// Function to load total characters from file
function loadTotalCharacters() {
    if (fs.existsSync(totalCharactersFilePath)) {
        try {
            const data = fs.readFileSync(totalCharactersFilePath, 'utf-8');
            totalCharacters = JSON.parse(data).totalCharacters || 0;
        } catch (error) {
            console.error('Error loading total characters:', error);
            totalCharacters = 0;
        }
    }
}

// Function to save total characters to file
function saveTotalCharacters() {
    try {
        fs.writeFileSync(totalCharactersFilePath, JSON.stringify({ totalCharacters }), 'utf-8');
    } catch (error) {
        console.error('Error saving total characters:', error);
    }
}

// Function to reset character counts
export function resetCharacterCounts() {
    totalCharacters = 0;
    saveTotalCharacters();
}

// Load total characters on extension activation
loadTotalCharacters();

vscode.workspace.onDidChangeTextDocument((event) => {
    let changeAmount = 0;
    
    event.contentChanges.forEach(change => {
        if (change.text.length > 0) {
            changeAmount += change.text.length; // Count only added characters
        }
    });
    
    if (changeAmount > 0) {
        totalCharacters += changeAmount;
        saveTotalCharacters(); // Save progress
        
        // Update upgradable typing achievements
        updateUpgradableAchievement(achievements, 'typing', totalCharacters, achievementsFilePath, sidebarProvider);
    }
});