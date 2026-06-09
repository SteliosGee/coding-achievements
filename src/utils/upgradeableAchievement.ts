import * as vscode from 'vscode';
import { Achievement } from '../extension';
import { saveAchievementDefs, loadAchievementProgress, saveAchievementProgress } from './storage';

export function updateUpgradableAchievement(
    achievements: Achievement[],
    baseId: string,
    currentValue: number,
    achievementsFilePath: string,
    sidebarProvider: any
) {
    const achievement = achievements.find(a => a.baseId === baseId && a.type === 'upgradable');

    if (!achievement || !achievement.tiers) {
        return;
    }

    const previousTier = achievement.currentTier ?? -1;

    achievement.currentValue = currentValue;

    let newTier = -1;

    for (let i = 0; i < achievement.tiers.length; i++) {
        if (currentValue >= achievement.tiers[i].target) {
            newTier = i;
        } else {
            break;
        }
    }

    const hasProgressedToNewTier = newTier > previousTier;

    achievement.currentTier = newTier;

    if (newTier >= 0) {
        const currentTierInfo = achievement.tiers[newTier];
        achievement.tier = currentTierInfo.tier;
        achievement.unlocked = true;

        if (hasProgressedToNewTier) {
            vscode.window.showInformationMessage(`🏆 ${currentTierInfo.name} unlocked! (${achievement.name})`);
        }
    } else {
        achievement.tier = achievement.tiers[0].tier;
        achievement.unlocked = false;
    }

    // Save to globalState
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
}

export function getProgressPercentage(achievement: Achievement): number {
    if (achievement.currentValue === undefined || achievement.currentValue === null || !achievement.tiers || achievement.currentTier === undefined) {
        return 0;
    }

    const currentTierIndex = achievement.currentTier;
    const nextTierIndex = currentTierIndex + 1;

    if (nextTierIndex >= achievement.tiers.length) {
        return 100;
    }

    if (currentTierIndex < 0) {
        const firstTierTarget = achievement.tiers[0].target;
        return Math.min((achievement.currentValue / firstTierTarget) * 100, 100);
    }

    const currentTierTarget = achievement.tiers[currentTierIndex].target;
    const nextTierTarget = achievement.tiers[nextTierIndex].target;

    const progressInCurrentRange = achievement.currentValue - currentTierTarget;
    const totalRangeSize = nextTierTarget - currentTierTarget;

    return Math.min((progressInCurrentRange / totalRangeSize) * 100, 100);
}

export function getProgressText(achievement: Achievement): string {
    if (achievement.currentValue === undefined || achievement.currentValue === null || !achievement.tiers || achievement.currentTier === undefined) {
        return '0 / 0';
    }

    const currentTierIndex = achievement.currentTier;
    const nextTierIndex = currentTierIndex + 1;

    if (nextTierIndex >= achievement.tiers.length) {
        return 'MAX LEVEL';
    }

    if (currentTierIndex < 0) {
        const firstTierTarget = achievement.tiers[0].target;
        return `${achievement.currentValue.toLocaleString()} / ${firstTierTarget.toLocaleString()}`;
    }

    const nextTierTarget = achievement.tiers[nextTierIndex].target;
    return `${achievement.currentValue.toLocaleString()} / ${nextTierTarget.toLocaleString()}`;
}

export function getCurrentTierName(achievement: Achievement): string {
    if (!achievement.tiers || achievement.currentTier === undefined) {
        return achievement.name;
    }

    if (achievement.currentTier < 0) {
        return achievement.tiers[0].name;
    }

    if (achievement.currentTier >= achievement.tiers.length) {
        return achievement.tiers[achievement.tiers.length - 1].name;
    }

    return achievement.tiers[achievement.currentTier].name;
}

export function getCurrentTierDescription(achievement: Achievement): string {
    if (!achievement.tiers || achievement.currentTier === undefined) {
        return achievement.description;
    }

    if (achievement.currentTier < 0) {
        return achievement.tiers[0].description;
    }

    if (achievement.currentTier >= achievement.tiers.length) {
        return achievement.tiers[achievement.tiers.length - 1].description;
    }

    return achievement.tiers[achievement.currentTier].description;
}
