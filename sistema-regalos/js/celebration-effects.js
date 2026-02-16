// ============================================
// EFECTOS DE CELEBRACIÓN - COOMOTOR
// Confetti, animaciones y sonidos al aprobar
// ============================================

class CelebrationEffects {
    constructor() {
        this.confettiColors = ['#2563eb', '#c41e3a', '#fbbf24', '#10b981', '#8b5cf6', '#ec4899'];
        this.isPlaying = false;
    }

    // ============================================
    // CONFETTI - Lluvia de papelitos
    // ============================================
    launchConfetti(duration = 3000) {
        const confettiCount = 150;
        const container = document.createElement('div');
        container.id = 'confetti-container';
        container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9999;
            overflow: hidden;
        `;
        document.body.appendChild(container);

        for (let i = 0; i < confettiCount; i++) {
            setTimeout(() => {
                this.createConfettiPiece(container);
            }, Math.random() * 500);
        }

        // Limpiar después de la animación
        setTimeout(() => {
            container.remove();
        }, duration + 3000);
    }

    createConfettiPiece(container) {
        const confetti = document.createElement('div');
        const size = Math.random() * 10 + 5;
        const color = this.confettiColors[Math.floor(Math.random() * this.confettiColors.length)];
        const startX = Math.random() * window.innerWidth;
        const endX = startX + (Math.random() - 0.5) * 200;
        const rotation = Math.random() * 360;
        const duration = Math.random() * 2 + 2;

        confetti.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background: ${color};
            top: -20px;
            left: ${startX}px;
            opacity: 1;
            transform: rotate(${rotation}deg);
            border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
        `;

        container.appendChild(confetti);

        // Animación de caída
        confetti.animate([
            { 
                transform: `translate(0, 0) rotate(${rotation}deg)`,
                opacity: 1
            },
            { 
                transform: `translate(${endX - startX}px, ${window.innerHeight + 20}px) rotate(${rotation + 720}deg)`,
                opacity: 0
            }
        ], {
            duration: duration * 1000,
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        });

        setTimeout(() => confetti.remove(), duration * 1000);
    }

