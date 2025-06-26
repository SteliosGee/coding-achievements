# Contributing to Coding Achievements 🏆

Thank you for your interest in contributing to Coding Achievements! We welcome all kinds of contributions, whether you're a seasoned developer or just starting out. Every contribution matters and helps make this extension better for the entire VS Code community.

## 🌟 Ways to Contribute

### 🐛 Bug Reports
Found a bug? Help us fix it!
- Check if the issue already exists in our [Issues](../../issues)
- If not, create a new issue with:
  - Clear description of the problem
  - Steps to reproduce
  - Your VS Code version and operating system
  - Screenshots or error messages if applicable

### 💡 Feature Requests
Have an idea for a new achievement or feature?
- Open an issue with the "enhancement" label
- Describe your idea clearly
- Explain why it would be valuable to users
- Feel free to suggest implementation approaches

### 🏅 New Achievement Ideas
We're always looking for creative achievement ideas!
- **Coding Milestones**: Lines of code, files created, commits made
- **Time-based**: Coding streaks, late-night sessions, weekend coding
- **Language-specific**: Achievements for different programming languages
- **Behavioral**: Good practices, debugging skills, collaboration
- **Fun & Quirky**: Unique coding patterns, special dates, easter eggs

### 📝 Documentation
Help improve our documentation:
- Fix typos or unclear explanations
- Add examples or tutorials
- Translate documentation
- Improve code comments

### 🎨 Design & UI
Make the extension more beautiful:
- Design new achievement icons
- Improve the sidebar UI
- Suggest better color schemes
- Create achievement badges or themes

### 🧪 Testing
Help ensure quality:
- Test new features
- Report edge cases
- Write unit tests
- Test on different operating systems

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- VS Code
- Git

### Setting Up the Development Environment

1. **Fork the repository**
   ```bash
   # Click the "Fork" button on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/coding-achievements.git
   cd coding-achievements
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build and watch for changes**
   ```bash
   npm run watch
   ```

4. **Test the extension**
   - Press `F5` to open a new VS Code window with the extension loaded
   - Make changes and reload the window to test

### 🏗️ Project Structure

```
src/
├── extension.ts              # Main extension entry point
├── webviewContent.ts         # Sidebar UI content
├── achievements/             # Achievement modules
│   ├── save.ts              # Save-related achievements
│   ├── typing.ts            # Typing achievements
│   ├── time-based.ts        # Time-based achievements
│   └── ...                  # Other achievement categories
└── utils/                   # Utility functions
    ├── unlockAchievement.ts # Achievement unlocking logic
    └── ...                  # Other utilities
```

## 📋 Contribution Guidelines

### Code Style
- Use TypeScript
- Follow existing code formatting
- Add comments for complex logic
- Use meaningful variable and function names

### Achievement Development
When creating new achievements:

1. **Choose the right category** - Add to existing files or create new ones
2. **Follow the Achievement interface**:
   ```typescript
   interface Achievement {
       name: string;           // Clear, engaging name
       icon: string;           // Emoji or icon
       description: string;    // What the user accomplished
       unlocked: boolean;      // Unlocking status
       tier: 'diamond' | 'gold' | 'silver' | 'bronze';
       type?: 'upgradable' | 'unique';
   }
   ```

3. **Make it engaging** - Use fun names and descriptions
4. **Test thoroughly** - Ensure it unlocks correctly
5. **Consider performance** - Don't slow down VS Code

### Commit Messages
Use clear, descriptive commit messages:
- `feat: add new typing speed achievement`
- `fix: resolve issue with weekend warrior tracking`
- `docs: update README with new features`
- `style: improve sidebar styling`

### Pull Request Process

1. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-new-achievement
   ```

2. **Make your changes**
   - Follow the coding guidelines
   - Test your changes thoroughly
   - Update documentation if needed

3. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add amazing new achievement"
   ```

4. **Push to your fork**
   ```bash
   git push origin feature/amazing-new-achievement
   ```

5. **Open a Pull Request**
   - Provide a clear description of your changes
   - Reference any related issues
   - Include screenshots for UI changes

## 🤝 Community

### Getting Help
- Join discussions in our [Issues](../../issues)
- Ask questions - no question is too small!
- Share your ideas and get feedback

### Code of Conduct
We're committed to providing a welcoming and inclusive environment. Please:
- Be respectful and kind
- Help others learn and grow
- Give constructive feedback
- Celebrate achievements (pun intended!)

## 🙏 Recognition

All contributors will be:
- Listed in our README
- Mentioned in release notes
- Awarded special contributor achievements in the extension!

## 📞 Contact

- **Issues**: Use GitHub Issues for bugs and feature requests
- **Discussions**: Use GitHub Discussions for general questions
- **Email**: Feel free to reach out directly for sensitive matters

---

**Ready to contribute?** We can't wait to see what amazing achievements and features you'll create! Every contribution, no matter how small, helps make coding more fun and engaging for developers everywhere. 🚀

*Happy coding and achievement hunting!* 🏆
