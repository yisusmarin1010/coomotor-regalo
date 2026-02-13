// ============================================
// JAVASCRIPT PARA REGISTRO - SISTEMA REGALOS CON VALIDACIONES MEJORADAS
// ============================================

// Reglas de validación
const VALIDACIONES = {
    cedula: {
        min: 7,
        max: 10,
        pattern: /^\d{7,10}$/,
        mensaje: 'La cédula debe tener entre 7 y 10 dígitos'
    },
    celular: {
        length: 10,
        pattern: /^3\d{9}$/,
        mensaje: 'El celular debe tener 10 dígitos y comenzar con 3'
    },
    correo: {
        pattern: /^[a-zA-Z0-9._-]+@(gmail\.com|hotmail\.com|outlook\.com|yahoo\.com|coomotor\.com)$/,
        mensaje: 'El correo debe ser de Gmail, Hotmail, Outlook, Yahoo o Coomotor'
    },
    password: {
        minLength: 8,
        pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        mensaje: 'La contraseña debe tener mínimo 8 caracteres, incluir mayúsculas, minúsculas, números y un carácter especial (@$!%*?&)'
    },
    nombres: {
        minLength: 2,
        maxLength: 50,
        pattern: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
        mensaje: 'Los nombres solo pueden contener letras y espacios'
    },
    apellidos: {
        minLength: 2,
        maxLength: 50,
        pattern: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
        mensaje: 'Los apellidos solo pueden contener letras y espacios'
    }
};

// Manejar cambios en tipo de conductor
document.getElementById('tipoConductor').addEventListener('change', function() {
    const tipoConductor = this.value;
    const subtipoCarretera = document.getElementById('subtipoCarretera');
    const subtipoFurgones = document.getElementById('subtipoFurgones');
    
    // Ocultar todos los subtipos
    subtipoCarretera.classList.remove('show');
    subtipoFurgones.classList.remove('show');
    
    // Limpiar selecciones
    document.getElementById('subtipoCarreteraSelect').value = '';
    document.getElementById('subtipoFurgonesSelect').value = '';
    
    // Mostrar subtipo correspondiente
    if (tipoConductor === 'carretera') {
        subtipoCarretera.classList.add('show');
    } else if (tipoConductor === 'furgones') {
        subtipoFurgones.classList.add('show');
    }
});

// Validación en tiempo real del celular
document.getElementById('celular').addEventListener('input', function() {
    let value = this.value.replace(/\D/g, ''); // Solo números
    if (value.length > 10) {
        value = value.substring(0, 10);
    }
    this.value = value;
    validarCampo('celular', value);
});

// Validación en tiempo real del documento
document.getElementById('numeroDocumento').addEventListener('input', function() {
    let value = this.value.replace(/\D/g, ''); // Solo números
    if (value.length > 10) {
        value = value.substring(0, 10);
    }
    this.value = value;
    validarCampo('cedula', value);
});

// Validación en tiempo real del correo
document.getElementById('correo').addEventListener('blur', function() {
    validarCampo('correo', this.value.trim());
});

// Validación en tiempo real de la contraseña
document.getElementById('password').addEventListener('input', function() {
    validarCampo('password', this.value);
    mostrarFuerzaPassword(this.value);
});

// Validación de confirmación de contraseña
document.getElementById('confirmPassword').addEventListener('input', function() {
    const password = document.getElementById('password').value;
    const confirmPassword = this.value;
    
    if (confirmPassword && password !== confirmPassword) {
        mostrarErrorCampo('confirmPassword', 'Las contraseñas no coinciden');
    } else {
        limpiarErrorCampo('confirmPassword');
    }
});

// Validación de nombres
document.getElementById('nombres').addEventListener('blur', function() {
    validarCampo('nombres', this.value.trim());
});

// Validación de apellidos
document.getElementById('apellidos').addEventListener('blur', function() {
    validarCampo('apellidos', this.value.trim());
});

// Función para validar un campo específico
function validarCampo(campo, valor) {
    const regla = VALIDACIONES[campo];
    if (!regla) return true;
    
    const inputElement = document.getElementById(campo === 'cedula' ? 'numeroDocumento' : campo);
    
    // Validar longitud mínima
    if (regla.minLength && valor.length < regla.minLength) {
        mostrarErrorCampo(inputElement.id, `Mínimo ${regla.minLength} caracteres`);
        return false;
    }
    
    // Validar longitud máxima
    if (regla.maxLength && valor.length > regla.maxLength) {
        mostrarErrorCampo(inputElement.id, `Máximo ${regla.maxLength} caracteres`);
        return false;
    }
    
    // Validar longitud exacta
    if (regla.length && valor.length !== regla.length) {
        mostrarErrorCampo(inputElement.id, regla.mensaje);
        return false;
    }
    
    // Validar patrón
    if (regla.pattern && !regla.pattern.test(valor)) {
        mostrarErrorCampo(inputElement.id, regla.mensaje);
        return false;
    }
    
    // Si pasa todas las validaciones
    limpiarErrorCampo(inputElement.id);
    return true;
}

// Mostrar error en un campo
function mostrarErrorCampo(campoId, mensaje) {
    const campo = document.getElementById(campoId);
    campo.classList.add('is-invalid');
    campo.classList.remove('is-valid');
    
    // Buscar o crear div de error
    let errorDiv = campo.parentElement.querySelector('.invalid-feedback');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.className = 'invalid-feedback';
        campo.parentElement.appendChild(errorDiv);
    }
    errorDiv.textContent = mensaje;
}

