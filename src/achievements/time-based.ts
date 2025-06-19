import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { unlockAchievement } from '../utils/unlockAchievement';
import { updateUpgradableAchievement } from '../utils/upgradeableAchievement';
import { achievements, achievementsFilePath, sidebarProvider } from '../extension';

// Time tracking state
let isActive = false;
let sessionStartTime: number | null = null;
let totalCodingTimeMs = 0;
const timeDataPath = path.join(__dirname, 'coding-time.json');

// Load previous coding time data
function loadTimeData() {
    if (fs.existsSync(timeDataPath)) {
        try {
            const data = fs.readFileSync(timeDataPath, 'utf-8');
            totalCodingTimeMs = JSON.parse(data).totalCodingTimeMs || 0;
        } catch (error) {
            console.error('Error loading time data:', error);
            totalCodingTimeMs = 0;
        }
    }
}

// Save coding time data
function saveTimeData() {
    try {
        fs.writeFileSync(timeDataPath, JSON.stringify({ totalCodingTimeMs }), 'utf-8');
    } catch (error) {
        console.error('Error saving time data:', error);
    }
}

// Reset time tracking
export function resetTimeTracking() {
    totalCodingTimeMs = 0;
    saveTimeData();
}

// Load existing data
loadTimeData();

// Start tracking when user becomes active
function startTracking() {
    if (!isActive) {
        isActive = true;
        sessionStartTime = Date.now();
    }
}

// Stop tracking and update total time
function stopTracking() {
    if (isActive && sessionStartTime) {
        const now = Date.now();
        totalCodingTimeMs += (now - sessionStartTime);
        sessionStartTime = null;
        isActive = false;
        saveTimeData();
        checkTimeAchievements();
    }
}

// Check for time-based achievements
function checkTimeAchievements() {
    const totalHours = totalCodingTimeMs / (1000 * 60 * 60);
    
    // Update upgradable time achievements
    updateUpgradableAchievement(achievements, 'coding_time', totalHours, achievementsFilePath, sidebarProvider);
}

// Track when the user is active
const ACTIVITY_TIMEOUT = 2 * 60 * 1000; // 2 minutes of inactivity before stopping
let activityTimeout: NodeJS.Timeout | null = null;

// Document change listener
vscode.workspace.onDidChangeTextDocument(() => {
    startTracking();
    resetActivityTimeout();
});

// Cursor movement listener
vscode.window.onDidChangeTextEditorSelection(() => {
    startTracking();
    resetActivityTimeout();
});

// Reset the inactivity timer
function resetActivityTimeout() {
    if (activityTimeout) {
        clearTimeout(activityTimeout);
    }
    
    activityTimeout = setTimeout(() => {
        stopTracking();
    }, ACTIVITY_TIMEOUT);
}

// Stop tracking when VS Code loses focus
vscode.window.onDidChangeWindowState((e) => {
    if (!e.focused) {
        stopTracking();
    } else {
        startTracking();
        resetActivityTimeout();
    }
});