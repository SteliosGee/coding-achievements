import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { Achievement } from '../extension'; // Import the Achievement type from the main extension

export function unlockAchievement(
    achievements: Achievement[], 
    achievementName: string, 
    achievementsFilePath: string, 
    sidebarProvider: any
) {
    const achievement = achievements.find(a => a.name === achievementName);
    if (achievement && !achievement.unlocked) {
        achievement.unlocked = true;
        fs.writeFileSync(achievementsFilePath, JSON.stringify(achievements, null, 2));
        sidebarProvider.refresh();
        vscode.window.showInformationMessage(`${achievementName} unlocked!`);
    }
}
