import * as vscode from 'vscode';
import { unlockAchievement } from '../utils/unlockAchievement';
import { achievements, achievementsFilePath, sidebarProvider } from '../extension';

let isActive = false;
let sessionStartTime = 0;
let activityTimeout: NodeJS.Timeout | null = null;
let unlocked = false;

const ACTIVITY_TIMEOUT = 2 * 60 * 1000;
const MARATHON_TARGET_MS = 4 * 60 * 60 * 1000;

export function resetMarathonRunnerTracking() {
    isActive = false;
    sessionStartTime = 0;
    unlocked = false;
    if (activityTimeout) {
        clearTimeout(activityTimeout);
        activityTimeout = null;
    }
}

function startTracking() {
    if (unlocked) {
        return;
    }

    if (!isActive) {
        isActive = true;
        sessionStartTime = Date.now();
    }
}

function stopTracking() {
    isActive = false;
    sessionStartTime = 0;
    if (activityTimeout) {
        clearTimeout(activityTimeout);
        activityTimeout = null;
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

function checkMarathon() {
    if (!isActive || !sessionStartTime || unlocked) {
        return;
    }

    const elapsed = Date.now() - sessionStartTime;
    if (elapsed >= MARATHON_TARGET_MS) {
        unlockAchievement(achievements, '🏃‍♂️ Marathon Runner', achievementsFilePath, sidebarProvider);
        unlocked = true;
    }
}

export function init(): vscode.Disposable[] {
    const achievement = achievements.find(a => a.name === '🏃‍♂️ Marathon Runner');
    if (achievement?.unlocked) {
        unlocked = true;
    }

    return [
        vscode.workspace.onDidChangeTextDocument(() => {
            startTracking();
            resetActivityTimeout();
            checkMarathon();
        }),

        vscode.window.onDidChangeTextEditorSelection(() => {
            startTracking();
            resetActivityTimeout();
            checkMarathon();
        }),

        vscode.window.onDidChangeWindowState((e) => {
            if (!e.focused) {
                stopTracking();
            } else {
                startTracking();
                resetActivityTimeout();
            }
        })
    ];
}
