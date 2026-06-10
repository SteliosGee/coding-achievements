import * as vscode from 'vscode';
import { unlockAchievement } from '../utils/unlockAchievement';
import { achievements, achievementsFilePath, sidebarProvider } from '../extension';

let burstStart = 0;
let burstChars = 0;
let unlocked = false;

const BURST_WINDOW_MS = 10 * 1000;
const BURST_THRESHOLD = 500;

export function resetSpeedDemonTracking() {
    burstStart = 0;
    burstChars = 0;
    unlocked = false;
}

export function init(): vscode.Disposable[] {
    const achievement = achievements.find(a => a.name === '🏃 Speed Demon');
    if (achievement?.unlocked) {
        unlocked = true;
    }

    return [
        vscode.workspace.onDidChangeTextDocument((event) => {
            if (unlocked) {
                return;
            }

            let changeAmount = 0;
            event.contentChanges.forEach(change => {
                if (change.text.length > 0) {
                    changeAmount += change.text.length;
                }
            });

            if (changeAmount <= 0) {
                return;
            }

            const now = Date.now();

            if (now - burstStart > BURST_WINDOW_MS) {
                burstStart = now;
                burstChars = changeAmount;
            } else {
                burstChars += changeAmount;
            }

            if (burstChars >= BURST_THRESHOLD) {
                unlockAchievement(achievements, '🏃 Speed Demon', achievementsFilePath, sidebarProvider);
                unlocked = true;
            }
        })
    ];
}
