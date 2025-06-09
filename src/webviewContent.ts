import * as vscode from 'vscode';
import { achievements } from './extension';

export function getWebviewContent(view: vscode.WebviewView | undefined, context: vscode.ExtensionContext): string {
    // Group achievements by tier for better display
    // (removed duplicate byTier declaration to avoid redeclaration error)

    interface Achievement {
        name: string;
        description: string;
        tier: 'diamond' | 'gold' | 'silver' | 'bronze';
        unlocked: boolean;
        icon: string;
    }

    interface AchievementsByTier {
        diamond: Achievement[];
        gold: Achievement[];
        silver: Achievement[];
        bronze: Achievement[];
    }

    const byTier: AchievementsByTier = {
        diamond: achievements.filter((a: Achievement) => a.tier === 'diamond'),
        gold: achievements.filter((a: Achievement) => a.tier === 'gold'),
        silver: achievements.filter((a: Achievement) => a.tier === 'silver'),
        bronze: achievements.filter((a: Achievement) => a.tier === 'bronze')
    };

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
                        height: 80px;
                    }
                    .achievement .tooltip {
                        visibility: hidden;
                        width: 150px;
                        background-color: var(--vscode-editor-background);
                        color: var(--vscode-foreground);
                        text-align: center;
                        border-radius: 6px;
                        padding: 8px;
                        position: absolute;
                        z-index: 1;
                        bottom: 125%;
                        left: 50%;
                        margin-left: -75px;
                        opacity: 0;
                        transition: opacity 0.3s;
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                        pointer-events: none;
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
                </style>
            </head>
            <body>
                <h1>Coding Achievements</h1>
                
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${Math.round((achievements as Achievement[]).filter((a: Achievement) => a.unlocked).length / (achievements as Achievement[]).length * 100)}%"></div>
                </div>
                
                <h3>Progress: ${(achievements as Achievement[]).filter((a: Achievement) => a.unlocked).length} / ${(achievements as Achievement[]).length}</h3>
                
                ${(['diamond', 'gold', 'silver', 'bronze'] as Array<keyof AchievementsByTier>).map((tier: keyof AchievementsByTier) => `
                    <h3 class="tier-heading">${tier.charAt(0).toUpperCase() + tier.slice(1)} Tier</h3>
                    <div class="achievements-grid">
                        ${byTier[tier].map((ach: Achievement) => `
                            <div class="achievement ${ach.tier} ${ach.unlocked ? '' : 'locked'}">
                                <img src="${view?.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, ach.icon))}" alt="${ach.name}" />
                                <div class="achievement-name">${ach.name.replace('🏆 Achievement Unlocked: ', '')}</div>
                                <div class="tooltip">
                                    <strong>${ach.name}</strong><br>
                                    ${ach.description}<br>
                                    <em>Tier: ${ach.tier}</em><br>
                                    <strong>${ach.unlocked ? 'UNLOCKED' : 'LOCKED'}</strong>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `).join('')}
                
                <div class="button-container">
                    <button class="refresh-btn" onclick="refreshView()">Refresh</button>
                    <button class="reset-btn" onclick="resetAchievements()">Reset All Progress</button>
                </div>
                
                <script>
                    const vscode = acquireVsCodeApi();
                    
                    function refreshView() {
                        vscode.postMessage({ 
                            command: 'refresh'
                        });
                    }
                    
                    function resetAchievements() {
                        if (confirm('WARNING: This will reset ALL your achievement progress and lock all achievements. You will start from scratch. Continue?')) {
                            vscode.postMessage({
                                command: 'reset'
                            });
                        }
                    }
                </script>
            </body>
        </html>
    `;
}