// Limpiar error de un campo
function limpiarErrorCampo(campoId) {
    const campo = document.getElementById(campoId);
    campo.classList.remove('is-invalid');
    campo.classList.add('is-valid');
    
    const errorDiv = campo.parentElement.querySelector('.invalid-feedback');
    if (errorDiv) {
        errorDiv.remove();
    }
}

// Mostrar fuerza de la contraseña
function mostrarFuerzaPassword(password) {
    const passwordInput = document.getElementById('password');
    let fuerzaDiv = document.getElementById('passwordStrength');
    
    if (!fuerzaDiv) {
        fuerzaDiv = document.createElement('div');
        fuerzaDiv.id = 'passwordStrength';
        fuerzaDiv.className = 'mt-2';
        passwordInput.parentElement.appendChild(fuerzaDiv);
    }
    
    if (!password) {
        fuerzaDiv.innerHTML = '';
        return;
    }
    
    let fuerza = 0;
    let mensaje = '';
    let color = '';
    
    // Criterios de fuerza
    if (password.length >= 8) fuerza++;
    if (/[a-z]/.test(password)) fuerza++;
    if (/[A-Z]/.test(password)) fuerza++;
    if (/\d/.test(password)) fuerza++;
    if (/[@$!%*?&]/.test(password)) fuerza++;
    
    // Determinar mensaje y color
    if (fuerza <= 2) {
        mensaje = 'Débil';
        color = 'danger';
    } else if (fuerza <= 3) {
        mensaje = 'Media';
        color = 'warning';
    } else if (fuerza <= 4) {
        mensaje = 'Buena';
        color = 'info';
    } else {
        mensaje = 'Fuerte';
        color = 'success';
    }
    
    fuerzaDiv.innerHTML = `
        <small class="text-${color}">
            <i class="bi bi-shield-fill-check me-1"></i>
            Seguridad: <strong>${mensaje}</strong>
        </small>
        <div class="progress mt-1" style="height: 5px;">
            <div class="progress-bar bg-${color}" style="width: ${(fuerza / 5) * 100}%"></div>
        </div>
    `;
}

// Manejar envío del formulario
document.getElementById('registroForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const alertContainer = document.getElementById('alertContainer');
    
    // Obtener valores
    const nombres = document.getElementById('nombres').value.trim();
    const apellidos = document.getElementById('apellidos').value.trim();
    const celular = document.getElementById('celular').value.trim();
    const correo = document.getElementById('correo').value.trim();
    const numeroDocumento = document.getElementById('numeroDocumento').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const tipoConductor = document.getElementById('tipoConductor').value;
    
    // Validar todos los campos
    let errores = [];
    
    if (!validarCampo('nombres', nombres)) errores.push('Nombres inválidos');
    if (!validarCampo('apellidos', apellidos)) errores.push('Apellidos inválidos');
    if (!validarCampo('celular', celular)) errores.push('Celular inválido');
    if (!validarCampo('correo', correo)) errores.push('Correo inválido');
    if (!validarCampo('cedula', numeroDocumento)) errores.push('Cédula inválida');
    if (!validarCampo('password', password)) errores.push('Contraseña insegura');
    
    if (password !== confirmPassword) {
        errores.push('Las contraseñas no coinciden');
        mostrarErrorCampo('confirmPassword', 'Las contraseñas no coinciden');
    }
    
    // Mostrar errores si existen
    if (errores.length > 0) {
        mostrarAlerta('danger', 'Por favor corrige los siguientes errores:<br>• ' + errores.join('<br>• '));
        return;
    }
    
    // Obtener subtipo según el tipo de conductor
    let subtipoConductor = '';
    
    if (tipoConductor === 'carretera') {
        subtipoConductor = document.getElementById('subtipoCarreteraSelect').value;
        if (!subtipoConductor) {
            mostrarAlerta('danger', 'Debe seleccionar un subtipo para Carretera');
            return;
        }
    } else if (tipoConductor === 'furgones') {
        subtipoConductor = document.getElementById('subtipoFurgonesSelect').value;
        if (!subtipoConductor) {
            mostrarAlerta('danger', 'Debe seleccionar un subtipo para Furgones');
            return;
        }
    }
    
    // Preparar datos
    const formData = {
        nombres,
        apellidos,
        celular,
        correo,
        tipo_documento: document.getElementById('tipoDocumento').value,
        numero_documento: numeroDocumento,
        password,
        tipo_conductor: tipoConductor,
        subtipo_conductor: subtipoConductor
    };
    
    try {
        // Mostrar loading
        const submitBtn = document.querySelector('.btn-christmas');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Registrando...';
        submitBtn.disabled = true;
        
        const response = await fetch('/api/usuarios/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            mostrarAlerta('success', '¡Registro exitoso! Redirigiendo al login...');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        } else {
            mostrarAlerta('danger', result.error || 'Error al registrar usuario');
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
        
    } catch (error) {
        console.error('Error:', error);
        mostrarAlerta('danger', 'Error de conexión con el servidor. Verifica que el servidor esté corriendo.');
        
        // Restaurar botón
        const submitBtn = document.querySelector('.btn-christmas');
        submitBtn.innerHTML = '<i class="bi bi-person-plus-fill me-2"></i>Registrarse';
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
        <div class="alert ${alertClass} d-flex align-items-start" role="alert">
            <i class="bi bi-${icon} me-2 mt-1"></i>
            <div>${mensaje}</div>
        </div>
    `;
    
    // Scroll to alert
    alertContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    // Auto-hide después de 8 segundos para mensajes de error y warning
    if (tipo === 'danger' || tipo === 'warning') {
        setTimeout(() => {
            alertContainer.innerHTML = '';
        }, 8000);
    }
}