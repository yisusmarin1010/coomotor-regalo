// ============================================
// GESTOR DE TEMA Y ANIMACIONES
// ============================================

class ThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem('coomotor_theme') || 'light';
        this.init();
    }

    init() {
        // Aplicar tema guardado
        this.applyTheme(this.currentTheme);
        
        // Crear toggle si no existe
        this.createToggle();
        
        // Escuchar cambios de preferencia del sistema
        this.watchSystemPreference();
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.currentTheme = theme;
        localStorage.setItem('coomotor_theme', theme);
        
        // Actualizar el toggle si existe
        const toggle = document.querySelector('.theme-toggle-slider');
        if (toggle) {
            const icon = toggle.querySelector('.theme-toggle-icon');
            if (icon) {
                icon.textContent = theme === 'dark' ? '🌙' : '☀️';
            }
        }
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
        
        // Animación suave
        document.body.style.transition = 'background-color 0.3s ease';
    }

    createToggle() {
        // Buscar el navbar para agregar el toggle
        const navbar = document.querySelector('.navbar .container-fluid');
        if (!navbar) return;

        // Verificar si ya existe
        if (document.querySelector('.theme-toggle')) return;

        const toggleHTML = `
            <div class="theme-toggle" onclick="themeManager.toggleTheme()" title="Cambiar tema">
                <div class="theme-toggle-slider">
                    <span class="theme-toggle-icon">${this.currentTheme === 'dark' ? '🌙' : '☀️'}</span>
                </div>
            </div>
        `;

        // Insertar antes del userInfo
        const userInfo = navbar.querySelector('#userInfo');
        if (userInfo && userInfo.parentElement) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = toggleHTML;
            userInfo.parentElement.insertBefore(tempDiv.firstElementChild, userInfo);
        }
    }

    watchSystemPreference() {
        if (window.matchMedia) {
            const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
            darkModeQuery.addEventListener('change', (e) => {
                // Solo cambiar si el usuario no ha establecido preferencia
                if (!localStorage.getItem('coomotor_theme')) {
                    this.applyTheme(e.matches ? 'dark' : 'light');
                }
            });
        }
    }
}

// ============================================
// SKELETON LOADERS
// ============================================

class SkeletonLoader {
    static createStatSkeleton() {
        return `
            <div class="skeleton-card skeleton-stat">
                <div class="skeleton skeleton-circle"></div>
                <div class="skeleton skeleton-number"></div>
                <div class="skeleton skeleton-label"></div>
            </div>
        `;
    }

    static createTableSkeleton(rows = 5) {
        let html = '<div class="skeleton-table">';
        for (let i = 0; i < rows; i++) {
            html += `
                <div class="skeleton-table-row">
                    <div class="skeleton skeleton-table-cell"></div>
                    <div class="skeleton skeleton-table-cell"></div>
                    <div class="skeleton skeleton-table-cell"></div>
                    <div class="skeleton skeleton-table-cell"></div>
                </div>
            `;
        }
        html += '</div>';
        return html;
    }

    static createCardSkeleton() {
        return `
            <div class="skeleton-card">
                <div class="skeleton skeleton-text large" style="width: 60%;"></div>
                <div class="skeleton skeleton-text" style="width: 100%;"></div>
                <div class="skeleton skeleton-text" style="width: 80%;"></div>
                <div class="skeleton skeleton-text" style="width: 90%;"></div>
            </div>
        `;
    }

    static showLoading(containerId, type = 'table', count = 5) {
        const container = document.getElementById(containerId);
        if (!container) return;

        let skeletonHTML = '';
        switch (type) {
            case 'stats':
                skeletonHTML = this.createStatSkeleton().repeat(count);
                break;
            case 'table':
                skeletonHTML = this.createTableSkeleton(count);
                break;
            case 'card':
                skeletonHTML = this.createCardSkeleton().repeat(count);
                break;
            default:
                skeletonHTML = this.createTableSkeleton(count);
        }

        container.innerHTML = `<div class="fade-in">${skeletonHTML}</div>`;
    }

    static hideLoading(containerId, content) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Animación de salida para skeleton
        const skeleton = container.querySelector('.skeleton-card, .skeleton-table');
        if (skeleton) {
            skeleton.classList.add('fade-out');
            setTimeout(() => {
                container.innerHTML = `<div class="fade-in">${content}</div>`;
            }, 300);
        } else {
            container.innerHTML = `<div class="fade-in">${content}</div>`;
        }
    }
}

// ============================================
// ICONOS PERSONALIZADOS PARA CONDUCTORES
// ============================================

