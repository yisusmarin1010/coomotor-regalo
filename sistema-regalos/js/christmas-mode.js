// ============================================
// MODO FIESTA NAVIDEÑA - COOMOTOR
// Nieve, música, luces y ambiente festivo
// ============================================

class ChristmasMode {
    constructor() {
        this.isActive = localStorage.getItem('christmas_mode') !== 'false'; // Activo por defecto
        this.musicEnabled = localStorage.getItem('christmas_music') !== 'false';
        this.snowEnabled = localStorage.getItem('christmas_snow') !== 'false';
        this.lightsEnabled = localStorage.getItem('christmas_lights') !== 'false';
        
        this.audioContext = null;
        this.musicInterval = null;
        this.snowInterval = null;
        
        // Iniciar automáticamente si está activo
        if (this.isActive) {
            this.init();
        }
    }

    // ============================================
    // INICIALIZAR MODO NAVIDEÑO
    // ============================================
    init() {
        console.log('🎄 Iniciando Modo Fiesta Navideña...');
        
        if (this.snowEnabled) {
            this.startSnow();
        }
        
        if (this.lightsEnabled) {
            this.addChristmasLights();
        }
        
        this.addChristmasCursor();
        this.addSantaClaus();
        
        // Música se inicia con interacción del usuario
        if (this.musicEnabled) {
            this.setupMusicTrigger();
        }
    }

