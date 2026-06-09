import * as vscode from 'vscode';
import { unlockAchievement } from '../utils/unlockAchievement';
import { achievements, achievementsFilePath, sidebarProvider } from '../extension';
import { loadTracking, saveTracking } from '../utils/storage';

interface FileExplorerData {
    openedFiles: string[];
}

let openedFiles = new Set<string>();

function loadData() {
    const data = loadTracking<FileExplorerData>('file-explorer', { openedFiles: [] });
    openedFiles = new Set(data.openedFiles);
}

function saveData() {
    saveTracking('file-explorer', { openedFiles: Array.from(openedFiles) });
}

export function resetFileExplorerTracking() {
    openedFiles.clear();
    saveData();
}

export function init() {
    loadData();

    vscode.window.onDidChangeActiveTextEditor(editor => {
        if (editor?.document?.uri) {
            openedFiles.add(editor.document.uri.toString());
            if (openedFiles.size >= 10) {
                unlockAchievement(achievements, '🧭 Explorer', achievementsFilePath, sidebarProvider);
            }
            saveData();
        }
    });
}