class ConductorIcons {
    static getIcon(tipoConductor, subtipo = null) {
        const icons = {
            'urbano': {
                icon: '🚌',
                color: 'urbano',
                label: 'Conductor Urbano'
            },
            'carretera': {
                icon: '🚛',
                color: 'carretera',
                label: 'Conductor Carretera',
                subtipos: {
                    'sencillo': '🚚',
                    'tractomula': '🚛',
                    'dobletroque': '🚜'
                }
            },
            'furgones': {
                icon: '🚐',
                color: 'furgones',
                label: 'Conductor Furgones',
                subtipos: {
                    'sencillo': '🚐',
                    'dobletroque': '🚙'
                }
            },
            'administrativo': {
                icon: '💼',
                color: 'administrativo',
                label: 'Personal Administrativo'
            }
        };

        const conductor = icons[tipoConductor] || icons['administrativo'];
        let icon = conductor.icon;

        // Si tiene subtipo, usar icono específico
        if (subtipo && conductor.subtipos && conductor.subtipos[subtipo]) {
            icon = conductor.subtipos[subtipo];
        }

        return {
            icon: icon,
            color: conductor.color,
            label: conductor.label,
            html: `<span class="conductor-icon ${conductor.color}" title="${conductor.label}">${icon}</span>`
        };
    }

    static renderWithIcon(tipoConductor, subtipo, nombre) {
        const iconData = this.getIcon(tipoConductor, subtipo);
        return `
            <div class="d-flex align-items-center">
                ${iconData.html}
                <div>
                    <strong>${nombre}</strong>
                    <br>
                    <small class="text-muted">${iconData.label}</small>
                </div>
            </div>
        `;
    }
}

// ============================================
// ANIMACIONES SUAVES
// ============================================

class AnimationHelper {
    static fadeIn(element, duration = 300) {
        element.style.opacity = '0';
        element.style.display = 'block';
        
        let start = null;
        const animate = (timestamp) => {
            if (!start) start = timestamp;
            const progress = timestamp - start;
            const opacity = Math.min(progress / duration, 1);
            
            element.style.opacity = opacity;
            
            if (progress < duration) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }

    static fadeOut(element, duration = 300, callback = null) {
        let start = null;
        const animate = (timestamp) => {
            if (!start) start = timestamp;
            const progress = timestamp - start;
            const opacity = Math.max(1 - (progress / duration), 0);
            
            element.style.opacity = opacity;
            
            if (progress < duration) {
                requestAnimationFrame(animate);
            } else {
                element.style.display = 'none';
                if (callback) callback();
            }
        };
        
        requestAnimationFrame(animate);
    }

    static slideIn(element, direction = 'down', duration = 400) {
        const translations = {
            'down': 'translateY(-30px)',
            'up': 'translateY(30px)',
            'left': 'translateX(30px)',
            'right': 'translateX(-30px)'
        };

        element.style.transform = translations[direction];
        element.style.opacity = '0';
        element.style.transition = `all ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
        
        setTimeout(() => {
            element.style.transform = 'translate(0, 0)';
            element.style.opacity = '1';
        }, 10);
    }

    static pulse(element, scale = 1.05, duration = 300) {
        element.style.transition = `transform ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
        element.style.transform = `scale(${scale})`;
        
        setTimeout(() => {
            element.style.transform = 'scale(1)';
        }, duration);
    }

    static shake(element, intensity = 10, duration = 500) {
        const keyframes = [
            { transform: 'translateX(0)' },
            { transform: `translateX(-${intensity}px)` },
            { transform: `translateX(${intensity}px)` },
            { transform: `translateX(-${intensity}px)` },
            { transform: `translateX(${intensity}px)` },
            { transform: 'translateX(0)' }
        ];

        element.animate(keyframes, {
            duration: duration,
            easing: 'ease-in-out'
        });
    }
}

// ============================================
// UTILIDADES DE BOTONES
// ============================================

class ButtonHelper {
    static setLoading(button, loading = true) {
        if (loading) {
            button.disabled = true;
            button.classList.add('btn-loading');
            button.dataset.originalText = button.innerHTML;
            button.innerHTML = '<span class="visually-hidden">Cargando...</span>';
        } else {
            button.disabled = false;
            button.classList.remove('btn-loading');
            if (button.dataset.originalText) {
                button.innerHTML = button.dataset.originalText;
            }
        }
    }

    static showSuccess(button, message = '✓', duration = 2000) {
        const originalText = button.innerHTML;
        const originalClass = button.className;
        
        button.innerHTML = message;
        button.className = button.className.replace(/btn-\w+/g, 'btn-success');
        
        setTimeout(() => {
            button.innerHTML = originalText;
            button.className = originalClass;
        }, duration);
    }

    static showError(button, message = '✗', duration = 2000) {
        const originalText = button.innerHTML;
        const originalClass = button.className;
        
        button.innerHTML = message;
        button.className = button.className.replace(/btn-\w+/g, 'btn-danger');
        AnimationHelper.shake(button);
        
        setTimeout(() => {
            button.innerHTML = originalText;
            button.className = originalClass;
        }, duration);
    }
}

// ============================================
// INICIALIZACIÓN
// ============================================

// Crear instancia global del gestor de tema
let themeManager;

document.addEventListener('DOMContentLoaded', function() {
    themeManager = new ThemeManager();
    
    // Agregar clases de animación a elementos existentes
    document.querySelectorAll('.stat, .action-card, .action').forEach((el, index) => {
        el.style.animationDelay = `${index * 0.05}s`;
    });
});

// Exportar para uso global
window.ThemeManager = ThemeManager;
window.SkeletonLoader = SkeletonLoader;
window.ConductorIcons = ConductorIcons;
window.AnimationHelper = AnimationHelper;
window.ButtonHelper = ButtonHelper;
