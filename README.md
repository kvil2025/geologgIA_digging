# 🎮 GeologgIA Digging - Juego de Excavación

Un juego estilo Dig Dug donde excavas túneles, recolectas minerales preciosos y enfrentas enemigos que se inflan.

## 🎵 Sistema de Audio

El juego incluye un sistema de audio completo con dos opciones:

### Opción 1: Audio Procedural (Actual)
El juego actualmente usa **Web Audio API** para generar todos los sonidos de forma procedural:
- ✅ **Música de fondo** estilo chiptune/retro
- ✅ **Sonido de excavación** con ruido blanco filtrado
- ✅ **Sonidos de minerales** (diferentes para Cobre, Oro y Tierras Raras)
- ✅ **Efectos de explosión** con filtros dinámicos
- ✅ **Sonidos de daño** y game over

### Opción 2: Archivos de Audio Personalizados

Si quieres usar tus propios archivos de audio (MP3, OGG, WAV), sigue estos pasos:

#### 1. Crear estructura de carpetas
```bash
mkdir -p assets/music
mkdir -p assets/sfx
```

#### 2. Agregar tus archivos de audio
Coloca tus archivos en las carpetas correspondientes:
```
assets/
├── music/
│   └── background.mp3       # Música de fondo
└── sfx/
    ├── dig.mp3              # Sonido de excavación
    ├── collect_copper.mp3   # Recolectar cobre
    ├── collect_gold.mp3     # Recolectar oro
    ├── collect_rare.mp3     # Recolectar tierras raras
    ├── explosion.mp3        # Explosión de enemigo
    ├── hit.mp3              # Recibir daño
    ├── level_complete.mp3   # Nivel completado
    └── game_over.mp3        # Game over
```

#### 3. Modificar audio.js
Al final del archivo `audio.js`, descomenta y ajusta estas líneas:

```javascript
// Cargar música de fondo
audioManager.loadAudioFile('background_music', 'assets/music/background.mp3').then(() => {
    // La música se iniciará automáticamente al comenzar el juego
});

// Cargar sonidos de efectos
audioManager.loadAudioFile('dig', 'assets/sfx/dig.mp3');
audioManager.loadAudioFile('collect_copper', 'assets/sfx/collect_copper.mp3');
audioManager.loadAudioFile('collect_gold', 'assets/sfx/collect_gold.mp3');
audioManager.loadAudioFile('collect_rare', 'assets/sfx/collect_rare.mp3');
audioManager.loadAudioFile('explosion', 'assets/sfx/explosion.mp3');
audioManager.loadAudioFile('hit', 'assets/sfx/hit.mp3');
audioManager.loadAudioFile('level_complete', 'assets/sfx/level_complete.mp3');
audioManager.loadAudioFile('game_over', 'assets/sfx/game_over.mp3');
```

#### 4. Modificar las funciones de reproducción
En `audio.js`, actualiza las funciones para usar los archivos cargados:

```javascript
// Ejemplo para playCollect
playCollect(mineralType) {
    if (!this.enabled || !this.audioContext) return;

    const soundMap = {
        'COPPER': 'collect_copper',
        'GOLD': 'collect_gold',
        'RARE_EARTH': 'collect_rare'
    };

    const soundName = soundMap[mineralType];
    if (this.audioBuffers[soundName]) {
        this.playAudioBuffer(soundName, false, 0.7);
    } else {
        // Fallback al sonido procedural
        // ... código actual ...
    }
}
```

## 🎮 Controles

### Teclado (Desktop)
- **Flechas / WASD**: Mover
- **Espacio / Enter**: Excavar

### Táctil (Móvil)
- **D-Pad**: Mover en 4 direcciones
- **Botón ⛏️**: Excavar

## 🎯 Objetivo del Juego

1. **Excava túneles** para moverte por el subsuelo
2. **Recolecta minerales**:
   - 🟤 Cobre: 100 puntos
   - 🟡 Oro: 500 puntos
   - 💎 Tierras Raras: 2000 puntos
3. **Evita o destruye enemigos** inflándolos con tu taladro
4. **Completa niveles** recolectando todos los minerales

## 🛠️ Recursos de Audio Recomendados

### Sitios para descargar audio gratuito:
- **Freesound.org** - Efectos de sonido
- **OpenGameArt.org** - Música y SFX para juegos
- **Incompetech.com** - Música libre de derechos
- **Zapsplat.com** - Efectos de sonido
- **Bfxr.net** - Generador de sonidos retro

### Herramientas para crear audio:
- **Audacity** - Editor de audio gratuito
- **Bfxr** - Generador de efectos retro
- **ChipTone** - Generador de música chiptune
- **Bosca Ceoil** - Creador de música simple

## 📝 Notas Técnicas

- El juego usa **Canvas API** para los gráficos
- **Web Audio API** para el sistema de audio
- Optimizado para **móviles y desktop**
- Sin dependencias externas (Vanilla JavaScript)

## 🎨 Características

- ✨ Diseño moderno con glassmorphism
- 🎵 Sistema de audio completo
- 📱 Responsive y optimizado para móviles
- 🎮 Controles táctiles y de teclado
- 💎 3 tipos de minerales con diferentes valores
- 👾 Enemigos con mecánica de inflado (estilo Dig Dug)
- 🏆 Sistema de puntuación y niveles progresivos

## 🚀 Cómo Jugar

1. Abre `index.html` en tu navegador
2. Haz clic en "Comenzar Expedición"
3. ¡Excava, recolecta y sobrevive!

---

Desarrollado con ❤️ para GeologgIA
