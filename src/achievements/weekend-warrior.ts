import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { unlockAchievement } from '../utils/unlockAchievement';
import { achievements, achievementsFilePath, sidebarProvider } from '../extension';

// Weekend tracking data structure
interface WeekendData {
    weekends: { [weekKey: string]: WeekendActivity };
}

interface WeekendActivity {
    weekKey: string; // Format: YYYY-WW (ISO week number)
    saturdayActive: boolean;
    sundayActive: boolean;
    completed: boolean;
}

let weekendData: WeekendData = {
    weekends: {}
};

const weekendDataPath = path.join(__dirname, 'weekend-data.json');

// Load weekend data
function loadWeekendData() {
    if (fs.existsSync(weekendDataPath)) {
        try {
            const data = fs.readFileSync(weekendDataPath, 'utf-8');
            weekendData = JSON.parse(data);
        } catch (error) {
            console.error('Error loading weekend data:', error);
            weekendData = { weekends: {} };
        }
    }
}

// Save weekend data
function saveWeekendData() {
    try {
        fs.writeFileSync(weekendDataPath, JSON.stringify(weekendData), 'utf-8');
    } catch (error) {
        console.error('Error saving weekend data:', error);
    }
}

// Reset weekend tracking
export function resetWeekendTracking() {
    weekendData = { weekends: {} };
    saveWeekendData();
}

// Get ISO week number for a date
function getISOWeek(date: Date): string {
    const year = date.getFullYear();
    const start = new Date(year, 0, 1);
    const week = Math.ceil(((date.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
    return `${year}-${week.toString().padStart(2, '0')}`;
}

// Get day of week (0 = Sunday, 6 = Saturday)
function getDayOfWeek(date: Date): number {
    return date.getDay();
}

// Check if date is Saturday or Sunday
function isWeekend(date: Date): boolean {
    const day = getDayOfWeek(date);
    return day === 0 || day === 6; // Sunday (0) or Saturday (6)
}

// Get current weekend activity or create new one
function getCurrentWeekendActivity(): WeekendActivity {
    const now = new Date();
    const weekKey = getISOWeek(now);
    
    if (!weekendData.weekends[weekKey]) {
        weekendData.weekends[weekKey] = {
            weekKey,
            saturdayActive: false,
            sundayActive: false,
            completed: false
        };
    }
    
    return weekendData.weekends[weekKey];
}

// Update weekend activity when user codes
function updateWeekendActivity() {
    const now = new Date();
    
    // Only track if it's actually a weekend
    if (!isWeekend(now)) {
        return;
    }
    
    const dayOfWeek = getDayOfWeek(now);
    const weekendActivity = getCurrentWeekendActivity();
    
    // Skip if already completed this achievement
    if (weekendActivity.completed) {
        return;
    }
    
    let activityUpdated = false;
    
    // Check if it's Saturday (6) and mark Saturday as active
    if (dayOfWeek === 6 && !weekendActivity.saturdayActive) {
        weekendActivity.saturdayActive = true;
        activityUpdated = true;
        console.log('🏖️ Saturday coding activity recorded for Weekend Warrior');
    }
    
    // Check if it's Sunday (0) and mark Sunday as active
    if (dayOfWeek === 0 && !weekendActivity.sundayActive) {
        weekendActivity.sundayActive = true;
        activityUpdated = true;
        console.log('🏖️ Sunday coding activity recorded for Weekend Warrior');
    }
    
    // Check if both Saturday and Sunday are now active
    if (weekendActivity.saturdayActive && weekendActivity.sundayActive && !weekendActivity.completed) {
        weekendActivity.completed = true;
        unlockAchievement(achievements, '🏖️ Weekend Warrior', achievementsFilePath, sidebarProvider);
        console.log('🏆 Weekend Warrior achievement unlocked! Coded on both Saturday and Sunday of the same weekend!');
    }
    
    // Save data if activity was updated
    if (activityUpdated) {
        saveWeekendData();
    }
}

// Load existing data
loadWeekendData();

// Listen for coding activity
vscode.workspace.onDidChangeTextDocument(() => {
    updateWeekendActivity();
});

// Listen for file saves
vscode.workspace.onDidSaveTextDocument(() => {
    updateWeekendActivity();
});

// Listen for active editor changes
vscode.window.onDidChangeActiveTextEditor(() => {
    updateWeekendActivity();
});

// Listen for text selection changes
vscode.window.onDidChangeTextEditorSelection(() => {
    updateWeekendActivity();
});

console.log('🏖️ Weekend Warrior achievement tracking initialized');
