import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Achievement } from '../extension';

let context: vscode.ExtensionContext | undefined;

export function setContext(ctx: vscode.ExtensionContext): void {
    context = ctx;
}

export function getContext(): vscode.ExtensionContext | undefined {
    return context;
}

// --- Achievement Progress ---

export function loadAchievementProgress(): Record<string, { unlocked: boolean; currentValue: number; currentTier: number; tier: string }> {
    if (context) {
        return context.globalState.get('achievementProgress', {});
    }
    return loadFromFile<Record<string, { unlocked: boolean; currentValue: number; currentTier: number; tier: string }>>('achievementProgress.json', {});
}

export function saveAchievementProgress(data: Record<string, { unlocked: boolean; currentValue: number; currentTier: number; tier: string }>): void {
    if (context) {
        context.globalState.update('achievementProgress', data);
    }
}

// --- Achievement Definitions ---

export function loadAchievementDefs(): Achievement[] {
    if (context) {
        const defsPath = path.join(context.extensionPath, 'achievements.json');
        if (fs.existsSync(defsPath)) {
            return JSON.parse(fs.readFileSync(defsPath, 'utf8'));
        }
    }
    return [];
}

export function saveAchievementDefs(achievements: Achievement[]): void {
    if (context) {
        const defsPath = path.join(context.extensionPath, 'achievements.json');
        fs.writeFileSync(defsPath, JSON.stringify(achievements, null, 2), 'utf8');
    }
}

// --- Generic Tracking Data ---

export function loadTracking<T>(key: string, defaultValue: T): T {
    if (context) {
        return context.globalState.get<T>(`tracking_${key}`, defaultValue);
    }
    return loadFromFile<T>(`${key}.json`, defaultValue);
}

export function saveTracking<T>(key: string, data: T): void {
    if (context) {
        context.globalState.update(`tracking_${key}`, data);
    }
    saveToFile(`${key}.json`, data);
}

// --- First-run flag ---

export function isFirstRun(): boolean {
    if (context) {
        return !context.globalState.get('hasInitialized', false);
    }
    return true;
}

export function markInitialized(): void {
    if (context) {
        context.globalState.update('hasInitialized', true);
    }
}

// --- Version tracking for changelog notifications ---

export function getLastSeenVersion(): string | undefined {
    if (context) {
        return context.globalState.get<string | undefined>('lastSeenVersion', undefined);
    }
    return undefined;
}

export function setLastSeenVersion(version: string): void {
    if (context) {
        context.globalState.update('lastSeenVersion', version);
    }
}

// --- Reset ---

export function resetAllTracking(): void {
    if (context) {
        const trackingKeys = ['typing', 'time', 'streaks', 'languages', 'workaholic', 'weekend', 'flow-state', 'file-explorer', 'early_bird_streak', 'night_owl_streak'];
        trackingKeys.forEach(key => {
            context!.globalState.update(`tracking_${key}`, undefined);
        });
        context.globalState.update('achievementProgress', undefined);
    }
}

// --- File-based fallback and migration ---

function getDataDir(): string | undefined {
    if (context) {
        return path.join(context.extensionPath, 'out', 'achievements');
    }
    return undefined;
}

function loadFromFile<T>(filename: string, defaultValue: T): T {
    const dir = getDataDir();
    if (!dir) {
        return defaultValue;
    }
    const filePath = path.join(dir, filename);
    if (fs.existsSync(filePath)) {
        try {
            return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        } catch {
            return defaultValue;
        }
    }
    return defaultValue;
}

function saveToFile(filename: string, data: unknown): void {
    const dir = getDataDir();
    if (!dir) {
        return;
    }
    try {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(path.join(dir, filename), JSON.stringify(data), 'utf-8');
    } catch (error) {
        console.error(`Error saving ${filename}:`, error);
    }
}

export function migrateFromFileStorage(): void {
    if (!context) {
        return;
    }

    try {
        // Migrate achievement progress from achievements.json
        const defsPath = path.join(context.extensionPath, 'achievements.json');
        if (fs.existsSync(defsPath)) {
            const oldAchievements: Achievement[] = JSON.parse(fs.readFileSync(defsPath, 'utf8'));
            const progressData: Record<string, { unlocked: boolean; currentValue: number; currentTier: number; tier: string }> = {};
            let hasData = false;

            oldAchievements.forEach(ach => {
                if (ach.unlocked || (ach.currentValue && ach.currentValue > 0) || (ach.currentTier && ach.currentTier > 0)) {
                    const key = ach.baseId || ach.name;
                    progressData[key] = {
                        unlocked: ach.unlocked,
                        currentValue: ach.currentValue || 0,
                        currentTier: ach.currentTier || 0,
                        tier: ach.tier
                    };
                    hasData = true;
                }
            });

            if (hasData) {
                context.globalState.update('achievementProgress', progressData);
            }
        }

        // Migrate tracking data files
        const trackingFiles: Array<{ file: string; key: string }> = [
            { file: 'totalCharacters.json', key: 'typing' },
            { file: 'coding-time.json', key: 'time' },
            { file: 'streak-data.json', key: 'streaks' },
            { file: 'languages.json', key: 'languages' },
            { file: 'workaholic-data.json', key: 'workaholic' },
            { file: 'weekend-data.json', key: 'weekend' },
            { file: 'flow-state-data.json', key: 'flow-state' },
        ];

        const outDir = path.join(context.extensionPath, 'out', 'achievements');
        trackingFiles.forEach(({ file, key }) => {
            const filePath = path.join(outDir, file);
            if (fs.existsSync(filePath)) {
                try {
                    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                    context!.globalState.update(`tracking_${key}`, data);
                } catch {
                    // Skip corrupted files
                }
            }
        });

        console.log('Data migration to persistent storage complete');
    } catch (error) {
        console.error('Error during data migration:', error);
    }
}
