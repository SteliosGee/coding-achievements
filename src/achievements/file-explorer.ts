import * as vscode from 'vscode';
import { unlockAchievement } from '../utils/unlockAchievement';
import { achievements, achievementsFilePath, sidebarProvider } from '../extension';

// Track unique files opened in the current session
const openedFiles = new Set<string>();

// Listen for file open events
vscode.window.onDidChangeActiveTextEditor(editor => {
    if (editor && editor.document && editor.document.uri) {
        // Add this file to our set of opened files
        openedFiles.add(editor.document.uri.toString());
        
        // Check for achievement
        if (openedFiles.size >= 10) {
            unlockAchievement(achievements, '🧭 Explorer', achievementsFilePath, sidebarProvider);
        }
    }
});

// Reset tracking for session-based achievements
export function resetFileExplorerTracking() {
    openedFiles.clear();
}