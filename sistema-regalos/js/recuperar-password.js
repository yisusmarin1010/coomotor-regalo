// ============================================
// RECUPERACIÓN DE CONTRASEÑA
// ============================================

let currentStep = 1;
let userEmail = '';
let recoveryToken = '';
let captchaNum1 = 0;
let captchaNum2 = 0;
let captchaRespuesta = 0;

// Inicializar
document.addEventListener('DOMContentLoaded', function() {
    setupCodeInputs();
    setupForms();
    generarCaptcha();
});

// Configurar inputs de código
function setupCodeInputs() {
    const inputs = document.querySelectorAll('.code-input');
    
    inputs.forEach((input, index) => {
        input.addEventListener('input', function(e) {
            if (e.target.value.length === 1 && index < inputs.length - 1) {
                inputs[index + 1].focus();
            }
        });
        
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                inputs[index - 1].focus();
            }
        });
        
        // Solo permitir números
        input.addEventListener('keypress', function(e) {
            if (!/[0-9]/.test(e.key)) {
                e.preventDefault();
            }
        });
    });
}

// Configurar formularios
function setupForms() {
    // Formulario de email
    document.getElementById('emailForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        await enviarCodigo();
    });
    
    // Formulario de código
    document.getElementById('codeForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        await verificarCodigo();
    });
    
    // Formulario de nueva contraseña
    document.getElementById('passwordForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        await cambiarPassword();
    });
}

