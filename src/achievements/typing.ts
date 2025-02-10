import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { unlockAchievement } from '../utils/unlockAchievement'; // Import the unlockAchievement function
import { achievements, achievementsFilePath, sidebarProvider } from '../extension'; // Import necessary variables

let addedCharacters: number = 0;
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
    addedCharacters = 0;
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
    
    addedCharacters += changeAmount;
    totalCharacters += changeAmount;
    saveTotalCharacters(); // Save progress

    if (addedCharacters >= 5) {
        unlockAchievement(achievements, 'Fast Fingers', achievementsFilePath, sidebarProvider);
    }
    if (addedCharacters >= 50) {
        unlockAchievement(achievements, 'Keyboard Warrior', achievementsFilePath, sidebarProvider);
    }
    if (addedCharacters >= 500) {
        unlockAchievement(achievements, 'Code Ninja', achievementsFilePath, sidebarProvider);
    }
    if (totalCharacters >= 10) {
        unlockAchievement(achievements, 'Hacker Mode', achievementsFilePath, sidebarProvider);
    }
});

// Reset the added characters counter when a document is closed
vscode.workspace.onDidCloseTextDocument(() => {
    addedCharacters = 0;
});