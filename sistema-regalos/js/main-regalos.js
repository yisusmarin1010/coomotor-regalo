// ============================================
// JAVASCRIPT PRINCIPAL ELEGANTE - SISTEMA REGALOS NAVIDEÑOS
// ============================================

// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    initializeCountdown();
    initializeNavbarEffects();
    initializeScrollAnimations();
    checkUserSession();
});

// Countdown Timer elegante
function initializeCountdown() {
    updateCountdown();
    setInterval(updateCountdown, 1000);
}

function updateCountdown() {
    const christmas = new Date('December 25, 2026 00:00:00').getTime();
    const now = new Date().getTime();
    const distance = christmas - now;

    if (distance < 0) {
        document.getElementById('countdown').innerHTML = `
            <div class="text-center">
                <h2 style="color: var(--primary-red); font-family: 'Dancing Script', cursive; font-size: 3rem;">
                    🎄 ¡Feliz Navidad! 🎅
                </h2>
                <p style="color: var(--neutral-medium); font-size: 1.2rem; margin-top: 20px;">
                    ¡Que la magia navideña llene de alegría todos los hogares de COOMOTOR!
                </p>
            </div>
        `;
        return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    // Actualizar números
    updateCountdownNumber('days', days);
    updateCountdownNumber('hours', hours);
    updateCountdownNumber('minutes', minutes);
    updateCountdownNumber('seconds', seconds);
}

function updateCountdownNumber(elementId, newValue) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = newValue.toString().padStart(2, '0');
    }
}

// Efectos de navbar
function initializeNavbarEffects() {
    const navbar = document.getElementById('mainNavbar');
    if (!navbar) return;
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

// Animaciones de scroll suaves
function initializeScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observar elementos para animaciones
    document.querySelectorAll('.feature-card, .timeline-item, .conductor-type-card').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.6s ease';
        observer.observe(el);
    });
}

// Función global para cerrar sesión
window.cerrarSesion = function() {
    localStorage.removeItem('coomotor_token');
    localStorage.removeItem('coomotor_user');
    localStorage.removeItem('coomotor_remember');
    sessionStorage.clear();
    
    showNotification('Sesión cerrada exitosamente', 'success');
    
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1500);
};

// Sistema de notificaciones simple
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'success' ? 'success' : 'info'} position-fixed`;
    notification.style.cssText = `
        top: 20px;
        right: 20px;
        z-index: 10000;
        min-width: 300px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Verificar sesión de usuario
function checkUserSession() {
    if (localStorage.getItem('coomotor_token') && localStorage.getItem('coomotor_user')) {
        const user = JSON.parse(localStorage.getItem('coomotor_user'));
        const navbarButtons = document.querySelector('.navbar .ms-auto');
        if (navbarButtons) {
            navbarButtons.innerHTML = `
                <span class="text-dark me-3">
                    <i class="bi bi-person-circle me-1"></i>
                    Hola, ${user.nombres}
                </span>
                <a href="${user.rol === 'admin' ? 'dashboards/admin.html' : 'dashboards/empleado.html'}" 
                   class="btn btn-primary me-2">
                    <i class="bi bi-speedometer2 me-1"></i>
                    Mi Panel
                </a>
                <button onclick="cerrarSesion()" class="btn btn-outline-primary">
                    <i class="bi bi-box-arrow-right me-1"></i>
                    Salir
                </button>
            `;
        }
    }
}

// Smooth scroll para enlaces internos
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});