    // ============================================
    // ESTRELLAS BRILLANTES
    // ============================================
    launchStars(duration = 2000) {
        const starCount = 30;
        const container = document.createElement('div');
        container.id = 'stars-container';
        container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9998;
        `;
        document.body.appendChild(container);

        for (let i = 0; i < starCount; i++) {
            setTimeout(() => {
                this.createStar(container);
            }, Math.random() * 1000);
        }

        setTimeout(() => {
            container.remove();
        }, duration + 2000);
    }

    createStar(container) {
        const star = document.createElement('div');
        const size = Math.random() * 20 + 10;
        const x = Math.random() * window.innerWidth;
        const y = Math.random() * window.innerHeight;

        star.innerHTML = '⭐';
        star.style.cssText = `
            position: absolute;
            font-size: ${size}px;
            left: ${x}px;
            top: ${y}px;
            opacity: 0;
            transform: scale(0) rotate(0deg);
        `;

        container.appendChild(star);

        // Animación de aparición y rotación
        star.animate([
            { 
                opacity: 0,
                transform: 'scale(0) rotate(0deg)'
            },
            { 
                opacity: 1,
                transform: 'scale(1.5) rotate(180deg)',
                offset: 0.5
            },
            { 
                opacity: 0,
                transform: 'scale(0) rotate(360deg)'
            }
        ], {
            duration: 2000,
            easing: 'ease-in-out'
        });

        setTimeout(() => star.remove(), 2000);
    }

    // ============================================
    // REGALO CAYENDO
    // ============================================
    launchFallingGift() {
        const gift = document.createElement('div');
        gift.innerHTML = '🎁';
        gift.style.cssText = `
            position: fixed;
            font-size: 80px;
            left: 50%;
            top: -100px;
            transform: translateX(-50%);
            z-index: 10000;
            pointer-events: none;
            filter: drop-shadow(0 10px 20px rgba(0,0,0,0.3));
        `;

        document.body.appendChild(gift);

        // Animación de caída con rebote
        gift.animate([
            { 
                top: '-100px',
                transform: 'translateX(-50%) rotate(0deg) scale(1)'
            },
            { 
                top: '50%',
                transform: 'translateX(-50%) rotate(360deg) scale(1.2)',
                offset: 0.7
            },
            { 
                top: '45%',
                transform: 'translateX(-50%) rotate(360deg) scale(1)',
                offset: 0.85
            },
            { 
                top: '50%',
                transform: 'translateX(-50%) rotate(360deg) scale(1.5)',
                offset: 1
            }
        ], {
            duration: 1500,
            easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
        });

        setTimeout(() => {
            // Explosión del regalo
            gift.animate([
                { 
                    transform: 'translateX(-50%) scale(1.5)',
                    opacity: 1
                },
                { 
                    transform: 'translateX(-50%) scale(3)',
                    opacity: 0
                }
            ], {
                duration: 500,
                easing: 'ease-out'
            });

            setTimeout(() => gift.remove(), 500);
        }, 1500);
    }

    // ============================================
    // SONIDO DE CELEBRACIÓN
    // ============================================
    playSound() {
        if (this.isPlaying) return;
        
        this.isPlaying = true;
        
        // Crear contexto de audio
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Secuencia de notas alegres
        const notes = [
            { freq: 523.25, time: 0 },      // C5
            { freq: 659.25, time: 0.15 },   // E5
            { freq: 783.99, time: 0.3 },    // G5
            { freq: 1046.50, time: 0.45 }   // C6
        ];

        notes.forEach(note => {
            setTimeout(() => {
                this.playNote(audioContext, note.freq, 0.2);
            }, note.time * 1000);
        });

        setTimeout(() => {
            this.isPlaying = false;
        }, 1000);
    }

    playNote(audioContext, frequency, duration) {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
    }

    // ============================================
    // MODAL DE CELEBRACIÓN
    // ============================================
    showCelebrationModal(nombreHijo, postulacionId) {
        const modal = document.createElement('div');
        modal.id = 'celebration-modal';
        modal.innerHTML = `
            <div class="celebration-overlay" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                z-index: 10001;
                display: flex;
                align-items: center;
                justify-content: center;
                animation: fadeIn 0.3s ease-out;
            ">
                <div class="celebration-content" style="
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 30px;
                    padding: 50px;
                    max-width: 600px;
                    text-align: center;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
                    animation: bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                    position: relative;
                    overflow: hidden;
                ">
                    <div style="font-size: 100px; margin-bottom: 20px; animation: rotate 2s ease-in-out infinite;">
                        🎉
                    </div>
                    
                    <h1 style="
                        color: white;
                        font-size: 48px;
                        font-weight: 900;
                        margin: 0 0 20px 0;
                        text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
                        animation: pulse 1s ease-in-out infinite;
                    ">
                        ¡FELICIDADES!
                    </h1>
                    
                    <p style="
                        color: rgba(255,255,255,0.95);
                        font-size: 24px;
                        margin: 0 0 30px 0;
                        line-height: 1.6;
                    ">
                        El regalo para <strong style="color: #fbbf24;">${nombreHijo}</strong> ha sido <strong>APROBADO</strong> 🎁
                    </p>
                    
                    <div style="
                        background: rgba(255,255,255,0.2);
                        border-radius: 15px;
                        padding: 20px;
                        margin: 30px 0;
                        backdrop-filter: blur(10px);
                    ">
                        <p style="color: white; margin: 0; font-size: 16px; line-height: 1.8;">
                            ✨ Pronto recibirás información sobre la fecha y lugar de entrega<br>
                            🎅 ¡Que la magia de la Navidad llene tu hogar de alegría!
                        </p>
                    </div>
                    
                    <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap; margin-top: 30px;">
                        <button onclick="celebrationEffects.takeScreenshot()" style="
                            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                            color: white;
                            border: none;
                            padding: 15px 30px;
                            border-radius: 12px;
                            font-size: 16px;
                            font-weight: 600;
                            cursor: pointer;
                            box-shadow: 0 4px 15px rgba(16,185,129,0.4);
                            transition: transform 0.2s;
                        " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                            📸 Tomar Screenshot
                        </button>
                        
                        <button onclick="celebrationEffects.shareOnSocial('${nombreHijo}')" style="
                            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                            color: white;
                            border: none;
                            padding: 15px 30px;
                            border-radius: 12px;
                            font-size: 16px;
                            font-weight: 600;
                            cursor: pointer;
                            box-shadow: 0 4px 15px rgba(59,130,246,0.4);
                            transition: transform 0.2s;
                        " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                            📱 Compartir
                        </button>
                        
                        <button onclick="celebrationEffects.closeCelebrationModal()" style="
                            background: rgba(255,255,255,0.2);
                            color: white;
                            border: 2px solid white;
                            padding: 15px 30px;
                            border-radius: 12px;
                            font-size: 16px;
                            font-weight: 600;
                            cursor: pointer;
                            backdrop-filter: blur(10px);
                            transition: transform 0.2s;
                        " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                            ✨ Cerrar
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Agregar estilos de animación
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes bounceIn {
                0% { transform: scale(0.3); opacity: 0; }
                50% { transform: scale(1.05); }
                70% { transform: scale(0.9); }
                100% { transform: scale(1); opacity: 1; }
            }
            
            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
            }
            
