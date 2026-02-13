// ============================================
// JAVASCRIPT PARA LOGIN - SISTEMA REGALOS
// ============================================

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
            mostrarAlerta('danger', result.error || 'Credenciales incorrectas');
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