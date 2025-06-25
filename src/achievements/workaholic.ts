import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { updateUpgradableAchievement } from '../utils/upgradeableAchievement';
import { achievements, achievementsFilePath, sidebarProvider } from '../extension';

// Workaholic tracking state
interface WorkaholicData {
    dailySessions: { [date: string]: DaySession };
}

interface DaySession {
    date: string;
    totalCodingTimeMs: number;
    longestStreakMs: number;
    currentStreakStartTime: number | null;
    lastActivityTime: number | null;
    isActive: boolean;
}

let workaholicData: WorkaholicData = {
    dailySessions: {}
};

const workaholicDataPath = path.join(__dirname, 'workaholic-data.json');

// Enhanced anti-AFK settings
const ACTIVITY_TIMEOUT = 90 * 1000; // 90 seconds of inactivity before pausing (more strict than regular time tracking)
const MIN_ACTIVITY_DURATION = 30 * 1000; // Minimum 30 seconds of activity to count
const TYPING_THRESHOLD = 10; // Minimum characters typed in a burst to count as activity

let currentStreakStart: number | null = null;
let lastActivityTime: number | null = null;
let isCurrentlyActive = false;
let activityTimeout: NodeJS.Timeout | null = null;
let typingBurstCount = 0;
let typingBurstTimer: NodeJS.Timeout | null = null;

// Load workaholic data
function loadWorkaholicData() {
    if (fs.existsSync(workaholicDataPath)) {
        try {
            const data = fs.readFileSync(workaholicDataPath, 'utf-8');
            workaholicData = JSON.parse(data);
        } catch (error) {
            console.error('Error loading workaholic data:', error);
            workaholicData = { dailySessions: {} };
        }
    }
}

// Save workaholic data
function saveWorkaholicData() {
    try {
        fs.writeFileSync(workaholicDataPath, JSON.stringify(workaholicData), 'utf-8');
    } catch (error) {
        console.error('Error saving workaholic data:', error);
    }
}

// Reset workaholic data
export function resetWorkaholicTracking() {
    workaholicData = { dailySessions: {} };
    currentStreakStart = null;
    lastActivityTime = null;
    isCurrentlyActive = false;
    typingBurstCount = 0;
    
    if (activityTimeout) {
        clearTimeout(activityTimeout);
        activityTimeout = null;
    }
    if (typingBurstTimer) {
        clearTimeout(typingBurstTimer);
        typingBurstTimer = null;
    }
    
    saveWorkaholicData();
}

// Get today's date as YYYY-MM-DD
function getTodayString() {
    const now = new Date();
    return now.toISOString().split('T')[0];
}

// Get or create today's session
function getTodaySession(): DaySession {
    const today = getTodayString();
    
    if (!workaholicData.dailySessions[today]) {
        workaholicData.dailySessions[today] = {
            date: today,
            totalCodingTimeMs: 0,
            longestStreakMs: 0,
            currentStreakStartTime: null,
            lastActivityTime: null,
            isActive: false
        };
    }
    
    return workaholicData.dailySessions[today];
}

// Start a new coding streak
function startCodingStreak() {
    if (!isCurrentlyActive) {
        const now = Date.now();
        currentStreakStart = now;
        lastActivityTime = now;
        isCurrentlyActive = true;
        
        const session = getTodaySession();
        session.currentStreakStartTime = now;
        session.lastActivityTime = now;
        session.isActive = true;
        
        console.log('🔥 Started new workaholic streak');
        resetActivityTimeout();
    }
}

// End the current coding streak
function endCodingStreak() {
    if (isCurrentlyActive && currentStreakStart) {
        const now = Date.now();
        const streakDuration = now - currentStreakStart;
        
        // Only count streaks longer than minimum duration
        if (streakDuration >= MIN_ACTIVITY_DURATION) {
            const session = getTodaySession();
            session.totalCodingTimeMs += streakDuration;
            
            // Update longest streak if this one was longer
            if (streakDuration > session.longestStreakMs) {
                session.longestStreakMs = streakDuration;
                console.log(`🏆 New longest workaholic streak: ${Math.round(streakDuration / (1000 * 60))} minutes`);
            }
            
            // Update achievement progress with longest streak in hours
            const longestStreakHours = session.longestStreakMs / (1000 * 60 * 60);
            updateUpgradableAchievement(achievements, 'workaholic', longestStreakHours, achievementsFilePath, sidebarProvider);
        }
        
        session.isActive = false;
        session.currentStreakStartTime = null;
        saveWorkaholicData();
    }
    
    currentStreakStart = null;
    lastActivityTime = null;
    isCurrentlyActive = false;
    typingBurstCount = 0;
    
    if (activityTimeout) {
        clearTimeout(activityTimeout);
        activityTimeout = null;
    }
    
    console.log('⏹️ Ended workaholic streak');
}

