import * as vscode from 'vscode';
import { achievements, Achievement } from './extension';
import { getProgressPercentage, getProgressText, getCurrentTierName, getCurrentTierDescription } from './utils/upgradeableAchievement';

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

export function getWebviewContent(view: vscode.WebviewView | undefined, context: vscode.ExtensionContext): string {
    // Group by type first
    const byType: AchievementsByType = {
        upgradable: {},
        unique: []
    };

    achievements.forEach((ach: Achievement) => {
        if (ach.type === 'upgradable' && ach.baseId) {
            // For the new system, each upgradable achievement is a single evolving achievement
            byType.upgradable[ach.baseId] = [ach]; // Single achievement per baseId
        } else {
            byType.unique.push(ach);
        }
    });

    // Group unique achievements by tier
    const byTier: AchievementsByTier = {
        diamond: [...Object.values(byType.upgradable).flat().filter((a: Achievement) => a.tier === 'diamond'), ...byType.unique.filter((a: Achievement) => a.tier === 'diamond')],
        gold: [...Object.values(byType.upgradable).flat().filter((a: Achievement) => a.tier === 'gold'), ...byType.unique.filter((a: Achievement) => a.tier === 'gold')],
        silver: [...Object.values(byType.upgradable).flat().filter((a: Achievement) => a.tier === 'silver'), ...byType.unique.filter((a: Achievement) => a.tier === 'silver')],
        bronze: [...Object.values(byType.upgradable).flat().filter((a: Achievement) => a.tier === 'bronze'), ...byType.unique.filter((a: Achievement) => a.tier === 'bronze')]
    };

    // Group by alphabetical order
    const allAchievements = [...Object.values(byType.upgradable).flat(), ...byType.unique];
    const byName = allAchievements.sort((a, b) => a.name.localeCompare(b.name));

    return `
        <html>
            <head>
                <style>
                    body {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        text-align: center;
                        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                        color: var(--vscode-foreground);
                        background-color: var(--vscode-editor-background);
                        padding: 20px;
                    }
                    .progress-container {
                        width: 100%;
                        background-color: var(--vscode-editor-inactiveSelectionBackground);
                        border-radius: 10px;
                        margin: 10px 0;
                        height: 10px;
                    }
                    .progress-bar {
                        height: 10px;
                        border-radius: 10px;
                        background: linear-gradient(90deg, #8c52ff, #5ce1e6);
                    }
                    .achievement {
                        position: relative;
                        display: inline-flex;
                        flex-direction: column;
                        align-items: center;
                        margin: 10px;
                        padding: 5px;
                        border-radius: 5px;
                        transition: transform 0.2s ease, box-shadow 0.2s ease;
                        width: 80px;
                        min-height: 80px;
                    }
                    .achievement.upgradable {
                        min-height: 100px;
                    }
                    .achievement .tooltip {
                        visibility: hidden;
                        width: 180px;
                        background-color: var(--vscode-editor-background);
                        color: var(--vscode-foreground);
                        text-align: center;
                        border-radius: 6px;
                        padding: 8px;
                        position: absolute;
                        z-index: 1;
                        bottom: 125%;
                        left: 50%;
                        margin-left: -90px;
                        opacity: 0;
                        transition: opacity 0.3s;
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                        pointer-events: none;
                        font-size: 11px;
                    }
                    .achievement:hover {
                        transform: scale(1.15);
                        z-index: 10;
                    }
                    .achievement:hover .tooltip {
                        visibility: visible;
                        opacity: 1;
                    }
                    .achievement img {
                        width: 50px;
                        height: 50px;
                        object-fit: contain;
                    }
                    .achievement-name {
                        font-size: 10px;
                        margin-top: 5px;
                        max-width: 80px;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                    }
                    .progress-mini {
                        width: 70px;
                        height: 4px;
                        background-color: var(--vscode-editor-inactiveSelectionBackground);
                        border-radius: 2px;
                        margin-top: 3px;
                        overflow: hidden;
                    }
                    .progress-mini-bar {
                        height: 100%;
                        border-radius: 2px;
                        transition: width 0.3s ease;
                    }
                    .progress-mini-bar.bronze {
                        background: linear-gradient(90deg, #cd7f32, #ff9500);
                    }
                    .progress-mini-bar.silver {
                        background: linear-gradient(90deg, #c0c0c0, #e8e8e8);
                    }
                    .progress-mini-bar.gold {
                        background: linear-gradient(90deg, #ffd700, #ffed4e);
                    }
                    .progress-mini-bar.diamond {
                        background: linear-gradient(90deg, #b9f2ff, #00d4ff);
                    }
                    .progress-text {
                        font-size: 8px;
                        margin-top: 2px;
                        opacity: 0.8;
                    }
                    .diamond {
                        border: 2px solid #b9f2ff;
                        box-shadow: 0 0 10px #b9f2ff;
                        background: linear-gradient(135deg, #b9f2ff33, #b9f2ff11);
                    }
                    .gold {
                        border: 2px solid #ffd700;
                        box-shadow: 0 0 5px #ffd700;
                        background: linear-gradient(135deg, #ffd70033, #ffd70011);
                    }
                    .silver {
                        border: 2px solid #c0c0c0;
                        box-shadow: 0 0 5px #c0c0c0;
                        background: linear-gradient(135deg, #c0c0c033, #c0c0c011);
                    }
                    .bronze {
                        border: 2px solid #cd7f32;
                        box-shadow: 0 0 5px #cd7f32;
                        background: linear-gradient(135deg, #cd7f3233, #cd7f3211);
                    }
                    .locked {
                        filter: grayscale(100%) brightness(40%);
                        border: 2px solid #555;
                        box-shadow: none;
                        background: #33333333;
                    }
                    .tier-heading {
                        margin: 20px 0 10px 0;
                        width: 100%;
                        text-align: left;
                        padding-left: 10px;
                        border-bottom: 1px solid var(--vscode-editorGroup-border);
                    }
                    .achievements-grid {
                        display: flex;
                        flex-wrap: wrap;
                        justify-content: center;
                        gap: 10px;
                        width: 100%;
                    }
                    .button-container {
                        display: flex;
                        gap: 10px;
                        margin-top: 15px;
                    }
                    .refresh-btn {
                        background-color: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        padding: 8px 12px;
                        border-radius: 4px;
                        cursor: pointer;
                    }
                    .refresh-btn:hover {
                        background-color: var(--vscode-button-hoverBackground);
                    }
                    .reset-btn {
                        background-color: var(--vscode-errorForeground);
                        color: white;
                        border: none;
                        padding: 8px 12px;
                        border-radius: 4px;
                        cursor: pointer;
                    }
                    .reset-btn:hover {
                        opacity: 0.8;
                    }
                    .github-link {
                        margin-top: 20px;
                        text-align: center;
                    }
                    .github-link a {
                        display: inline-flex;
                        align-items: center;
                        gap: 8px;
                        color: var(--vscode-textLink-foreground);
                        text-decoration: none;
                        font-size: 12px;
                        padding: 8px 12px;
                        border-radius: 4px;
                        transition: background-color 0.2s ease;
                    }
                    .github-link a:hover {
                        background-color: var(--vscode-textLink-activeForeground);
                        color: var(--vscode-editor-background);
                    }
                    .github-link svg {
                        flex-shrink: 0;
                    }
                    .filter-container {
                        margin: 15px 0;
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        justify-content: center;
                    }
                    .filter-label {
                        font-weight: bold;
                        font-size: 14px;
                    }
                    .filter-select {
                        background-color: var(--vscode-dropdown-background);
                        color: var(--vscode-dropdown-foreground);
                        border: 1px solid var(--vscode-dropdown-border);
                        border-radius: 4px;
                        padding: 6px 8px;
                        font-size: 12px;
                        cursor: pointer;
                    }
                    .filter-select:focus {
                        outline: 1px solid var(--vscode-focusBorder);
                    }
                    .view-section {
                        display: none;
                        width: 100%;
                    }
                    .view-section.active {
                        display: block;
                    }
                </style>
            </head>
            <body>
                <h1>Coding Achievements</h1>
                
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${Math.round((achievements as Achievement[]).filter((a: Achievement) => a.unlocked).length / (achievements as Achievement[]).length * 100)}%"></div>
                </div>
                
                <h3>Progress: ${(achievements as Achievement[]).filter((a: Achievement) => a.unlocked).length} / ${(achievements as Achievement[]).length}</h3>
                
                <!-- Filter Controls -->
                <div class="filter-container">
                    <label class="filter-label">View by:</label>
                    <select class="filter-select" id="viewFilter" onchange="changeView()">
                        <option value="category">Category</option>
                        <option value="tier">Tier</option>
                        <option value="name">Alphabetical</option>
                    </select>
                </div>

                <!-- Category View (Default) -->
                <div id="categoryView" class="view-section active">
                    <!-- Upgradable Achievement Categories -->
                    ${Object.entries(byType.upgradable).map(([baseId, achievementArray]) => {
                        const seriesNames: { [key: string]: string } = {
                            'coding_time': '⏰ Coding Time Mastery',
                            'typing': '⌨️ Typing Expertise', 
                            'daily_streak': '🏅 Daily Consistency',
                            'languages': '🌍 Language Diversity',
                            'workaholic': '💪 Workaholic Dedication'
                        };
                        const seriesName = seriesNames[baseId] || baseId;
                        const ach = achievementArray[0]; // Single achievement per series now
                        
                        const progressPercentage = getProgressPercentage(ach);
                        const progressText = getProgressText(ach);
                        const currentTierName = getCurrentTierName(ach);
                        const currentTierDescription = getCurrentTierDescription(ach);
                        
                        return `
                        <h3 class="tier-heading">${seriesName}</h3>
                        <div class="achievements-grid">
                            <div class="achievement ${ach.tier} ${ach.unlocked ? '' : 'locked'} upgradable">
                                <img src="${view?.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, ach.icon))}" alt="${ach.name}" />
                                <div class="achievement-name">${currentTierName}</div>
                                <div class="progress-mini">
                                    <div class="progress-mini-bar ${ach.tier}" style="width: ${progressPercentage}%"></div>
                                </div>
                                <div class="progress-text">${progressText}</div>
                                <div class="tooltip">
                                    <strong>${seriesName}</strong><br>
                                    <strong>Current Tier: ${currentTierName}</strong><br>
                                    ${currentTierDescription}<br>
                                    <em>Progress: ${progressText}</em><br>
                                    <em>Tier Level: ${ach.tier}</em><br>
                                    <strong>${ach.unlocked ? 'UNLOCKED' : 'LOCKED'}</strong>
                                </div>
                            </div>
                        </div>
                        `;
                    }).join('')}
                    
                    <!-- Unique Achievement Categories -->
                    ${(() => {
                        const uniqueCategories = {
                            '🕒 Time & Focus': byType.unique.filter(a => ['🌙 Night Owl', '🐦 Early Bird', '🏖️ Weekend Warrior', '🧘 Flow State'].includes(a.name)),
                            '💾 Version Control & Debug': byType.unique.filter(a => ['💾 Commit Champion', '🐛 Bug Squasher'].includes(a.name)),
                            '📁 File Management': byType.unique.filter(a => ['🏆 First Save!', '🧭 Explorer'].includes(a.name))
                        };
                        
                        return Object.entries(uniqueCategories).map(([categoryName, categoryAchievements]) => {
                            if (categoryAchievements.length === 0) {
                                return '';
                            }
                            
                            return `
                            <h3 class="tier-heading">${categoryName}</h3>
                            <div class="achievements-grid">
                                ${categoryAchievements.map((ach: Achievement) => `
                                    <div class="achievement ${ach.tier} ${ach.unlocked ? '' : 'locked'}">
                                        <img src="${view?.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, ach.icon))}" alt="${ach.name}" />
                                        <div class="achievement-name">${ach.name.replace(/^[^a-zA-Z]*/, '')}</div>
                                        <div class="tooltip">
                                            <strong>${ach.name}</strong><br>
                                            ${ach.description}<br>
                                            <em>Tier: ${ach.tier}</em><br>
                                            <strong>${ach.unlocked ? 'UNLOCKED' : 'LOCKED'}</strong>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                            `;
                        }).join('');
                    })()}
                </div>

                <!-- Tier View -->
                <div id="tierView" class="view-section">
                    ${Object.entries(byTier).map(([tierName, tierAchievements]) => {
                        if (tierAchievements.length === 0) {
                            return '';
                        }
                        
                        const tierEmojis = {
                            diamond: '💎',
                            gold: '🥇',
                            silver: '🥈',
                            bronze: '🥉'
                        };
                        
                        return `
                        <h3 class="tier-heading">${tierEmojis[tierName as keyof typeof tierEmojis]} ${tierName.charAt(0).toUpperCase() + tierName.slice(1)} Tier</h3>
                        <div class="achievements-grid">
                            ${tierAchievements.map((ach: Achievement) => {
                                if (ach.type === 'upgradable') {
                                    const progressPercentage = getProgressPercentage(ach);
                                    const progressText = getProgressText(ach);
                                    const currentTierName = getCurrentTierName(ach);
                                    const currentTierDescription = getCurrentTierDescription(ach);
                                    
                                    return `
                                    <div class="achievement ${ach.tier} ${ach.unlocked ? '' : 'locked'} upgradable">
                                        <img src="${view?.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, ach.icon))}" alt="${ach.name}" />
                                        <div class="achievement-name">${currentTierName}</div>
                                        <div class="progress-mini">
                                            <div class="progress-mini-bar ${ach.tier}" style="width: ${progressPercentage}%"></div>
                                        </div>
                                        <div class="progress-text">${progressText}</div>
                                        <div class="tooltip">
                                            <strong>${ach.name}</strong><br>
                                            <strong>Current Tier: ${currentTierName}</strong><br>
                                            ${currentTierDescription}<br>
                                            <em>Progress: ${progressText}</em><br>
                                            <em>Tier Level: ${ach.tier}</em><br>
                                            <strong>${ach.unlocked ? 'UNLOCKED' : 'LOCKED'}</strong>
                                        </div>
                                    </div>
                                    `;
                                } else {
                                    return `
                                    <div class="achievement ${ach.tier} ${ach.unlocked ? '' : 'locked'}">
                                        <img src="${view?.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, ach.icon))}" alt="${ach.name}" />
                                        <div class="achievement-name">${ach.name.replace(/^[^a-zA-Z]*/, '')}</div>
                                        <div class="tooltip">
                                            <strong>${ach.name}</strong><br>
                                            ${ach.description}<br>
                                            <em>Tier: ${ach.tier}</em><br>
                                            <strong>${ach.unlocked ? 'UNLOCKED' : 'LOCKED'}</strong>
                                        </div>
                                    </div>
                                    `;
                                }
                            }).join('')}
                        </div>
                        `;
                    }).join('')}
                </div>

                <!-- Alphabetical View -->
                <div id="nameView" class="view-section">
                    <h3 class="tier-heading">📝 All Achievements (A-Z)</h3>
                    <div class="achievements-grid">
                        ${byName.map((ach: Achievement) => {
                            if (ach.type === 'upgradable') {
                                const progressPercentage = getProgressPercentage(ach);
                                const progressText = getProgressText(ach);
                                const currentTierName = getCurrentTierName(ach);
                                const currentTierDescription = getCurrentTierDescription(ach);
                                
                                return `
                                <div class="achievement ${ach.tier} ${ach.unlocked ? '' : 'locked'} upgradable">
                                    <img src="${view?.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, ach.icon))}" alt="${ach.name}" />
                                    <div class="achievement-name">${currentTierName}</div>
                                    <div class="progress-mini">
                                        <div class="progress-mini-bar ${ach.tier}" style="width: ${progressPercentage}%"></div>
                                    </div>
                                    <div class="progress-text">${progressText}</div>
                                    <div class="tooltip">
                                        <strong>${ach.name}</strong><br>
                                        <strong>Current Tier: ${currentTierName}</strong><br>
                                        ${currentTierDescription}<br>
                                        <em>Progress: ${progressText}</em><br>
                                        <em>Tier Level: ${ach.tier}</em><br>
                                        <strong>${ach.unlocked ? 'UNLOCKED' : 'LOCKED'}</strong>
                                    </div>
                                </div>
                                `;
                            } else {
                                return `
                                <div class="achievement ${ach.tier} ${ach.unlocked ? '' : 'locked'}">
                                    <img src="${view?.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, ach.icon))}" alt="${ach.name}" />
                                    <div class="achievement-name">${ach.name.replace(/^[^a-zA-Z]*/, '')}</div>
                                    <div class="tooltip">
                                        <strong>${ach.name}</strong><br>
                                        ${ach.description}<br>
                                        <em>Tier: ${ach.tier}</em><br>
                                        <strong>${ach.unlocked ? 'UNLOCKED' : 'LOCKED'}</strong>
                                    </div>
                                </div>
                                `;
                            }
                        }).join('')}
                    </div>
                </div>
                
                <div class="button-container">
                    <button class="refresh-btn" onclick="refreshAchievements()">🔄 Refresh</button>
                    <button class="reset-btn" onclick="resetAchievements()">🗑️ Reset Progress</button>
                </div>
                
                <div class="github-link">
                    <a href="https://github.com/SteliosGee/coding-achievements" target="_blank">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
                        </svg>
                        GitHub Repository
                    </a>
                </div>
                
                <script>
                    const vscode = acquireVsCodeApi();
                    
                    function changeView() {
                        const filter = document.getElementById('viewFilter').value;
                        const views = ['categoryView', 'tierView', 'nameView'];
                        
                        // Hide all views
                        views.forEach(viewId => {
                            const view = document.getElementById(viewId);
                            if (view) {
                                view.classList.remove('active');
                            }
                        });
                        
                        // Show selected view
                        const selectedView = document.getElementById(filter + 'View');
                        if (selectedView) {
                            selectedView.classList.add('active');
                        }
                    }
                    
                    function refreshAchievements() {
                        vscode.postMessage({ command: 'refresh' });
                    }
                    
                    function resetAchievements() {
                        vscode.postMessage({ command: 'reset' });
                    }
                    
                    // Listen for messages from the extension
                    window.addEventListener('message', event => {
                        const message = event.data;
                        switch (message.command) {
                            case 'resetComplete':
                                // Remove any existing loading messages
                                document.querySelectorAll('[style*="position:fixed"]').forEach(el => el.remove());
                                
                                if (message.success) {
                                    // Show success feedback
                                    const successMsg = document.createElement('div');
                                    successMsg.innerHTML = '✅ All achievements have been reset!<br><small>Refreshing view...</small>';
                                    successMsg.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:var(--vscode-notifications-background);color:var(--vscode-notifications-foreground);padding:20px;border-radius:8px;z-index:1000;text-align:center;';
                                    document.body.appendChild(successMsg);
                                    setTimeout(() => successMsg.remove(), 2000);
                                    
                                    // Refresh the view
                                    setTimeout(() => {
                                        vscode.postMessage({ command: 'refresh' });
                                    }, 500);
                                } else {
                                    // Show error feedback
                                    const errorMsg = document.createElement('div');
                                    errorMsg.innerHTML = '❌ Failed to reset achievements.<br><small>Check the console for details.</small>';
                                    errorMsg.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:var(--vscode-errorForeground);color:white;padding:20px;border-radius:8px;z-index:1000;text-align:center;';
                                    document.body.appendChild(errorMsg);
                                    setTimeout(() => errorMsg.remove(), 3000);
                                }
                                break;
                        }
                    });
                </script>
            </body>
        </html>
    `;
}
