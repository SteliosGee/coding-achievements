import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { unlockAchievement } from '../utils/unlockAchievement';
import { achievements, achievementsFilePath, sidebarProvider } from '../extension';

// Flow State tracking data structure
interface FlowStateData {
    sessions: FlowSession[];
    bestSession: number; // Best session duration in milliseconds
}

interface FlowSession {
    startTime: number;
    endTime: number | null;
    duration: number; // Duration in milliseconds
    completed: boolean; // Whether this session reached 2 hours
}

let flowStateData: FlowStateData = {
    sessions: [],
    bestSession: 0
};

const flowStateDataPath = path.join(__dirname, 'flow-state-data.json');

// Flow State tracking state
const FLOW_STATE_TARGET = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
const ACTIVITY_TIMEOUT = 30 * 1000; // 30 seconds of inactivity before pausing
const MIN_ACTIVITY_INTERVAL = 5 * 1000; // Minimum 5 seconds between activity checks

let currentSession: FlowSession | null = null;
let lastActivityTime: number | null = null;
let activityTimeout: NodeJS.Timeout | null = null;
let isWindowFocused: boolean = true;
let hasAchievement: boolean = false;

// Load flow state data
function loadFlowStateData() {
    if (fs.existsSync(flowStateDataPath)) {
        try {
            const data = fs.readFileSync(flowStateDataPath, 'utf-8');
            flowStateData = JSON.parse(data);
            
            // Check if achievement is already unlocked
            const achievement = achievements.find(a => a.name === '🧘 Flow State');
            if (achievement?.unlocked) {
                hasAchievement = true;
            }
        } catch (error) {
            console.error('Error loading flow state data:', error);
            flowStateData = { sessions: [], bestSession: 0 };
        }
    }
}

// Save flow state data
function saveFlowStateData() {
    try {
        fs.writeFileSync(flowStateDataPath, JSON.stringify(flowStateData), 'utf-8');
    } catch (error) {
        console.error('Error saving flow state data:', error);
    }
}

// Reset flow state tracking
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
    
    saveFlowStateData();
}

// Start a new flow state session
function startFlowStateSession() {
    // Don't start if already have achievement
    if (hasAchievement) {
        return;
    }
    
    // Don't start if window is not focused
    if (!isWindowFocused) {
        return;
    }
    
    // Don't start if already in a session
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
    
    console.log('🧘 Flow State session started');
}

// End the current flow state session
function endFlowStateSession(reason: string = 'unknown') {
    if (!currentSession || currentSession.endTime !== null) {
        return;
    }
    
    const now = Date.now();
    currentSession.endTime = now;
    currentSession.duration = now - currentSession.startTime;
    
    // Check if this session reached the target
    if (currentSession.duration >= FLOW_STATE_TARGET) {
        currentSession.completed = true;
        
        if (!hasAchievement) {
            unlockAchievement(achievements, '🧘 Flow State', achievementsFilePath, sidebarProvider);
            hasAchievement = true;
            console.log('🏆 Flow State achievement unlocked! 2 hours of uninterrupted coding!');
        }
    }
    
    // Update best session
    if (currentSession.duration > flowStateData.bestSession) {
        flowStateData.bestSession = currentSession.duration;
    }
    
    // Add to sessions history
    flowStateData.sessions.push(currentSession);
    
    // Keep only last 10 sessions to avoid excessive data
    if (flowStateData.sessions.length > 10) {
        flowStateData.sessions = flowStateData.sessions.slice(-10);
    }
    
    const durationMinutes = Math.round(currentSession.duration / (1000 * 60));
    console.log(`🧘 Flow State session ended (${reason}): ${durationMinutes} minutes`);
    
    saveFlowStateData();
    currentSession = null;
    
    if (activityTimeout) {
        clearTimeout(activityTimeout);
        activityTimeout = null;
    }
}

// Update activity and check progress
function updateActivity() {
    // Don't track if already have achievement
    if (hasAchievement) {
        return;
    }
    
    // Don't track if window is not focused
    if (!isWindowFocused) {
        endFlowStateSession('window lost focus');
        return;
    }
    
    const now = Date.now();
    
    // Throttle activity updates
    if (lastActivityTime && (now - lastActivityTime) < MIN_ACTIVITY_INTERVAL) {
        return;
    }
    
    // Start session if not already started
    if (!currentSession || currentSession.endTime !== null) {
        startFlowStateSession();
        return;
    }
    
    lastActivityTime = now;
    resetActivityTimeout();
    
    // Check if we've reached the target
    const currentDuration = now - currentSession.startTime;
    if (currentDuration >= FLOW_STATE_TARGET && !currentSession.completed) {
        endFlowStateSession('target reached');
    }
}

// Reset the inactivity timer
function resetActivityTimeout() {
    if (activityTimeout) {
        clearTimeout(activityTimeout);
    }
    
    activityTimeout = setTimeout(() => {
        endFlowStateSession('inactivity timeout');
    }, ACTIVITY_TIMEOUT);
}

// Handle window focus changes
function onWindowFocusChanged(focused: boolean) {
    isWindowFocused = focused;
    
    if (!focused) {
        console.log('🧘 VS Code lost focus - ending Flow State session');
        endFlowStateSession('window lost focus');
    } else {
        console.log('🧘 VS Code gained focus - ready for Flow State tracking');
        // Don't auto-start here, wait for actual activity
    }
}

// Clean up any existing session on startup that might be invalid
function cleanupExistingSession() {
    if (currentSession && currentSession.endTime === null) {
        const timeSinceStart = Date.now() - currentSession.startTime;
        
        // If more than activity timeout has passed since startup, end the session
        if (timeSinceStart > ACTIVITY_TIMEOUT) {
            endFlowStateSession('startup cleanup');
        }
    }
}

// Load existing data
loadFlowStateData();

// Clean up any invalid sessions after loading data
cleanupExistingSession();

// Listen for coding activity
vscode.workspace.onDidChangeTextDocument(() => {
    updateActivity();
});

// Listen for cursor movement
vscode.window.onDidChangeTextEditorSelection(() => {
    updateActivity();
});

// Listen for active editor changes
vscode.window.onDidChangeActiveTextEditor(() => {
    updateActivity();
});

// Listen for file saves
vscode.workspace.onDidSaveTextDocument(() => {
    updateActivity();
});

// Listen for window focus changes
vscode.window.onDidChangeWindowState((e) => {
    onWindowFocusChanged(e.focused);
});

// Listen for file operations
vscode.workspace.onDidCreateFiles(() => updateActivity());
vscode.workspace.onDidDeleteFiles(() => updateActivity());
vscode.workspace.onDidRenameFiles(() => updateActivity());

// Listen for debug session activity
vscode.debug.onDidStartDebugSession(() => updateActivity());
vscode.debug.onDidChangeActiveDebugSession(() => updateActivity());

// Listen for terminal activity
vscode.window.onDidChangeActiveTerminal(() => updateActivity());

console.log('🧘 Flow State achievement tracking initialized');
