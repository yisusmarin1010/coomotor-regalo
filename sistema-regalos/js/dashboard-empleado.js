// ============================================
// DASHBOARD EMPLEADO AVANZADO - SISTEMA REGALOS NAVIDEÑOS
// ============================================

let usuarioActual = null;
let hijosRegistrados = [];
let postulaciones = [];
let notificaciones = [];
let estadisticasEnTiempoReal = {};

// Inicializar dashboard con funcionalidades avanzadas
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔵 Inicializando dashboard empleado...');
    verificarAutenticacion();
    // cargarEstadisticas(); // Temporalmente deshabilitado
    cargarHijos();
    inicializarNotificaciones();
    inicializarAnimaciones();
    configurarEventListeners();
    // iniciarActualizacionTiempoReal(); // Temporalmente deshabilitado
    
    // Mostrar mensaje de bienvenida personalizado
    // mostrarBienvenida(); // Temporalmente deshabilitado
    
    console.log('✅ Dashboard inicializado');
});

// Mostrar bienvenida personalizada
function mostrarBienvenida() {
    const hora = new Date().getHours();
    let saludo = '';
    let emoji = '';
    
    if (hora < 12) {
        saludo = 'Buenos días';
        emoji = '🌅';
    } else if (hora < 18) {
        saludo = 'Buenas tardes';
        emoji = '☀️';
    } else {
        saludo = 'Buenas noches';
        emoji = '🌙';
    }
    
    setTimeout(() => {
        mostrarNotificacion('info', `${emoji} ${saludo}, ${usuarioActual?.nombres || 'Usuario'}! Bienvenido al sistema de regalos navideños 🎄`, 4000);
    }, 1000);
}

// Configurar event listeners avanzados
function configurarEventListeners() {
    // Los botones de cerrar sesión se manejan en auth-global.js
    // No es necesario agregar listeners adicionales aquí
    
    // Botón de registrar hijo con animación
    const btnRegistrarHijo = document.getElementById('btnRegistrarHijo');
    if (btnRegistrarHijo) {
        btnRegistrarHijo.addEventListener('click', function() {
            console.log('🖱️ Click en btnRegistrarHijo');
            mostrarModalRegistroHijo();
        });
    } else {
        console.error('❌ btnRegistrarHijo no encontrado');
    }
    
    // Botón de hacer postulación
    const btnHacerPostulacion = document.getElementById('btnHacerPostulacion');
    if (btnHacerPostulacion) {
        btnHacerPostulacion.addEventListener('click', function() {
            console.log('🖱️ Click en btnHacerPostulacion');
            mostrarModalPostulacion();
        });
    } else {
        console.error('❌ btnHacerPostulacion no encontrado');
    }
    
    // Actualizar estadísticas cada 30 segundos - DESHABILITADO TEMPORALMENTE
    // setInterval(cargarEstadisticas, 30000);
}

// Inicializar animaciones
function inicializarAnimaciones() {
    // Animación de entrada para las tarjetas
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    });
    
    document.querySelectorAll('.fade-in').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'all 0.6s ease';
        observer.observe(el);
    });
}

// Sistema de notificaciones en tiempo real
function inicializarNotificaciones() {
    // Crear contenedor de notificaciones si no existe
    if (!document.getElementById('notificationsContainer')) {
        const container = document.createElement('div');
        container.id = 'notificationsContainer';
        container.className = 'position-fixed top-0 end-0 p-3';
        container.style.zIndex = '9999';
        
        // Asegurarse de que body existe antes de agregar
        if (document.body) {
            document.body.appendChild(container);
        } else {
            console.error('❌ document.body no está disponible aún');
        }
    }
}

