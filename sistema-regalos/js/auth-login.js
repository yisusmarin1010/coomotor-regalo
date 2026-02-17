// ============================================
// JAVASCRIPT PARA LOGIN - SISTEMA REGALOS
// ============================================

// Variables para control de intentos fallidos y CAPTCHA
let intentosFallidos = 0;
let captchaActivo = false;
let captchaRespuestaCorrecta = 0;

// Función para generaar CAPTCHA matemático
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
                <div class="captcha-question" style="background: white; padding: 0.75rem 1.5rem; border-radius: 8px; font-size: 1.25rem; font-weight: 700; color: #2563eb; border: 2px solid #3b82f6;">
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
    
    // Obtener deviceToken si existe
    const deviceToken = localStorage.getItem('coomotor_device_token');
    
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
            body: JSON.stringify({ 
                email: correo, 
                password: password,
                deviceToken: deviceToken // Enviar deviceToken si existe
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Verificar si requiere 2FA
            if (result.requiere2FA) {
                // Mostrar modal de 2FA
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                mostrarModal2FA(correo, recordarme);
                return;
            }
            
            // Login exitoso sin 2FA - resetear intentos
            resetearIntentos();
            
            // Guardar datos del usuario
            localStorage.setItem('coomotor_token', result.data.token);
            localStorage.setItem('coomotor_user', JSON.stringify(result.data.user));
            
            // Guardar deviceToken si viene en la respuesta
            if (result.data.deviceToken) {
                localStorage.setItem('coomotor_device_token', result.data.deviceToken);
            }
            
            if (recordarme) {
                localStorage.setItem('coomotor_remember', 'true');
            }
            
            // Mostrar mensaje especial si se omitió 2FA
            if (result.omitido2FA) {
                mostrarAlerta('success', '¡Bienvenido de nuevo! (Dispositivo recordado)');
            } else {
                mostrarAlerta('success', '¡Bienvenido! Redirigiendo...');
            }
            
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


// ============================================
// FUNCIONES PARA 2FA
// ============================================

function mostrarModal2FA(email, recordarme) {
    const modalHTML = `
        <div class="modal fade" id="modal2FA" tabindex="-1" data-bs-backdrop="static" data-bs-keyboard="false">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content" style="border-radius: 20px; overflow: hidden; border: none;">
                    <div class="modal-header" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 2rem;">
                        <div class="w-100 text-center">
                            <div style="font-size: 4rem; margin-bottom: 0.5rem;">🔐</div>
                            <h5 class="modal-title fw-bold" style="font-size: 1.5rem;">Verificación de Seguridad</h5>
                            <p class="mb-0 mt-2" style="font-size: 0.9rem; opacity: 0.9;">Código enviado a tu correo</p>
                        </div>
                    </div>
                    <div class="modal-body" style="padding: 2rem;">
                        <div class="alert alert-info" style="background: #e0f2fe; border: none; border-left: 4px solid #3b82f6;">
                            <i class="bi bi-info-circle me-2"></i>
                            <strong>Revisa tu correo</strong><br>
                            <small>Hemos enviado un código de 6 dígitos a <strong>${email}</strong></small>
                        </div>
                        
                        <div class="mb-4">
                            <label class="form-label fw-bold">Ingresa el código de verificación:</label>
                            <div class="d-flex gap-2 justify-content-center" id="codigo2FAInputs">
                                <input type="text" maxlength="1" class="form-control text-center codigo-input" style="width: 50px; height: 60px; font-size: 1.5rem; font-weight: 700; border: 2px solid #e2e8f0; border-radius: 10px;" data-index="0">
                                <input type="text" maxlength="1" class="form-control text-center codigo-input" style="width: 50px; height: 60px; font-size: 1.5rem; font-weight: 700; border: 2px solid #e2e8f0; border-radius: 10px;" data-index="1">
                                <input type="text" maxlength="1" class="form-control text-center codigo-input" style="width: 50px; height: 60px; font-size: 1.5rem; font-weight: 700; border: 2px solid #e2e8f0; border-radius: 10px;" data-index="2">
                                <input type="text" maxlength="1" class="form-control text-center codigo-input" style="width: 50px; height: 60px; font-size: 1.5rem; font-weight: 700; border: 2px solid #e2e8f0; border-radius: 10px;" data-index="3">
                                <input type="text" maxlength="1" class="form-control text-center codigo-input" style="width: 50px; height: 60px; font-size: 1.5rem; font-weight: 700; border: 2px solid #e2e8f0; border-radius: 10px;" data-index="4">
                                <input type="text" maxlength="1" class="form-control text-center codigo-input" style="width: 50px; height: 60px; font-size: 1.5rem; font-weight: 700; border: 2px solid #e2e8f0; border-radius: 10px;" data-index="5">
                            </div>
                            <small class="text-muted d-block text-center mt-2">
                                <i class="bi bi-clock me-1"></i>El código expira en 10 minutos
                            </small>
                        </div>
                        
                        <div id="alerta2FA"></div>
                        
                        <div class="d-grid gap-2">
                            <button type="button" class="btn btn-primary btn-lg" onclick="verificarCodigo2FA('${email}', ${recordarme})" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: none; border-radius: 10px; font-weight: 600; padding: 0.875rem;">
                                <i class="bi bi-shield-check me-2"></i>Verificar Código
                            </button>
                            <button type="button" class="btn btn-outline-secondary" onclick="reenviarCodigo2FA('${email}')" style="border-radius: 10px; font-weight: 600;">
                                <i class="bi bi-arrow-clockwise me-2"></i>Reenviar Código
                            </button>
                            <button type="button" class="btn btn-link text-muted" onclick="cerrarModal2FA()">
                                <i class="bi bi-arrow-left me-1"></i>Volver al login
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remover modal anterior si existe
    const modalAnterior = document.getElementById('modal2FA');
    if (modalAnterior) {
        modalAnterior.remove();
    }
    
    // Agregar modal al body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('modal2FA'));
    modal.show();
    
    // Configurar inputs de código
    configurarInputsCodigo();
    
    // Focus en primer input
    document.querySelector('.codigo-input').focus();
}

function configurarInputsCodigo() {
    const inputs = document.querySelectorAll('.codigo-input');
    
    inputs.forEach((input, index) => {
        // Auto-focus al siguiente input
        input.addEventListener('input', function(e) {
            if (this.value.length === 1 && index < inputs.length - 1) {
                inputs[index + 1].focus();
            }
            
            // Validar solo números
            this.value = this.value.replace(/[^0-9]/g, '');
            
            // Cambiar color del borde cuando tiene valor
            if (this.value) {
                this.style.borderColor = '#667eea';
                this.style.background = '#f0f4ff';
            } else {
                this.style.borderColor = '#e2e8f0';
                this.style.background = 'white';
            }
        });
        
        // Backspace para volver al anterior
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Backspace' && !this.value && index > 0) {
                inputs[index - 1].focus();
            }
            
            // Enter para verificar
            if (e.key === 'Enter') {
                const email = document.getElementById('modal2FA').querySelector('.modal-body strong').textContent;
                const recordarme = localStorage.getItem('coomotor_remember') === 'true';
                verificarCodigo2FA(email, recordarme);
            }
        });
        
        // Paste para distribuir código
        input.addEventListener('paste', function(e) {
            e.preventDefault();
            const pasteData = e.clipboardData.getData('text').replace(/[^0-9]/g, '');
            
            for (let i = 0; i < Math.min(pasteData.length, inputs.length); i++) {
                inputs[i].value = pasteData[i];
                inputs[i].style.borderColor = '#667eea';
                inputs[i].style.background = '#f0f4ff';
            }
            
            // Focus en el último input con valor
            const lastIndex = Math.min(pasteData.length - 1, inputs.length - 1);
            inputs[lastIndex].focus();
        });
    });
}

async function verificarCodigo2FA(email, recordarme) {
    const inputs = document.querySelectorAll('.codigo-input');
    const codigo = Array.from(inputs).map(input => input.value).join('');
    
    if (codigo.length !== 6) {
        mostrarAlerta2FA('warning', 'Por favor ingresa los 6 dígitos del código');
        return;
    }
    
    // Mostrar loading
    const btn = event.target;
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Verificando...';
    btn.disabled = true;
    
    try {
        const response = await fetch('/api/usuarios/login/verificar-2fa', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, codigo })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Guardar datos del usuario
            localStorage.setItem('coomotor_token', result.data.token);
            localStorage.setItem('coomotor_user', JSON.stringify(result.data.user));
            
            // Guardar deviceToken para omitir 2FA por 10 minutos
            if (result.data.deviceToken) {
                localStorage.setItem('coomotor_device_token', result.data.deviceToken);
            }
            
            if (recordarme) {
                localStorage.setItem('coomotor_remember', 'true');
            }
            
            mostrarAlerta2FA('success', '✅ Verificación exitosa. Redirigiendo...');
            
            // Redirigir según el rol
            setTimeout(() => {
                const user = result.data.user;
                if (user.rol === 'admin') {
                    window.location.href = '../dashboards/admin.html';
                } else {
                    window.location.href = '../dashboards/empleado.html';
                }
            }, 1500);
        } else {
            btn.innerHTML = originalText;
            btn.disabled = false;
            mostrarAlerta2FA('danger', result.error || 'Código incorrecto');
            
            // Limpiar inputs
            inputs.forEach(input => {
                input.value = '';
                input.style.borderColor = '#dc2626';
                input.style.background = '#fef2f2';
            });
            inputs[0].focus();
        }
    } catch (error) {
        console.error('Error:', error);
        btn.innerHTML = originalText;
        btn.disabled = false;
        mostrarAlerta2FA('danger', 'Error de conexión. Intenta nuevamente.');
    }
}

async function reenviarCodigo2FA(email) {
    const btn = event.target;
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Reenviando...';
    btn.disabled = true;
    
    try {
        const response = await fetch('/api/usuarios/login/reenviar-2fa', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });
        
        const result = await response.json();
        
        if (result.success) {
            mostrarAlerta2FA('success', '✅ Nuevo código enviado a tu correo');
            
            // Limpiar inputs
            document.querySelectorAll('.codigo-input').forEach(input => {
                input.value = '';
                input.style.borderColor = '#e2e8f0';
                input.style.background = 'white';
            });
            document.querySelector('.codigo-input').focus();
        } else {
            mostrarAlerta2FA('danger', result.error || 'Error al reenviar código');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarAlerta2FA('danger', 'Error de conexión. Intenta nuevamente.');
    } finally {
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }, 3000);
    }
}

function cerrarModal2FA() {
    const modal = bootstrap.Modal.getInstance(document.getElementById('modal2FA'));
    if (modal) {
        modal.hide();
    }
}

function mostrarAlerta2FA(tipo, mensaje) {
    const alertaDiv = document.getElementById('alerta2FA');
    const iconos = {
        success: 'bi-check-circle-fill',
        danger: 'bi-x-circle-fill',
        warning: 'bi-exclamation-triangle-fill',
        info: 'bi-info-circle-fill'
    };
    
    alertaDiv.innerHTML = `
        <div class="alert alert-${tipo} alert-dismissible fade show" role="alert" style="border-radius: 10px; border: none;">
            <i class="bi ${iconos[tipo]} me-2"></i>
            ${mensaje}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    // Auto-ocultar después de 5 segundos
    setTimeout(() => {
        alertaDiv.innerHTML = '';
    }, 5000);
}
