import * as vscode from 'vscode';
import { loadTracking, saveTracking } from '../utils/storage';
import { unlockAchievement } from '../utils/unlockAchievement';
import { achievements, achievementsFilePath, sidebarProvider } from '../extension';

interface WeekendData {
    weekends: { [weekKey: string]: WeekendActivity };
}

interface WeekendActivity {
    weekKey: string;
    saturdayActive: boolean;
    sundayActive: boolean;
    completed: boolean;
}

let weekendData: WeekendData = { weekends: {} };

function loadData() {
    weekendData = loadTracking<WeekendData>('weekend', { weekends: {} });
}

function saveData() {
    saveTracking('weekend', weekendData);
}

function getISOWeek(date: Date): string {
    const year = date.getFullYear();
    const start = new Date(year, 0, 1);
    const week = Math.ceil(((date.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
    return `${year}-${week.toString().padStart(2, '0')}`;
}

function getDayOfWeek(date: Date): number {
    return date.getDay();
}

function isWeekend(date: Date): boolean {
    const day = getDayOfWeek(date);
    return day === 0 || day === 6;
}

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

function updateWeekendActivity() {
    const now = new Date();

    if (!isWeekend(now)) {
        return;
    }

    const dayOfWeek = getDayOfWeek(now);
    const weekendActivity = getCurrentWeekendActivity();

    if (weekendActivity.completed) {
        return;
    }

    let activityUpdated = false;

    if (dayOfWeek === 6 && !weekendActivity.saturdayActive) {
        weekendActivity.saturdayActive = true;
        activityUpdated = true;
    }

    if (dayOfWeek === 0 && !weekendActivity.sundayActive) {
        weekendActivity.sundayActive = true;
        activityUpdated = true;
    }

    if (weekendActivity.saturdayActive && weekendActivity.sundayActive && !weekendActivity.completed) {
        weekendActivity.completed = true;
        unlockAchievement(achievements, '🏖️ Weekend Warrior', achievementsFilePath, sidebarProvider);
    }

    if (activityUpdated) {
        saveData();
    }
}

export function resetWeekendTracking() {
    weekendData = { weekends: {} };
    saveData();
}

export function init(): vscode.Disposable[] {
    loadData();

    return [
        vscode.workspace.onDidChangeTextDocument(() => {
            updateWeekendActivity();
        }),

        vscode.workspace.onDidSaveTextDocument(() => {
            updateWeekendActivity();
        }),

        vscode.window.onDidChangeActiveTextEditor(() => {
            updateWeekendActivity();
        }),

        vscode.window.onDidChangeTextEditorSelection(() => {
            updateWeekendActivity();
        })
    ];
}
