import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { unlockAchievement } from '../utils/unlockAchievement';
import { updateUpgradableAchievement } from '../utils/upgradeableAchievement';
import { achievements, achievementsFilePath, sidebarProvider } from '../extension';

// Data structure to track daily coding
interface StreakData {
    lastActiveDate: string;
    activeDays: string[];
    currentStreak: number;
    maxStreak: number;
    debugFixes: { [date: string]: number };
}

let streakData: StreakData = {
    lastActiveDate: '',
    activeDays: [],
    currentStreak: 0,
    maxStreak: 0,
    debugFixes: {}
};

const streakFilePath = path.join(__dirname, 'streak-data.json');

// Load streak data
function loadStreakData() {
    if (fs.existsSync(streakFilePath)) {
        try {
            const data = fs.readFileSync(streakFilePath, 'utf-8');
            streakData = JSON.parse(data);
        } catch (error) {
            console.error('Error loading streak data:', error);
            streakData = {
                lastActiveDate: '',
                activeDays: [],
                currentStreak: 0,
                maxStreak: 0,
                debugFixes: {}
            };
        }
    }
}

// Save streak data
function saveStreakData() {
    try {
        fs.writeFileSync(streakFilePath, JSON.stringify(streakData), 'utf-8');
    } catch (error) {
        console.error('Error saving streak data:', error);
    }
}

// Reset streak data
export function resetStreakData() {
    streakData = {
        lastActiveDate: '',
        activeDays: [],
        currentStreak: 0,
        maxStreak: 0,
        debugFixes: {}
    };
    saveStreakData();
}

// Get today's date as YYYY-MM-DD
function getTodayString() {
    const now = new Date();
    return now.toISOString().split('T')[0];
}

// Check if date string is yesterday compared to another date
function isYesterday(dateString: string, comparedTo: string) {
    const date = new Date(dateString);
    const compareDate = new Date(comparedTo);
    
    // Set both to midnight for comparison
    date.setHours(0, 0, 0, 0);
    compareDate.setHours(0, 0, 0, 0);
    
    // Subtract one day from compareDate
    compareDate.setDate(compareDate.getDate() - 1);
    
    return date.getTime() === compareDate.getTime();
}

// Update streak when user is active
function updateDailyStreak() {
    const today = getTodayString();
    
    // If already recorded today, do nothing
    if (streakData.lastActiveDate === today) {
        return;
    }
    
    // Check if continuing a streak (was active yesterday)
    if (isYesterday(streakData.lastActiveDate, today)) {
        streakData.currentStreak++;
    } else if (streakData.lastActiveDate !== today) {
        // Not yesterday, start a new streak
        streakData.currentStreak = 1;
    }
    
    // Update max streak if needed
    if (streakData.currentStreak > streakData.maxStreak) {
        streakData.maxStreak = streakData.currentStreak;
    }
    
    // Add today to active days if not already there
    if (!streakData.activeDays.includes(today)) {
        streakData.activeDays.push(today);
    }
    
    // Update last active date
    streakData.lastActiveDate = today;
    
    // Save changes
    saveStreakData();
    
    // Update upgradable streak achievements
    updateUpgradableAchievement(achievements, 'daily_streak', streakData.currentStreak, achievementsFilePath, sidebarProvider);
}

// Record a debug fix
export function recordDebugFix() {
    const today = getTodayString();
    
    // Initialize today's fixes if not already counted
    if (!streakData.debugFixes[today]) {
        streakData.debugFixes[today] = 0;
    }
    
    // Increment debug fix count
    streakData.debugFixes[today]++;
    
    // Save changes
    saveStreakData();
    
    // Check for achievement
    if (streakData.debugFixes[today] >= 10) {
        unlockAchievement(achievements, '🐞 Debugger Pro', achievementsFilePath, sidebarProvider);
    }
}

// Load existing data
loadStreakData();

// Listen for user activity
vscode.workspace.onDidChangeTextDocument(() => {
    updateDailyStreak();
});

// Also check on startup
updateDailyStreak();