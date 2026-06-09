import * as vscode from 'vscode';
import { loadTracking, saveTracking } from '../utils/storage';
import { updateUpgradableAchievement } from '../utils/upgradeableAchievement';
import { achievements, achievementsFilePath, sidebarProvider } from '../extension';

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

let workaholicData: WorkaholicData = { dailySessions: {} };

const ACTIVITY_TIMEOUT = 90 * 1000;
const MIN_ACTIVITY_DURATION = 30 * 1000;
const TYPING_THRESHOLD = 10;

let currentStreakStart: number | null = null;
let lastActivityTime: number | null = null;
let isCurrentlyActive = false;
let activityTimeout: NodeJS.Timeout | null = null;
let typingBurstCount = 0;
let typingBurstTimer: NodeJS.Timeout | null = null;

function loadData() {
    workaholicData = loadTracking<WorkaholicData>('workaholic', { dailySessions: {} });
}

function saveData() {
    saveTracking('workaholic', workaholicData);
}

function getTodayString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

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

        resetActivityTimeout();
    }
}

function endCodingStreak() {
    if (isCurrentlyActive && currentStreakStart) {
        const now = Date.now();
        const streakDuration = now - currentStreakStart;

        if (streakDuration >= MIN_ACTIVITY_DURATION) {
            const session = getTodaySession();
            session.totalCodingTimeMs += streakDuration;

            if (streakDuration > session.longestStreakMs) {
                session.longestStreakMs = streakDuration;
                console.log(`New longest workaholic streak: ${Math.round(streakDuration / (1000 * 60))} minutes`);
            }

            const longestStreakHours = session.longestStreakMs / (1000 * 60 * 60);
            updateUpgradableAchievement(achievements, 'workaholic', longestStreakHours, achievementsFilePath, sidebarProvider);

            session.isActive = false;
            session.currentStreakStartTime = null;
        }

        saveData();
    }

    currentStreakStart = null;
    lastActivityTime = null;
    isCurrentlyActive = false;
    typingBurstCount = 0;

    if (activityTimeout) {
        clearTimeout(activityTimeout);
        activityTimeout = null;
    }
}

function onActivityDetected() {
    const now = Date.now();

    if (!isCurrentlyActive) {
        startCodingStreak();
    } else {
        lastActivityTime = now;
        const session = getTodaySession();
        session.lastActivityTime = now;
    }

    resetActivityTimeout();
}

function resetActivityTimeout() {
    if (activityTimeout) {
        clearTimeout(activityTimeout);
    }

    activityTimeout = setTimeout(() => {
        endCodingStreak();
    }, ACTIVITY_TIMEOUT);
}

function onTypingActivity(changeAmount: number) {
    typingBurstCount += changeAmount;

    if (typingBurstTimer) {
        clearTimeout(typingBurstTimer);
    }

    typingBurstTimer = setTimeout(() => {
        if (typingBurstCount >= TYPING_THRESHOLD) {
            onActivityDetected();
        }
        typingBurstCount = 0;
    }, 2000);
}

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
            onTypingActivity(changeAmount);
        }
    });

    vscode.window.onDidChangeTextEditorSelection(() => {
        onActivityDetected();
    });

    vscode.window.onDidChangeActiveTextEditor(() => {
        onActivityDetected();
    });

    vscode.workspace.onDidSaveTextDocument(() => {
        onActivityDetected();
    });

    vscode.window.onDidChangeWindowState((e) => {
        if (!e.focused) {
            endCodingStreak();
        }
    });

    vscode.workspace.onDidCreateFiles(() => onActivityDetected());
    vscode.workspace.onDidDeleteFiles(() => onActivityDetected());
    vscode.workspace.onDidRenameFiles(() => onActivityDetected());
    vscode.debug.onDidStartDebugSession(() => onActivityDetected());
    vscode.debug.onDidChangeActiveDebugSession(() => onActivityDetected());
    vscode.window.onDidChangeActiveTerminal(() => onActivityDetected());

    // Resume streak from today if applicable
    const session = getTodaySession();
    if (session.isActive && session.currentStreakStartTime) {
        const now = Date.now();
        const timeSinceLastActivity = now - (session.lastActivityTime || session.currentStreakStartTime);

        if (timeSinceLastActivity < ACTIVITY_TIMEOUT) {
            currentStreakStart = session.currentStreakStartTime;
            lastActivityTime = session.lastActivityTime;
            isCurrentlyActive = true;
            resetActivityTimeout();
        } else {
            session.isActive = false;
            session.currentStreakStartTime = null;
            saveData();
        }
    }
}
