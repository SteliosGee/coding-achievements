import * as fs from 'fs';
import * as vscode from 'vscode';
import { Achievement } from '../extension';

export function updateUpgradableAchievement(
    achievements: Achievement[], 
    baseId: string, 
    currentValue: number,
    achievementsFilePath: string, 
    sidebarProvider: any
) {
    // Find the single upgradable achievement for this baseId
    const achievement = achievements.find(a => a.baseId === baseId && a.type === 'upgradable');
    
    if (!achievement || !achievement.tiers) {
        return;
    }

    // Store the previous tier for comparison
    const previousTier = achievement.currentTier ?? -1;
    
    // Update current value
    achievement.currentValue = currentValue;
    
    // Determine current tier based on progress
    let newTier = -1; // Start with -1 (no tier achieved)
    
    for (let i = 0; i < achievement.tiers.length; i++) {
        if (currentValue >= achievement.tiers[i].target) {
            newTier = i;
        } else {
            break;
        }
    }
    
    // Only show notification if we've progressed to a HIGHER tier
    const hasProgressedToNewTier = newTier > previousTier;
    
    // Update tier regardless of whether it's new
    achievement.currentTier = newTier;
    
    if (newTier >= 0) {
        const currentTierInfo = achievement.tiers[newTier];
        achievement.tier = currentTierInfo.tier;
        achievement.unlocked = true;
        
        // Only show notification for NEW tier achievements
        if (hasProgressedToNewTier) {
            vscode.window.showInformationMessage(`🏆 ${currentTierInfo.name} unlocked! (${achievement.name})`);
        }
    } else {
        // No tier achieved yet, set to bronze and locked
        achievement.tier = achievement.tiers[0].tier;
        achievement.unlocked = false;
    }
    
    // Always save the updated state
    fs.writeFileSync(achievementsFilePath, JSON.stringify(achievements, null, 2));
    sidebarProvider.refresh();
}

export function getProgressPercentage(achievement: Achievement): number {
    if (achievement.currentValue === undefined || achievement.currentValue === null || !achievement.tiers || achievement.currentTier === undefined) {
        return 0;
    }
    
    const currentTierIndex = achievement.currentTier;
    const nextTierIndex = currentTierIndex + 1;
    
    // If we're at the max tier, show 100%
    if (nextTierIndex >= achievement.tiers.length) {
        return 100;
    }
    
    // If we haven't reached the first tier yet
    if (currentTierIndex < 0) {
        const firstTierTarget = achievement.tiers[0].target;
        return Math.min((achievement.currentValue / firstTierTarget) * 100, 100);
    }
    
    const currentTierTarget = achievement.tiers[currentTierIndex].target;
    const nextTierTarget = achievement.tiers[nextTierIndex].target;
    
    // Calculate progress between current tier and next tier
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
    
    // If we're at the max tier
    if (nextTierIndex >= achievement.tiers.length) {
        return 'MAX LEVEL';
    }
    
    // If we haven't reached the first tier yet, show progress toward first tier
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
    
    // If we haven't reached the first tier yet, show the first tier name as the target
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
    
    // If we haven't reached the first tier yet, show the first tier description
    if (achievement.currentTier < 0) {
        return achievement.tiers[0].description;
    }
    
    if (achievement.currentTier >= achievement.tiers.length) {
        return achievement.tiers[achievement.tiers.length - 1].description;
    }
    
    return achievement.tiers[achievement.currentTier].description;
}
