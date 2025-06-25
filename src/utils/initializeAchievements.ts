import * as fs from 'fs';
import * as path from 'path';
import { achievements, achievementsFilePath, sidebarProvider } from '../extension';
import { updateUpgradableAchievement } from './upgradeableAchievement';

// Initialize all upgradable achievements with current values from tracking files
export function initializeUpgradableAchievements() {
    // Initialize typing achievements
    const typingDataPath = path.join(__dirname, '../achievements/totalCharacters.json');
    if (fs.existsSync(typingDataPath)) {
        try {
            const data = JSON.parse(fs.readFileSync(typingDataPath, 'utf-8'));
            const totalCharacters = data.totalCharacters || 0;
            updateUpgradableAchievement(achievements, 'typing', totalCharacters, achievementsFilePath, sidebarProvider);
        } catch (error) {
            console.error('Error loading typing data:', error);
        }
    }

    // Initialize time-based achievements
    const timeDataPath = path.join(__dirname, '../achievements/coding-time.json');
    if (fs.existsSync(timeDataPath)) {
        try {
            const data = JSON.parse(fs.readFileSync(timeDataPath, 'utf-8'));
            const totalCodingTimeMs = data.totalCodingTimeMs || 0;
            const totalHours = totalCodingTimeMs / (1000 * 60 * 60);
            updateUpgradableAchievement(achievements, 'coding_time', totalHours, achievementsFilePath, sidebarProvider);
        } catch (error) {
            console.error('Error loading time data:', error);
        }
    }

    // Initialize streak achievements
    const streakDataPath = path.join(__dirname, '../achievements/streak-data.json');
    if (fs.existsSync(streakDataPath)) {
        try {
            const data = JSON.parse(fs.readFileSync(streakDataPath, 'utf-8'));
            const currentStreak = data.currentStreak || 0;
            updateUpgradableAchievement(achievements, 'daily_streak', currentStreak, achievementsFilePath, sidebarProvider);
        } catch (error) {
            console.error('Error loading streak data:', error);
        }
    }

    // Initialize workaholic achievements
    const workaholicDataPath = path.join(__dirname, '../achievements/workaholic-data.json');
    if (fs.existsSync(workaholicDataPath)) {
        try {
            const data = JSON.parse(fs.readFileSync(workaholicDataPath, 'utf-8'));
            const today = new Date().toISOString().split('T')[0];
            const todaySession = data.dailySessions?.[today];
            
            if (todaySession) {
                const longestStreakHours = todaySession.longestStreakMs / (1000 * 60 * 60);
                updateUpgradableAchievement(achievements, 'workaholic', longestStreakHours, achievementsFilePath, sidebarProvider);
            }
        } catch (error) {
            console.error('Error loading workaholic data:', error);
        }
    }

    console.log('✅ Upgradable achievements initialized with current progress values');
}
