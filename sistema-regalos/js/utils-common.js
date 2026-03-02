/**
 * UTILIDADES COMUNES - FRONTEND
 * Funciones reutilizables para evitar duplicación de código
 */

// ============================================
// SISTEMA DE NOTIFICACIONES CENTRALIZADO
// ============================================

/**
 * Muestra una notificación toast moderna
 * @param {string} tipo - success, error, warning, info
 * @param {string} mensaje - Mensaje a mostrar
 * @param {number} duracion - Duración en ms (default: 3000)
 */
function mostrarNotificacion(tipo, mensaje, duracion = 3000) {
    // Crear contenedor si no existe
    let container = document.getElementById('notificationsContainer');
    
    if (!container) {
        container = document.createElement('div');
        container.id = 'notificationsContainer';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            max-width: 400px;
        `;
        
        if (document.body) {
            document.body.appendChild(container);
        } else {
            console.error('❌ No se puede mostrar notificación: document.body no existe');
            return;
        }
    }
    
    // Iconos y colores por tipo
    const config = {
        success: { icon: 'bi-check-circle-fill', color: '#10b981', bg: '#d1fae5' },
        error: { icon: 'bi-x-circle-fill', color: '#ef4444', bg: '#fee2e2' },
        warning: { icon: 'bi-exclamation-triangle-fill', color: '#f59e0b', bg: '#fef3c7' },
        info: { icon: 'bi-info-circle-fill', color: '#3b82f6', bg: '#dbeafe' }
    };
    
    const { icon, color, bg } = config[tipo] || config.info;
    
    // Crear notificación
    const notification = document.createElement('div');
    notification.className = 'notification-toast fade-in';
    notification.style.cssText = `
        background: ${bg};
        border-left: 4px solid ${color};
        padding: 1rem 1.25rem;
        border-radius: 12px;
        margin-bottom: 0.75rem;
        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        display: flex;
        align-items: center;
        gap: 0.75rem;
        animation: slideInRight 0.3s ease-out;
    `;
    
    notification.innerHTML = `
        <i class="bi ${icon}" style="font-size: 1.5rem; color: ${color};"></i>
        <span style="flex: 1; color: #1f2937; font-weight: 500; font-size: 0.9rem;">${mensaje}</span>
        <button onclick="this.parentElement.remove()" style="background: none; border: none; color: ${color}; cursor: pointer; font-size: 1.2rem; padding: 0; line-height: 1;">
            <i class="bi bi-x"></i>
        </button>
    `;
    
    container.appendChild(notification);
    
    // Auto-eliminar
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, duracion);
}

/**
 * Muestra una alerta en un contenedor específico
 * @param {string} containerId - ID del contenedor
 * @param {string} tipo - success, danger, warning, info
 * @param {string} mensaje - Mensaje a mostrar
 */
function mostrarAlerta(containerId, tipo, mensaje) {
    const alertContainer = document.getElementById(containerId);
    
    if (!alertContainer) {
        console.error(`❌ Contenedor ${containerId} no encontrado`);
        return;
    }
    
    const iconos = {
        success: 'bi-check-circle-fill',
        danger: 'bi-x-circle-fill',
        warning: 'bi-exclamation-triangle-fill',
        info: 'bi-info-circle-fill'
    };
    
    const alertClass = `alert-${tipo}`;
    const icon = iconos[tipo] || iconos.info;
    
    alertContainer.innerHTML = `
        <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
            <i class="bi ${icon} me-2"></i>
            ${mensaje}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    // Auto-eliminar después de 5 segundos
    setTimeout(() => {
        alertContainer.innerHTML = '';
    }, 5000);
}

// ============================================
// VALIDACIONES FRONTEND
// ============================================

/**
 * Valida que todos los campos requeridos estén llenos
 * @param {Object} campos - Objeto con los campos a validar
 * @returns {Object} { valido: boolean, mensaje: string }
 */
function validarCamposRequeridos(campos) {
    for (const [nombre, valor] of Object.entries(campos)) {
        if (!valor || (typeof valor === 'string' && valor.trim() === '')) {
            return {
                valido: false,
                mensaje: `El campo ${nombre} es obligatorio`
            };
        }
    }
    return { valido: true };
}

/**
 * Valida formato de email
 */
function validarEmail(email) {
    const regex = /^[a-zA-Z0-9._-]+@(gmail\.com|hotmail\.com|outlook\.com|yahoo\.com|coomotor\.com)$/;
    return regex.test(email);
}

/**
 * Valida celular colombiano
 */
function validarCelular(celular) {
    const regex = /^3\d{9}$/;
    return regex.test(celular);
}

/**
 * Valida número de documento
 */
function validarDocumento(numero) {
    const regex = /^\d{7,10}$/;
    return regex.test(numero);
}

/**
 * Calcula edad a partir de fecha de nacimiento
 */
function calcularEdad(fechaNacimiento) {
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
        edad--;
    }
    
    return edad;
}