// Enhanced activity detection with typing burst detection
function onActivityDetected() {
    const now = Date.now();
    
    // Check if we need to start a new streak
    if (!isCurrentlyActive) {
        startCodingStreak();
    } else {
        // Update last activity time
        lastActivityTime = now;
        const session = getTodaySession();
        session.lastActivityTime = now;
    }
    
    resetActivityTimeout();
}

// Reset the inactivity timer with enhanced anti-AFK protection
function resetActivityTimeout() {
    if (activityTimeout) {
        clearTimeout(activityTimeout);
    }
    
    activityTimeout = setTimeout(() => {
        console.log('💤 Workaholic streak paused due to inactivity');
        endCodingStreak();
    }, ACTIVITY_TIMEOUT);
}

// Enhanced typing detection with burst counting
function onTypingActivity(changeAmount: number) {
    typingBurstCount += changeAmount;
    
    // Reset burst timer
    if (typingBurstTimer) {
        clearTimeout(typingBurstTimer);
    }
    
    // Check if this typing burst qualifies as real activity
    typingBurstTimer = setTimeout(() => {
        if (typingBurstCount >= TYPING_THRESHOLD) {
            onActivityDetected();
        }
        typingBurstCount = 0;
    }, 2000); // 2-second window for typing bursts
}

// Load existing data
loadWorkaholicData();

// Listen for enhanced activity detection
vscode.workspace.onDidChangeTextDocument((event) => {
    let changeAmount = 0;
    event.contentChanges.forEach(change => {
        if (change.text.length > 0) {
            changeAmount += change.text.length;
        }
    });
    
    if (changeAmount > 0) {
        onTypingActivity(changeAmount);
    }
});

// Additional activity listeners for anti-AFK
vscode.window.onDidChangeTextEditorSelection(() => {
    onActivityDetected();
});

vscode.window.onDidChangeActiveTextEditor(() => {
    onActivityDetected();
});

vscode.workspace.onDidSaveTextDocument(() => {
    onActivityDetected();
});

// Handle VS Code window focus changes
vscode.window.onDidChangeWindowState((e) => {
    if (!e.focused) {
        console.log('📵 VS Code lost focus - pausing workaholic streak');
        endCodingStreak();
    } else {
        console.log('📱 VS Code gained focus - ready for workaholic tracking');
        // Don't auto-start here, wait for actual activity
    }
});

// Handle file operations
vscode.workspace.onDidCreateFiles(() => onActivityDetected());
vscode.workspace.onDidDeleteFiles(() => onActivityDetected());
vscode.workspace.onDidRenameFiles(() => onActivityDetected());

// Debug session activity
vscode.debug.onDidStartDebugSession(() => onActivityDetected());
vscode.debug.onDidChangeActiveDebugSession(() => onActivityDetected());

// Terminal activity
vscode.window.onDidChangeActiveTerminal(() => onActivityDetected());

// Initialize on startup - check if we should resume a streak from today
const session = getTodaySession();
if (session.isActive && session.currentStreakStartTime) {
    const now = Date.now();
    const timeSinceLastActivity = now - (session.lastActivityTime || session.currentStreakStartTime);
    
    // If less than activity timeout has passed, resume the streak
    if (timeSinceLastActivity < ACTIVITY_TIMEOUT) {
        currentStreakStart = session.currentStreakStartTime;
        lastActivityTime = session.lastActivityTime;
        isCurrentlyActive = true;
        resetActivityTimeout();
        console.log('🔄 Resumed workaholic streak from previous session');
    } else {
        // Too much time has passed, end the previous streak
        session.isActive = false;
        session.currentStreakStartTime = null;
        saveWorkaholicData();
        console.log('⏰ Previous workaholic streak expired due to extended inactivity');
    }
}

console.log('💪 Workaholic achievement tracking initialized with enhanced anti-AFK protection');
