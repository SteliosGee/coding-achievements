import * as vscode from 'vscode';

let unlockedAchievements: string[] = [];

export function activate(context: vscode.ExtensionContext) {
    console.log('✅ Code Achievements extension is now active!');

    // Load stored achievements
    unlockedAchievements = context.globalState.get<string[]>('unlockedAchievements') || [];

    // Sidebar Provider Class
    class SidebarProvider implements vscode.WebviewViewProvider {
        public readonly viewType = 'coding-achievements-sidebar';
        private _view?: vscode.WebviewView;

        constructor(private readonly _context: vscode.ExtensionContext) {}

        resolveWebviewView(webviewView: vscode.WebviewView) {
            this._view = webviewView;
            webviewView.webview.options = { enableScripts: true };
            this.updateWebview();
        }

        private updateWebview() {
            if (this._view) {
                this._view.webview.html = this.getWebviewContent();
            }
        }

        private getWebviewContent(): string {
            return `
                <html>
                    <body>
                        <h1>Achievements</h1>
                        <ul>
                            ${unlockedAchievements.map(ach => `<li>${ach}</li>`).join('')}
                        </ul>
                    </body>
                </html>
            `;
        }

        public refresh() {
            this.updateWebview();
        }
    }

    // Declare sidebarProvider variable before using it
    let sidebarProvider = new SidebarProvider(context);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('coding-achievements-sidebar', sidebarProvider)
    );

    // Function to unlock an achievement and update the UI
    function unlockAchievement(achievement: string, context: vscode.ExtensionContext) {
        if (!unlockedAchievements.includes(achievement)) {
            unlockedAchievements.push(achievement);
            context.globalState.update('unlockedAchievements', unlockedAchievements);
            
            // Make sure sidebarProvider exists before calling refresh
            if (sidebarProvider) {
                sidebarProvider.refresh();
            }

            vscode.window.showInformationMessage(achievement);
        }
    }

    // Show initial welcome message and unlock achievement if not already unlocked
    if (!unlockedAchievements.includes('🏆 Achievement Unlocked: Welcome to Code Achievements!')) {
        unlockAchievement('🏆 Achievement Unlocked: Welcome to Code Achievements!', context);
    }

    // Command to manually activate the extension
    let activateCommand = vscode.commands.registerCommand('coding-achievements.activate', () => {
        unlockAchievement('✅ Code Achievements manually activated!', context);
    });

    // Push command to subscriptions
    context.subscriptions.push(activateCommand);
}

export function deactivate() {
    console.log('❌ Code Achievements extension is now deactivated.');
}
