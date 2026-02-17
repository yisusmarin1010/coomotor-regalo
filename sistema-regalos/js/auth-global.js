// ============================================
// FUNCIONES GLOBALES DE AUTENTICACIÓN
// ============================================

// Función global para cerrar sesión - disponible en todas las páginas
async function cerrarSesion(event) {
    // Prevenir comportamiento por defecto si es un enlace
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    console.log('🔴 Función cerrarSesion llamada');
    
    // Confirmar acción
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        console.log('✅ Usuario confirmó cerrar sesión');
        
        try {
            // Obtener datos antes de limpiar
            const deviceToken = localStorage.getItem('coomotor_device_token');
            const userData = localStorage.getItem('coomotor_user');
            
            // Registrar logout en el servidor para recordar dispositivo
            if (deviceToken && userData) {
                try {
                    const user = JSON.parse(userData);
                    await fetch('/api/usuarios/logout', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            deviceToken: deviceToken,
                            email: user.correo,
                            usuarioId: user.id
                        })
                    });
                    console.log('📱 Dispositivo registrado para omitir 2FA por 10 minutos');
                } catch (error) {
                    console.error('Error al registrar logout:', error);
                }
            }
            
            // Limpiar localStorage (excepto deviceToken)
            localStorage.removeItem('coomotor_token');
            localStorage.removeItem('coomotor_user');
            localStorage.removeItem('coomotor_remember');
            // NO eliminar coomotor_device_token para mantenerlo
            
            // Limpiar sessionStorage
            sessionStorage.clear();
            
            console.log('🧹 Datos de sesión eliminados');
            
            // Determinar la ruta correcta según la ubicación actual
            const currentPath = window.location.pathname;
            let redirectPath = '/sistema-regalos/index.html';
            
            console.log('📍 Ruta actual:', currentPath);
            
            // Si estamos en una subcarpeta, ajustar la ruta
            if (currentPath.includes('/dashboards/')) {
                redirectPath = '../index.html';
            } else if (currentPath.includes('/auth/')) {
                redirectPath = '../index.html';
            }
            
            console.log('🔄 Redirigiendo a:', redirectPath);
            
            // Redirigir al index principal
            setTimeout(() => {
                window.location.href = redirectPath;
            }, 100);
            
        } catch (error) {
            console.error('❌ Error al cerrar sesión:', error);
            // Forzar redirección de todas formas
            window.location.href = '../index.html';
        }
    } else {
        console.log('❌ Usuario canceló cerrar sesión');
    }
    
    return false;
}

// Hacer la función disponible globalmente de múltiples formas
window.cerrarSesion = cerrarSesion;
window.logout = cerrarSesion;

// Función para verificar si el usuario está autenticado
window.verificarAutenticacion = function() {
    const token = localStorage.getItem('coomotor_token');
    const user = localStorage.getItem('coomotor_user');
    return !!(token && user);
};

// Función para obtener el usuario actual
window.obtenerUsuarioActual = function() {
    try {
        const userData = localStorage.getItem('coomotor_user');
        return userData ? JSON.parse(userData) : null;
    } catch (error) {
        console.error('Error al obtener usuario actual:', error);
        return null;
    }
};

// Función para mostrar alertas
window.mostrarAlertaGlobal = function(tipo, mensaje) {
    // Crear contenedor si no existe
    let alertContainer = document.getElementById('alertContainerGlobal');
    if (!alertContainer) {
        alertContainer = document.createElement('div');
        alertContainer.id = 'alertContainerGlobal';
        alertContainer.className = 'position-fixed top-0 end-0 p-3';
        alertContainer.style.zIndex = '9999';
        document.body.appendChild(alertContainer);
    }
    
    const alertClass = tipo === 'success' ? 'alert-success' : 'alert-danger';
    const icon = tipo === 'success' ? 'check-circle-fill' : 'exclamation-triangle-fill';
    
    const alertElement = document.createElement('div');
    alertElement.className = `alert ${alertClass} d-flex align-items-center alert-dismissible fade show`;
    alertElement.setAttribute('role', 'alert');
    alertElement.innerHTML = `
        <i class="bi bi-${icon} me-2"></i>
        <div>${mensaje}</div>
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    alertContainer.appendChild(alertElement);
    
    // Auto-remove después de 5 segundos
    setTimeout(() => {
        if (alertElement.parentElement) {
            alertElement.remove();
        }
    }, 5000);
};

console.log('🔐 Funciones globales de autenticación cargadas');