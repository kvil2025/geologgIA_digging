// ===== SISTEMA DE AUDIO MEJORADO =====
// Este archivo maneja todos los efectos de sonido y música del juego usando Web Audio API

class AudioManager {
    constructor() {
        this.audioContext = null;
        this.sounds = {};
        this.enabled = true;
        this.volume = 0.3;
        this.musicVolume = 0.15;
        this.sfxVolume = 0.4;

        // Música de fondo
        this.backgroundMusic = null;
        this.musicGainNode = null;
        this.isMusicPlaying = false;

        // Buffer para archivos de audio externos
        this.audioBuffers = {};

        // Inicializar AudioContext al primer clic del usuario
        document.addEventListener('click', () => this.init(), { once: true });
        document.addEventListener('touchstart', () => this.init(), { once: true });
    }

    init() {
        if (this.audioContext) return;

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('🔊 Sistema de audio inicializado');

            // Crear nodo de ganancia para música
            this.musicGainNode = this.audioContext.createGain();
            this.musicGainNode.gain.value = this.musicVolume;
            this.musicGainNode.connect(this.audioContext.destination);

        } catch (e) {
            console.warn('⚠️ Web Audio API no disponible:', e);
            this.enabled = false;
        }
    }

    // ===== MÚSICA DE FONDO PROCEDURAL =====

    // Crear música de fondo procedural estilo chiptune/retro
    startBackgroundMusic() {
        if (!this.enabled || !this.audioContext || this.isMusicPlaying) return;

        this.isMusicPlaying = true;
        this.playMusicLoop();
    }

    playMusicLoop() {
        if (!this.isMusicPlaying || !this.enabled) return;

        // Melodía principal (notas en Hz)
        const melody = [
            { freq: 262, duration: 0.3 }, // C4
            { freq: 330, duration: 0.3 }, // E4
            { freq: 392, duration: 0.3 }, // G4
            { freq: 330, duration: 0.3 }, // E4
            { freq: 294, duration: 0.3 }, // D4
            { freq: 349, duration: 0.3 }, // F4
            { freq: 392, duration: 0.3 }, // G4
            { freq: 349, duration: 0.3 }, // F4
        ];

        let currentTime = this.audioContext.currentTime;

        melody.forEach((note, index) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.connect(gain);
            gain.connect(this.musicGainNode);

            osc.frequency.value = note.freq;
            osc.type = 'square';

            gain.gain.setValueAtTime(0, currentTime);
            gain.gain.linearRampToValueAtTime(this.musicVolume * 0.3, currentTime + 0.01);
            gain.gain.linearRampToValueAtTime(0, currentTime + note.duration);

            osc.start(currentTime);
            osc.stop(currentTime + note.duration);

            currentTime += note.duration;
        });

        // Repetir la música
        const totalDuration = melody.reduce((sum, note) => sum + note.duration, 0);
        setTimeout(() => this.playMusicLoop(), totalDuration * 1000);
    }

    stopBackgroundMusic() {
        this.isMusicPlaying = false;
    }

    // ===== CARGAR ARCHIVOS DE AUDIO EXTERNOS =====

    async loadAudioFile(name, url) {
        if (!this.audioContext) {
            await this.init();
        }

        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.audioBuffers[name] = audioBuffer;
            console.log(`✅ Audio cargado: ${name}`);
            return true;
        } catch (e) {
            console.warn(`⚠️ Error cargando audio ${name}:`, e);
            return false;
        }
    }

    playAudioBuffer(name, loop = false, volume = 1.0) {
        if (!this.enabled || !this.audioContext || !this.audioBuffers[name]) return null;

        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();

        source.buffer = this.audioBuffers[name];
        source.loop = loop;

        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        gainNode.gain.value = volume * this.volume;

        source.start(0);
        return source;
    }

    // ===== EFECTOS DE SONIDO MEJORADOS =====

    // Crear un tono con envelope ADSR
    createTone(frequency, duration, type = 'sine', attack = 0.01, decay = 0.1, sustain = 0.7, release = 0.1) {
        if (!this.enabled || !this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = type;

        const now = this.audioContext.currentTime;
        const volume = this.sfxVolume;

        // ADSR Envelope
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(volume, now + attack);
        gainNode.gain.linearRampToValueAtTime(volume * sustain, now + attack + decay);
        gainNode.gain.setValueAtTime(volume * sustain, now + duration - release);
        gainNode.gain.linearRampToValueAtTime(0, now + duration);

        oscillator.start(now);
        oscillator.stop(now + duration);
    }

    // Sonido de excavación mejorado (simula taladro/pico)
    playDig() {
        if (!this.enabled || !this.audioContext) return;

        // Si hay un archivo cargado, usarlo
        if (this.audioBuffers['dig']) {
            this.playAudioBuffer('dig', false, 0.6);
            return;
        }

        // Sonido procedural de excavación
        const now = this.audioContext.currentTime;

        // Ruido blanco para simular tierra/rocas
        const bufferSize = this.audioContext.sampleRate * 0.15;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.3;
        }

        const noise = this.audioContext.createBufferSource();
        noise.buffer = buffer;

        // Filtro para dar carácter al sonido
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800;
        filter.Q.value = 5;

        const gainNode = this.audioContext.createGain();
        gainNode.gain.setValueAtTime(this.sfxVolume * 0.5, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        noise.start(now);
        noise.stop(now + 0.15);

        // Agregar tono de impacto
        this.createTone(120, 0.08, 'square', 0.001, 0.02, 0.3, 0.05);
        setTimeout(() => this.createTone(80, 0.06, 'square', 0.001, 0.02, 0.3, 0.04), 40);
    }

    // Sonido de recolectar mineral mejorado
    playCollect(mineralType) {
        if (!this.enabled || !this.audioContext) return;

        const frequencies = {
            'COPPER': [400, 500, 600],
            'GOLD': [600, 800, 1000, 1200],
            'RARE_EARTH': [800, 1000, 1200, 1400, 1600]
        };

        const freqs = frequencies[mineralType] || [500, 700];
        freqs.forEach((freq, index) => {
            setTimeout(() => {
                this.createTone(freq, 0.2, 'sine', 0.01, 0.05, 0.8, 0.1);
                // Agregar armónico para riqueza
                this.createTone(freq * 2, 0.15, 'sine', 0.01, 0.05, 0.4, 0.08);
            }, index * 60);
        });
    }

    // Sonido de daño mejorado
    playHit() {
        if (!this.enabled || !this.audioContext) return;

        // Sonido de impacto grave
        this.createTone(80, 0.4, 'sawtooth', 0.001, 0.1, 0.6, 0.2);

        // Ruido de impacto
        setTimeout(() => {
            const now = this.audioContext.currentTime;
            const bufferSize = this.audioContext.sampleRate * 0.1;
            const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
            const data = buffer.getChannelData(0);

            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
            }

            const noise = this.audioContext.createBufferSource();
            noise.buffer = buffer;

            const gainNode = this.audioContext.createGain();
            gainNode.gain.value = this.sfxVolume * 0.3;

            noise.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            noise.start(now);
        }, 50);
    }

    // Sonido de explosión de enemigo mejorado
    playExplosion() {
        if (!this.enabled || !this.audioContext) return;

        // Explosión grave
        this.createTone(60, 0.5, 'sawtooth', 0.001, 0.15, 0.4, 0.3);

        // Ruido de explosión
        const now = this.audioContext.currentTime;
        const bufferSize = this.audioContext.sampleRate * 0.3;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize) * 0.5;
        }

        const noise = this.audioContext.createBufferSource();
        noise.buffer = buffer;

        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, now);
        filter.frequency.exponentialRampToValueAtTime(100, now + 0.3);

        const gainNode = this.audioContext.createGain();
        gainNode.gain.setValueAtTime(this.sfxVolume * 0.6, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        noise.start(now);
    }

    // Sonido de nivel completado
    playLevelComplete() {
        if (!this.enabled || !this.audioContext) return;

        const melody = [523, 659, 784, 1047];
        melody.forEach((freq, index) => {
            setTimeout(() => {
                this.createTone(freq, 0.3, 'sine', 0.01, 0.1, 0.7, 0.15);
                this.createTone(freq * 2, 0.25, 'sine', 0.01, 0.1, 0.3, 0.1);
            }, index * 150);
        });
    }

    // Sonido de game over
    playGameOver() {
        if (!this.enabled || !this.audioContext) return;

        const melody = [400, 350, 300, 250];
        melody.forEach((freq, index) => {
            setTimeout(() => {
                this.createTone(freq, 0.4, 'triangle', 0.05, 0.1, 0.6, 0.2);
            }, index * 250);
        });
    }

    // ===== CONTROLES =====

    // Toggle de audio
    toggle() {
        this.enabled = !this.enabled;
        if (!this.enabled) {
            this.stopBackgroundMusic();
        }
        return this.enabled;
    }

    // Ajustar volumen general
    setVolume(value) {
        this.volume = Math.max(0, Math.min(1, value));
    }

    // Ajustar volumen de música
    setMusicVolume(value) {
        this.musicVolume = Math.max(0, Math.min(1, value));
        if (this.musicGainNode) {
            this.musicGainNode.gain.value = this.musicVolume;
        }
    }

    // Ajustar volumen de efectos
    setSFXVolume(value) {
        this.sfxVolume = Math.max(0, Math.min(1, value));
    }
}

// Crear instancia global
const audioManager = new AudioManager();

// Exportar para uso en game.js
if (typeof window !== 'undefined') {
    window.audioManager = audioManager;
}

console.log('🎵 Audio manager mejorado cargado');

// ===== EJEMPLO DE USO CON ARCHIVOS EXTERNOS =====
// Para usar archivos de audio MP3/OGG, descomenta y ajusta las rutas:
/*
// Cargar música de fondo
audioManager.loadAudioFile('background_music', 'assets/music/background.mp3').then(() => {
    // Reproducir música en loop
    audioManager.playAudioBuffer('background_music', true, 0.3);
});

// Cargar sonido de excavación
audioManager.loadAudioFile('dig', 'assets/sfx/dig.mp3');

// Cargar otros sonidos
audioManager.loadAudioFile('collect', 'assets/sfx/collect.mp3');
audioManager.loadAudioFile('explosion', 'assets/sfx/explosion.mp3');
*/
