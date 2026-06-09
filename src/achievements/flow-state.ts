import * as vscode from 'vscode';
import { loadTracking, saveTracking } from '../utils/storage';
import { unlockAchievement } from '../utils/unlockAchievement';
import { achievements, achievementsFilePath, sidebarProvider } from '../extension';

interface FlowStateData {
    sessions: FlowSession[];
    bestSession: number;
}

interface FlowSession {
    startTime: number;
    endTime: number | null;
    duration: number;
    completed: boolean;
}

let flowStateData: FlowStateData = { sessions: [], bestSession: 0 };

const FLOW_STATE_TARGET = 2 * 60 * 60 * 1000;
const ACTIVITY_TIMEOUT = 30 * 1000;
const MIN_ACTIVITY_INTERVAL = 5 * 1000;

let currentSession: FlowSession | null = null;
let lastActivityTime: number | null = null;
let activityTimeout: NodeJS.Timeout | null = null;
let isWindowFocused = true;
let hasAchievement = false;

function loadData() {
    flowStateData = loadTracking<FlowStateData>('flow-state', { sessions: [], bestSession: 0 });

    const achievement = achievements.find(a => a.name === '🧘 Flow State');
    if (achievement?.unlocked) {
        hasAchievement = true;
    }
}

function saveData() {
    saveTracking('flow-state', flowStateData);
}

function startFlowStateSession() {
    if (hasAchievement || !isWindowFocused) {
        return;
    }

    if (currentSession && currentSession.endTime === null) {
        return;
    }

    const now = Date.now();
    currentSession = {
        startTime: now,
        endTime: null,
        duration: 0,
        completed: false
    };

    lastActivityTime = now;
    resetActivityTimeout();
}

function endFlowStateSession(reason: string = 'unknown') {
    if (!currentSession || currentSession.endTime !== null) {
        return;
    }

    const now = Date.now();
    currentSession.endTime = now;
    currentSession.duration = now - currentSession.startTime;

    if (currentSession.duration >= FLOW_STATE_TARGET) {
        currentSession.completed = true;

        if (!hasAchievement) {
            unlockAchievement(achievements, '🧘 Flow State', achievementsFilePath, sidebarProvider);
            hasAchievement = true;
        }
    }

    if (currentSession.duration > flowStateData.bestSession) {
        flowStateData.bestSession = currentSession.duration;
    }

    flowStateData.sessions.push(currentSession);

    if (flowStateData.sessions.length > 10) {
        flowStateData.sessions = flowStateData.sessions.slice(-10);
    }

    saveData();
    currentSession = null;

    if (activityTimeout) {
        clearTimeout(activityTimeout);
        activityTimeout = null;
    }
}

function updateActivity() {
    if (hasAchievement || !isWindowFocused) {
        if (!isWindowFocused && currentSession && currentSession.endTime === null) {
            endFlowStateSession('window lost focus');
        }
        return;
    }

    const now = Date.now();

    if (lastActivityTime && (now - lastActivityTime) < MIN_ACTIVITY_INTERVAL) {
        return;
    }

    if (!currentSession || currentSession.endTime !== null) {
        startFlowStateSession();
        return;
    }

    lastActivityTime = now;
    resetActivityTimeout();

    const currentDuration = now - currentSession.startTime;
    if (currentDuration >= FLOW_STATE_TARGET && !currentSession.completed) {
        endFlowStateSession('target reached');
    }
}

function resetActivityTimeout() {
    if (activityTimeout) {
        clearTimeout(activityTimeout);
    }

    activityTimeout = setTimeout(() => {
        endFlowStateSession('inactivity timeout');
    }, ACTIVITY_TIMEOUT);
}

export function resetFlowStateTracking() {
    flowStateData = { sessions: [], bestSession: 0 };
    currentSession = null;
    lastActivityTime = null;
    isWindowFocused = true;
    hasAchievement = false;

    if (activityTimeout) {
        clearTimeout(activityTimeout);
        activityTimeout = null;
    }

    saveData();
}

export function init() {
    loadData();

    // Cleanup stale session from previous run
    if (currentSession && currentSession.endTime === null) {
        const timeSinceStart = Date.now() - currentSession.startTime;
        if (timeSinceStart > ACTIVITY_TIMEOUT) {
            endFlowStateSession('startup cleanup');
        }
    }

    vscode.workspace.onDidChangeTextDocument(() => updateActivity());
    vscode.window.onDidChangeTextEditorSelection(() => updateActivity());
    vscode.window.onDidChangeActiveTextEditor(() => updateActivity());
    vscode.workspace.onDidSaveTextDocument(() => updateActivity());

    vscode.window.onDidChangeWindowState((e) => {
        isWindowFocused = e.focused;
        if (!e.focused) {
            endFlowStateSession('window lost focus');
        }
    });

    vscode.workspace.onDidCreateFiles(() => updateActivity());
    vscode.workspace.onDidDeleteFiles(() => updateActivity());
    vscode.workspace.onDidRenameFiles(() => updateActivity());
    vscode.debug.onDidStartDebugSession(() => updateActivity());
    vscode.debug.onDidChangeActiveDebugSession(() => updateActivity());
    vscode.window.onDidChangeActiveTerminal(() => updateActivity());
}
