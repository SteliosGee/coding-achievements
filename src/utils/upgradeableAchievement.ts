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

    // Update current value
    achievement.currentValue = currentValue;
    
    // Determine current tier based on progress
    let newTier = 0;
    let hasUnlocked = false;
    
    for (let i = 0; i < achievement.tiers.length; i++) {
        if (currentValue >= achievement.tiers[i].target) {
            newTier = i;
        } else {
            break;
        }
    }
    
    // Check if we've progressed to a higher tier
    if (newTier > (achievement.currentTier || 0)) {
        achievement.currentTier = newTier;
        hasUnlocked = true;
        
        // Update the achievement's display properties based on current tier
        const currentTierInfo = achievement.tiers[newTier];
        achievement.tier = currentTierInfo.tier;
        achievement.unlocked = true;
        
        // Show notification for tier upgrade
        vscode.window.showInformationMessage(`🏆 ${currentTierInfo.name} unlocked! (${achievement.name})`);
    } else if (newTier >= 0) {
        // Update tier info even if not newly unlocked
        const currentTierInfo = achievement.tiers[newTier];
        achievement.tier = currentTierInfo.tier;
        achievement.currentTier = newTier;
        
        if (currentValue >= currentTierInfo.target) {
            achievement.unlocked = true;
        }
    }
    
    if (hasUnlocked || achievement.currentValue !== currentValue) {
        fs.writeFileSync(achievementsFilePath, JSON.stringify(achievements, null, 2));
        sidebarProvider.refresh();
    }
}

export function getProgressPercentage(achievement: Achievement): number {
    if (!achievement.currentValue || !achievement.tiers || achievement.currentTier === undefined) {
        return 0;
    }
    
    const currentTierIndex = achievement.currentTier;
    const nextTierIndex = currentTierIndex + 1;
    
    // If we're at the max tier, show 100%
    if (nextTierIndex >= achievement.tiers.length) {
        return 100;
    }
    
    const currentTierTarget = currentTierIndex >= 0 ? achievement.tiers[currentTierIndex].target : 0;
    const nextTierTarget = achievement.tiers[nextTierIndex].target;
    
    // Calculate progress between current tier and next tier
    const progressInCurrentRange = achievement.currentValue - currentTierTarget;
    const totalRangeSize = nextTierTarget - currentTierTarget;
    
    return Math.min((progressInCurrentRange / totalRangeSize) * 100, 100);
}

export function getProgressText(achievement: Achievement): string {
    if (!achievement.currentValue || !achievement.tiers || achievement.currentTier === undefined) {
        return '0 / 0';
    }
    
    const nextTierIndex = achievement.currentTier + 1;
    
    // If we're at the max tier
    if (nextTierIndex >= achievement.tiers.length) {
        return 'MAX LEVEL';
    }
    
    const nextTierTarget = achievement.tiers[nextTierIndex].target;
    return `${achievement.currentValue.toLocaleString()} / ${nextTierTarget.toLocaleString()}`;
}

export function getCurrentTierName(achievement: Achievement): string {
    if (!achievement.tiers || achievement.currentTier === undefined) {
        return achievement.name;
    }
    
    if (achievement.currentTier < 0 || achievement.currentTier >= achievement.tiers.length) {
        return achievement.tiers[0].name;
    }
    
    return achievement.tiers[achievement.currentTier].name;
}

export function getCurrentTierDescription(achievement: Achievement): string {
    if (!achievement.tiers || achievement.currentTier === undefined) {
        return achievement.description;
    }
    
    if (achievement.currentTier < 0 || achievement.currentTier >= achievement.tiers.length) {
        return achievement.tiers[0].description;
    }
    
    return achievement.tiers[achievement.currentTier].description;
}
