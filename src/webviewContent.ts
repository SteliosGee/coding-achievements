import * as vscode from 'vscode';
import { achievements, Achievement } from './extension';
import { getProgressPercentage, getProgressText, getCurrentTierName, getCurrentTierDescription } from './utils/upgradeableAchievement';
import { getUnlockSoundScript } from './utils/sound';

interface AchievementsByTier {
    diamond: Achievement[];
    gold: Achievement[];
    silver: Achievement[];
    bronze: Achievement[];
}

interface AchievementsByType {
    upgradable: { [baseId: string]: Achievement[] };
    unique: Achievement[];
}

function renderUpgradableCard(ach: Achievement, seriesName: string, view: vscode.WebviewView | undefined, context: vscode.ExtensionContext): string {
    const progressPercentage = getProgressPercentage(ach);
    const progressText = getProgressText(ach);
    const currentTierName = getCurrentTierName(ach);
    const currentTierDescription = getCurrentTierDescription(ach);
    const iconUri = view?.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, ach.icon));

    return `
    <div class="achievement-card ${ach.tier} ${ach.unlocked ? 'unlocked' : 'locked'} upgradable" data-unlocked="${ach.unlocked}">
        <div class="card-icon-wrap">
            <img src="${iconUri}" alt="${ach.name}" />
            ${ach.unlocked ? '<div class="unlock-badge">&#10003;</div>' : ''}
        </div>
        <div class="card-name">${currentTierName}</div>
        <div class="progress-track">
            <div class="progress-fill ${ach.tier}" style="width: ${progressPercentage}%"></div>
        </div>
        <div class="progress-label">${progressText}</div>
        <div class="tooltip">
            <strong>${seriesName}</strong><br>
            <strong>Tier: ${currentTierName}</strong><br>
            ${currentTierDescription}<br>
            <em>${progressText}</em><br>
            <em class="tier-badge ${ach.tier}">${ach.tier.toUpperCase()}</em><br>
            <strong>${ach.unlocked ? 'UNLOCKED' : 'LOCKED'}</strong>
        </div>
    </div>`;
}

function renderUniqueCard(ach: Achievement, view: vscode.WebviewView | undefined, context: vscode.ExtensionContext): string {
    const iconUri = view?.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, ach.icon));
    const displayName = ach.name.replace(/^[^\w]*/, '');

    return `
    <div class="achievement-card ${ach.tier} ${ach.unlocked ? 'unlocked' : 'locked'}" data-unlocked="${ach.unlocked}">
        <div class="card-icon-wrap">
            <img src="${iconUri}" alt="${ach.name}" />
            ${ach.unlocked ? '<div class="unlock-badge">&#10003;</div>' : ''}
        </div>
        <div class="card-name">${displayName}</div>
        <div class="tooltip">
            <strong>${ach.name}</strong><br>
            ${ach.description}<br>
            <em class="tier-badge ${ach.tier}">${ach.tier.toUpperCase()}</em><br>
            <strong>${ach.unlocked ? 'UNLOCKED' : 'LOCKED'}</strong>
        </div>
    </div>`;
}