// Paso 1: Enviar código al correo
async function enviarCodigo() {
    const email = document.getElementById('email').value.trim();
    
    if (!email) {
        mostrarAlerta('Por favor ingresa tu correo electrónico', 'warning');
        return;
    }
    
    // Validar formato de email
    if (!validarEmail(email)) {
        mostrarAlerta('Por favor ingresa un correo electrónico válido', 'warning');
        return;
    }
    
    try {
        mostrarAlerta('Enviando código...', 'info');
        
        const response = await fetch('/api/auth/recuperar-password/solicitar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });
        
        const result = await response.json();
        
        if (result.success) {
            userEmail = email;
            // Mostrar emoji feliz con confetti
            mostrarEmojiFeedback('success', '🎉', '¡Perfecto!', 'Código enviado exitosamente. ¡Revisa tu correo!');
            crearConfetti();
            setTimeout(() => {
                irAPaso(2);
            }, 2500);
        } else {
            // Mostrar emoji enojado/triste
            mostrarEmojiFeedback('error', '😠', '¡Oops!', 'Este correo no está vinculado a ninguna cuenta. Verifica e intenta nuevamente.');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarEmojiFeedback('error', '😰', '¡Error!', 'No pudimos conectar con el servidor. Intenta más tarde.');
    }
}

// Paso 2: Verificar código
async function verificarCodigo() {
    const code = obtenerCodigo();
    
    if (code.length !== 6) {
        mostrarAlerta('Por favor ingresa el código completo', 'warning');
        return;
    }
    
    // Validar CAPTCHA primero
    const captchaInput = parseInt(document.getElementById('captchaInput').value);
    
    if (!captchaInput) {
        mostrarEmojiFeedback('error', '🤨', '¡Espera!', 'Debes resolver el CAPTCHA de seguridad primero.');
        return;
    }
    
    if (captchaInput !== captchaRespuesta) {
        mostrarEmojiFeedback('error', '😵', '¡CAPTCHA Incorrecto!', 'La respuesta matemática no es correcta. Intenta nuevamente.');
        regenerarCaptcha();
        document.getElementById('captchaInput').value = '';
        return;
    }
    
    try {
        mostrarAlerta('Verificando código...', 'info');
        
        const response = await fetch('/api/auth/recuperar-password/verificar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                email: userEmail,
                codigo: code 
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            recoveryToken = result.token;
            // Emoji súper feliz con confetti
            mostrarEmojiFeedback('success', '🎊', '¡Código Correcto!', '¡Excelente! Ahora puedes cambiar tu contraseña de forma segura.');
            crearConfetti();
            setTimeout(() => {
                irAPaso(3);
            }, 2500);
        } else {
            // Emoji triste y decepcionado
            mostrarEmojiFeedback('error', '😢', '¡Código Inválido!', 'El código que ingresaste no es válido o ya expiró. Verifica e intenta nuevamente.');
            limpiarCodigo();
            regenerarCaptcha();
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarEmojiFeedback('error', '😰', '¡Error!', 'No pudimos verificar el código. Intenta más tarde.');
    }
}

// Paso 3: Cambiar contraseña
async function cambiarPassword() {
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validar que las contraseñas coincidan
    if (newPassword !== confirmPassword) {
        mostrarAlerta('Las contraseñas no coinciden', 'warning');
        return;
    }
    
    // Validar fortaleza de contraseña
    if (!validarPassword(newPassword)) {
        mostrarAlerta('La contraseña debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas, números y caracteres especiales', 'warning');
        return;
    }
    
    try {
        mostrarAlerta('Cambiando contraseña...', 'info');
        
        const response = await fetch('/api/auth/recuperar-password/cambiar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                email: userEmail,
                token: recoveryToken,
                nuevaPassword: newPassword 
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            mostrarAlerta('✅ Contraseña cambiada exitosamente. Redirigiendo...', 'success');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        } else {
            mostrarAlerta(result.error || 'Error al cambiar la contraseña', 'danger');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarAlerta('Error de conexión. Intenta nuevamente.', 'danger');
    }
}

// Reenviar código
async function reenviarCodigo() {
    limpiarCodigo();
    await enviarCodigo();
}

// Navegación entre pasos
function irAPaso(paso) {
    // Ocultar todos los pasos
    document.querySelectorAll('.form-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Actualizar indicadores
    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active', 'completed');
    });
    
    // Mostrar paso actual
    document.getElementById(`step${paso}`).classList.add('active');
    document.getElementById(`step${paso}Indicator`).classList.add('active');
    
    // Marcar pasos anteriores como completados
    for (let i = 1; i < paso; i++) {
        document.getElementById(`step${i}Indicator`).classList.add('completed');
    }
    
    currentStep = paso;
    
    // Regenerar CAPTCHA si vamos al paso 2
    if (paso === 2) {
        generarCaptcha();
    }
    
    // Limpiar alertas
    document.getElementById('alertContainer').innerHTML = '';
}

function volverPaso1() {
    irAPaso(1);
    limpiarCodigo();
}

// Utilidades
function obtenerCodigo() {
    let code = '';
    for (let i = 1; i <= 6; i++) {
        code += document.getElementById(`code${i}`).value;
    }
    return code;
}

function limpiarCodigo() {
    for (let i = 1; i <= 6; i++) {
        document.getElementById(`code${i}`).value = '';
    }
    document.getElementById('code1').focus();
}

function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(`${inputId}Icon`);
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('bi-eye');
        icon.classList.add('bi-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('bi-eye-slash');
        icon.classList.add('bi-eye');
    }
}

function validarEmail(email) {
    const regex = /^[a-zA-Z0-9._-]+@(gmail\.com|hotmail\.com|outlook\.com|yahoo\.com|coomotor\.com)$/;
    return regex.test(email);
}

function validarPassword(password) {
    // Mínimo 8 caracteres, al menos una mayúscula, una minúscula, un número y un carácter especial
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(password);
}

function mostrarAlerta(mensaje, tipo) {
    const alertContainer = document.getElementById('alertContainer');
    const alertHTML = `
        <div class="alert alert-${tipo} alert-dismissible fade show" role="alert">
            ${mensaje}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    alertContainer.innerHTML = alertHTML;
    
    // Auto-cerrar después de 5 segundos
    if (tipo === 'success' || tipo === 'info') {
        setTimeout(() => {
            alertContainer.innerHTML = '';
        }, 5000);
    }
}

// ============================================
// FUNCIONES DE EMOJI FEEDBACK DINÁMICO
// ============================================

function mostrarEmojiFeedback(tipo, emoji, titulo, mensaje) {
    // Crear elemento de feedback
    const feedbackDiv = document.createElement('div');
    feedbackDiv.className = `emoji-feedback ${tipo}`;
    feedbackDiv.innerHTML = `
        <span class="emoji-icon">${emoji}</span>
        <div class="emoji-message">
            <h3>${titulo}</h3>
            <p>${mensaje}</p>
        </div>
    `;
    
    document.body.appendChild(feedbackDiv);
    
    // Activar animación
    setTimeout(() => {
        feedbackDiv.classList.add('show');
    }, 10);
    
    // Remover después de la animación
    setTimeout(() => {
        feedbackDiv.remove();
    }, 2500);
}

function crearConfetti() {
    const colores = ['#059669', '#fbbf24', '#dc2626', '#3b82f6', '#8b5cf6'];
    const cantidad = 50;
    
    for (let i = 0; i < cantidad; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.background = colores[Math.floor(Math.random() * colores.length)];
            confetti.style.animationDelay = Math.random() * 0.5 + 's';
            confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
            
            document.body.appendChild(confetti);
            
            setTimeout(() => {
                confetti.remove();
            }, 3000);
        }, i * 30);
    }
}

// ============================================
// FUNCIONES DE CAPTCHA
// ============================================

function generarCaptcha() {
    captchaNum1 = Math.floor(Math.random() * 10) + 1;
    captchaNum2 = Math.floor(Math.random() * 10) + 1;
    captchaRespuesta = captchaNum1 + captchaNum2;
    
    const operaciones = ['+', '-', '×'];
    const operacion = operaciones[Math.floor(Math.random() * operaciones.length)];
    
    if (operacion === '-') {
        // Asegurar que el resultado sea positivo
        if (captchaNum1 < captchaNum2) {
            [captchaNum1, captchaNum2] = [captchaNum2, captchaNum1];
        }
        captchaRespuesta = captchaNum1 - captchaNum2;
    } else if (operacion === '×') {
        captchaNum1 = Math.floor(Math.random() * 5) + 1;
        captchaNum2 = Math.floor(Math.random() * 5) + 1;
        captchaRespuesta = captchaNum1 * captchaNum2;
    }
    
    document.getElementById('captchaQuestion').innerHTML = `¿Cuánto es ${captchaNum1} ${operacion} ${captchaNum2}?`;
    document.getElementById('captchaInput').value = '';
}

function regenerarCaptcha() {
    generarCaptcha();
    mostrarAlerta('🔄 CAPTCHA regenerado', 'info');
}
