// ============================================
// RECUPERACIÓN DE CONTRASEÑA
// ============================================

let currentStep = 1;
let userEmail = '';
let recoveryToken = '';

// Inicializar
document.addEventListener('DOMContentLoaded', function() {
    setupCodeInputs();
    setupForms();
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
            mostrarAlerta('✅ Código enviado a tu correo electrónico', 'success');
            setTimeout(() => {
                irAPaso(2);
            }, 1500);
        } else {
            mostrarAlerta(result.error || 'Error al enviar el código', 'danger');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarAlerta('Error de conexión. Intenta nuevamente.', 'danger');
    }
}

// Paso 2: Verificar código
async function verificarCodigo() {
    const code = obtenerCodigo();
    
    if (code.length !== 6) {
        mostrarAlerta('Por favor ingresa el código completo', 'warning');
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
            mostrarAlerta('✅ Código verificado correctamente', 'success');
            setTimeout(() => {
                irAPaso(3);
            }, 1500);
        } else {
            mostrarAlerta(result.error || 'Código incorrecto', 'danger');
            limpiarCodigo();
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarAlerta('Error de conexión. Intenta nuevamente.', 'danger');
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