// Verificar autenticación con validación avanzada
function verificarAutenticacion() {
    const token = localStorage.getItem('coomotor_token');
    const userData = localStorage.getItem('coomotor_user');
    
    if (!token || !userData) {
        mostrarNotificacion('warning', 'Sesión expirada. Redirigiendo al login...', 2000);
        setTimeout(() => {
            window.location.href = '../auth/login.html';
        }, 2000);
        return;
    }
    
    try {
        usuarioActual = JSON.parse(userData);
        
        // Verificar que sea empleado
        if (usuarioActual.rol === 'admin') {
            mostrarNotificacion('info', 'Redirigiendo al panel de administrador...', 2000);
            setTimeout(() => {
                window.location.href = 'admin.html';
            }, 2000);
            return;
        }
        
        // Mostrar información del usuario con animación
        const userInfo = document.getElementById('userInfo');
        if (userInfo) {
            userInfo.innerHTML = `
                <div class="user-info-animated">
                    <i class="bi bi-person-circle me-2"></i>
                    <span>${usuarioActual.nombres} ${usuarioActual.apellidos}</span>
                    <small class="text-muted ms-2">(${usuarioActual.tipo_conductor})</small>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error al parsear datos de usuario:', error);
        window.location.href = '../auth/login.html';
    }
}

// Cargar estadísticas con animaciones
async function cargarEstadisticas() {
    try {
        const response = await fetch('/api/empleados/estadisticas', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('coomotor_token')}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                const stats = result.data;
                
                // Animar contadores
                animarContador('totalHijos', stats.totalHijos || 0);
                animarContador('totalPostulaciones', stats.totalPostulaciones || 0);
                animarContador('postulacionesAprobadas', stats.postulacionesAprobadas || 0);
                animarContador('regalosEntregados', stats.regalosEntregados || 0);
                
                // Actualizar estadísticas globales
                estadisticasEnTiempoReal = stats;
                
                // Mostrar progreso
                actualizarBarrasProgreso(stats);
            }
        }
    } catch (error) {
        console.error('Error al cargar estadísticas:', error);
        mostrarNotificacion('error', 'Error al cargar estadísticas');
    }
}

// Animar contadores
function animarContador(elementId, valorFinal) {
    const elemento = document.getElementById(elementId);
    if (!elemento) return;
    
    const valorActual = parseInt(elemento.textContent) || 0;
    const incremento = Math.ceil((valorFinal - valorActual) / 20);
    let contador = valorActual;
    
    const intervalo = setInterval(() => {
        contador += incremento;
        if (contador >= valorFinal) {
            contador = valorFinal;
            clearInterval(intervalo);
        }
        elemento.textContent = contador;
    }, 50);
}

// Actualizar barras de progreso
function actualizarBarrasProgreso(stats) {
    const totalHijos = stats.totalHijos || 0;
    const postulaciones = stats.totalPostulaciones || 0;
    const aprobadas = stats.postulacionesAprobadas || 0;
    const entregados = stats.regalosEntregados || 0;
    
    // Progreso de postulaciones
    const progresoPostulaciones = totalHijos > 0 ? (postulaciones / totalHijos) * 100 : 0;
    actualizarBarra('progresoPostulaciones', progresoPostulaciones);
    
    // Progreso de aprobaciones
    const progresoAprobaciones = postulaciones > 0 ? (aprobadas / postulaciones) * 100 : 0;
    actualizarBarra('progresoAprobaciones', progresoAprobaciones);
    
    // Progreso de entregas
    const progresoEntregas = aprobadas > 0 ? (entregados / aprobadas) * 100 : 0;
    actualizarBarra('progresoEntregas', progresoEntregas);
}

// Actualizar barra de progreso individual
function actualizarBarra(elementId, porcentaje) {
    const barra = document.getElementById(elementId);
    if (barra) {
        barra.style.width = `${porcentaje}%`;
        barra.setAttribute('aria-valuenow', porcentaje);
    }
}

// Cargar hijos con funcionalidades avanzadas
async function cargarHijos() {
    try {
        const response = await fetch('/api/hijos', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('coomotor_token')}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                hijosRegistrados = result.data;
                mostrarHijos();
                actualizarResumenHijos();
            }
        }
    } catch (error) {
        console.error('Error al cargar hijos:', error);
        mostrarNotificacion('error', 'Error al cargar información de hijos');
    }
}

// Mostrar hijos con diseño mejorado
function mostrarHijos() {
    const container = document.getElementById('hijosContainer');
    
    if (hijosRegistrados.length === 0) {
        container.innerHTML = `
            <div class="empty-state text-center py-5">
                <div class="empty-icon mb-3">
                    <i class="bi bi-person-plus" style="font-size: 4rem; color: #6c757d;"></i>
                </div>
                <h4 class="text-muted">No tienes hijos registrados</h4>
                <p class="text-muted mb-4">Registra a tus hijos para poder postularlos a los regalos navideños</p>
                <button class="btn btn-christmas btn-lg" onclick="mostrarModalRegistroHijo()">
                    <i class="bi bi-plus-circle me-2"></i>Registrar Primer Hijo
                </button>
            </div>
        `;
        actualizarResumenHijos();
        return;
    }
    
    let html = '<div class="row">';
    
    hijosRegistrados.forEach((hijo, index) => {
        const edad = calcularEdad(hijo.fecha_nacimiento);
        const tienePostulacion = hijo.postulacion_id ? true : false;
        const estadoPostulacion = hijo.estado_postulacion || 'sin_postular';
        
        // Determinar color y estado
        let badgeClass = 'bg-secondary';
        let estadoTexto = 'Sin postular';
        let iconoEstado = 'circle';
        
        switch (estadoPostulacion) {
            case 'pendiente':
                badgeClass = 'bg-warning';
                estadoTexto = 'Pendiente';
                iconoEstado = 'clock';
                break;
            case 'aprobada':
                badgeClass = 'bg-success';
                estadoTexto = 'Aprobada';
                iconoEstado = 'check-circle';
                break;
            case 'regalo_comprado':
                badgeClass = 'bg-info';
                estadoTexto = 'Regalo Comprado';
                iconoEstado = 'bag-check';
                break;
            case 'entregado':
                badgeClass = 'bg-primary';
                estadoTexto = 'Entregado';
                iconoEstado = 'gift';
                break;
            case 'rechazada':
                badgeClass = 'bg-danger';
                estadoTexto = 'Rechazada';
                iconoEstado = 'x-circle';
                break;
        }
        
        html += `
            <div class="col-md-6 col-lg-4 mb-4">
                <div class="hijo-card fade-in" style="animation-delay: ${index * 0.1}s">
                    <div class="hijo-header">
                        <div class="hijo-avatar">
                            <i class="bi bi-person-circle"></i>
                        </div>
                        <div class="hijo-info-header">
                            <h5 class="mb-1">${hijo.nombres} ${hijo.apellidos}</h5>
                            <span class="edad-badge">${edad} años</span>
                        </div>
                    </div>
                    
                    <div class="hijo-details">
                        <div class="detail-item">
                            <i class="bi bi-calendar3"></i>
                            <span>${formatearFecha(hijo.fecha_nacimiento)}</span>
                        </div>
                        <div class="detail-item">
                            <i class="bi bi-card-text"></i>
                            <span>${hijo.tipo_documento}: ${hijo.numero_documento}</span>
                        </div>
                    </div>
                    
                    <div class="hijo-status">
                        <span class="badge ${badgeClass}">
                            <i class="bi bi-${iconoEstado} me-1"></i>${estadoTexto}
                        </span>
                    </div>
                    
                    <div class="hijo-actions">
                        ${!tienePostulacion ? 
                            `<button class="btn btn-christmas btn-sm" onclick="postularHijo(${hijo.id})">
                                <i class="bi bi-gift me-1"></i>Postular
                            </button>` :
                            estadoPostulacion === 'pendiente' ?
                            `<button class="btn btn-outline-warning btn-sm" disabled>
                                <i class="bi bi-clock me-1"></i>En Revisión
                            </button>` :
                            `<button class="btn btn-outline-success btn-sm" onclick="verDetallesPostulacion(${hijo.postulacion_id})">
                                <i class="bi bi-eye me-1"></i>Ver Detalles
                            </button>`
                        }
                        <button class="btn btn-outline-secondary btn-sm" onclick="editarHijo(${hijo.id})" title="Editar información">
                            <i class="bi bi-pencil"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
    
    // Actualizar resumen
    actualizarResumenHijos();
    
    // Reinicializar animaciones
    setTimeout(inicializarAnimaciones, 100);
}

// Modal de registro de hijo mejorado
function mostrarModalRegistroHijo() {
    const modal = `
        <div class="modal fade" id="modalRegistroHijo" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-christmas text-white">
                        <h5 class="modal-title">
                            <i class="bi bi-person-plus-fill me-2"></i>
                            Registrar Nuevo Hijo
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="progress mb-4">
                            <div class="progress-bar bg-christmas" role="progressbar" style="width: 33%" id="progressRegistro"></div>
                        </div>
                        
                        <form id="formRegistroHijo">
                            <div class="step-content" id="step1">
                                <h6 class="text-christmas mb-3">
                                    <i class="bi bi-1-circle me-2"></i>Información Personal
                                </h6>
                                <div class="row">
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">Nombres *</label>
                                        <input type="text" class="form-control" id="hijosNombres" required>
                                        <div class="form-text">Nombres completos del menor</div>
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">Apellidos *</label>
                                        <input type="text" class="form-control" id="hijosApellidos" required>
                                        <div class="form-text">Apellidos completos del menor</div>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Fecha de Nacimiento *</label>
                                    <input type="date" class="form-control" id="hijosFechaNacimiento" required onchange="validarEdad()">
                                    <div class="form-text" id="edadTexto"></div>
                                </div>
                            </div>
                            
                            <div class="step-content d-none" id="step2">
                                <h6 class="text-christmas mb-3">
                                    <i class="bi bi-2-circle me-2"></i>Documentación
                                </h6>
                                <div class="row">
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">Tipo de Documento *</label>
                                        <select class="form-select" id="hijosTipoDocumento" required>
                                            <option value="">Seleccionar...</option>
                                            <option value="registro_civil">Registro Civil</option>
                                            <option value="tarjeta_identidad">Tarjeta de Identidad</option>
                                            <option value="cedula">Cédula de Ciudadanía</option>
                                        </select>
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">Número de Documento *</label>
                                        <input type="text" class="form-control" id="hijosNumeroDocumento" required>
                                        <div class="form-text">Sin puntos ni espacios</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="step-content d-none" id="step3">
                                <h6 class="text-christmas mb-3">
                                    <i class="bi bi-3-circle me-2"></i>Confirmación
                                </h6>
                                <div class="confirmation-card">
                                    <div id="datosConfirmacion"></div>
                                </div>
                                <div class="alert alert-info">
                                    <i class="bi bi-info-circle me-2"></i>
                                    <strong>Importante:</strong> Solo se pueden registrar hijos menores de 12 años para el programa de regalos navideños.
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" id="btnAnterior" onclick="anteriorPaso()" style="display: none;">
                            <i class="bi bi-arrow-left me-2"></i>Anterior
                        </button>
                        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-christmas" id="btnSiguiente" onclick="siguientePaso()">
                            Siguiente<i class="bi bi-arrow-right ms-2"></i>
                        </button>
                        <button type="button" class="btn btn-christmas d-none" id="btnRegistrar" onclick="registrarHijo()">
                            <i class="bi bi-save me-2"></i>Registrar Hijo
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modalsContainer').innerHTML = modal;
    const modalElement = new bootstrap.Modal(document.getElementById('modalRegistroHijo'));
    modalElement.show();
    
    // Inicializar paso actual
    window.pasoActual = 1;
}

// Navegación entre pasos del modal
let pasoActual = 1;

function siguientePaso() {
    console.log('🔵 siguientePaso() llamada, pasoActual:', pasoActual);
    
    if (pasoActual === 1) {
        // Validar paso 1
        const nombres = document.getElementById('hijosNombres').value.trim();
        const apellidos = document.getElementById('hijosApellidos').value.trim();
        const fechaNacimiento = document.getElementById('hijosFechaNacimiento').value;
        
        console.log('📝 Datos paso 1:', { nombres, apellidos, fechaNacimiento });
        
        if (!nombres || !apellidos || !fechaNacimiento) {
            console.log('⚠️ Campos incompletos');
            mostrarNotificacion('warning', 'Por favor completa todos los campos obligatorios');
            return;
        }
        
        const edad = calcularEdad(fechaNacimiento);
        console.log('👶 Edad calculada:', edad);
        
        if (edad > 12) {
            console.log('❌ Edad mayor a 12 años');
            mostrarNotificacion('error', 'Solo se pueden registrar hijos menores de 12 años');
            return;
        }
        
        console.log('✅ Validación paso 1 exitosa, avanzando a paso 2');
        pasoActual = 2;
        mostrarPaso(2);
    } else if (pasoActual === 2) {
        // Validar paso 2
        const tipoDocumento = document.getElementById('hijosTipoDocumento').value;
        const numeroDocumento = document.getElementById('hijosNumeroDocumento').value.trim();
        
        console.log('📝 Datos paso 2:', { tipoDocumento, numeroDocumento });
        
        if (!tipoDocumento || !numeroDocumento) {
            console.log('⚠️ Campos incompletos');
            mostrarNotificacion('warning', 'Por favor completa la información del documento');
            return;
        }
        
        console.log('✅ Validación paso 2 exitosa, avanzando a paso 3');
        pasoActual = 3;
        mostrarPaso(3);
        mostrarConfirmacion();
    }
}

function anteriorPaso() {
    if (pasoActual > 1) {
        pasoActual--;
        mostrarPaso(pasoActual);
    }
}

function mostrarPaso(paso) {
    // Ocultar todos los pasos
    document.querySelectorAll('.step-content').forEach(el => el.classList.add('d-none'));
    
    // Mostrar paso actual
    document.getElementById(`step${paso}`).classList.remove('d-none');
    
    // Actualizar progreso
    const progreso = (paso / 3) * 100;
    document.getElementById('progressRegistro').style.width = `${progreso}%`;
    
    // Actualizar botones
    const btnAnterior = document.getElementById('btnAnterior');
    const btnSiguiente = document.getElementById('btnSiguiente');
    const btnRegistrar = document.getElementById('btnRegistrar');
    
    if (paso === 1) {
        btnAnterior.style.display = 'none';
        btnSiguiente.classList.remove('d-none');
        btnRegistrar.classList.add('d-none');
    } else if (paso === 2) {
        btnAnterior.style.display = 'inline-block';
        btnSiguiente.classList.remove('d-none');
        btnRegistrar.classList.add('d-none');
    } else if (paso === 3) {
        btnAnterior.style.display = 'inline-block';
        btnSiguiente.classList.add('d-none');
        btnRegistrar.classList.remove('d-none');
    }
}

function mostrarConfirmacion() {
    const nombres = document.getElementById('hijosNombres').value;
    const apellidos = document.getElementById('hijosApellidos').value;
    const fechaNacimiento = document.getElementById('hijosFechaNacimiento').value;
    const tipoDocumento = document.getElementById('hijosTipoDocumento').value;
    const numeroDocumento = document.getElementById('hijosNumeroDocumento').value;
    const edad = calcularEdad(fechaNacimiento);
    
    const tipoDocTexto = {
        'registro_civil': 'Registro Civil',
        'tarjeta_identidad': 'Tarjeta de Identidad',
        'cedula': 'Cédula de Ciudadanía'
    };
    
    document.getElementById('datosConfirmacion').innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <strong>Nombres:</strong><br>
                <span class="text-muted">${nombres}</span>
            </div>
            <div class="col-md-6">
                <strong>Apellidos:</strong><br>
                <span class="text-muted">${apellidos}</span>
            </div>
        </div>
        <hr>
        <div class="row">
            <div class="col-md-6">
                <strong>Fecha de Nacimiento:</strong><br>
                <span class="text-muted">${formatearFecha(fechaNacimiento)} (${edad} años)</span>
            </div>
            <div class="col-md-6">
                <strong>Documento:</strong><br>
                <span class="text-muted">${tipoDocTexto[tipoDocumento]}: ${numeroDocumento}</span>
            </div>
        </div>
    `;
}

function validarEdad() {
    const fechaNacimiento = document.getElementById('hijosFechaNacimiento').value;
    const edadTexto = document.getElementById('edadTexto');
    
    if (fechaNacimiento) {
        const edad = calcularEdad(fechaNacimiento);
        if (edad > 12) {
            edadTexto.innerHTML = `<span class="text-danger">⚠️ ${edad} años - Solo se permiten menores de 12 años</span>`;
        } else {
            edadTexto.innerHTML = `<span class="text-success">✅ ${edad} años - Edad válida</span>`;
        }
    }
}

// Registrar hijo con validaciones avanzadas
async function registrarHijo() {
    const nombres = document.getElementById('hijosNombres').value.trim();
    const apellidos = document.getElementById('hijosApellidos').value.trim();
    const tipoDocumento = document.getElementById('hijosTipoDocumento').value;
    const numeroDocumento = document.getElementById('hijosNumeroDocumento').value.trim();
    const fechaNacimiento = document.getElementById('hijosFechaNacimiento').value;
    
    // Validaciones finales
    const edad = calcularEdad(fechaNacimiento);
    if (edad > 12) {
        mostrarNotificacion('error', 'Solo se pueden registrar hijos menores de 12 años');
        return;
    }
    
    // Mostrar loading
    const btnRegistrar = document.getElementById('btnRegistrar');
    const textoOriginal = btnRegistrar.innerHTML;
    btnRegistrar.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Registrando...';
    btnRegistrar.disabled = true;
    
    try {
        const response = await fetch('/api/hijos', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('coomotor_token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nombres,
                apellidos,
                tipo_documento: tipoDocumento,
                numero_documento: numeroDocumento,
                fecha_nacimiento: fechaNacimiento
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            mostrarNotificacion('success', `¡${nombres} ha sido registrado exitosamente! 🎉`, 4000);
            bootstrap.Modal.getInstance(document.getElementById('modalRegistroHijo')).hide();
            cargarHijos();
            cargarEstadisticas();
            
            // Mostrar sugerencia de postulación
            setTimeout(() => {
                mostrarNotificacion('info', '💡 Ahora puedes postular a tu hijo para los regalos navideños', 3000);
            }, 2000);
        } else {
            mostrarNotificacion('error', result.error || 'Error al registrar hijo');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('error', 'Error de conexión. Inténtalo de nuevo.');
    } finally {
        btnRegistrar.innerHTML = textoOriginal;
        btnRegistrar.disabled = false;
    }
}

// Modal de postulación mejorado
function mostrarModalPostulacion() {
    if (hijosRegistrados.length === 0) {
        mostrarNotificacion('warning', 'Primero debes registrar al menos un hijo');
        return;
    }
    
    const hijosDisponibles = hijosRegistrados.filter(hijo => !hijo.postulacion_id);
    
    if (hijosDisponibles.length === 0) {
        mostrarNotificacion('info', 'Todos tus hijos ya han sido postulados');
        return;
    }
    
    let opcionesHijos = '';
    hijosDisponibles.forEach(hijo => {
        const edad = calcularEdad(hijo.fecha_nacimiento);
        opcionesHijos += `
            <div class="hijo-option" onclick="seleccionarHijo(${hijo.id})">
                <div class="hijo-option-content">
                    <div class="hijo-option-info">
                        <h6>${hijo.nombres} ${hijo.apellidos}</h6>
                        <small class="text-muted">${edad} años • ${hijo.tipo_documento}: ${hijo.numero_documento}</small>
                    </div>
                    <div class="hijo-option-check">
                        <i class="bi bi-circle" id="check-${hijo.id}"></i>
                    </div>
                </div>
            </div>
        `;
    });
    
    const modal = `
        <div class="modal fade" id="modalPostulacion" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header bg-christmas text-white">
                        <h5 class="modal-title">
                            <i class="bi bi-gift me-2"></i>
                            Postular para Regalo Navideño
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-info">
                            <i class="bi bi-info-circle me-2"></i>
                            Selecciona el hijo que deseas postular para recibir un regalo navideño
                        </div>
                        
                        <div class="hijos-selection">
                            ${opcionesHijos}
                        </div>
                        
                        <div class="mt-3" id="hijoSeleccionado" style="display: none;">
                            <div class="alert alert-success">
                                <i class="bi bi-check-circle me-2"></i>
                                <span id="nombreHijoSeleccionado"></span> ha sido seleccionado
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-christmas" id="btnConfirmarPostulacion" onclick="confirmarPostulacion()" disabled>
                            <i class="bi bi-send me-2"></i>Enviar Postulación
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modalsContainer').innerHTML = modal;
    const modalElement = new bootstrap.Modal(document.getElementById('modalPostulacion'));
    modalElement.show();
}

let hijoSeleccionadoId = null;

function seleccionarHijo(hijoId) {
    // Limpiar selección anterior
    document.querySelectorAll('.hijo-option').forEach(el => el.classList.remove('selected'));
    document.querySelectorAll('.hijo-option-check i').forEach(el => {
        el.className = 'bi bi-circle';
    });
    
    // Seleccionar nuevo hijo
    const opcion = document.querySelector(`[onclick="seleccionarHijo(${hijoId})"]`);
    opcion.classList.add('selected');
    document.getElementById(`check-${hijoId}`).className = 'bi bi-check-circle-fill text-success';
    
    // Actualizar variables
    hijoSeleccionadoId = hijoId;
    const hijo = hijosRegistrados.find(h => h.id === hijoId);
    
    // Mostrar confirmación
    document.getElementById('hijoSeleccionado').style.display = 'block';
    document.getElementById('nombreHijoSeleccionado').textContent = `${hijo.nombres} ${hijo.apellidos}`;
    document.getElementById('btnConfirmarPostulacion').disabled = false;
}

async function confirmarPostulacion() {
    if (!hijoSeleccionadoId) return;
    
    const btnConfirmar = document.getElementById('btnConfirmarPostulacion');
    const textoOriginal = btnConfirmar.innerHTML;
    btnConfirmar.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Enviando...';
    btnConfirmar.disabled = true;
    
    try {
        const response = await fetch('/api/postulaciones', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('coomotor_token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                hijo_id: hijoSeleccionadoId
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            const hijo = hijosRegistrados.find(h => h.id === hijoSeleccionadoId);
            mostrarNotificacion('success', `¡Postulación enviada exitosamente para ${hijo.nombres}! 🎁`, 4000);
            bootstrap.Modal.getInstance(document.getElementById('modalPostulacion')).hide();
            cargarHijos();
            cargarEstadisticas();
            
            // Mostrar información adicional
            setTimeout(() => {
                mostrarNotificacion('info', 'Tu postulación será revisada por el equipo administrativo', 3000);
            }, 2000);
        } else {
            mostrarNotificacion('error', result.error || 'Error al enviar postulación');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('error', 'Error de conexión. Inténtalo de nuevo.');
    } finally {
        btnConfirmar.innerHTML = textoOriginal;
        btnConfirmar.disabled = false;
    }
}

// Postular hijo individual (desde la tarjeta)
async function postularHijo(hijoId) {
    const hijo = hijosRegistrados.find(h => h.id === hijoId);
    
    if (confirm(`¿Deseas postular a ${hijo.nombres} ${hijo.apellidos} para recibir un regalo navideño?`)) {
        try {
            const response = await fetch('/api/postulaciones', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('coomotor_token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    hijo_id: hijoId
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                mostrarNotificacion('success', `¡${hijo.nombres} ha sido postulado exitosamente! 🎁`, 4000);
                cargarHijos();
                cargarEstadisticas();
            } else {
                mostrarNotificacion('error', result.error || 'Error al realizar postulación');
            }
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion('error', 'Error de conexión');
        }
    }
}

// Sistema de notificaciones mejorado
function mostrarNotificacion(tipo, mensaje, duracion = 3000) {
    let container = document.getElementById('notificationsContainer');
    
    // Si el contenedor no existe, crearlo
    if (!container) {
        container = document.createElement('div');
        container.id = 'notificationsContainer';
        container.className = 'position-fixed top-0 end-0 p-3';
        container.style.zIndex = '9999';
        
        if (document.body) {
            document.body.appendChild(container);
        } else {
            console.error('❌ No se puede mostrar notificación: document.body no existe');
            return;
        }
    }
    
    const id = Date.now();
    
    const tipoClases = {
        'success': 'alert-success',
        'error': 'alert-danger',
        'warning': 'alert-warning',
        'info': 'alert-info'
    };
    
    const iconos = {
        'success': 'check-circle-fill',
        'error': 'exclamation-triangle-fill',
        'warning': 'exclamation-triangle-fill',
        'info': 'info-circle-fill'
    };
    
    const notificacion = document.createElement('div');
    notificacion.id = `notification-${id}`;
    notificacion.className = 'notification-item';
    notificacion.innerHTML = `
        <div class="alert ${tipoClases[tipo]} d-flex align-items-center alert-dismissible fade show shadow-sm" role="alert">
            <i class="bi bi-${iconos[tipo]} me-2"></i>
            <div class="flex-grow-1">${mensaje}</div>
            <button type="button" class="btn-close" onclick="cerrarNotificacion('${id}')"></button>
        </div>
    `;
    
    container.appendChild(notificacion);
    
    // Auto-cerrar
    setTimeout(() => {
        cerrarNotificacion(id);
    }, duracion);
}

function cerrarNotificacion(id) {
    const notificacion = document.getElementById(`notification-${id}`);
    if (notificacion) {
        notificacion.style.opacity = '0';
        notificacion.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notificacion.parentElement) {
                notificacion.remove();
            }
        }, 300);
    }
}

// Actualización en tiempo real
function iniciarActualizacionTiempoReal() {
    // Actualizar cada 2 minutos
    setInterval(async () => {
        await cargarEstadisticas();
        
        // Verificar nuevas notificaciones
        verificarNotificacionesNuevas();
    }, 120000);
}

function verificarNotificacionesNuevas() {
    // Simular verificación de notificaciones
    const probabilidad = Math.random();
    
    if (probabilidad < 0.1) { // 10% de probabilidad
        const mensajes = [
            '🎄 Recordatorio: El período de postulaciones termina pronto',
            '📢 Nueva información disponible sobre la entrega de regalos',
            '🎁 Se han aprobado nuevas postulaciones',
            '⭐ ¡Gracias por participar en nuestro programa navideño!'
        ];
        
        const mensaje = mensajes[Math.floor(Math.random() * mensajes.length)];
        mostrarNotificacion('info', mensaje, 5000);
    }
}

// Funciones de utilidad mejoradas
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

function formatearFecha(fecha) {
    return new Date(fecha).toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function actualizarResumenHijos() {
    const totalHijos = hijosRegistrados.length;
    const postulados = hijosRegistrados.filter(h => h.postulacion_id).length;
    const aprobados = hijosRegistrados.filter(h => h.estado_postulacion === 'aprobada' || h.estado_postulacion === 'entregado').length;
    
    const resumenContainer = document.getElementById('resumenHijos');
    if (resumenContainer) {
        resumenContainer.innerHTML = `
            <div class="col-md-4">
                <div class="resumen-item">
                    <span class="resumen-numero">${totalHijos}</span>
                    <span class="resumen-texto">Total Hijos</span>
                </div>
            </div>
            <div class="col-md-4">
                <div class="resumen-item">
                    <span class="resumen-numero">${postulados}</span>
                    <span class="resumen-texto">Postulados</span>
                </div>
            </div>
            <div class="col-md-4">
                <div class="resumen-item">
                    <span class="resumen-numero">${aprobados}</span>
                    <span class="resumen-texto">Aprobados</span>
                </div>
            </div>
        `;
    }
}

// Editar hijo
function editarHijo(hijoId) {
    const hijo = hijosRegistrados.find(h => h.id === hijoId);
    if (!hijo) return;
    
    const modal = `
        <div class="modal fade" id="modalEditarHijo" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header bg-warning text-dark">
                        <h5 class="modal-title">
                            <i class="bi bi-pencil-square me-2"></i>
                            Editar Información de ${hijo.nombres}
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="formEditarHijo">
                            <input type="hidden" id="editHijoId" value="${hijo.id}">
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Nombres *</label>
                                    <input type="text" class="form-control" id="editHijosNombres" value="${hijo.nombres}" required>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Apellidos *</label>
                                    <input type="text" class="form-control" id="editHijosApellidos" value="${hijo.apellidos}" required>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Tipo de Documento *</label>
                                    <select class="form-select" id="editHijosTipoDocumento" required>
                                        <option value="registro_civil" ${hijo.tipo_documento === 'registro_civil' ? 'selected' : ''}>Registro Civil</option>
                                        <option value="tarjeta_identidad" ${hijo.tipo_documento === 'tarjeta_identidad' ? 'selected' : ''}>Tarjeta de Identidad</option>
                                        <option value="cedula" ${hijo.tipo_documento === 'cedula' ? 'selected' : ''}>Cédula de Ciudadanía</option>
                                    </select>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Número de Documento *</label>
                                    <input type="text" class="form-control" id="editHijosNumeroDocumento" value="${hijo.numero_documento}" required>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Fecha de Nacimiento *</label>
                                <input type="date" class="form-control" id="editHijosFechaNacimiento" value="${hijo.fecha_nacimiento.split('T')[0]}" required>
                            </div>
                            <div class="alert alert-warning">
                                <i class="bi bi-exclamation-triangle me-2"></i>
                                Los cambios en la información pueden afectar el estado de las postulaciones existentes.
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-warning" onclick="guardarCambiosHijo()">
                            <i class="bi bi-save me-2"></i>Guardar Cambios
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modalsContainer').innerHTML = modal;
    new bootstrap.Modal(document.getElementById('modalEditarHijo')).show();
}

// Guardar cambios del hijo
async function guardarCambiosHijo() {
    const hijoId = document.getElementById('editHijoId').value;
    const nombres = document.getElementById('editHijosNombres').value.trim();
    const apellidos = document.getElementById('editHijosApellidos').value.trim();
    const tipoDocumento = document.getElementById('editHijosTipoDocumento').value;
    const numeroDocumento = document.getElementById('editHijosNumeroDocumento').value.trim();
    const fechaNacimiento = document.getElementById('editHijosFechaNacimiento').value;
    
    if (!nombres || !apellidos || !tipoDocumento || !numeroDocumento || !fechaNacimiento) {
        mostrarNotificacion('warning', 'Todos los campos son obligatorios');
        return;
    }
    
    const edad = calcularEdad(fechaNacimiento);
    if (edad > 12) {
        mostrarNotificacion('error', 'Solo se permiten hijos menores de 12 años');
        return;
    }
    
    const btnGuardar = document.querySelector('#modalEditarHijo .btn-warning');
    const textoOriginal = btnGuardar.innerHTML;
    btnGuardar.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Guardando...';
    btnGuardar.disabled = true;
    
    try {
        const response = await fetch(`/api/hijos/${hijoId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('coomotor_token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nombres,
                apellidos,
                tipo_documento: tipoDocumento,
                numero_documento: numeroDocumento,
                fecha_nacimiento: fechaNacimiento
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            mostrarNotificacion('success', `Información de ${nombres} actualizada exitosamente`, 4000);
            bootstrap.Modal.getInstance(document.getElementById('modalEditarHijo')).hide();
            cargarHijos();
        } else {
            mostrarNotificacion('error', result.error || 'Error al actualizar información');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('error', 'Error de conexión');
    } finally {
        btnGuardar.innerHTML = textoOriginal;
        btnGuardar.disabled = false;
    }
}

// Ver detalles de postulación
function verDetallesPostulacion(postulacionId) {
    // Buscar la postulación en los datos de hijos
    const hijo = hijosRegistrados.find(h => h.postulacion_id === postulacionId);
    if (!hijo) return;
    
    const estadoInfo = {
        'pendiente': {
            color: 'warning',
            icon: 'clock',
            titulo: 'En Revisión',
            descripcion: 'Tu postulación está siendo revisada por el equipo administrativo.'
        },
        'aprobada': {
            color: 'success',
            icon: 'check-circle',
            titulo: 'Aprobada',
            descripcion: 'Tu postulación ha sido aprobada. El regalo será preparado pronto.'
        },
        'regalo_comprado': {
            color: 'info',
            icon: 'bag-check',
            titulo: 'Regalo Preparado',
            descripcion: 'El regalo ha sido comprado y está listo para entrega.'
        },
        'entregado': {
            color: 'primary',
            icon: 'gift',
            titulo: 'Entregado',
            descripcion: '¡El regalo ha sido entregado exitosamente!'
        },
        'rechazada': {
            color: 'danger',
            icon: 'x-circle',
            titulo: 'Rechazada',
            descripcion: 'La postulación no pudo ser aprobada en esta ocasión.'
        }
    };
    
    const estado = estadoInfo[hijo.estado_postulacion] || estadoInfo['pendiente'];
    
    const modal = `
        <div class="modal fade" id="modalDetallesPostulacion" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-${estado.color} text-white">
                        <h5 class="modal-title">
                            <i class="bi bi-${estado.icon} me-2"></i>
                            Detalles de Postulación - ${hijo.nombres} ${hijo.apellidos}
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6">
                                <div class="card border-0 bg-light">
                                    <div class="card-body">
                                        <h6 class="card-title text-primary">
                                            <i class="bi bi-person me-2"></i>Información del Niño
                                        </h6>
                                        <p><strong>Nombre:</strong> ${hijo.nombres} ${hijo.apellidos}</p>
                                        <p><strong>Edad:</strong> ${calcularEdad(hijo.fecha_nacimiento)} años</p>
                                        <p><strong>Documento:</strong> ${hijo.tipo_documento}: ${hijo.numero_documento}</p>
                                        <p><strong>Fecha de Nacimiento:</strong> ${formatearFecha(hijo.fecha_nacimiento)}</p>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="card border-0 bg-light">
                                    <div class="card-body">
                                        <h6 class="card-title text-primary">
                                            <i class="bi bi-clipboard-check me-2"></i>Estado de Postulación
                                        </h6>
                                        <div class="text-center mb-3">
                                            <i class="bi bi-${estado.icon}" style="font-size: 3rem; color: var(--bs-${estado.color});"></i>
                                        </div>
                                        <h5 class="text-center text-${estado.color}">${estado.titulo}</h5>
                                        <p class="text-center">${estado.descripcion}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="mt-4">
                            <h6 class="text-primary">
                                <i class="bi bi-clock-history me-2"></i>Cronología de la Postulación
                            </h6>
                            <div class="timeline">
                                <div class="timeline-item">
                                    <div class="d-flex justify-content-between">
                                        <div>
                                            <h6>Postulación Enviada</h6>
                                            <small class="text-muted">La postulación fue enviada exitosamente</small>
                                        </div>
                                        <span class="badge bg-success">Completado</span>
                                    </div>
                                </div>
                                <div class="timeline-item">
                                    <div class="d-flex justify-content-between">
                                        <div>
                                            <h6>En Revisión</h6>
                                            <small class="text-muted">El equipo administrativo está revisando</small>
                                        </div>
                                        <span class="badge bg-${hijo.estado_postulacion === 'pendiente' ? 'warning' : 'success'}">
                                            ${hijo.estado_postulacion === 'pendiente' ? 'En Proceso' : 'Completado'}
                                        </span>
                                    </div>
                                </div>
                                ${hijo.estado_postulacion !== 'pendiente' ? `
                                <div class="timeline-item">
                                    <div class="d-flex justify-content-between">
                                        <div>
                                            <h6>Decisión Tomada</h6>
                                            <small class="text-muted">La postulación ha sido ${hijo.estado_postulacion}</small>
                                        </div>
                                        <span class="badge bg-${estado.color}">Completado</span>
                                    </div>
                                </div>
                                ` : ''}
                            </div>
                        </div>
                        
                        ${hijo.observaciones_admin ? `
                        <div class="alert alert-info mt-3">
                            <h6><i class="bi bi-chat-left-text me-2"></i>Observaciones del Administrador:</h6>
                            <p class="mb-0">${hijo.observaciones_admin}</p>
                        </div>
                        ` : ''}
                        
                        <div class="alert alert-light mt-3">
                            <h6><i class="bi bi-info-circle me-2"></i>Información Importante:</h6>
                            <ul class="mb-0">
                                <li>Los regalos se entregarán entre el 21 y 24 de diciembre</li>
                                <li>Recibirás una notificación cuando el estado cambie</li>
                                <li>Para dudas, contacta al equipo de soporte</li>
                            </ul>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        <a href="../contacto.html" class="btn btn-primary">
                            <i class="bi bi-envelope me-2"></i>Contactar Soporte
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modalsContainer').innerHTML = modal;
    new bootstrap.Modal(document.getElementById('modalDetallesPostulacion')).show();
}

// Mostrar perfil del usuario
function mostrarPerfil() {
    if (!usuarioActual) return;
    
    const modal = `
        <div class="modal fade" id="modalPerfil" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title">
                            <i class="bi bi-person-circle me-2"></i>
                            Mi Perfil
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="text-center mb-4">
                            <div class="profile-avatar mb-3">
                                <i class="bi bi-person-circle" style="font-size: 5rem; color: var(--coomotor-primary);"></i>
                            </div>
                            <h4>${usuarioActual.nombres} ${usuarioActual.apellidos}</h4>
                            <span class="badge bg-success">${usuarioActual.rol.toUpperCase()}</span>
                        </div>
                        
                        <div class="row">
                            <div class="col-md-6">
                                <h6 class="text-primary">Información Personal</h6>
                                <p><strong>Nombres:</strong> ${usuarioActual.nombres}</p>
                                <p><strong>Apellidos:</strong> ${usuarioActual.apellidos}</p>
                                <p><strong>Correo:</strong> ${usuarioActual.correo}</p>
                                <p><strong>Celular:</strong> ${usuarioActual.celular}</p>
                            </div>
                            <div class="col-md-6">
                                <h6 class="text-primary">Información Laboral</h6>
                                <p><strong>Tipo de Conductor:</strong> ${usuarioActual.tipo_conductor}</p>
                                ${usuarioActual.subtipo_conductor ? `<p><strong>Subtipo:</strong> ${usuarioActual.subtipo_conductor}</p>` : ''}
                                <p><strong>Estado:</strong> <span class="badge bg-success">${usuarioActual.estado}</span></p>
                                <p><strong>Registro:</strong> ${formatearFecha(usuarioActual.fecha_registro)}</p>
                            </div>
                        </div>
                        
                        <div class="alert alert-info">
                            <i class="bi bi-info-circle me-2"></i>
                            Para actualizar tu información personal, contacta al departamento de recursos humanos.
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        <a href="../contacto.html" class="btn btn-primary">
                            <i class="bi bi-envelope me-2"></i>Contactar RRHH
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modalsContainer').innerHTML = modal;
    new bootstrap.Modal(document.getElementById('modalPerfil')).show();
}


// ============================================
// GESTIÓN DE MENSAJES Y RESPUESTAS
// ============================================

// Cargar mensajes del usuario
async function cargarMisMensajes() {
    try {
        console.log('🔵 Cargando mensajes del usuario...');
        
        const response = await fetch('/api/mis-contactos', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('coomotor_token')}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('📥 Mensajes recibidos:', result);
            
            if (result.success) {
                // Log detallado de cada mensaje
                result.data.forEach((msg, idx) => {
                    console.log(`📧 Mensaje ${idx + 1}:`, {
                        id: msg.id,
                        asunto: msg.asunto,
                        estado: msg.estado,
                        tieneRespuesta: msg.respuesta ? 'SÍ' : 'NO',
                        respuesta: msg.respuesta,
                        fecha_respuesta: msg.fecha_respuesta
                    });
                });
                
                mostrarMensajes(result.data);
            } else {
                throw new Error(result.message);
            }
        } else {
            throw new Error('Error al cargar mensajes');
        }
    } catch (error) {
        console.error('❌ Error al cargar mensajes:', error);
        document.getElementById('mensajesContainer').innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle me-2"></i>
                Error al cargar tus mensajes. Por favor, intenta de nuevo.
            </div>
        `;
    }
}

// Mostrar mensajes en el dashboard
function mostrarMensajes(mensajes) {
    const container = document.getElementById('mensajesContainer');
    
    if (mensajes.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="bi bi-chat-dots"></i>
                </div>
                <h4>No tienes mensajes</h4>
                <p>Aún no has enviado ningún mensaje de contacto</p>
                <a href="../contacto.html" class="btn btn-christmas btn-lg">
                    <i class="bi bi-plus-circle me-2"></i>Enviar Primer Mensaje
                </a>
            </div>
        `;
        return;
    }
    
    let html = '<div class="row">';
    
    mensajes.forEach((mensaje, index) => {
        const tieneRespuesta = mensaje.respuesta && mensaje.respuesta.trim() !== '';
        const estadoBadge = obtenerBadgeEstadoMensaje(mensaje.estado);
        const tipoIcono = obtenerIconoTipoContacto(mensaje.tipo_contacto);
        const prioridadBadge = obtenerBadgePrioridad(mensaje.prioridad);
        
        html += `
            <div class="col-md-6 mb-3">
                <div class="card h-100 ${tieneRespuesta ? 'border-success' : 'border-warning'}" style="border-width: 2px;">
                    <div class="card-header bg-light">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <h6 class="mb-1">
                                    ${tipoIcono} ${mensaje.asunto}
                                </h6>
                                <small class="text-muted">
                                    <i class="bi bi-calendar me-1"></i>
                                    ${formatearFecha(mensaje.fecha_creacion)}
                                </small>
                            </div>
                            <div class="text-end">
                                ${estadoBadge}
                                ${prioridadBadge}
                            </div>
                        </div>
                    </div>
                    <div class="card-body">
                        <h6 class="text-muted mb-2">Tu mensaje:</h6>
                        <p class="mb-3" style="font-size: 0.9rem;">
                            ${mensaje.mensaje.length > 150 ? mensaje.mensaje.substring(0, 150) + '...' : mensaje.mensaje}
                        </p>
                        
                        ${tieneRespuesta ? `
                            <div class="alert alert-success mb-0">
                                <h6 class="alert-heading">
                                    <i class="bi bi-reply-fill me-2"></i>
                                    Respuesta del Administrador:
                                </h6>
                                <hr>
                                <p class="mb-2" style="font-size: 0.9rem;">${mensaje.respuesta}</p>
                                <small class="text-muted">
                                    <i class="bi bi-clock me-1"></i>
                                    Respondido el ${formatearFecha(mensaje.fecha_respuesta)}
                                </small>
                            </div>
                        ` : `
                            <div class="alert alert-warning mb-0">
                                <i class="bi bi-hourglass-split me-2"></i>
                                <strong>Pendiente de respuesta</strong>
                                <br>
                                <small>Nuestro equipo revisará tu mensaje pronto</small>
                            </div>
                        `}
                    </div>
                    <div class="card-footer bg-light">
                        <button class="btn btn-sm btn-outline-primary" onclick="verDetalleMensaje(${index})">
                            <i class="bi bi-eye me-1"></i>
                            Ver Detalles Completos
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
    
    // Guardar mensajes en variable global para el modal
    window.mensajesUsuario = mensajes;
}

// Ver detalle completo del mensaje
function verDetalleMensaje(index) {
    const mensaje = window.mensajesUsuario[index];
    const tieneRespuesta = mensaje.respuesta && mensaje.respuesta.trim() !== '';
    const estadoBadge = obtenerBadgeEstadoMensaje(mensaje.estado);
    const tipoIcono = obtenerIconoTipoContacto(mensaje.tipo_contacto);
    const prioridadBadge = obtenerBadgePrioridad(mensaje.prioridad);
    
    const modalHTML = `
        <div class="modal fade" id="modalDetalleMensaje" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            ${tipoIcono} Detalle del Mensaje
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <strong>Asunto:</strong>
                                <p>${mensaje.asunto}</p>
                            </div>
                            <div class="col-md-6">
                                <strong>Estado:</strong>
                                <p>${estadoBadge} ${prioridadBadge}</p>
                            </div>
                        </div>
                        
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <strong>Fecha de Envío:</strong>
                                <p>${formatearFecha(mensaje.fecha_creacion)}</p>
                            </div>
                            <div class="col-md-6">
                                <strong>Tipo:</strong>
                                <p>${mensaje.tipo_contacto}</p>
                            </div>
                        </div>
                        
                        <hr>
                        
                        <div class="mb-3">
                            <h6 class="text-muted">Tu Mensaje:</h6>
                            <div class="p-3 bg-light rounded">
                                ${mensaje.mensaje}
                            </div>
                        </div>
                        
                        ${tieneRespuesta ? `
                            <hr>
                            <div class="alert alert-success">
                                <h6 class="alert-heading">
                                    <i class="bi bi-reply-fill me-2"></i>
                                    Respuesta del Administrador:
                                </h6>
                                <hr>
                                <p class="mb-2">${mensaje.respuesta}</p>
                                <small class="text-muted">
                                    <i class="bi bi-clock me-1"></i>
                                    Respondido el ${formatearFecha(mensaje.fecha_respuesta)}
                                </small>
                            </div>
                        ` : `
                            <div class="alert alert-warning">
                                <i class="bi bi-hourglass-split me-2"></i>
                                <strong>Pendiente de respuesta</strong>
                                <br>
                                <small>Nuestro equipo revisará tu mensaje y te responderá pronto.</small>
                            </div>
                        `}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remover modal anterior si existe
    const modalAnterior = document.getElementById('modalDetalleMensaje');
    if (modalAnterior) {
        modalAnterior.remove();
    }
    
    // Agregar nuevo modal
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('modalDetalleMensaje'));
    modal.show();
}

// Obtener badge de estado del mensaje
function obtenerBadgeEstadoMensaje(estado) {
    const badges = {
        'pendiente': '<span class="badge bg-warning">Pendiente</span>',
        'en_proceso': '<span class="badge bg-info">En Proceso</span>',
        'resuelto': '<span class="badge bg-success">Resuelto</span>',
        'cerrado': '<span class="badge bg-secondary">Cerrado</span>'
    };
    return badges[estado] || '<span class="badge bg-secondary">Desconocido</span>';
}

// Obtener icono según tipo de contacto
function obtenerIconoTipoContacto(tipo) {
    const iconos = {
        'queja': '🚨',
        'sugerencia': '💡',
        'consulta': '❓',
        'felicitacion': '🎉',
        'problema_tecnico': '🔧',
        'otro': '📋'
    };
    return iconos[tipo] || '📋';
}

// Obtener badge de prioridad
function obtenerBadgePrioridad(prioridad) {
    const badges = {
        'urgente': '<span class="badge bg-danger">🔴 Urgente</span>',
        'alta': '<span class="badge bg-warning">🟠 Alta</span>',
        'media': '<span class="badge bg-info">🟡 Media</span>',
        'baja': '<span class="badge bg-success">🟢 Baja</span>'
    };
    return badges[prioridad] || '<span class="badge bg-secondary">Media</span>';
}

// Cargar mensajes al iniciar el dashboard
document.addEventListener('DOMContentLoaded', function() {
    // Esperar un poco para que se cargue el usuario
    setTimeout(() => {
        if (usuarioActual) {
            cargarMisMensajes();
        }
    }, 1000);
});
