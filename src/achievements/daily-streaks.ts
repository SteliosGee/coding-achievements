import * as vscode from 'vscode';
import { loadTracking, saveTracking } from '../utils/storage';
import { updateUpgradableAchievement } from '../utils/upgradeableAchievement';
import { achievements, achievementsFilePath, sidebarProvider } from '../extension';
import { unlockAchievement } from '../utils/unlockAchievement';

interface StreakData {
    lastActiveDate: string;
    activeDays: string[];
    currentStreak: number;
    maxStreak: number;
    debugFixes: { [date: string]: number };
}

const DEFAULT_STREAK: StreakData = {
    lastActiveDate: '',
    activeDays: [],
    currentStreak: 0,
    maxStreak: 0,
    debugFixes: {}
};

let streakData: StreakData = { ...DEFAULT_STREAK };

function loadData() {
    streakData = loadTracking<StreakData>('streaks', { ...DEFAULT_STREAK });
}

function saveData() {
    saveTracking('streaks', streakData);
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

function updateDailyStreak() {
    const today = getTodayString();

    if (streakData.lastActiveDate === today) {
        return;
    }

    if (isYesterday(streakData.lastActiveDate, today)) {
        streakData.currentStreak++;
    } else if (streakData.lastActiveDate !== today) {
        streakData.currentStreak = 1;
    }

    if (streakData.currentStreak > streakData.maxStreak) {
        streakData.maxStreak = streakData.currentStreak;
    }

    if (!streakData.activeDays.includes(today)) {
        streakData.activeDays.push(today);
    }

    if (streakData.activeDays.length > 365) {
        streakData.activeDays = streakData.activeDays.slice(-365);
    }

    streakData.lastActiveDate = today;
    saveData();

    updateUpgradableAchievement(achievements, 'daily_streak', streakData.currentStreak, achievementsFilePath, sidebarProvider);
}

export function recordDebugFix() {
    const today = getTodayString();

    if (!streakData.debugFixes[today]) {
        streakData.debugFixes[today] = 0;
    }

    streakData.debugFixes[today]++;
    saveData();

    if (streakData.debugFixes[today] >= 10) {
        unlockAchievement(achievements, '🐞 Debugger Pro', achievementsFilePath, sidebarProvider);
    }
}

export function resetStreakData() {
    streakData = { ...DEFAULT_STREAK };
    saveData();
}

export function init() {
    loadData();

    vscode.workspace.onDidChangeTextDocument(() => {
        updateDailyStreak();
    });

    updateDailyStreak();
}
