// ============================================
// PANEL DE CONFIGURACIÓN - COOMOTOR
// Accesible desde cualquier página
// ============================================

class SettingsPanel {
    constructor() {
        this.isOpen = false;
        this.createPanel();
        this.createFloatingButton();
    }

    // ============================================
    // CREAR BOTÓN FLOTANTE
    // ============================================
    createFloatingButton() {
        const button = document.createElement('button');
        button.id = 'settings-floating-btn';
        button.innerHTML = '⚙️';
        button.title = 'Configuración';
        button.style.cssText = `
            position: fixed;
            bottom: 100px;
            right: 20px;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
            color: white;
            border: none;
            font-size: 28px;
            cursor: pointer;
            box-shadow: 0 5px 20px rgba(37, 99, 235, 0.4);
            z-index: 9994;
            transition: all 0.3s;
            animation: pulse 2s ease-in-out infinite;
        `;

        button.addEventListener('mouseenter', () => {
            button.style.transform = 'scale(1.1) rotate(90deg)';
        });

        button.addEventListener('mouseleave', () => {
            button.style.transform = 'scale(1) rotate(0deg)';
        });

        button.addEventListener('click', () => {
            this.toggle();
        });

        // Animación de pulso
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse {
                0%, 100% { box-shadow: 0 5px 20px rgba(37, 99, 235, 0.4); }
                50% { box-shadow: 0 5px 30px rgba(37, 99, 235, 0.8); }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(button);
    }

    // ============================================
    // CREAR PANEL DE CONFIGURACIÓN
    // ============================================
    createPanel() {
        const panel = document.createElement('div');
        panel.id = 'settings-panel';
        panel.style.cssText = `
            position: fixed;
            top: 50%;
            right: -400px;
            transform: translateY(-50%);
            width: 380px;
            max-height: 90vh;
            background: white;
            border-radius: 20px 0 0 20px;
            box-shadow: -5px 0 30px rgba(0,0,0,0.3);
            z-index: 9998;
            overflow-y: auto;
            transition: right 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        `;

        panel.innerHTML = `
            <div style="padding: 30px;">
                <!-- Header -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                    <h3 style="margin: 0; color: #1f2937; font-size: 24px; font-weight: 700;">
                        ⚙️ Configuración
                    </h3>
                    <button onclick="settingsPanel.close()" style="
                        background: none;
                        border: none;
                        font-size: 28px;
                        cursor: pointer;
                        color: #6b7280;
                        transition: color 0.2s;
                    " onmouseover="this.style.color='#dc2626'" onmouseout="this.style.color='#6b7280'">
                        ×
                    </button>
                </div>

                <!-- Modo Navideño -->
                <div style="
                    background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%);
                    border-radius: 15px;
                    padding: 20px;
                    margin-bottom: 20px;
                    border: 2px solid #fbbf24;
                ">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <div>
                            <h4 style="margin: 0 0 5px 0; color: #92400e; font-size: 18px; font-weight: 700;">
                                🎄 Modo Fiesta Navideña
                            </h4>
                            <p style="margin: 0; color: #92400e; font-size: 13px; opacity: 0.8;">
                                Activa el ambiente festivo
                            </p>
                        </div>
                        <label class="switch">
                            <input type="checkbox" id="toggle-christmas-mode" ${christmasMode.isActive ? 'checked' : ''} onchange="settingsPanel.toggleChristmasMode()">
                            <span class="slider"></span>
                        </label>
                    </div>

                    <!-- Opciones individuales -->
                    <div id="christmas-options" style="
                        border-top: 2px dashed #fbbf24;
                        padding-top: 15px;
                        margin-top: 15px;
                        display: ${christmasMode.isActive ? 'block' : 'none'};
                    ">
                        <!-- Música -->
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <span style="font-size: 20px;">🎵</span>
                                <span style="color: #92400e; font-weight: 600;">Música Navideña</span>
                            </div>
                            <label class="switch-small">
                                <input type="checkbox" id="toggle-music" ${christmasMode.musicEnabled ? 'checked' : ''} onchange="settingsPanel.toggleMusic()">
                                <span class="slider-small"></span>
                            </label>
                        </div>

                        <!-- Nieve -->
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <span style="font-size: 20px;">❄️</span>
                                <span style="color: #92400e; font-weight: 600;">Nieve Cayendo</span>
                            </div>
                            <label class="switch-small">
                                <input type="checkbox" id="toggle-snow" ${christmasMode.snowEnabled ? 'checked' : ''} onchange="settingsPanel.toggleSnow()">
                                <span class="slider-small"></span>
                            </label>
                        </div>

                        <!-- Luces -->
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <span style="font-size: 20px;">💡</span>
                                <span style="color: #92400e; font-weight: 600;">Luces Navideñas</span>
                            </div>
                            <label class="switch-small">
                                <input type="checkbox" id="toggle-lights" ${christmasMode.lightsEnabled ? 'checked' : ''} onchange="settingsPanel.toggleLights()">
                                <span class="slider-small"></span>
                            </label>
                        </div>
                    </div>
                </div>

                <!-- Info -->
                <div style="
                    background: #f3f4f6;
                    border-radius: 12px;
                    padding: 15px;
                    margin-top: 20px;
                ">
                    <p style="margin: 0; color: #6b7280; font-size: 13px; line-height: 1.6;">
                        <strong style="color: #1f2937;">💡 Nota:</strong> La configuración se guarda automáticamente y se aplica en todas las páginas del sistema.
                    </p>
                </div>

                <!-- Footer -->
                <div style="
                    text-align: center;
                    margin-top: 25px;
                    padding-top: 20px;
                    border-top: 2px solid #e5e7eb;
                ">
                    <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                        COOMOTOR - Sistema de Regalos Navideños
                    </p>
                </div>
            </div>
        `;

        // Agregar estilos de los switches
        const style = document.createElement('style');
        style.textContent = `
            /* Switch grande */
            .switch {
                position: relative;
                display: inline-block;
                width: 60px;
                height: 34px;
            }

            .switch input {
                opacity: 0;
                width: 0;
                height: 0;
            }

            .slider {
                position: absolute;
                cursor: pointer;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: #cbd5e1;
                transition: 0.4s;
                border-radius: 34px;
            }

            .slider:before {
                position: absolute;
                content: "";
                height: 26px;
                width: 26px;
                left: 4px;
                bottom: 4px;
                background-color: white;
                transition: 0.4s;
                border-radius: 50%;
            }

            input:checked + .slider {
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            }

            input:checked + .slider:before {
                transform: translateX(26px);
            }

            /* Switch pequeño */
            .switch-small {
                position: relative;
                display: inline-block;
                width: 44px;
                height: 24px;
            }

            .switch-small input {
                opacity: 0;
                width: 0;
                height: 0;
            }

            .slider-small {
                position: absolute;
                cursor: pointer;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: #cbd5e1;
                transition: 0.4s;
                border-radius: 24px;
            }

            .slider-small:before {
                position: absolute;
                content: "";
                height: 18px;
                width: 18px;
                left: 3px;
                bottom: 3px;
                background-color: white;
                transition: 0.4s;
                border-radius: 50%;
            }

            input:checked + .slider-small {
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            }

            input:checked + .slider-small:before {
                transform: translateX(20px);
            }

            /* Scrollbar personalizado */
            #settings-panel::-webkit-scrollbar {
                width: 8px;
            }

            #settings-panel::-webkit-scrollbar-track {
                background: #f1f5f9;
            }

            #settings-panel::-webkit-scrollbar-thumb {
                background: #cbd5e1;
                border-radius: 4px;
            }

            #settings-panel::-webkit-scrollbar-thumb:hover {
                background: #94a3b8;
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(panel);
    }

    // ============================================
    // TOGGLE PANEL
    // ============================================
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        const panel = document.getElementById('settings-panel');
        panel.style.right = '0';
        this.isOpen = true;
    }

    close() {
        const panel = document.getElementById('settings-panel');
        panel.style.right = '-400px';
        this.isOpen = false;
    }

    // ============================================
    // TOGGLE FUNCIONES
    // ============================================
    toggleChristmasMode() {
        const isActive = christmasMode.toggle();
        const options = document.getElementById('christmas-options');
        options.style.display = isActive ? 'block' : 'none';
        
        this.showToast(
            isActive ? '🎄 Modo Navideño Activado' : '❌ Modo Navideño Desactivado',
            isActive ? 'success' : 'info'
        );
    }

    toggleMusic() {
        const isEnabled = christmasMode.toggleMusic();
        this.showToast(
            isEnabled ? '🎵 Música Activada' : '🔇 Música Desactivada',
            isEnabled ? 'success' : 'info'
        );
    }

    toggleSnow() {
        const isEnabled = christmasMode.toggleSnow();
        this.showToast(
            isEnabled ? '❄️ Nieve Activada' : '🚫 Nieve Desactivada',
            isEnabled ? 'success' : 'info'
        );
    }

    toggleLights() {
        const isEnabled = christmasMode.toggleLights();
        this.showToast(
            isEnabled ? '💡 Luces Activadas' : '🔌 Luces Desactivadas',
            isEnabled ? 'success' : 'info'
        );
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

        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInRight {
                from {
                    transform: translateX(400px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            @keyframes slideOutRight {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(400px);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.settingsPanel = new SettingsPanel();
    });
} else {
    window.settingsPanel = new SettingsPanel();
}

// Exportar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SettingsPanel;
}