    // ============================================
    // NIEVE CAYENDO
    // ============================================
    startSnow() {
        // Crear contenedor de nieve
        let snowContainer = document.getElementById('snow-container');
        if (!snowContainer) {
            snowContainer = document.createElement('div');
            snowContainer.id = 'snow-container';
            snowContainer.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 9997;
                overflow: hidden;
            `;
            document.body.appendChild(snowContainer);
        }

        // Crear copos de nieve continuamente
        this.snowInterval = setInterval(() => {
            this.createSnowflake(snowContainer);
        }, 200);
    }

    createSnowflake(container) {
        const snowflake = document.createElement('div');
        const size = Math.random() * 5 + 3;
        const startX = Math.random() * window.innerWidth;
        const duration = Math.random() * 3 + 5;
        const delay = Math.random() * 2;
        const drift = (Math.random() - 0.5) * 100;

        snowflake.innerHTML = '❄';
        snowflake.style.cssText = `
            position: absolute;
            color: white;
            font-size: ${size}px;
            left: ${startX}px;
            top: -20px;
            opacity: ${Math.random() * 0.6 + 0.4};
            text-shadow: 0 0 5px rgba(255,255,255,0.8);
            animation: snowfall ${duration}s linear ${delay}s;
            animation-fill-mode: forwards;
        `;

        // Agregar animación CSS si no existe
        if (!document.getElementById('snowfall-animation')) {
            const style = document.createElement('style');
            style.id = 'snowfall-animation';
            style.textContent = `
                @keyframes snowfall {
                    0% {
                        transform: translateY(0) translateX(0) rotate(0deg);
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(${window.innerHeight + 20}px) translateX(${drift}px) rotate(360deg);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        container.appendChild(snowflake);

        // Eliminar después de la animación
        setTimeout(() => {
            snowflake.remove();
        }, (duration + delay) * 1000);
    }

    stopSnow() {
        if (this.snowInterval) {
            clearInterval(this.snowInterval);
            this.snowInterval = null;
        }
        const snowContainer = document.getElementById('snow-container');
        if (snowContainer) {
            snowContainer.remove();
        }
    }

    // ============================================
    // LUCES NAVIDEÑAS EN NAVBAR
    // ============================================
    addChristmasLights() {
        const navbar = document.querySelector('.navbar');
        if (!navbar || document.getElementById('christmas-lights')) return;

        const lightsContainer = document.createElement('div');
        lightsContainer.id = 'christmas-lights';
        lightsContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 5px;
            display: flex;
            justify-content: space-around;
            z-index: 1000;
        `;

        const colors = ['#ff0000', '#00ff00', '#ffff00', '#0000ff', '#ff00ff', '#00ffff'];
        const lightCount = 20;

        for (let i = 0; i < lightCount; i++) {
            const light = document.createElement('div');
            const color = colors[i % colors.length];
            
            light.style.cssText = `
                width: 10px;
                height: 10px;
                border-radius: 50%;
                background: ${color};
                box-shadow: 0 0 10px ${color}, 0 0 20px ${color};
                animation: blink ${Math.random() * 2 + 1}s infinite;
                animation-delay: ${Math.random()}s;
            `;
            
            lightsContainer.appendChild(light);
        }

        // Agregar animación de parpadeo
        if (!document.getElementById('lights-animation')) {
            const style = document.createElement('style');
            style.id = 'lights-animation';
            style.textContent = `
                @keyframes blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.3; }
                }
            `;
            document.head.appendChild(style);
        }

        navbar.style.position = 'relative';
        navbar.appendChild(lightsContainer);
    }

    removeLights() {
        const lights = document.getElementById('christmas-lights');
        if (lights) {
            lights.remove();
        }
    }

    // ============================================
    // CURSOR CON ESTRELLITAS
    // ============================================
    addChristmasCursor() {
        if (document.getElementById('cursor-trail')) return;

        document.addEventListener('mousemove', this.createCursorTrail);
    }

    createCursorTrail(e) {
        if (Math.random() > 0.7) { // No crear en cada movimiento
            const trail = document.createElement('div');
            trail.innerHTML = '✨';
            trail.style.cssText = `
                position: fixed;
                left: ${e.clientX}px;
                top: ${e.clientY}px;
                font-size: ${Math.random() * 10 + 10}px;
                pointer-events: none;
                z-index: 9996;
                animation: fadeOut 1s ease-out forwards;
            `;

            if (!document.getElementById('cursor-animation')) {
                const style = document.createElement('style');
                style.id = 'cursor-animation';
                style.textContent = `
                    @keyframes fadeOut {
                        0% {
                            opacity: 1;
                            transform: translateY(0) scale(1);
                        }
                        100% {
                            opacity: 0;
                            transform: translateY(-30px) scale(0.5);
                        }
                    }
                `;
                document.head.appendChild(style);
            }

            document.body.appendChild(trail);
            setTimeout(() => trail.remove(), 1000);
        }
    }

    removeCursor() {
        document.removeEventListener('mousemove', this.createCursorTrail);
    }

    // ============================================
    // SANTA CLAUS ANIMADO
    // ============================================
    addSantaClaus() {
        if (document.getElementById('santa-claus')) return;

        const santa = document.createElement('div');
        santa.id = 'santa-claus';
        santa.innerHTML = '🎅';
        santa.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            font-size: 60px;
            z-index: 9995;
            cursor: pointer;
            animation: bounce 2s ease-in-out infinite;
            filter: drop-shadow(0 5px 10px rgba(0,0,0,0.3));
            transition: transform 0.3s;
        `;

        santa.addEventListener('mouseenter', () => {
            santa.style.transform = 'scale(1.2) rotate(10deg)';
        });

        santa.addEventListener('mouseleave', () => {
            santa.style.transform = 'scale(1) rotate(0deg)';
        });

        santa.addEventListener('click', () => {
            this.santaSpeaks();
        });

        if (!document.getElementById('santa-animation')) {
            const style = document.createElement('style');
            style.id = 'santa-animation';
            style.textContent = `
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-20px); }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(santa);
    }

    santaSpeaks() {
        const messages = [
            '¡Ho Ho Ho! 🎅',
            '¡Feliz Navidad! 🎄',
            '¡Que la magia navideña te acompañe! ✨',
            '¡Los regalos están en camino! 🎁',
            '¡Felices Fiestas! 🎉'
        ];

        const message = messages[Math.floor(Math.random() * messages.length)];
        
        const bubble = document.createElement('div');
        bubble.textContent = message;
        bubble.style.cssText = `
            position: fixed;
            bottom: 100px;
            right: 20px;
            background: white;
            color: #c41e3a;
            padding: 15px 20px;
            border-radius: 20px;
            font-weight: 600;
            box-shadow: 0 5px 20px rgba(0,0,0,0.3);
            z-index: 9996;
            animation: fadeInOut 3s ease-in-out;
        `;

        if (!document.getElementById('bubble-animation')) {
            const style = document.createElement('style');
            style.id = 'bubble-animation';
            style.textContent = `
                @keyframes fadeInOut {
                    0% { opacity: 0; transform: translateY(20px); }
                    20%, 80% { opacity: 1; transform: translateY(0); }
                    100% { opacity: 0; transform: translateY(-20px); }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(bubble);
        setTimeout(() => bubble.remove(), 3000);
    }

    removeSanta() {
        const santa = document.getElementById('santa-claus');
        if (santa) {
            santa.remove();
        }
    }

    // ============================================
    // MÚSICA NAVIDEÑA
    // ============================================
    setupMusicTrigger() {
        // Esperar primera interacción del usuario
        const startMusic = () => {
            this.startMusic();
            document.removeEventListener('click', startMusic);
            document.removeEventListener('keydown', startMusic);
        };

        document.addEventListener('click', startMusic, { once: true });
        document.addEventListener('keydown', startMusic, { once: true });
    }

    startMusic() {
        if (!this.musicEnabled || this.musicInterval) return;

        console.log('🎵 Iniciando música navideña...');

        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Melodía de "Jingle Bells" simplificada
        const melody = [
            { note: 'E5', duration: 0.25 },
            { note: 'E5', duration: 0.25 },
            { note: 'E5', duration: 0.5 },
            { note: 'E5', duration: 0.25 },
            { note: 'E5', duration: 0.25 },
            { note: 'E5', duration: 0.5 },
            { note: 'E5', duration: 0.25 },
            { note: 'G5', duration: 0.25 },
            { note: 'C5', duration: 0.25 },
            { note: 'D5', duration: 0.25 },
            { note: 'E5', duration: 1 },
            { note: 'F5', duration: 0.25 },
            { note: 'F5', duration: 0.25 },
            { note: 'F5', duration: 0.25 },
            { note: 'F5', duration: 0.25 },
            { note: 'F5', duration: 0.25 },
            { note: 'E5', duration: 0.25 },
            { note: 'E5', duration: 0.25 },
            { note: 'E5', duration: 0.25 },
            { note: 'E5', duration: 0.25 },
            { note: 'D5', duration: 0.25 },
            { note: 'D5', duration: 0.25 },
            { note: 'E5', duration: 0.25 },
            { note: 'D5', duration: 0.5 },
            { note: 'G5', duration: 0.5 }
        ];

        const noteFrequencies = {
            'C5': 523.25,
            'D5': 587.33,
            'E5': 659.25,
            'F5': 698.46,
            'G5': 783.99
        };

        let currentTime = 0;

        const playMelody = () => {
            melody.forEach(({ note, duration }) => {
                setTimeout(() => {
                    this.playMusicNote(noteFrequencies[note], duration);
                }, currentTime * 1000);
                currentTime += duration;
            });

            // Repetir la melodía
            this.musicInterval = setTimeout(() => {
                currentTime = 0;
                playMelody();
            }, currentTime * 1000 + 2000); // Pausa de 2 segundos entre repeticiones
        };

        playMelody();
    }

    playMusicNote(frequency, duration) {
        if (!this.audioContext || !this.musicEnabled) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';

        // Volumen audible pero no excesivo
        gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    stopMusic() {
        if (this.musicInterval) {
            clearTimeout(this.musicInterval);
            this.musicInterval = null;
        }
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
    }

    // ============================================
    // ACTIVAR/DESACTIVAR MODO
    // ============================================
    toggle() {
        this.isActive = !this.isActive;
        localStorage.setItem('christmas_mode', this.isActive);

        if (this.isActive) {
            this.init();
        } else {
            this.deactivate();
        }

        return this.isActive;
    }

    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        localStorage.setItem('christmas_music', this.musicEnabled);

        if (this.musicEnabled && this.isActive) {
            this.setupMusicTrigger();
        } else {
            this.stopMusic();
        }

        return this.musicEnabled;
    }

    toggleSnow() {
        this.snowEnabled = !this.snowEnabled;
        localStorage.setItem('christmas_snow', this.snowEnabled);

        if (this.snowEnabled && this.isActive) {
            this.startSnow();
        } else {
            this.stopSnow();
        }

        return this.snowEnabled;
    }

    toggleLights() {
        this.lightsEnabled = !this.lightsEnabled;
        localStorage.setItem('christmas_lights', this.lightsEnabled);

        if (this.lightsEnabled && this.isActive) {
            this.addChristmasLights();
        } else {
            this.removeLights();
        }

        return this.lightsEnabled;
    }

    deactivate() {
        this.stopSnow();
        this.stopMusic();
        this.removeLights();
        this.removeCursor();
        this.removeSanta();
    }
}

// Instancia global
const christmasMode = new ChristmasMode();

// Exportar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChristmasMode;
}
