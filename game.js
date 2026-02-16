// ===== CONFIGURACIÓN DEL JUEGO =====
const CONFIG = {
    TILE_SIZE: 32,
    GRID_WIDTH: 12,
    GRID_HEIGHT: 16,
    PLAYER_SPEED: 4,
    ENEMY_SPEED: 2,
    DRILL_RANGE: 1,
    INITIAL_LIVES: 3,

    // Tipos de minerales
    MINERALS: {
        COPPER: { name: 'Cobre', points: 100, probability: 0.15, color: '#b87333', icon: '🟤' },
        GOLD: { name: 'Oro', points: 500, probability: 0.08, color: '#ffd700', icon: '🟡' },
        RARE_EARTH: { name: 'Tierras Raras', points: 2000, probability: 0.02, color: '#00ffff', icon: '💎' }
    },

    // Tipos de peligros
    DANGERS: {
        ROCK_MONSTER: { speed: 2.5, points: 200, color: '#8b4513' },
        LAVA_CREATURE: { speed: 3.5, points: 300, color: '#ff4500' }
    }
};

// ===== ESTADO DEL JUEGO =====
const gameState = {
    currentScreen: 'start',
    level: 1,
    score: 0,
    lives: CONFIG.INITIAL_LIVES,
    mineralsCollected: { copper: 0, gold: 0, rareEarth: 0 },
    isPaused: false,
    gameOver: false
};