            @keyframes rotate {
                0%, 100% { transform: rotate(-10deg); }
                50% { transform: rotate(10deg); }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(modal);
    }

    closeCelebrationModal() {
        const modal = document.getElementById('celebration-modal');
        if (modal) {
            modal.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => modal.remove(), 300);
        }
    }

    // ============================================
    // TOMAR SCREENSHOT
    // ============================================
    async takeScreenshot() {
        try {
            // Usar html2canvas si está disponible
            if (typeof html2canvas !== 'undefined') {
                const canvas = await html2canvas(document.body);
                const link = document.createElement('a');
                link.download = `aprobacion-coomotor-${Date.now()}.png`;
                link.href = canvas.toDataURL();
                link.click();
                
                this.showToast('✅ Screenshot guardado', 'success');
            } else {
                this.showToast('📸 Usa Ctrl+Shift+S para tomar screenshot', 'info');
            }
        } catch (error) {
            console.error('Error al tomar screenshot:', error);
            this.showToast('❌ Error al tomar screenshot', 'error');
        }
    }

    // ============================================
    // COMPARTIR EN REDES SOCIALES
    // ============================================
    shareOnSocial(nombreHijo) {
        const text = `¡El regalo para ${nombreHijo} ha sido aprobado! 🎉🎁 #COOMOTOR #RegalosNavideños`;
        const url = window.location.href;

        // Crear modal de opciones
        const shareModal = document.createElement('div');
        shareModal.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.8);
                z-index: 10002;
                display: flex;
                align-items: center;
                justify-content: center;
            " onclick="this.remove()">
                <div style="
                    background: white;
                    border-radius: 20px;
                    padding: 40px;
                    max-width: 400px;
                " onclick="event.stopPropagation()">
                    <h3 style="margin: 0 0 30px 0; text-align: center; color: #1f2937;">Compartir en:</h3>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}" 
                           target="_blank" 
                           style="
                            background: #1877f2;
                            color: white;
                            padding: 15px;
                            border-radius: 12px;
                            text-decoration: none;
                            text-align: center;
                            font-weight: 600;
                            transition: transform 0.2s;
                        " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                            📘 Facebook
                        </a>
                        
                        <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}" 
                           target="_blank" 
                           style="
                            background: #1da1f2;
                            color: white;
                            padding: 15px;
                            border-radius: 12px;
                            text-decoration: none;
                            text-align: center;
                            font-weight: 600;
                            transition: transform 0.2s;
                        " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                            🐦 Twitter
                        </a>
                        
                        <a href="https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}" 
                           target="_blank" 
                           style="
                            background: #25d366;
                            color: white;
                            padding: 15px;
                            border-radius: 12px;
                            text-decoration: none;
                            text-align: center;
                            font-weight: 600;
                            transition: transform 0.2s;
                        " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                            💬 WhatsApp
                        </a>
                        
                        <button onclick="navigator.clipboard.writeText('${text}'); celebrationEffects.showToast('✅ Texto copiado', 'success'); this.closest('div[style*=fixed]').remove();" 
                           style="
                            background: #6b7280;
                            color: white;
                            padding: 15px;
                            border: none;
                            border-radius: 12px;
                            text-align: center;
                            font-weight: 600;
                            cursor: pointer;
                            transition: transform 0.2s;
                        " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                            📋 Copiar
                        </button>
                    </div>
                    
                    <button onclick="this.closest('div[style*=fixed]').remove()" style="
                        width: 100%;
                        margin-top: 20px;
                        background: #f3f4f6;
                        color: #1f2937;
                        padding: 12px;
                        border: none;
                        border-radius: 12px;
                        font-weight: 600;
                        cursor: pointer;
                    ">
                        Cancelar
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(shareModal);
    }

    // ============================================
    // TOAST NOTIFICATION
    // ============================================
    showToast(message, type = 'info') {
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            info: '#3b82f6',
            warning: '#f59e0b'
        };

        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${colors[type]};
            color: white;
            padding: 15px 25px;
            border-radius: 12px;
            font-weight: 600;
            z-index: 10003;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            animation: slideInRight 0.3s ease-out;
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // ============================================
    // CELEBRACIÓN COMPLETA
    // ============================================
    celebrate(nombreHijo, postulacionId) {
        // Lanzar todos los efectos
        this.playSound();
        this.launchConfetti(4000);
        this.launchStars(3000);
        this.launchFallingGift();
        
        // Mostrar modal después de 1 segundo
        setTimeout(() => {
            this.showCelebrationModal(nombreHijo, postulacionId);
        }, 1000);
    }
}

// Instancia global
const celebrationEffects = new CelebrationEffects();

// Exportar para uso en otros archivos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CelebrationEffects;
}
