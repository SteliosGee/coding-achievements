import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Achievement } from '../extension';

/**
 * Data manager that uses VS Code's storage API to persist user data
 * This ensures data survives extension updates
 */
export class DataManager {
    private context: vscode.ExtensionContext;
    private defaultAchievements: Achievement[];

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.defaultAchievements = this.loadDefaultAchievements();
    }

    /**
     * Load default achievement definitions from the extension bundle
     */
    private loadDefaultAchievements(): Achievement[] {
        const defaultAchievementsPath = path.join(this.context.extensionPath, 'achievements.json');
        if (fs.existsSync(defaultAchievementsPath)) {
            return JSON.parse(fs.readFileSync(defaultAchievementsPath, 'utf8'));
        }
        return [];
    }

    /**
     * Get user achievements with their progress preserved
     */
    getUserAchievements(): Achievement[] {
        // Get user progress from persistent storage
        const userProgress = this.context.globalState.get<any>('achievementProgress', {});
        
        // Merge default achievements with user progress
        return this.defaultAchievements.map(defaultAch => {
            const userData = userProgress[defaultAch.baseId || defaultAch.name];
            
            return {
                ...defaultAch,
                unlocked: userData?.unlocked || false,
                currentValue: userData?.currentValue || 0,
                currentTier: userData?.currentTier || 0,
                tier: userData?.tier || defaultAch.tier
            };
        });
    }

    /**
     * Save user achievement progress
     */
    saveAchievementProgress(achievements: Achievement[]): void {
        const progressData: any = {};
        
        achievements.forEach(ach => {
            const key = ach.baseId || ach.name;
            progressData[key] = {
                unlocked: ach.unlocked,
                currentValue: ach.currentValue || 0,
                currentTier: ach.currentTier || 0,
                tier: ach.tier
            };
        });

        this.context.globalState.update('achievementProgress', progressData);
    }

    /**
     * Get tracking data (typing, time, streaks, etc.)
     */
    getTrackingData(key: string): any {
        return this.context.globalState.get(`tracking_${key}`, {});
    }

    /**
     * Save tracking data
     */
    saveTrackingData(key: string, data: any): void {
        this.context.globalState.update(`tracking_${key}`, data);
    }

    /**
     * Reset all user data
     */
    resetAllData(): void {
        this.context.globalState.update('achievementProgress', {});
        
        // Reset all tracking data
        const trackingKeys = ['typing', 'time', 'streaks', 'languages'];
        trackingKeys.forEach(key => {
            this.context.globalState.update(`tracking_${key}`, {});
        });
    }

    /**
     * Migrate from old file-based storage to new storage API
     */
    async migrateFromFileStorage(): Promise<void> {
        try {
            // Check if we have old achievements.json with user data
            const oldAchievementsPath = path.join(this.context.extensionPath, 'achievements.json');
            if (fs.existsSync(oldAchievementsPath)) {
                const oldAchievements = JSON.parse(fs.readFileSync(oldAchievementsPath, 'utf8'));
                
                // Extract user progress
                const progressData: any = {};
                oldAchievements.forEach((ach: Achievement) => {
                    if (ach.unlocked || ach.currentValue || ach.currentTier) {
                        const key = ach.baseId || ach.name;
                        progressData[key] = {
                            unlocked: ach.unlocked,
                            currentValue: ach.currentValue || 0,
                            currentTier: ach.currentTier || 0,
                            tier: ach.tier
                        };
                    }
                });

                // Save to new storage if we found user progress
                if (Object.keys(progressData).length > 0) {
                    await this.context.globalState.update('achievementProgress', progressData);
                    console.log('✅ Migrated achievement progress to persistent storage');
                }
            }

            // Migrate old data files
            const dataDir = path.join(this.context.extensionPath, 'data');
            if (fs.existsSync(dataDir)) {
                // Migrate typing data
                const typingFile = path.join(dataDir, 'totalCharacters.json');
                if (fs.existsSync(typingFile)) {
                    const typingData = JSON.parse(fs.readFileSync(typingFile, 'utf8'));
                    await this.saveTrackingData('typing', typingData);
                }

                // Migrate streak data
                const streakFile = path.join(dataDir, 'streak-data.json');
                if (fs.existsSync(streakFile)) {
                    const streakData = JSON.parse(fs.readFileSync(streakFile, 'utf8'));
                    await this.saveTrackingData('streaks', streakData);
                }

                // Migrate time data
                const timeFile = path.join(dataDir, 'coding-time.json');
                if (fs.existsSync(timeFile)) {
                    const timeData = JSON.parse(fs.readFileSync(timeFile, 'utf8'));
                    await this.saveTrackingData('time', timeData);
                }

                console.log('✅ Migrated tracking data to persistent storage');
            }
        } catch (error) {
            console.error('❌ Error during data migration:', error);
        }
    }
}