// ===== CANVAS Y CONTEXTO =====
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Configurar canvas para móvil
function resizeCanvas() {
    const container = document.getElementById('gameScreen');
    const hud = document.querySelector('.hud');
    const controls = document.querySelector('.controls');

    const availableHeight = window.innerHeight - (hud?.offsetHeight || 0) - (controls?.offsetHeight || 0);
    const availableWidth = window.innerWidth;

    canvas.width = CONFIG.GRID_WIDTH * CONFIG.TILE_SIZE;
    canvas.height = CONFIG.GRID_HEIGHT * CONFIG.TILE_SIZE;

    // Escalar canvas para ajustar a pantalla
    const scaleX = availableWidth / canvas.width;
    const scaleY = availableHeight / canvas.height;
    const scale = Math.min(scaleX, scaleY, 1);

    canvas.style.width = `${canvas.width * scale}px`;
    canvas.style.height = `${canvas.height * scale}px`;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// ===== GRID DEL JUEGO =====
class Grid {
    constructor() {
        this.tiles = [];
        this.minerals = [];
        this.init();
    }

    init() {
        // Crear grid vacío
        this.tiles = Array(CONFIG.GRID_HEIGHT).fill(null).map(() =>
            Array(CONFIG.GRID_WIDTH).fill(null).map(() => ({
                type: 'dirt',
                dug: false
            }))
        );

        // Primera fila siempre vacía (spawn del jugador)
        for (let x = 0; x < CONFIG.GRID_WIDTH; x++) {
            this.tiles[0][x].dug = true;
        }

        // Generar minerales
        this.generateMinerals();
    }

    generateMinerals() {
        this.minerals = [];
        const totalTiles = CONFIG.GRID_WIDTH * (CONFIG.GRID_HEIGHT - 1);

        // Generar minerales según probabilidad
        for (let y = 2; y < CONFIG.GRID_HEIGHT; y++) {
            for (let x = 0; x < CONFIG.GRID_WIDTH; x++) {
                const rand = Math.random();
                let cumulativeProbability = 0;

                for (const [key, mineral] of Object.entries(CONFIG.MINERALS)) {
                    cumulativeProbability += mineral.probability;
                    if (rand < cumulativeProbability) {
                        this.minerals.push({
                            x, y,
                            type: key,
                            collected: false,
                            ...mineral
                        });
                        break;
                    }
                }
            }
        }
    }

    getTile(x, y) {
        if (x < 0 || x >= CONFIG.GRID_WIDTH || y < 0 || y >= CONFIG.GRID_HEIGHT) {
            return null;
        }
        return this.tiles[y][x];
    }

    digTile(x, y) {
        const tile = this.getTile(x, y);
        if (tile && !tile.dug) {
            tile.dug = true;

            // Reproducir sonido de excavación
            if (window.audioManager) {
                window.audioManager.playDig();
            }

            // Verificar si hay mineral
            const mineral = this.minerals.find(m => m.x === x && m.y === y && !m.collected);
            if (mineral) {
                mineral.collected = true;
                return mineral;
            }
        }
        return null;
    }

    draw() {
        // Dibujar tiles
        for (let y = 0; y < CONFIG.GRID_HEIGHT; y++) {
            for (let x = 0; x < CONFIG.GRID_WIDTH; x++) {
                const tile = this.tiles[y][x];
                const px = x * CONFIG.TILE_SIZE;
                const py = y * CONFIG.TILE_SIZE;

                if (tile.dug) {
                    // Túnel excavado
                    ctx.fillStyle = '#000000';
                    ctx.fillRect(px, py, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
                } else {
                    // Tierra
                    const gradient = ctx.createLinearGradient(px, py, px, py + CONFIG.TILE_SIZE);
                    gradient.addColorStop(0, '#654321');
                    gradient.addColorStop(1, '#4a3319');
                    ctx.fillStyle = gradient;
                    ctx.fillRect(px, py, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);

                    // Textura de tierra
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
                    for (let i = 0; i < 3; i++) {
                        const rx = px + Math.random() * CONFIG.TILE_SIZE;
                        const ry = py + Math.random() * CONFIG.TILE_SIZE;
                        ctx.fillRect(rx, ry, 2, 2);
                    }

                    // Mostrar mineral en la tierra si existe
                    const mineral = this.minerals.find(m => m.x === x && m.y === y && !m.collected);
                    if (mineral) {
                        // Brillo sutil del mineral
                        const glowGradient = ctx.createRadialGradient(
                            px + CONFIG.TILE_SIZE / 2, py + CONFIG.TILE_SIZE / 2, 0,
                            px + CONFIG.TILE_SIZE / 2, py + CONFIG.TILE_SIZE / 2, CONFIG.TILE_SIZE / 2
                        );
                        glowGradient.addColorStop(0, mineral.color + '40');
                        glowGradient.addColorStop(1, 'transparent');
                        ctx.fillStyle = glowGradient;
                        ctx.fillRect(px, py, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);

                        // Pequeño icono del mineral
                        ctx.font = `${CONFIG.TILE_SIZE * 0.4}px Arial`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillStyle = mineral.color;
                        ctx.fillText(mineral.icon, px + CONFIG.TILE_SIZE / 2, py + CONFIG.TILE_SIZE / 2);
                    }
                }

                // Borde sutil
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
                ctx.lineWidth = 1;
                ctx.strokeRect(px, py, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
            }
        }

        // Dibujar minerales recolectables en túneles excavados
        this.minerals.forEach(mineral => {
            if (!mineral.collected && this.tiles[mineral.y][mineral.x].dug) {
                const px = mineral.x * CONFIG.TILE_SIZE;
                const py = mineral.y * CONFIG.TILE_SIZE;

                // Efecto de brillo brillante
                const gradient = ctx.createRadialGradient(
                    px + CONFIG.TILE_SIZE / 2, py + CONFIG.TILE_SIZE / 2, 0,
                    px + CONFIG.TILE_SIZE / 2, py + CONFIG.TILE_SIZE / 2, CONFIG.TILE_SIZE / 2
                );
                gradient.addColorStop(0, mineral.color);
                gradient.addColorStop(1, 'transparent');
                ctx.fillStyle = gradient;
                ctx.fillRect(px, py, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);

                // Icono del mineral grande
                ctx.font = `${CONFIG.TILE_SIZE * 0.6}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(mineral.icon, px + CONFIG.TILE_SIZE / 2, py + CONFIG.TILE_SIZE / 2);
            }
        });
    }
}

// ===== JUGADOR =====
class Player {
    constructor() {
        this.x = CONFIG.GRID_WIDTH / 2;
        this.y = 0;
        this.direction = 'down';
        this.isMoving = false;
        this.isDrilling = false;
        this.animationFrame = 0;
    }

    move(dx, dy) {
        const newX = this.x + dx;
        const newY = this.y + dy;

        // Verificar límites
        if (newX < 0 || newX >= CONFIG.GRID_WIDTH || newY < 0 || newY >= CONFIG.GRID_HEIGHT) {
            return false;
        }

        const tile = grid.getTile(newX, newY);
        if (tile) {
            // Si el tile no está excavado, excavarlo automáticamente
            if (!tile.dug) {
                const mineral = grid.digTile(newX, newY);
                if (mineral) {
                    this.collectMineral(mineral);
                }
            }

            // Mover al jugador
            this.x = newX;
            this.y = newY;

            // Actualizar dirección
            if (dx > 0) this.direction = 'right';
            else if (dx < 0) this.direction = 'left';
            else if (dy > 0) this.direction = 'down';
            else if (dy < 0) this.direction = 'up';

            return true;
        }

        return false;
    }

    drill() {
        const directions = {
            'up': [0, -1],
            'down': [0, 1],
            'left': [-1, 0],
            'right': [1, 0]
        };

        const [dx, dy] = directions[this.direction];
        const targetX = this.x + dx;
        const targetY = this.y + dy;

        // Excavar tierra
        const mineral = grid.digTile(targetX, targetY);
        if (mineral) {
            this.collectMineral(mineral);
        }

        // Inflar enemigos en rango
        enemies.forEach(enemy => {
            if (enemy.isInInflateRange(this)) {
                enemy.inflate();
            }
        });

        this.isDrilling = true;
        setTimeout(() => { this.isDrilling = false; }, 200);
    }

    collectMineral(mineral) {
        gameState.score += mineral.points;

        // Actualizar contador
        if (mineral.type === 'COPPER') gameState.mineralsCollected.copper++;
        else if (mineral.type === 'GOLD') gameState.mineralsCollected.gold++;
        else if (mineral.type === 'RARE_EARTH') gameState.mineralsCollected.rareEarth++;

        // Reproducir sonido de recolección
        if (window.audioManager) {
            window.audioManager.playCollect(mineral.type);
        }

        // Mostrar notificación
        showMineralNotification(mineral);

        // Actualizar HUD
        updateHUD();
    }

    draw() {
        const px = this.x * CONFIG.TILE_SIZE;
        const py = this.y * CONFIG.TILE_SIZE;
        const centerX = px + CONFIG.TILE_SIZE / 2;
        const centerY = py + CONFIG.TILE_SIZE / 2;

        ctx.save();

        // Piernas
        ctx.fillStyle = '#2c5aa0';
        ctx.fillRect(centerX - 6, centerY + 4, 4, 8); // Pierna izquierda
        ctx.fillRect(centerX + 2, centerY + 4, 4, 8); // Pierna derecha

        // Cuerpo/Torso
        ctx.fillStyle = '#ff8800';
        ctx.fillRect(centerX - 8, centerY - 6, 16, 12);

        // Brazos
        ctx.fillStyle = '#ff8800';
        if (this.direction === 'left') {
            ctx.fillRect(centerX - 12, centerY - 4, 6, 4); // Brazo izquierdo extendido
            ctx.fillRect(centerX + 6, centerY - 2, 4, 4); // Brazo derecho
        } else if (this.direction === 'right') {
            ctx.fillRect(centerX - 10, centerY - 2, 4, 4); // Brazo izquierdo
            ctx.fillRect(centerX + 6, centerY - 4, 6, 4); // Brazo derecho extendido
        } else {
            ctx.fillRect(centerX - 10, centerY - 2, 4, 4); // Brazo izquierdo
            ctx.fillRect(centerX + 6, centerY - 2, 4, 4); // Brazo derecho
        }

        // Cabeza/Casco
        ctx.fillStyle = '#ffcc00';
        ctx.beginPath();
        ctx.arc(centerX, centerY - 12, 7, 0, Math.PI * 2);
        ctx.fill();

        // Visor del casco
        ctx.fillStyle = '#4a90e2';
        ctx.fillRect(centerX - 5, centerY - 14, 10, 4);

        // Luz del casco
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(centerX, centerY - 18, 2, 0, Math.PI * 2);
        ctx.fill();

        // Taladro/Herramienta
        if (this.isDrilling || this.direction !== 'down') {
            ctx.fillStyle = '#888888';
            ctx.strokeStyle = '#555555';
            ctx.lineWidth = 1;

            if (this.direction === 'up') {
                ctx.fillRect(centerX - 2, centerY - 22, 4, 8);
                ctx.strokeRect(centerX - 2, centerY - 22, 4, 8);
            } else if (this.direction === 'down') {
                ctx.fillRect(centerX - 2, centerY + 12, 4, 8);
                ctx.strokeRect(centerX - 2, centerY + 12, 4, 8);
            } else if (this.direction === 'left') {
                ctx.fillRect(centerX - 18, centerY - 2, 8, 4);
                ctx.strokeRect(centerX - 18, centerY - 2, 8, 4);
            } else if (this.direction === 'right') {
                ctx.fillRect(centerX + 10, centerY - 2, 8, 4);
                ctx.strokeRect(centerX + 10, centerY - 2, 8, 4);
            }

            // Punta del taladro
            if (this.isDrilling) {
                ctx.fillStyle = '#ff6600';
                if (this.direction === 'up') {
                    ctx.beginPath();
                    ctx.moveTo(centerX, centerY - 24);
                    ctx.lineTo(centerX - 3, centerY - 22);
                    ctx.lineTo(centerX + 3, centerY - 22);
                    ctx.fill();
                } else if (this.direction === 'down') {
                    ctx.beginPath();
                    ctx.moveTo(centerX, centerY + 22);
                    ctx.lineTo(centerX - 3, centerY + 20);
                    ctx.lineTo(centerX + 3, centerY + 20);
                    ctx.fill();
                } else if (this.direction === 'left') {
                    ctx.beginPath();
                    ctx.moveTo(centerX - 20, centerY);
                    ctx.lineTo(centerX - 18, centerY - 3);
                    ctx.lineTo(centerX - 18, centerY + 3);
                    ctx.fill();
                } else if (this.direction === 'right') {
                    ctx.beginPath();
                    ctx.moveTo(centerX + 20, centerY);
                    ctx.lineTo(centerX + 18, centerY - 3);
                    ctx.lineTo(centerX + 18, centerY + 3);
                    ctx.fill();
                }
            }
        }

        ctx.restore();
    }
}

// ===== ENEMIGOS =====
class Enemy {
    constructor(type, x, y) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.config = CONFIG.DANGERS[type];
        this.direction = Math.random() > 0.5 ? 1 : -1;
        this.moveCounter = 0;
        this.inflateLevel = 0; // 0 = normal, 1-3 = inflando, 4 = explota
        this.inflateTimer = null;
        this.isExploding = false;
        this.explosionFrame = 0;
    }

    inflate() {
        if (this.inflateLevel < 4) {
            this.inflateLevel++;

            // Resetear timer de desinflado
            if (this.inflateTimer) {
                clearTimeout(this.inflateTimer);
            }

            if (this.inflateLevel === 4) {
                // Enemigo explota
                this.explode();
            } else {
                // Desinflarse después de 2 segundos si no se sigue inflando
                this.inflateTimer = setTimeout(() => {
                    if (this.inflateLevel > 0) {
                        this.inflateLevel--;
                    }
                }, 2000);
            }
        }
    }

    explode() {
        this.isExploding = true;
        gameState.score += this.config.points;
        updateHUD();

        // Reproducir sonido de explosión
        if (window.audioManager) {
            window.audioManager.playExplosion();
        }

        // Remover después de la animación
        setTimeout(() => {
            const index = enemies.indexOf(this);
            if (index > -1) {
                enemies.splice(index, 1);
            }
        }, 300);
    }

    update() {
        if (this.isExploding) {
            this.explosionFrame++;
            return;
        }

        // Enemigos inflados se mueven más lento
        const speedMultiplier = this.inflateLevel > 0 ? 0.5 : 1;

        this.moveCounter++;
        if (this.moveCounter >= (60 / this.config.speed) / speedMultiplier) {
            this.moveCounter = 0;

            // Movimiento simple: horizontal con cambio aleatorio
            const newX = this.x + this.direction;
            const tile = grid.getTile(newX, this.y);

            if (tile && tile.dug && newX >= 0 && newX < CONFIG.GRID_WIDTH) {
                this.x = newX;
            } else {
                this.direction *= -1; // Cambiar dirección
            }

            // Ocasionalmente cambiar de fila
            if (Math.random() < 0.1) {
                const newY = this.y + (Math.random() > 0.5 ? 1 : -1);
                const tileY = grid.getTile(this.x, newY);
                if (tileY && tileY.dug && newY > 0 && newY < CONFIG.GRID_HEIGHT) {
                    this.y = newY;
                }
            }
        }
    }

    checkCollision(player) {
        return Math.abs(this.x - player.x) < 0.5 && Math.abs(this.y - player.y) < 0.5;
    }

    isInInflateRange(player) {
        // Verificar si el enemigo está en rango de inflado (1 tile de distancia en la dirección del jugador)
        const dx = this.x - player.x;
        const dy = this.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 1.5) return false;

        // Verificar si está en la dirección correcta
        if (player.direction === 'up' && dy < 0 && Math.abs(dx) < 0.5) return true;
        if (player.direction === 'down' && dy > 0 && Math.abs(dx) < 0.5) return true;
        if (player.direction === 'left' && dx < 0 && Math.abs(dy) < 0.5) return true;
        if (player.direction === 'right' && dx > 0 && Math.abs(dy) < 0.5) return true;

        return false;
    }

    draw() {
        const px = this.x * CONFIG.TILE_SIZE;
        const py = this.y * CONFIG.TILE_SIZE;
        const centerX = px + CONFIG.TILE_SIZE / 2;
        const centerY = py + CONFIG.TILE_SIZE / 2;

        if (this.isExploding) {
            // Animación de explosión
            const explosionSize = (this.explosionFrame / 10) * CONFIG.TILE_SIZE;
            ctx.fillStyle = this.config.color + '80';
            ctx.beginPath();
            ctx.arc(centerX, centerY, explosionSize, 0, Math.PI * 2);
            ctx.fill();

            // Partículas
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const dist = this.explosionFrame * 2;
                const px = centerX + Math.cos(angle) * dist;
                const py = centerY + Math.sin(angle) * dist;
                ctx.fillStyle = this.config.color;
                ctx.fillRect(px - 2, py - 2, 4, 4);
            }
            return;
        }

        // Tamaño base + inflado
        const baseSize = CONFIG.TILE_SIZE * 0.7;
        const inflateMultiplier = 1 + (this.inflateLevel * 0.3);
        const size = baseSize * inflateMultiplier;

        // Cuerpo del enemigo
        ctx.fillStyle = this.config.color;
        ctx.beginPath();
        ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2);
        ctx.fill();

        // Borde si está inflado
        if (this.inflateLevel > 0) {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Ojos (se separan al inflarse)
        const eyeOffset = 5 + (this.inflateLevel * 2);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(centerX - eyeOffset, centerY - 3, 3, 0, Math.PI * 2);
        ctx.arc(centerX + eyeOffset, centerY - 3, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(centerX - eyeOffset, centerY - 3, 1.5, 0, Math.PI * 2);
        ctx.arc(centerX + eyeOffset, centerY - 3, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Boca (se abre al inflarse)
        if (this.inflateLevel > 0) {
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(centerX, centerY + 3, 4 + this.inflateLevel, 0, Math.PI, false);
            ctx.stroke();
        }
    }
}

// ===== INSTANCIAS DEL JUEGO =====
let grid;
let player;
let enemies = [];
let gameLoop;

// ===== FUNCIONES DE JUEGO =====
function initGame() {
    grid = new Grid();
    player = new Player();
    enemies = [];

    // Generar enemigos según nivel
    const enemyCount = Math.min(2 + gameState.level, 6);
    for (let i = 0; i < enemyCount; i++) {
        const type = Math.random() > 0.5 ? 'ROCK_MONSTER' : 'LAVA_CREATURE';
        const x = Math.floor(Math.random() * CONFIG.GRID_WIDTH);
        const y = Math.floor(Math.random() * (CONFIG.GRID_HEIGHT - 5)) + 3;
        enemies.push(new Enemy(type, x, y));
    }

    updateHUD();
}

function update() {
    if (gameState.isPaused || gameState.gameOver) return;

    // Actualizar enemigos
    enemies.forEach(enemy => {
        enemy.update();

        // Verificar colisión con jugador
        if (enemy.checkCollision(player)) {
            handlePlayerHit();
        }
    });

    // Verificar si se completó el nivel
    const allMineralsCollected = grid.minerals.every(m => m.collected);
    if (allMineralsCollected) {
        nextLevel();
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    grid.draw();
    enemies.forEach(enemy => enemy.draw());
    player.draw();
}

function gameLoopFunction() {
    update();
    draw();
    gameLoop = requestAnimationFrame(gameLoopFunction);
}

function handlePlayerHit() {
    gameState.lives--;
    updateHUD();

    // Reproducir sonido de daño
    if (window.audioManager) {
        window.audioManager.playHit();
    }

    if (gameState.lives <= 0) {
        endGame();
    } else {
        // Resetear posición del jugador
        player.x = CONFIG.GRID_WIDTH / 2;
        player.y = 0;

        // Breve pausa
        gameState.isPaused = true;
        setTimeout(() => { gameState.isPaused = false; }, 1000);
    }
}

function nextLevel() {
    gameState.level++;
    gameState.score += 1000 * gameState.level; // Bonus por nivel

    // Reproducir sonido de nivel completado
    if (window.audioManager) {
        window.audioManager.playLevelComplete();
    }

    // Reiniciar nivel
    initGame();
}

function endGame() {
    gameState.gameOver = true;
    cancelAnimationFrame(gameLoop);

    // Detener música de fondo
    if (window.audioManager) {
        window.audioManager.stopBackgroundMusic();
        window.audioManager.playGameOver();
    }

    // Mostrar pantalla de game over
    showScreen('gameOver');

    // Actualizar estadísticas finales
    document.getElementById('finalScore').textContent = gameState.score.toLocaleString();
    document.getElementById('finalLevel').textContent = gameState.level;

    const mineralsHTML = `
        <div class="mineral-count">
            <span class="mineral-count-icon">🟤</span>
            <span class="mineral-count-value">${gameState.mineralsCollected.copper}</span>
        </div>
        <div class="mineral-count">
            <span class="mineral-count-icon">🟡</span>
            <span class="mineral-count-value">${gameState.mineralsCollected.gold}</span>
        </div>
        <div class="mineral-count">
            <span class="mineral-count-icon">💎</span>
            <span class="mineral-count-value">${gameState.mineralsCollected.rareEarth}</span>
        </div>
    `;
    document.getElementById('mineralsCollected').innerHTML = mineralsHTML;
}

// ===== FUNCIONES DE UI =====
function showScreen(screenName) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });

    const screens = {
        'start': 'startScreen',
        'game': 'gameScreen',
        'gameOver': 'gameOverScreen'
    };

    document.getElementById(screens[screenName]).classList.add('active');
    gameState.currentScreen = screenName;
}

function updateHUD() {
    document.getElementById('levelDisplay').textContent = gameState.level;
    document.getElementById('scoreDisplay').textContent = gameState.score.toLocaleString();
    document.getElementById('livesDisplay').textContent = '❤️'.repeat(gameState.lives);
}

function showMineralNotification(mineral) {
    const notification = document.getElementById('mineralFound');
    document.getElementById('mineralIcon').textContent = mineral.icon;
    document.getElementById('mineralName').textContent = mineral.name;
    document.getElementById('mineralPoints').textContent = `+${mineral.points}`;

    notification.classList.add('show');
    setTimeout(() => {
        notification.classList.remove('show');
    }, 2000);
}

// ===== CONTROLES =====
let currentInput = { x: 0, y: 0, drill: false };
let moveInterval;

// Controles táctiles
document.querySelectorAll('.dpad-btn').forEach(btn => {
    btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const direction = btn.dataset.direction;

        const movements = {
            'up': [0, -1],
            'down': [0, 1],
            'left': [-1, 0],
            'right': [1, 0]
        };

        const [dx, dy] = movements[direction];
        currentInput = { x: dx, y: dy, drill: false };

        // Movimiento continuo
        moveInterval = setInterval(() => {
            if (!gameState.isPaused && !gameState.gameOver) {
                player.move(currentInput.x, currentInput.y);
            }
        }, 150);
    });

    btn.addEventListener('touchend', (e) => {
        e.preventDefault();
        clearInterval(moveInterval);
        currentInput = { x: 0, y: 0, drill: false };
    });
});

// Botón de excavación
document.getElementById('drillBtn').addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (!gameState.isPaused && !gameState.gameOver) {
        player.drill();
    }
});

// Controles de teclado (para testing en desktop)
let keysPressed = new Set();

document.addEventListener('keydown', (e) => {
    if (gameState.currentScreen !== 'game') return;
    if (gameState.isPaused || gameState.gameOver) return;

    // Evitar repetición de eventos keydown
    if (keysPressed.has(e.key)) return;
    keysPressed.add(e.key);

    const keyMap = {
        'ArrowUp': [0, -1],
        'ArrowDown': [0, 1],
        'ArrowLeft': [-1, 0],
        'ArrowRight': [1, 0],
        'w': [0, -1],
        'W': [0, -1],
        's': [0, 1],
        'S': [0, 1],
        'a': [-1, 0],
        'A': [-1, 0],
        'd': [1, 0],
        'D': [1, 0]
    };

    if (keyMap[e.key]) {
        e.preventDefault();
        const [dx, dy] = keyMap[e.key];
        player.move(dx, dy);
    } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        player.drill();
    }
});

document.addEventListener('keyup', (e) => {
    keysPressed.delete(e.key);
});

// ===== EVENTOS DE BOTONES =====
document.getElementById('startBtn').addEventListener('click', () => {
    // Resetear estado
    gameState.level = 1;
    gameState.score = 0;
    gameState.lives = CONFIG.INITIAL_LIVES;
    gameState.mineralsCollected = { copper: 0, gold: 0, rareEarth: 0 };
    gameState.isPaused = false;
    gameState.gameOver = false;

    // Iniciar música de fondo
    if (window.audioManager) {
        window.audioManager.startBackgroundMusic();
    }

    showScreen('game');
    resizeCanvas();
    initGame();
    gameLoopFunction();
});

document.getElementById('restartBtn').addEventListener('click', () => {
    // Resetear estado
    gameState.level = 1;
    gameState.score = 0;
    gameState.lives = CONFIG.INITIAL_LIVES;
    gameState.mineralsCollected = { copper: 0, gold: 0, rareEarth: 0 };
    gameState.isPaused = false;
    gameState.gameOver = false;

    // Reiniciar música de fondo
    if (window.audioManager) {
        window.audioManager.startBackgroundMusic();
    }

    showScreen('game');
    resizeCanvas();
    initGame();
    gameLoopFunction();
});

// ===== INICIALIZACIÓN =====
console.log('🎮 GeologgIA Digging cargado correctamente');
console.log('📱 Optimizado para dispositivos móviles');
