import * as vscode from 'vscode';

let soundEnabled = true;

export function setSoundEnabled(enabled: boolean) {
    soundEnabled = enabled;
}

export function isSoundEnabled(): boolean {
    return soundEnabled;
}

/**
 * Play an achievement unlock sound using the Web Audio API in the webview.
 * This generates a pleasant ascending chime programmatically — no audio files needed.
 */
export function getUnlockSoundScript(): string {
    if (!soundEnabled) {
        return '';
    }

    return `
    <script>
    (function() {
        function playUnlockSound() {
            try {
                const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
                const now = audioCtx.currentTime;

                notes.forEach((freq, i) => {
                    const osc = audioCtx.createOscillator();
                    const gain = audioCtx.createGain();

                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq, now);

                    gain.gain.setValueAtTime(0, now + i * 0.12);
                    gain.gain.linearRampToValueAtTime(0.15, now + i * 0.12 + 0.05);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.3);

                    osc.connect(gain);
                    gain.connect(audioCtx.destination);

                    osc.start(now + i * 0.12);
                    osc.stop(now + i * 0.12 + 0.35);
                });
            } catch (e) {
                // Audio not available
            }
        }

        // Expose for use by unlock messages
        window.__playUnlockSound = playUnlockSound;
    })();
    </script>`;
}
