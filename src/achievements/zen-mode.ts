import * as vscode from 'vscode';
import { unlockAchievement } from '../utils/unlockAchievement';
import { achievements, achievementsFilePath, sidebarProvider } from '../extension';

let focusedFile: string | null = null;
let focusStart: number = 0;
let focusTimeout: NodeJS.Timeout | null = null;
let unlocked = false;

const ZEN_TARGET_MS = 30 * 60 * 1000;

export function resetZenModeTracking() {
    focusedFile = null;
    focusStart = 0;
    unlocked = false;
    if (focusTimeout) {
        clearTimeout(focusTimeout);
        focusTimeout = null;
    }
}

function startFocus(fileUri: string) {
    if (unlocked) {
        return;
    }

    if (focusedFile === fileUri) {
        return;
    }

    focusedFile = fileUri;
    focusStart = Date.now();

    if (focusTimeout) {
        clearTimeout(focusTimeout);
    }

    focusTimeout = setTimeout(() => {
        if (!unlocked && focusedFile) {
            unlockAchievement(achievements, '🧊 Zen Mode', achievementsFilePath, sidebarProvider);
            unlocked = true;
        }
    }, ZEN_TARGET_MS);
}

function clearFocus() {
    focusedFile = null;
    if (focusTimeout) {
        clearTimeout(focusTimeout);
        focusTimeout = null;
    }
}

export function init(): vscode.Disposable[] {
    const achievement = achievements.find(a => a.name === '🧊 Zen Mode');
    if (achievement?.unlocked) {
        unlocked = true;
    }

    return [
        vscode.window.onDidChangeActiveTextEditor((editor) => {
            if (editor?.document?.uri) {
                startFocus(editor.document.uri.toString());
            } else {
                clearFocus();
            }
        }),

        vscode.window.onDidChangeWindowState((e) => {
            if (!e.focused) {
                clearFocus();
            }
        })
    ];
}
