import * as vscode from 'vscode';
import { Achievement } from '../extension';
import { saveAchievementDefs, loadAchievementProgress, saveAchievementProgress } from './storage';

export function unlockAchievement(
    achievements: Achievement[],
    achievementName: string,
    achievementsFilePath: string,
    sidebarProvider: any
) {
    const achievement = achievements.find(a => a.name === achievementName);
    if (achievement && !achievement.unlocked) {
        achievement.unlocked = true;

        // Save progress to globalState
        const progress = loadAchievementProgress();
        const key = achievement.baseId || achievement.name;
        progress[key] = {
            unlocked: achievement.unlocked,
            currentValue: achievement.currentValue || 0,
            currentTier: achievement.currentTier || 0,
            tier: achievement.tier
        };
        saveAchievementProgress(progress);

        // Also save to file for backward compatibility
        saveAchievementDefs(achievements);

        sidebarProvider?.refresh();

        // Notify webview for sound + toast
        if (sidebarProvider?._view) {
            sidebarProvider._view.webview.postMessage({
                command: 'achievementUnlocked',
                name: achievementName
            });
        }

        vscode.window.showInformationMessage(`${achievementName} unlocked!`);
    }
}
