import * as vscode from 'vscode';
import { loadTracking, saveTracking } from '../utils/storage';
import { updateUpgradableAchievement } from '../utils/upgradeableAchievement';
import { achievements, achievementsFilePath, sidebarProvider } from '../extension';

interface StreakData {
    lastActiveDate: string;
    currentStreak: number;
    activeDays: string[];
}

const DEFAULT_STREAK: StreakData = {
    lastActiveDate: '',
    currentStreak: 0,
    activeDays: []
};

let streakData: StreakData = { ...DEFAULT_STREAK };

function loadData() {
    streakData = loadTracking<StreakData>('early_bird_streak', { ...DEFAULT_STREAK });
}

function saveData() {
    saveTracking('early_bird_streak', streakData);
}

function getTodayString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function isYesterday(dateString: string, comparedTo: string) {
    if (!dateString) {
        return false;
    }
    const [y1, m1, d1] = dateString.split('-').map(Number);
    const [y2, m2, d2] = comparedTo.split('-').map(Number);

    const date = new Date(y1, m1 - 1, d1);
    const compareDate = new Date(y2, m2 - 1, d2);
    compareDate.setDate(compareDate.getDate() - 1);

    return date.getTime() === compareDate.getTime();
}

function checkEarlyBird() {
    const hour = new Date().getHours();
    if (hour >= 9) {
        return;
    }

    const today = getTodayString();

    if (streakData.lastActiveDate === today) {
        return;
    }

    if (isYesterday(streakData.lastActiveDate, today)) {
        streakData.currentStreak++;
    } else if (streakData.lastActiveDate !== today) {
        streakData.currentStreak = 1;
    }

    if (!streakData.activeDays.includes(today)) {
        streakData.activeDays.push(today);
    }

    if (streakData.activeDays.length > 365) {
        streakData.activeDays = streakData.activeDays.slice(-365);
    }

    streakData.lastActiveDate = today;
    saveData();

    updateUpgradableAchievement(achievements, 'early_bird_streak', streakData.currentStreak, achievementsFilePath, sidebarProvider);
}

export function resetEarlyBirdStreakTracking() {
    streakData = { ...DEFAULT_STREAK };
    saveData();
}

export function init(): vscode.Disposable[] {
    loadData();

    return [
        vscode.workspace.onDidChangeTextDocument(() => {
            checkEarlyBird();
        })
    ];
}
