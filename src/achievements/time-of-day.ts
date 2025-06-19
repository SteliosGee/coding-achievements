import * as vscode from 'vscode';
import { unlockAchievement } from '../utils/unlockAchievement';
import { achievements, achievementsFilePath, sidebarProvider } from '../extension';

// Track achievements based on time of day
let nightOwlChecked = false;
let earlyBirdChecked = false;

function checkTimeOfDay() {
    const hour = new Date().getHours();
    
    // Night Owl: coding between midnight and 5am
    if (!nightOwlChecked && (hour >= 0 && hour < 5)) {
        unlockAchievement(achievements, '🌙 Night Owl', achievementsFilePath, sidebarProvider);
        nightOwlChecked = true;
    }
    
    // Early Bird: coding between 5am and 9am
    if (!earlyBirdChecked && (hour >= 5 && hour < 9)) {
        unlockAchievement(achievements, '🐦 Early Bird', achievementsFilePath, sidebarProvider);
        earlyBirdChecked = true;
    }
}

// Reset time of day tracking
export function resetTimeOfDayTracking() {
    nightOwlChecked = false;
    earlyBirdChecked = false;
}

// Check on startup and periodically
checkTimeOfDay();
setInterval(checkTimeOfDay, 60 * 1000); // Check every minute

// Also check when user starts typing
vscode.workspace.onDidChangeTextDocument(() => {
    checkTimeOfDay();
});