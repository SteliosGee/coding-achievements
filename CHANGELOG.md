# Change Log

All notable changes to the "coding-achievements" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

### Added
- Persistent progress storage via VS Code globalState (survives extension updates)
- Welcome/onboarding webview on first run
- Sound effects on achievement unlock (Web Audio API)
- Toast notifications for unlocks
- Theme-aware CSS custom properties for webview UI
- Tier glow effects and unlock pulse animations
- Overall progress bar and filter toggle buttons
- Changelog notification on version update
- esbuild bundling (single `dist/extension.js`, ~38KB)
- Unit tests for upgradeable achievement progress/tier calculations
- GitHub Actions CI/CD pipeline
- `🐞 Debugger Pro` achievement (10 debug sessions in a day)
- Debounced typing save (2s debounce)
- Data caps: debugFixes and dailySessions limited to last 30 days
- All event listener disposables tracked for proper cleanup

### Fixed
- CSS syntax error in webview
- Broken git commit detection (was firing on repo presence)
- Daily streaks timezone handling (local dates)
- `isYesterday` logic for streak tracking
- Active days capped to 365 to prevent unbounded growth
- Explorer achievement now session-only (resets on deactivation)
- Time tracking properly stops on deactivation
- Flow State session saved on deactivation
- Removed `saveAchievementDefs()` from unlock path (was overwriting bundled definitions)
- Fixed `achievements.json` shipped with pre-unlocked state
- Removed redundant `activationEvents` from package.json
- Widened engine compatibility to `^1.85.0`
- Updated `.vscode-test.mjs` to use `dist/` output

### Changed
- GlobalState persistence replaces file-based storage (migration on first run)
- All achievement modules export `init()` returning disposables
- `deactivate()` now properly stops tracking and cleans up sessions
- esbuild replaces TypeScript compiler for production bundling
