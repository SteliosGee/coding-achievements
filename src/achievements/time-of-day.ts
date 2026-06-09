import * as vscode from 'vscode';
import { unlockAchievement } from '../utils/unlockAchievement';
import { achievements, achievementsFilePath, sidebarProvider } from '../extension';

let nightOwlChecked = false;
let earlyBirdChecked = false;
let checkInterval: NodeJS.Timeout | undefined;

function checkTimeOfDay() {
    const hour = new Date().getHours();

    if (!nightOwlChecked && (hour >= 0 && hour < 5)) {
        unlockAchievement(achievements, '🌙 Night Owl', achievementsFilePath, sidebarProvider);
        nightOwlChecked = true;
    }

    if (!earlyBirdChecked && (hour >= 5 && hour < 9)) {
        unlockAchievement(achievements, '🐦 Early Bird', achievementsFilePath, sidebarProvider);
        earlyBirdChecked = true;
    }
}

export function resetTimeOfDayTracking() {
    nightOwlChecked = false;
    earlyBirdChecked = false;
}

export function disposeTimeOfDayTracking() {
    if (checkInterval) {
        clearInterval(checkInterval);
        checkInterval = undefined;
    }
}

export function init() {
    checkTimeOfDay();
    checkInterval = setInterval(checkTimeOfDay, 60 * 1000);

    vscode.workspace.onDidChangeTextDocument(() => {
        checkTimeOfDay();
    });
}