export function getWebviewContent(view: vscode.WebviewView | undefined, context: vscode.ExtensionContext): string {
    const byType: AchievementsByType = { upgradable: {}, unique: [] };

    achievements.forEach((ach: Achievement) => {
        if (ach.type === 'upgradable' && ach.baseId) {
            byType.upgradable[ach.baseId] = [ach];
        } else {
            byType.unique.push(ach);
        }
    });

    const byTier: AchievementsByTier = {
        diamond: [...Object.values(byType.upgradable).flat().filter(a => a.tier === 'diamond'), ...byType.unique.filter(a => a.tier === 'diamond')],
        gold: [...Object.values(byType.upgradable).flat().filter(a => a.tier === 'gold'), ...byType.unique.filter(a => a.tier === 'gold')],
        silver: [...Object.values(byType.upgradable).flat().filter(a => a.tier === 'silver'), ...byType.unique.filter(a => a.tier === 'silver')],
        bronze: [...Object.values(byType.upgradable).flat().filter(a => a.tier === 'bronze'), ...byType.unique.filter(a => a.tier === 'bronze')]
    };

    const allAchievements = [...Object.values(byType.upgradable).flat(), ...byType.unique];
    const byName = allAchievements.sort((a, b) => a.name.localeCompare(b.name));

    const unlockedCount = achievements.filter(a => a.unlocked).length;
    const totalCount = achievements.length;
    const progressPercent = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

    const seriesNames: Record<string, string> = {
        'coding_time': '⏰ Coding Time',
        'typing': '⌨️ Typing',
        'daily_streak': '🏅 Daily Streak',
        'languages': '🌍 Languages',
        'workaholic': '💪 Workaholic',
        'early_bird_streak': '🌅 Early Bird Streak',
        'night_owl_streak': '🦉 Night Owl Streak'
    };

    const tierEmojis: Record<string, string> = { diamond: '💎', gold: '🥇', silver: '🥈', bronze: '🥉' };

    return `
    <html>
    <head>
    <style>
        :root {
            --tier-bronze: #cd7f32;
            --tier-silver: #c0c0c0;
            --tier-gold: #ffd700;
            --tier-diamond: #00d4ff;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background: var(--vscode-editor-background);
            padding: 16px;
            line-height: 1.4;
        }

        /* --- Header --- */
        .header { text-align: center; margin-bottom: 16px; }
        .header h1 { font-size: 18px; font-weight: 600; margin-bottom: 8px; }

        /* --- Overall Progress --- */
        .overall-progress { margin-bottom: 16px; }
        .progress-track-outer {
            width: 100%; height: 8px;
            background: var(--vscode-editor-inactiveSelectionBackground);
            border-radius: 4px; overflow: hidden;
        }
        .progress-fill-outer {
            height: 100%; border-radius: 4px;
            background: linear-gradient(90deg, var(--tier-bronze), var(--tier-silver), var(--tier-gold), var(--tier-diamond));
            transition: width 0.5s ease;
        }
        .progress-stats {
            display: flex; justify-content: space-between;
            font-size: 11px; opacity: 0.8; margin-top: 4px;
        }

        /* --- Filter --- */
        .filter-bar {
            display: flex; justify-content: center;
            gap: 4px; margin-bottom: 12px;
            flex-wrap: wrap;
        }
        .filter-btn {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none; padding: 4px 8px;
            border-radius: 4px; cursor: pointer;
            font-size: 11px; transition: opacity 0.2s;
            flex: 0 1 auto;
        }
        .filter-btn:hover { opacity: 0.85; }
        .filter-btn.active {
            outline: 1px solid var(--vscode-focusBorder);
        }

        /* --- Section Headings --- */
        .section-title {
            font-size: 12px; font-weight: 600;
            text-transform: uppercase; letter-spacing: 0.5px;
            opacity: 0.7; margin: 12px 0 8px 0;
            padding-bottom: 4px;
            border-bottom: 1px solid var(--vscode-editorGroup-border);
        }

        /* --- Collapsible Sections --- */
        .collapse-header {
            display: flex; align-items: center; gap: 6px;
            cursor: pointer; user-select: none;
            font-size: 12px; font-weight: 600;
            text-transform: uppercase; letter-spacing: 0.5px;
            opacity: 0.85; margin: 10px 0 4px 0;
            padding: 4px 0;
            border-bottom: 1px solid var(--vscode-editorGroup-border);
        }
        .collapse-header:hover { opacity: 1; }
        .collapse-header .arrow {
            transition: transform 0.2s ease;
            font-size: 10px;
        }
        .collapse-header.open .arrow { transform: rotate(90deg); }
        .collapse-header .count {
            margin-left: auto; font-weight: normal;
            opacity: 0.5; font-size: 10px;
        }
        .collapse-body {
            transition: max-height 0.3s ease, opacity 0.2s ease;
            max-height: 0; opacity: 0;
        }
        .collapse-body.open { max-height: 3000px; opacity: 1; }

        /* --- Achievement Grid --- */
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
            gap: 6px;
            margin-bottom: 8px;
            width: 100%;
        }

        /* --- Achievement Card --- */
        .achievement-card {
            position: relative;
            display: flex; flex-direction: column;
            align-items: center; text-align: center;
            width: 100%; padding: 6px 4px;
            border-radius: 8px;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
            cursor: default;
        }
        .achievement-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 9999;
        }
        .achievement-card.locked {
            filter: grayscale(80%) brightness(50%);
            opacity: 0.6;
        }
        .achievement-card.locked:hover {
            filter: grayscale(40%) brightness(70%);
            opacity: 0.8;
        }

        /* Tier glow for unlocked cards */
        .achievement-card.unlocked.diamond { box-shadow: 0 0 8px rgba(0, 212, 255, 0.15); }
        .achievement-card.unlocked.gold { box-shadow: 0 0 8px rgba(255, 215, 0, 0.15); }
        .achievement-card.unlocked.silver { box-shadow: 0 0 8px rgba(192, 192, 192, 0.15); }
        .achievement-card.unlocked.bronze { box-shadow: 0 0 8px rgba(205, 127, 50, 0.15); }

        .card-icon-wrap { position: relative; display: inline-flex; }
        .card-icon-wrap img { width: 36px; height: 36px; object-fit: contain; }

        /* Tier-tinted icons for locked achievements */
        .achievement-card.locked.bronze .card-icon-wrap img {
            filter: grayscale(100%) brightness(0.4) sepia(1) hue-rotate(-10deg) saturate(2.5);
        }
        .achievement-card.locked.silver .card-icon-wrap img {
            filter: grayscale(100%) brightness(0.55) saturate(0.5);
        }
        .achievement-card.locked.gold .card-icon-wrap img {
            filter: grayscale(100%) brightness(0.45) sepia(1) hue-rotate(5deg) saturate(3);
        }
        .achievement-card.locked.diamond .card-icon-wrap img {
            filter: grayscale(100%) brightness(0.45) sepia(1) hue-rotate(170deg) saturate(3);
        }
        .achievement-card.locked:hover.bronze .card-icon-wrap img {
            filter: grayscale(60%) brightness(0.6) sepia(1) hue-rotate(-10deg) saturate(2);
        }
        .achievement-card.locked:hover.silver .card-icon-wrap img {
            filter: grayscale(60%) brightness(0.65) saturate(0.4);
        }
        .achievement-card.locked:hover.gold .card-icon-wrap img {
            filter: grayscale(60%) brightness(0.6) sepia(1) hue-rotate(5deg) saturate(2.5);
        }
        .achievement-card.locked:hover.diamond .card-icon-wrap img {
            filter: grayscale(60%) brightness(0.6) sepia(1) hue-rotate(170deg) saturate(2.5);
        }
        .unlock-badge {
            position: absolute; bottom: -2px; right: -4px;
            width: 12px; height: 12px;
            background: #4ec9b0; color: #1e1e1e;
            border-radius: 50%; font-size: 9px;
            display: flex; align-items: center; justify-content: center;
            font-weight: bold;
        }
        .card-name {
            font-size: 9px; margin-top: 4px;
            width: 100%; overflow: hidden;
            text-overflow: ellipsis; white-space: nowrap;
        }

        /* --- Progress Bar (mini) --- */
        .progress-track {
            width: 80%; height: 3px;
            background: var(--vscode-editor-inactiveSelectionBackground);
            border-radius: 2px; margin-top: 3px; overflow: hidden;
        }
        .progress-fill {
            height: 100%; border-radius: 2px;
            transition: width 0.4s ease;
        }
        .progress-fill.bronze { background: linear-gradient(90deg, #cd7f32, #ff9500); }
        .progress-fill.silver { background: linear-gradient(90deg, #a8a8a8, #e8e8e8); }
        .progress-fill.gold { background: linear-gradient(90deg, #daa520, #ffed4e); }
        .progress-fill.diamond { background: linear-gradient(90deg, #0099cc, #00d4ff); }

        .progress-label { font-size: 8px; opacity: 0.7; margin-top: 2px; }

        .hide-progress .progress-track,
        .hide-progress .progress-label { display: none; }

        /* --- Tooltip --- */
        .tooltip {
            visibility: hidden; width: 180px;
            background: var(--vscode-editorWidget-background);
            color: var(--vscode-editorWidget-foreground);
            text-align: left; border-radius: 6px;
            padding: 8px; position: absolute;
            z-index: 10000; bottom: 110%; left: 50%;
            transform: translateX(-50%);
            opacity: 0; transition: opacity 0.15s;
            box-shadow: 0 4px 16px rgba(0,0,0,0.4);
            pointer-events: none; font-size: 10px;
            border: 1px solid var(--vscode-editorWidget-border);
            line-height: 1.4;
        }
        .achievement-card:hover > .tooltip {
            visibility: visible; opacity: 1;
        }
        .achievement-card.edge-left > .tooltip { left: 0; transform: none; }
        .achievement-card.edge-right > .tooltip { left: auto; right: 0; transform: none; }
        .tier-badge {
            display: inline-block; padding: 1px 6px;
            border-radius: 3px; font-size: 9px;
            font-weight: bold; margin-top: 4px;
        }
        .tier-badge.diamond { background: rgba(0,212,255,0.15); color: #00d4ff; }
        .tier-badge.gold { background: rgba(255,215,0,0.15); color: #ffd700; }
        .tier-badge.silver { background: rgba(192,192,192,0.15); color: #c0c0c0; }
        .tier-badge.bronze { background: rgba(205,127,50,0.15); color: #cd7f32; }

        /* --- Buttons --- */
        .actions {
            display: flex; gap: 8px; justify-content: center;
            margin-top: 16px; flex-wrap: wrap;
        }
        .btn {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none; padding: 6px 12px;
            border-radius: 4px; cursor: pointer;
            font-size: 11px; transition: opacity 0.2s;
        }
        .btn:hover { background: var(--vscode-button-hoverBackground); }
        .btn-danger {
            background: var(--vscode-errorForeground);
            color: white;
        }
        .btn-danger:hover { opacity: 0.85; }

        /* --- Footer --- */
        .footer { text-align: center; margin-top: 16px; }
        .footer a {
            color: var(--vscode-textLink-foreground);
            text-decoration: none; font-size: 11px;
            display: inline-flex; align-items: center; gap: 6px;
        }
        .footer a:hover { text-decoration: underline; }

        /* --- View sections --- */
        .view-section { display: none; }
        .view-section.active { display: block; }

        /* --- Onboarding overlay --- */
        .onboarding-overlay {
            display: none; position: fixed; inset: 0;
            background: rgba(0,0,0,0.7); z-index: 1000;
            align-items: center; justify-content: center;
        }
        .onboarding-overlay.visible { display: flex; }
        .onboarding-card {
            background: var(--vscode-editorWidget-background);
            border: 1px solid var(--vscode-editorWidget-border);
            border-radius: 12px; padding: 32px;
            max-width: 340px; text-align: center;
            box-shadow: 0 8px 32px rgba(0,0,0,0.5);
        }
        .onboarding-card h2 { font-size: 20px; margin-bottom: 12px; }
        .onboarding-card p { font-size: 13px; opacity: 0.85; margin-bottom: 8px; line-height: 1.5; }
        .onboarding-card .btn { margin-top: 16px; padding: 8px 24px; font-size: 13px; }

        /* --- Unlock animation --- */
        @keyframes unlockPulse {
            0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(78, 201, 176, 0.4); }
            50% { transform: scale(1.05); box-shadow: 0 0 16px 4px rgba(78, 201, 176, 0.3); }
            100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(78, 201, 176, 0); }
        }
        .achievement-card.just-unlocked {
            animation: unlockPulse 0.8s ease-out;
        }

        /* --- Toast notification --- */
        .toast {
            position: fixed; bottom: 20px; left: 50%;
            transform: translateX(-50%);
            background: var(--vscode-notifications-background);
            color: var(--vscode-notifications-foreground);
            padding: 12px 20px; border-radius: 8px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.4);
            z-index: 2000; font-size: 13px;
            opacity: 0; transition: opacity 0.3s;
            pointer-events: none;
        }
        .toast.visible { opacity: 1; }

        /* --- Responsive --- */
        @media (max-width: 250px) {
            body { padding: 8px; }
            .grid { grid-template-columns: repeat(auto-fill, minmax(60px, 1fr)); gap: 4px; }
            .card-icon-wrap img { width: 30px; height: 30px; }
            .card-name { font-size: 8px; }
            .filter-btn { padding: 3px 6px; font-size: 10px; }
            .collapse-header { font-size: 11px; }
            .progress-label { font-size: 7px; }
        }
        @media (min-width: 500px) {
            .grid { grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); }
        }
        @media (min-width: 700px) {
            .grid { grid-template-columns: repeat(auto-fill, minmax(90px, 1fr)); gap: 8px; }
            .card-icon-wrap img { width: 40px; height: 40px; }
        }
    </style>
    </head>
    <body>
        <!-- Onboarding Overlay -->
        <div class="onboarding-overlay" id="onboarding">
            <div class="onboarding-card">
                <h2>Welcome to Coding Achievements!</h2>
                <p>This extension tracks your coding activity and rewards you with achievements for reaching milestones.</p>
                <p>Save files, type code, debug, commit to Git, and more -- each action brings you closer to unlocking badges.</p>
                <p>Check this panel anytime to see your progress across different tiers: Bronze, Silver, Gold, and Diamond.</p>
                <button class="btn" onclick="dismissOnboarding()">Get Started</button>
            </div>
        </div>

        <!-- Toast -->
        <div class="toast" id="toast"></div>

        <div class="header">
            <h1>Coding Achievements</h1>
        </div>

        <div class="overall-progress">
            <div class="progress-track-outer">
                <div class="progress-fill-outer" style="width: ${progressPercent}%"></div>
            </div>
            <div class="progress-stats">
                <span>${unlockedCount} / ${totalCount} unlocked</span>
                <span>${progressPercent}%</span>
            </div>
        </div>

        <div class="filter-bar">
            <button class="filter-btn active" data-view="category" onclick="switchView('category')">Category</button>
            <button class="filter-btn" data-view="tier" onclick="switchView('tier')">Tier</button>
            <button class="filter-btn" data-view="alpha" onclick="switchView('alpha')">A-Z</button>
        </div>

        <!-- Category View -->
        <div id="view-category" class="view-section active">
            ${(() => {
                const upgradable = Object.entries(byType.upgradable).map(([baseId, arr]) => ({
                    baseId,
                    ach: arr[0],
                    name: seriesNames[baseId] || baseId
                }));
                const allUpgradable = upgradable.length;
                const unlockedUpgradable = upgradable.filter(u => u.ach.unlocked).length;

                return `
                <div class="collapse-header open" onclick="toggleCollapse(this)">
                    <span class="arrow">&#9654;</span>
                    📈 Progress
                    <span class="count">${unlockedUpgradable}/${allUpgradable}</span>
                </div>
                <div class="collapse-body open">
                    <div class="grid">
                        ${upgradable.map(u => renderUpgradableCard(u.ach, u.name, view, context)).join('')}
                    </div>
                </div>`;
            })()}

            ${(() => {
                const items = byType.unique.filter(a =>
                    ['🏃 Speed Demon', '🎯 Perfectionist', '🧹 Code Janitor', '🧊 Zen Mode', '🏃‍♂️ Marathon Runner'].includes(a.name)
                );
                const unlocked = items.filter(a => a.unlocked).length;
                if (items.length === 0) return '';
                return `
                <div class="collapse-header open" onclick="toggleCollapse(this)">
                    <span class="arrow">&#9654;</span>
                    ⌨️ Coding Habits
                    <span class="count">${unlocked}/${items.length}</span>
                </div>
                <div class="collapse-body open">
                    <div class="grid">
                        ${items.map(a => renderUniqueCard(a, view, context)).join('')}
                    </div>
                </div>`;
            })()}

            ${(() => {
                const items = byType.unique.filter(a =>
                    ['🌙 Night Owl', '🐦 Early Bird', '🌅 Early Bird Streak', '🦉 Night Owl Streak', '🏖️ Weekend Warrior', '🧘 Flow State'].includes(a.name)
                );
                const unlocked = items.filter(a => a.unlocked).length;
                if (items.length === 0) return '';
                return `
                <div class="collapse-header open" onclick="toggleCollapse(this)">
                    <span class="arrow">&#9654;</span>
                    🕒 Time & Streaks
                    <span class="count">${unlocked}/${items.length}</span>
                </div>
                <div class="collapse-body open">
                    <div class="grid">
                        ${items.map(a => a.type === 'upgradable'
                            ? renderUpgradableCard(a, seriesNames[a.baseId || ''] || a.name, view, context)
                            : renderUniqueCard(a, view, context)
                        ).join('')}
                    </div>
                </div>`;
            })()}

            ${(() => {
                const items = byType.unique.filter(a =>
                    ['🏆 First Save!', '🧭 Explorer', '📝 Documentation Hero', '🧪 Test-Driven', '🧩 Multi-File Maestro'].includes(a.name)
                );
                const unlocked = items.filter(a => a.unlocked).length;
                if (items.length === 0) return '';
                return `
                <div class="collapse-header open" onclick="toggleCollapse(this)">
                    <span class="arrow">&#9654;</span>
                    📁 Files & Docs
                    <span class="count">${unlocked}/${items.length}</span>
                </div>
                <div class="collapse-body open">
                    <div class="grid">
                        ${items.map(a => renderUniqueCard(a, view, context)).join('')}
                    </div>
                </div>`;
            })()}

            ${(() => {
                const items = byType.unique.filter(a =>
                    ['💾 Commit Champion', '🐛 Bug Squasher', '🐞 Debugger Pro'].includes(a.name)
                );
                const unlocked = items.filter(a => a.unlocked).length;
                if (items.length === 0) return '';
                return `
                <div class="collapse-header open" onclick="toggleCollapse(this)">
                    <span class="arrow">&#9654;</span>
                    💾 Git & Debug
                    <span class="count">${unlocked}/${items.length}</span>
                </div>
                <div class="collapse-body open">
                    <div class="grid">
                        ${items.map(a => renderUniqueCard(a, view, context)).join('')}
                    </div>
                </div>`;
            })()}
        </div>

        <!-- Tier View -->
        <div id="view-tier" class="view-section">
            ${Object.entries(byTier).map(([tier, items]: [string, Achievement[]]) => {
                if (items.length === 0) { return ''; }
                return `
                <div class="section-title">${tierEmojis[tier] || ''} ${tier.charAt(0).toUpperCase() + tier.slice(1)}</div>
                <div class="grid">
                    ${items.map(a => a.type === 'upgradable'
                        ? renderUpgradableCard(a, seriesNames[a.baseId || ''] || a.name, view, context)
                        : renderUniqueCard(a, view, context)
                    ).join('')}
                </div>`;
            }).join('')}
        </div>

        <!-- Alphabetical View -->
        <div id="view-alpha" class="view-section">
            <div class="section-title">All Achievements</div>
            <div class="grid">
                ${byName.map(a => a.type === 'upgradable'
                    ? renderUpgradableCard(a, seriesNames[a.baseId || ''] || a.name, view, context)
                    : renderUniqueCard(a, view, context)
                ).join('')}
            </div>
        </div>

        <div class="actions">
            <button class="btn" onclick="refreshAchievements()">Refresh</button>
            <button class="btn" onclick="toggleProgress()" id="progressToggle">Hide Progress</button>
            <button class="btn btn-danger" onclick="resetAchievements()">Reset</button>
        </div>

        <div class="footer">
            <a href="https://github.com/SteliosGee/coding-achievements" target="_blank">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
                </svg>
                GitHub
            </a>
        </div>

        ${getUnlockSoundScript()}

        <script>
            const vscode = acquireVsCodeApi();

            function switchView(view) {
                document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
                document.getElementById('view-' + view)?.classList.add('active');
                document.querySelectorAll('.filter-btn').forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.view === view);
                });
            }

            function toggleCollapse(header) {
                header.classList.toggle('open');
                const body = header.nextElementSibling;
                body.classList.toggle('open');
                requestAnimationFrame(labelEdges);
            }

            function labelEdges() {
                document.querySelectorAll('.grid').forEach(grid => {
                    const cards = grid.querySelectorAll('.achievement-card');
                    if (!cards.length) return;
                    const gridRect = grid.getBoundingClientRect();
                    cards.forEach(c => {
                        c.classList.remove('edge-left', 'edge-right');
                        const r = c.getBoundingClientRect();
                        if (r.left <= gridRect.left + 2) c.classList.add('edge-left');
                        if (r.right >= gridRect.right - 2) c.classList.add('edge-right');
                    });
                });
            }

            document.addEventListener('DOMContentLoaded', labelEdges);
            window.addEventListener('resize', labelEdges);

            function refreshAchievements() { vscode.postMessage({ command: 'refresh' }); }
            function resetAchievements() { vscode.postMessage({ command: 'reset' }); }

            function toggleProgress() {
                document.body.classList.toggle('hide-progress');
                const hidden = document.body.classList.contains('hide-progress');
                document.getElementById('progressToggle').textContent = hidden ? 'Show Progress' : 'Hide Progress';
                localStorage.setItem('hideProgress', hidden);
            }

            function dismissOnboarding() {
                document.getElementById('onboarding').classList.remove('visible');
                vscode.postMessage({ command: 'dismissOnboarding' });
            }

            function showToast(text, duration) {
                const toast = document.getElementById('toast');
                toast.textContent = text;
                toast.classList.add('visible');
                setTimeout(() => toast.classList.remove('visible'), duration || 2000);
            }

            document.addEventListener('DOMContentLoaded', () => {
                if (localStorage.getItem('hideProgress') === 'true') {
                    document.body.classList.add('hide-progress');
                    document.getElementById('progressToggle').textContent = 'Show Progress';
                }
            });

            window.addEventListener('message', event => {
                const msg = event.data;
                switch (msg.command) {
                    case 'showOnboarding':
                        document.getElementById('onboarding').classList.add('visible');
                        break;
                    case 'resetComplete':
                        if (msg.success) {
                            showToast('All achievements reset!');
                            setTimeout(() => vscode.postMessage({ command: 'refresh' }), 500);
                        } else {
                            showToast('Reset failed. Check console.');
                        }
                        break;
                    case 'achievementUnlocked':
                        if (window.__playUnlockSound) window.__playUnlockSound();
                        showToast(msg.name + ' unlocked!');
                        break;
                }
            });
        </script>
    </body>
    </html>`;
}
