import * as vscode from 'vscode';
import { achievements } from './extension';

export function getWebviewContent(view: vscode.WebviewView | undefined, context: vscode.ExtensionContext): string {
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
                    }
                    .achievement {
                        position: relative;
                        display: inline-block;
                        margin: 10px;
                    }
                    .achievement .tooltip {
                        visibility: hidden;
                        width: 120px;
                        background-color: black;
                        color: #fff;
                        text-align: center;
                        border-radius: 6px;
                        padding: 5px;
                        position: absolute;
                        z-index: 1;
                        bottom: 125%;
                        left: 50%;
                        margin-left: -60px;
                        opacity: 0;
                        transition: opacity 0.3s;
                    }
                    .achievement:hover {
                        transform: scale(1.2);
                    }
                    .achievement:hover .tooltip {
                        visibility: visible;
                        opacity: 1;
                    }
                    .gold {
                        border: 2px solid gold;
                    }
                    .silver {
                        border: 2px solid silver;
                    }
                    .bronze {
                        border: 2px solid bronze;
                    }
                </style>
            </head>
            <body>
                <h1>Achievements</h1>
                <h3>Unlocked: ${achievements.filter(a => a.unlocked).length} / ${achievements.length}</h3>
                <ul style="list-style-type:none; padding: 0;">
                    ${achievements.filter(a => a.unlocked).map(ach => `
                        <li class="achievement">
                            <img src="${view?.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, ach.icon))}" width="50" height="50" class="${ach.tier}" />
                            <div class="tooltip">${ach.description}</div>
                        </li>
                    `).join('')}
                </ul>
                <h3>Locked: ${achievements.filter(a => !a.unlocked).length}</h3>
                <ul style="list-style-type:none; padding: 0;">
                    ${achievements.filter(a => !a.unlocked).map(ach => `
                        <li class="achievement">
                            <img src="${view?.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, ach.icon))}" width="50" height="50" class="${ach.tier}" />
                            <div class="tooltip">${ach.description}</div>
                        </li>
                    `).join('')}
                </ul>
            </body>
        </html>
    `;
}