// ============================================
// UTILIDADES DE FORMATO
// ============================================

/**
 * Formatea fecha a formato colombiano
 */
function formatearFecha(fecha) {
    if (!fecha) return '-';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * Formatea fecha y hora
 */
function formatearFechaHora(fecha) {
    if (!fecha) return '-';
    const date = new Date(fecha);
    return date.toLocaleString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Capitaliza primera letra
 */
function capitalizar(texto) {
    if (!texto) return '';
    return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
}

// ============================================
// UTILIDADES DE LOADING
// ============================================

/**
 * Muestra spinner de carga en un contenedor
 */
function mostrarLoading(containerId, mensaje = 'Cargando...') {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = `
        <div class="text-center py-5">
            <div class="spinner-border text-primary mb-3" role="status">
                <span class="visually-hidden">Cargando...</span>
            </div>
            <p class="text-muted">${mensaje}</p>
        </div>
    `;
}

/**
 * Muestra estado vacío
 */
function mostrarEstadoVacio(containerId, icono, titulo, mensaje, boton = null) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    let botonHTML = '';
    if (boton) {
        botonHTML = `
            <button class="btn btn-primary mt-3" onclick="${boton.onclick}">
                <i class="bi ${boton.icon}"></i> ${boton.texto}
            </button>
        `;
    }
    
    container.innerHTML = `
        <div class="empty-state text-center py-5">
            <i class="bi ${icono}" style="font-size: 4rem; color: #cbd5e0; margin-bottom: 1rem;"></i>
            <h4 style="font-size: 1.25rem; font-weight: 700; color: #1f2937; margin-bottom: 0.75rem;">${titulo}</h4>
            <p style="font-size: 1rem; color: #6b7280;">${mensaje}</p>
            ${botonHTML}
        </div>
    `;
}

// ============================================
// UTILIDADES DE API
// ============================================

/**
 * Maneja errores de API de forma centralizada
 */
function manejarErrorAPI(error, mensajeDefault = 'Error de conexión') {
    console.error('Error API:', error);
    
    if (error.message) {
        mostrarNotificacion('error', error.message);
    } else {
        mostrarNotificacion('error', mensajeDefault);
    }
}

/**
 * Obtiene headers para peticiones autenticadas
 */
function obtenerHeaders() {
    const headers = {
        'Content-Type': 'application/json'
    };
    
    const token = localStorage.getItem('token');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
}

// ============================================
// ANIMACIONES CSS
// ============================================

// Agregar estilos de animación al documento
if (document.head) {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
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
                transform: translateX(100%);
                opacity: 0;
            }
        }
        
        .fade-in {
            animation: fadeIn 0.3s ease-out;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
    `;
    document.head.appendChild(style);
}

// Exportar funciones (si se usa como módulo)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        mostrarNotificacion,
        mostrarAlerta,
        validarCamposRequeridos,
        validarEmail,
        validarCelular,
        validarDocumento,
        calcularEdad,
        formatearFecha,
        formatearFechaHora,
        capitalizar,
        mostrarLoading,
        mostrarEstadoVacio,
        manejarErrorAPI,
        obtenerHeaders
    };
}

console.log('✅ Utilidades comunes cargadas');
