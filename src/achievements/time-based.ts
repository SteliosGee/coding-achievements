import * as vscode from 'vscode';
import { loadTracking, saveTracking } from '../utils/storage';
import { updateUpgradableAchievement } from '../utils/upgradeableAchievement';
import { achievements, achievementsFilePath, sidebarProvider } from '../extension';

interface TimeData {
    totalCodingTimeMs: number;
}

let isActive = false;
let sessionStartTime: number | null = null;
let totalCodingTimeMs = 0;
let activityTimeout: NodeJS.Timeout | null = null;

const ACTIVITY_TIMEOUT = 2 * 60 * 1000;

function loadData() {
    const data = loadTracking<TimeData>('time', { totalCodingTimeMs: 0 });
    totalCodingTimeMs = data.totalCodingTimeMs || 0;
}

function saveData() {
    saveTracking('time', { totalCodingTimeMs });
}

function checkTimeAchievements() {
    const totalHours = totalCodingTimeMs / (1000 * 60 * 60);
    updateUpgradableAchievement(achievements, 'coding_time', totalHours, achievementsFilePath, sidebarProvider);
}

function startTracking() {
    if (!isActive) {
        isActive = true;
        sessionStartTime = Date.now();
    }
}

export function stopTracking() {
    if (isActive && sessionStartTime) {
        const now = Date.now();
        totalCodingTimeMs += (now - sessionStartTime);
        sessionStartTime = null;
        isActive = false;
        saveData();
        checkTimeAchievements();
    }
}

function resetActivityTimeout() {
    if (activityTimeout) {
        clearTimeout(activityTimeout);
    }
    activityTimeout = setTimeout(() => {
        stopTracking();
    }, ACTIVITY_TIMEOUT);
}

export function resetTimeTracking() {
    totalCodingTimeMs = 0;
    sessionStartTime = null;
    isActive = false;
    if (activityTimeout) {
        clearTimeout(activityTimeout);
        activityTimeout = null;
    }
    saveData();
}

export function init(): vscode.Disposable[] {
    loadData();

    let lastFocusChange = 0;
    const FOCUS_DEBOUNCE_MS = 1000;

    return [
        vscode.workspace.onDidChangeTextDocument(() => {
            startTracking();
            resetActivityTimeout();
        }),

        vscode.window.onDidChangeTextEditorSelection(() => {
            startTracking();
            resetActivityTimeout();
        }),

        vscode.window.onDidChangeWindowState((e) => {
            const now = Date.now();
            if (now - lastFocusChange < FOCUS_DEBOUNCE_MS) {
                return;
            }
            lastFocusChange = now;

            if (!e.focused) {
                stopTracking();
            } else {
                startTracking();
                resetActivityTimeout();
            }
        })
    ];
}
