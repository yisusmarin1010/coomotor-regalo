// ============================================
// JAVASCRIPT PARA LOGIN - SISTEMA REGALOS
// ============================================

// Variables para control de intentos fallidos y CAPTCHA
let intentosFallidos = 0;
let captchaActivo = false;
let captchaRespuestaCorrecta = 0;

// Función para generar CAPTCHA matemático
function generarCaptcha() {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    captchaRespuestaCorrecta = num1 + num2;
    
    const captchaHTML = `
        <div id="captchaContainer" class="mb-3 p-3" style="background: #f0f9ff; border: 2px solid #3b82f6; border-radius: 12px;">
            <label class="form-label fw-bold text-primary">
                <i class="bi bi-shield-check me-2"></i>Verificación de Seguridad
            </label>
            <p class="mb-2" style="font-size: 0.9rem; color: #1e40af;">
                Por seguridad, resuelve esta operación matemática:
            </p>
            <div class="d-flex align-items-center gap-3">
                <div class="captcha-question" style="background: white; padding: 0.75rem 1.5rem; border-radius: 8px; font-size: 1.25rem; font-weight: 700; color: #059669; border: 2px solid #10b981;">
                    ${num1} + ${num2} = ?
                </div>
                <input type="number" id="captchaInput" class="form-control" placeholder="Tu respuesta" required style="max-width: 120px; font-size: 1.1rem; font-weight: 600; text-align: center;">
            </div>
            <small class="text-muted d-block mt-2">
                <i class="bi bi-info-circle me-1"></i>Esto nos ayuda a proteger tu cuenta
            </small>
        </div>
    `;
    
    // Insertar CAPTCHA antes del botón de submit
    const submitBtn = document.querySelector('.btn-christmas');
    submitBtn.insertAdjacentHTML('beforebegin', captchaHTML);
    captchaActivo = true;
    
    // Focus en el input del CAPTCHA
    document.getElementById('captchaInput').focus();
}

// Función para validar CAPTCHA
function validarCaptcha() {
    if (!captchaActivo) return true;
    
    const captchaInput = document.getElementById('captchaInput');
    if (!captchaInput) return true;
    
    const respuestaUsuario = parseInt(captchaInput.value);
    
    if (isNaN(respuestaUsuario)) {
        mostrarAlerta('warning', 'Por favor resuelve la operación matemática');
        return false;
    }
    
    if (respuestaUsuario !== captchaRespuestaCorrecta) {
        mostrarAlerta('danger', 'Respuesta incorrecta. Intenta de nuevo');
        // Regenerar CAPTCHA
        document.getElementById('captchaContainer').remove();
        generarCaptcha();
        return false;
    }
    
    return true;
}

// Función para resetear intentos fallidos (después de login exitoso)
function resetearIntentos() {
    intentosFallidos = 0;
    captchaActivo = false;
    const captchaContainer = document.getElementById('captchaContainer');
    if (captchaContainer) {
        captchaContainer.remove();
    }
}

// Función para mostrar/ocultar contraseña
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const passwordIcon = document.getElementById('passwordIcon');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        passwordIcon.className = 'bi bi-eye-slash';
    } else {
        passwordInput.type = 'password';
        passwordIcon.className = 'bi bi-eye';
    }
}

// Manejar envío del formulario
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const correo = document.getElementById('correo').value.trim();
    const password = document.getElementById('password').value;
    const recordarme = document.getElementById('recordarme').checked;
    
    if (!correo || !password) {
        mostrarAlerta('danger', 'Por favor complete todos los campos');
        return;
    }
    
    // Validar CAPTCHA si está activo
    if (captchaActivo && !validarCaptcha()) {
        return;
    }
    
    // Mostrar loading
    const submitBtn = document.querySelector('.btn-christmas');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Iniciando sesión...';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch('/api/usuarios/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: correo, password: password })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Login exitoso - resetear intentos
            resetearIntentos();
            
            // Guardar datos del usuario
            localStorage.setItem('coomotor_token', result.data.token);
            localStorage.setItem('coomotor_user', JSON.stringify(result.data.user));
            
            if (recordarme) {
                localStorage.setItem('coomotor_remember', 'true');
            }
            
            mostrarAlerta('success', '¡Bienvenido! Redirigiendo...');
            
            // Redirigir según el rol
            setTimeout(() => {
                const user = result.data.user;
                if (user.rol === 'admin') {
                    window.location.href = '../dashboards/admin.html';
                } else {
                    window.location.href = '../dashboards/empleado.html';
                }
            }, 1000);
            
        } else {
            // Login fallido - incrementar intentos
            intentosFallidos++;
            
            // Mostrar mensaje de error
            let mensajeError = result.error || 'Credenciales incorrectas';
            
            // Si es el segundo intento fallido, agregar CAPTCHA
            if (intentosFallidos >= 2 && !captchaActivo) {
                mensajeError += '. Por seguridad, ahora debes resolver un CAPTCHA.';
                mostrarAlerta('warning', mensajeError);
                generarCaptcha();
            } else if (intentosFallidos === 1) {
                mensajeError += ` (Intento ${intentosFallidos} de 2 antes de CAPTCHA)`;
                mostrarAlerta('danger', mensajeError);
            } else {
                mostrarAlerta('danger', mensajeError);
            }
            
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
        
    } catch (error) {
        console.error('Error:', error);
        mostrarAlerta('danger', 'Error de conexión con el servidor. Verifica que el servidor esté corriendo.');
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
});

function mostrarAlerta(tipo, mensaje) {
    const alertContainer = document.getElementById('alertContainer');
    let alertClass, icon;
    
    switch(tipo) {
        case 'success':
            alertClass = 'alert-success';
            icon = 'check-circle-fill';
            break;
        case 'warning':
            alertClass = 'alert-warning';
            icon = 'exclamation-triangle-fill';
            break;
        default:
            alertClass = 'alert-danger';
            icon = 'exclamation-triangle-fill';
    }
    
    alertContainer.innerHTML = `
        <div class="alert ${alertClass} d-flex align-items-center" role="alert">
            <i class="bi bi-${icon} me-2"></i>
            <div>${mensaje}</div>
        </div>
    `;
    
    // Auto-hide después de 5 segundos para mensajes de error y warning
    if (tipo === 'danger' || tipo === 'warning') {
        setTimeout(() => {
            alertContainer.innerHTML = '';
        }, 5000);
    }
}

// Cargar datos recordados si existen
window.addEventListener('load', function() {
    if (localStorage.getItem('coomotor_remember') === 'true') {
        const userData = localStorage.getItem('coomotor_user');
        if (userData) {
            const user = JSON.parse(userData);
            document.getElementById('correo').value = user.correo || '';
            document.getElementById('recordarme').checked = true;
        }
    }
});

// Verificar si ya está logueado
if (localStorage.getItem('coomotor_token') && localStorage.getItem('coomotor_user')) {
    const user = JSON.parse(localStorage.getItem('coomotor_user'));
    if (user.rol === 'admin') {
        window.location.href = '../dashboards/admin.html';
    } else {
        window.location.href = '../dashboards/empleado.html';
    }
}