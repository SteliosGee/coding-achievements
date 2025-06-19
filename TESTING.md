# Coding Achievements Extension - Testing Guide

## 🧪 Testing the New Upgradable Achievement System

### Quick Test Steps

1. **Install the Extension**
   - Press `F5` to launch Extension Development Host
   - Open the achievements panel from the activity bar (trophy icon)

2. **Test Upgradable Achievements**

   **⌨️ Typing Progress:**
   - Start typing in any file
   - Watch the "Typing Novice" achievement progress toward 1,000 characters
   - Progress bar should update in real-time

   **⏰ Time Tracking:**
   - Keep VS Code active and type occasionally
   - The "Time Apprentice" achievement tracks toward 1 hour
   - Inactivity pauses tracking after 2 minutes

   **🌍 Language Diversity:**
   - Open files with different extensions (.js, .py, .ts, .html, .css)
   - "Language Explorer" progresses toward 3 different languages

   **🏅 Daily Streaks:**
   - Code on consecutive days
   - "Streak Starter" tracks toward 3 days in a row

3. **Test Unique Achievements**

   **🏆 First Save:**
   - Save any file to unlock immediately

   **🌙 Night Owl / 🐦 Early Bird:**
   - Change system time to test (midnight-5am for Night Owl, 5am-9am for Early Bird)

   **🧭 Explorer:**
   - Open 10 different files in one session

4. **Verify UI Features**
   - Progress bars appear only on upgradable achievements
   - Tooltips show current progress and next tier targets
   - Achievements are grouped by series (upgradable) and tier (unique)
   - Reset button clears all progress
   - Refresh button updates display

### Expected Behavior

- **Progress Persistence**: Progress should save between VS Code sessions
- **Real-time Updates**: Progress bars update as you code
- **Tier Progression**: Higher tiers unlock automatically when targets are met
- **Visual Feedback**: Unlocked achievements are highlighted, locked ones are grayed out

### Troubleshooting

If achievements don't update:
1. Click the "Refresh" button
2. Check the Developer Console (`Help > Toggle Developer Tools`)
3. Look for achievement-related console messages
4. Verify data files are being created in the extension directory

### Data Files Created

The extension creates these tracking files:
- `achievements.json` - Main achievement definitions and unlock status
- `totalCharacters.json` - Typing progress
- `coding-time.json` - Time tracking data  
- `streak-data.json` - Daily streak information
