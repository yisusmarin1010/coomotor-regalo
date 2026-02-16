// ============================================
// DASHBOARD ADMIN - SISTEMA REGALOS NAVIDEÑOS
// ============================================

let usuarioActual = null;
let seccionActual = 'inicio';

// Inicializar dashboard
document.addEventListener('DOMContentLoaded', function() {
    verificarAutenticacion();
    cargarEstadisticas();
    mostrarSeccion('inicio');
});

// Verificar autenticación
function verificarAutenticacion() {
    const token = localStorage.getItem('coomotor_token');
    const userData = localStorage.getItem('coomotor_user');
    
    if (!token || !userData) {
        window.location.href = '../auth/login.html';
        return;
    }
    
    usuarioActual = JSON.parse(userData);
    
    // Verificar que sea admin
    if (usuarioActual.rol !== 'admin') {
        window.location.href = 'empleado.html';
        return;
    }
    
    // Mostrar información del usuario
    document.getElementById('userInfo').innerHTML = `
        <i class="bi bi-person-circle me-1"></i>
        ${usuarioActual.nombres} ${usuarioActual.apellidos} (Admin)
    `;
}

// Cargar estadísticas generales
async function cargarEstadisticas() {
    try {
        const response = await fetch('/api/admin/estadisticas', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('coomotor_token')}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                const stats = result.data;
                document.getElementById('totalEmpleados').textContent = stats.totalEmpleados || 0;
                document.getElementById('totalHijos').textContent = stats.totalHijos || 0;
                document.getElementById('postulacionesPendientes').textContent = stats.postulacionesPendientes || 0;
                document.getElementById('postulacionesAprobadas').textContent = stats.postulacionesAprobadas || 0;
                document.getElementById('regalosComprados').textContent = stats.regalosComprados || 0;
                document.getElementById('regalosEntregados').textContent = stats.regalosEntregados || 0;
            }
        }
        
        // Cargar también estadísticas de contactos
        await cargarEstadisticasContactosGenerales();
        
    } catch (error) {
        console.error('Error al cargar estadísticas:', error);
    }
}

// Cargar estadísticas de contactos para el dashboard principal
async function cargarEstadisticasContactosGenerales() {
    try {
        const response = await fetch('/api/contactos?estadisticas=true', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('coomotor_token')}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.success && result.estadisticas) {
                const stats = result.estadisticas;
                document.getElementById('totalContactos').textContent = stats.total || 0;
                document.getElementById('contactosPendientes').textContent = stats.pendientes || 0;
            }
        }
    } catch (error) {
        console.error('Error al cargar estadísticas de contactos:', error);
    }
}

// Mostrar sección específica
function mostrarSeccion(seccion) {
    seccionActual = seccion;
    const container = document.getElementById('seccionesContainer');
    
    // Ocultar la sección de usuarios si existe
    const seccionUsuarios = document.getElementById('seccionUsuarios');
    if (seccionUsuarios) {
        seccionUsuarios.style.display = 'none';
    }
    
    switch(seccion) {
        case 'inicio':
            mostrarInicio();
            break;
        case 'postulaciones':
            mostrarPostulaciones();
            break;
        case 'empleados':
            mostrarEmpleados();
            break;
        case 'documentos':
            mostrarDocumentos();
            break;
        case 'regalos':
            mostrarRegalos();
            break;
        case 'reportes':
            mostrarReportes();
            break;
        case 'contactos':
            mostrarContactos();
            break;
        case 'usuarios':
            // Ocultar el container principal y mostrar la sección de usuarios
            container.innerHTML = '';
            if (seccionUsuarios) {
                seccionUsuarios.style.display = 'block';
                cargarUsuarios();
            }
            break;
        case 'chat':
            mostrarChat();
            break;
        default:
            mostrarInicio();
    }
}

// Mostrar sección de inicio
function mostrarInicio() {
    const container = document.getElementById('seccionesContainer');
    container.innerHTML = `
        <div class="action-card">
            <h3 class="action-title">
                <i class="bi bi-house-fill me-2"></i>
                Panel de Control Principal
            </h3>
            <p>Bienvenido al sistema administrativo de regalos navideños COOMOTOR 2024</p>
            
            <div class="row mt-4">
                <div class="col-md-6">
                    <div class="info-card">
                        <h5><i class="bi bi-calendar-event me-2"></i>Fechas Importantes</h5>
                        <ul class="list-unstyled mb-0">
                            <li class="mb-2"><i class="bi bi-circle-fill text-success me-2" style="font-size: 0.5rem;"></i><strong>Registro:</strong> Hasta el 10 de Diciembre</li>
                            <li class="mb-2"><i class="bi bi-circle-fill text-warning me-2" style="font-size: 0.5rem;"></i><strong>Postulaciones:</strong> Hasta el 15 de Diciembre</li>
                            <li class="mb-2"><i class="bi bi-circle-fill text-info me-2" style="font-size: 0.5rem;"></i><strong>Revisión:</strong> 16 - 20 de Diciembre</li>
                            <li class="mb-0"><i class="bi bi-circle-fill text-danger me-2" style="font-size: 0.5rem;"></i><strong>Entrega:</strong> 21 - 24 de Diciembre</li>
                        </ul>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="info-card" style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-left: 4px solid #3b82f6;">
                        <h5><i class="bi bi-graph-up-arrow me-2 text-primary"></i>Resumen del Sistema</h5>
                        <div class="row text-center mt-3">
                            <div class="col-6 mb-3">
                                <div style="background: white; padding: 1rem; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                                    <div style="font-size: 2rem; font-weight: 800; color: #059669;" id="totalUsuariosInicio">
                                        <div class="spinner-border spinner-border-sm text-success" role="status"></div>
                                    </div>
                                    <div style="font-size: 0.75rem; color: #6b7280; font-weight: 600; text-transform: uppercase;">Usuarios</div>
                                </div>
                            </div>
                            <div class="col-6 mb-3">
                                <div style="background: white; padding: 1rem; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                                    <div style="font-size: 2rem; font-weight: 800; color: #f59e0b;" id="totalPostulacionesInicio">
                                        <div class="spinner-border spinner-border-sm text-warning" role="status"></div>
                                    </div>
                                    <div style="font-size: 0.75rem; color: #6b7280; font-weight: 600; text-transform: uppercase;">Postulaciones</div>
                                </div>
                            </div>
                            <div class="col-6">
                                <div style="background: white; padding: 1rem; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                                    <div style="font-size: 2rem; font-weight: 800; color: #3b82f6;" id="pendientesInicio">
                                        <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
                                    </div>
                                    <div style="font-size: 0.75rem; color: #6b7280; font-weight: 600; text-transform: uppercase;">Pendientes</div>
                                </div>
                            </div>
                            <div class="col-6">
                                <div style="background: white; padding: 1rem; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                                    <div style="font-size: 2rem; font-weight: 800; color: #10b981;" id="aprobadasInicio">
                                        <div class="spinner-border spinner-border-sm text-success" role="status"></div>
                                    </div>
                                    <div style="font-size: 0.75rem; color: #6b7280; font-weight: 600; text-transform: uppercase;">Aprobadas</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="row mt-3">
                <div class="col-12">
                    <div class="alert alert-info mb-0" style="background: linear-gradient(135deg, #e0f2fe 0%, #dbeafe 100%); border: none; border-left: 4px solid #3b82f6;">
                        <div class="d-flex align-items-center">
                            <i class="bi bi-lightbulb-fill text-primary me-3" style="font-size: 1.5rem;"></i>
                            <div>
                                <h6 class="mb-1" style="color: #1e40af; font-weight: 600;">Consejo del Sistema</h6>
                                <p class="mb-0" style="color: #1e3a8a; font-size: 0.85rem;">
                                    Revisa diariamente las postulaciones pendientes para mantener el proceso ágil. 
                                    Recuerda solicitar documentos faltantes a tiempo para evitar retrasos en las aprobaciones.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Cargar estadísticas para el resumen
    cargarEstadisticasInicio();
}

// Cargar estadísticas para la sección de inicio
async function cargarEstadisticasInicio() {
    try {
        // Cargar total de usuarios
        const usuariosResponse = await fetch('/api/admin/empleados', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('coomotor_token')}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (usuariosResponse.ok) {
            const usuariosResult = await usuariosResponse.json();
            const totalUsuarios = usuariosResult.data?.length || 0;
            document.getElementById('totalUsuariosInicio').textContent = totalUsuarios;
        }
        
        // Cargar postulaciones
        const postulacionesResponse = await fetch('/api/admin/postulaciones', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('coomotor_token')}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (postulacionesResponse.ok) {
            const postulacionesResult = await postulacionesResponse.json();
            const postulaciones = postulacionesResult.data || [];
            
            document.getElementById('totalPostulacionesInicio').textContent = postulaciones.length;
            
            const pendientes = postulaciones.filter(p => 
                p.estado_postulacion === 'pendiente' || 
                p.estado_postulacion === 'documentos_solicitados' ||
                p.estado_postulacion === 'documentos_recibidos'
            ).length;
            
            const aprobadas = postulaciones.filter(p => 
                p.estado_postulacion === 'aprobada' || 
                p.estado_postulacion === 'entregado'
            ).length;
            
            document.getElementById('pendientesInicio').textContent = pendientes;
            document.getElementById('aprobadasInicio').textContent = aprobadas;
        }
    } catch (error) {
        console.error('Error al cargar estadísticas de inicio:', error);
        // Mostrar 0 en caso de error
        document.getElementById('totalUsuariosInicio').textContent = '0';
        document.getElementById('totalPostulacionesInicio').textContent = '0';
        document.getElementById('pendientesInicio').textContent = '0';
        document.getElementById('aprobadasInicio').textContent = '0';
    }
}

// Mostrar sección de postulaciones
async function mostrarPostulaciones() {
    const container = document.getElementById('seccionesContainer');
    container.innerHTML = `
        <div class="action-card">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h3 class="action-title mb-0">
                    <i class="bi bi-list-check me-2"></i>
                    Gestión de Postulaciones
                </h3>
                <div>
                    <button class="btn btn-outline-primary" onclick="filtrarPostulaciones('todas')">Todas</button>
                    <button class="btn btn-outline-warning" onclick="filtrarPostulaciones('pendiente')">Pendientes</button>
                    <button class="btn btn-outline-success" onclick="filtrarPostulaciones('aprobada')">Aprobadas</button>
                </div>
            </div>
            <div class="alert alert-info" style="font-size: 0.75rem; padding: 0.75rem;">
                <i class="bi bi-info-circle me-2"></i>
                <strong>Nota:</strong> Las postulaciones rechazadas se ocultan automáticamente del panel.
            </div>
            <div id="postulacionesContainer">
                <div class="d-flex justify-content-center p-4">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Cargando postulaciones...</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    cargarPostulaciones();
}

// Cargar postulaciones
async function cargarPostulaciones(filtro = 'todas') {
    try {
        const response = await fetch(`/api/admin/postulaciones?filtro=${filtro}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('coomotor_token')}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                // Filtrar postulaciones rechazadas - no mostrarlas en el panel
                const postulacionesFiltradas = result.data.filter(p => p.estado_postulacion !== 'rechazada');
                mostrarTablaPostulaciones(postulacionesFiltradas);
            }
        }
    } catch (error) {
        console.error('Error al cargar postulaciones:', error);
        document.getElementById('postulacionesContainer').innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle me-2"></i>
                Error al cargar las postulaciones
            </div>
        `;
    }
}

// Mostrar tabla de postulaciones
function mostrarTablaPostulaciones(postulaciones) {
    const container = document.getElementById('postulacionesContainer');
    
    if (postulaciones.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-inbox"></i>
                <h4>No hay postulaciones</h4>
                <p>No se encontraron postulaciones con los filtros aplicados</p>
            </div>
        `;
        return;
    }
    
    let html = `
        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>Empleado</th>
                        <th>Hijo</th>
                        <th>Edad</th>
                        <th>Fecha Postulación</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    postulaciones.forEach(postulacion => {
        const edad = calcularEdad(postulacion.fecha_nacimiento_hijo);
        const estadoBadge = obtenerBadgeEstado(postulacion.estado_postulacion);
        
        html += `
            <tr>
                <td>
                    <div>
                        <strong>${postulacion.empleado_nombres} ${postulacion.empleado_apellidos}</strong>
                        <br>
                        <small class="text-muted">${postulacion.tipo_conductor}</small>
                    </div>
                </td>
                <td>
                    <div>
                        <strong>${postulacion.hijo_nombres} ${postulacion.hijo_apellidos}</strong>
                        <br>
                        <small class="text-muted">${postulacion.tipo_documento}: ${postulacion.numero_documento}</small>
                    </div>
                </td>
                <td>${edad} años</td>
                <td>${formatearFecha(postulacion.fecha_postulacion)}</td>
                <td>${estadoBadge}</td>
                <td>
                    ${postulacion.estado_postulacion === 'pendiente' ? `
                        <button class="btn btn-sm btn-warning me-1" onclick="mostrarModalSolicitarDocumentos(${postulacion.id}, '${postulacion.hijo_nombres} ${postulacion.hijo_apellidos}')" title="Solicitar documentos">
                            <i class="bi bi-file-earmark-arrow-up"></i> Solicitar Docs
                        </button>
                        <button class="btn btn-sm btn-success me-1" onclick="aprobarPostulacion(${postulacion.id})">
                            <i class="bi bi-check"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="rechazarPostulacion(${postulacion.id})">
                            <i class="bi bi-x"></i>
                        </button>
                    ` : postulacion.estado_postulacion === 'documentos_solicitados' ? `
                        <button class="btn btn-sm btn-info me-1" disabled>
                            <i class="bi bi-hourglass-split"></i> Esperando Docs
                        </button>
                        <button class="btn btn-sm btn-outline-primary" onclick="verDetallePostulacion(${postulacion.id})">
                            <i class="bi bi-eye"></i>
                        </button>
                    ` : postulacion.estado_postulacion === 'documentos_recibidos' ? `
                        <button class="btn btn-sm btn-primary me-1" onclick="mostrarSeccion('documentos')">
                            <i class="bi bi-file-check"></i> Ver Docs
                        </button>
                        <button class="btn btn-sm btn-success me-1" onclick="aprobarPostulacion(${postulacion.id})">
                            <i class="bi bi-check"></i> Aprobar
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="rechazarPostulacion(${postulacion.id})">
                            <i class="bi bi-x"></i> Rechazar
                        </button>
                    ` : postulacion.estado_postulacion === 'aprobada' ? `
                        <button class="btn btn-sm btn-outline-primary me-1" onclick="verDetallePostulacion(${postulacion.id})">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-warning" onclick="eliminarAprobacion(${postulacion.id}, '${postulacion.hijo_nombres}')" title="Eliminar aprobación">
                            <i class="bi bi-trash"></i>
                        </button>
                    ` : `
                        <button class="btn btn-sm btn-outline-primary" onclick="verDetallePostulacion(${postulacion.id})">
                            <i class="bi bi-eye"></i>
                        </button>
                    `}
                </td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    container.innerHTML = html;
}

// Aprobar postulación
async function aprobarPostulacion(postulacionId) {
    if (!confirm('¿Está seguro de aprobar esta postulación?')) return;
    
    try {
        const response = await fetch(`/api/admin/postulaciones/${postulacionId}/aprobar`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('coomotor_token')}`,
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            mostrarAlerta('success', 'Postulación aprobada exitosamente');
            cargarPostulaciones();
            cargarEstadisticas();
        } else {
            mostrarAlerta('danger', result.error || 'Error al aprobar postulación');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarAlerta('danger', 'Error de conexión');
    }
}

// Rechazar postulación
async function rechazarPostulacion(postulacionId) {
    const motivo = prompt('Ingrese el motivo del rechazo (opcional):');
    
    try {
        const response = await fetch(`/api/admin/postulaciones/${postulacionId}/rechazar`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('coomotor_token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ motivo: motivo || '' })
        });
        
        const result = await response.json();
        
        if (result.success) {
            mostrarAlerta('success', 'Postulación rechazada');
            cargarPostulaciones();
            cargarEstadisticas();
        } else {
            mostrarAlerta('danger', result.error || 'Error al rechazar postulación');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarAlerta('danger', 'Error de conexión');
    }
}

// Ver detalle de postulación
async function verDetallePostulacion(postulacionId) {
    try {
        const response = await fetch(`/api/admin/postulaciones?filtro=todas`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('coomotor_token')}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                const postulacion = result.data.find(p => p.id === postulacionId);
                if (postulacion) {
                    mostrarModalDetallePostulacion(postulacion);
                }
            }
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarAlerta('danger', 'Error al cargar detalle');
    }
}

// Mostrar modal con detalle de postulación
function mostrarModalDetallePostulacion(postulacion) {
    const edad = calcularEdad(postulacion.fecha_nacimiento_hijo);
    const modalHTML = `
        <div class="modal fade" id="modalDetallePostulacion" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Detalle de Postulación</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6">
                                <h6 class="text-muted mb-3">Información del Empleado</h6>
                                <p><strong>Nombre:</strong> ${postulacion.empleado_nombres} ${postulacion.empleado_apellidos}</p>
                                <p><strong>Tipo:</strong> ${postulacion.tipo_conductor}</p>
                                ${postulacion.subtipo_conductor ? `<p><strong>Subtipo:</strong> ${postulacion.subtipo_conductor}</p>` : ''}
                            </div>
                            <div class="col-md-6">
                                <h6 class="text-muted mb-3">Información del Hijo</h6>
                                <p><strong>Nombre:</strong> ${postulacion.hijo_nombres} ${postulacion.hijo_apellidos}</p>
                                <p><strong>Edad:</strong> ${edad} años</p>
                                <p><strong>Documento:</strong> ${postulacion.tipo_documento}: ${postulacion.numero_documento}</p>
                            </div>
                        </div>
                        <hr>
                        <div class="row">
                            <div class="col-12">
                                <h6 class="text-muted mb-3">Estado de la Postulación</h6>
                                <p><strong>Estado:</strong> ${obtenerBadgeEstado(postulacion.estado_postulacion)}</p>
                                <p><strong>Fecha de Postulación:</strong> ${formatearFecha(postulacion.fecha_postulacion)}</p>
                                ${postulacion.fecha_aprobacion ? `<p><strong>Fecha de Aprobación:</strong> ${formatearFecha(postulacion.fecha_aprobacion)}</p>` : ''}
                                ${postulacion.fecha_revision ? `<p><strong>Fecha de Revisión:</strong> ${formatearFecha(postulacion.fecha_revision)}</p>` : ''}
                                ${postulacion.observaciones_admin ? `<p><strong>Observaciones:</strong> ${postulacion.observaciones_admin}</p>` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        ${postulacion.estado_postulacion === 'pendiente' ? `
                            <button type="button" class="btn btn-success" onclick="aprobarPostulacionDesdeModal(${postulacion.id})">
                                <i class="bi bi-check me-1"></i> Aprobar
                            </button>
                            <button type="button" class="btn btn-danger" onclick="rechazarPostulacionDesdeModal(${postulacion.id})">
                                <i class="bi bi-x me-1"></i> Rechazar
                            </button>
                        ` : ''}
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remover modal anterior si existe
    const modalAnterior = document.getElementById('modalDetallePostulacion');
    if (modalAnterior) {
        modalAnterior.remove();
    }
    
    // Agregar nuevo modal
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('modalDetallePostulacion'));
    modal.show();
}

// Aprobar desde modal
async function aprobarPostulacionDesdeModal(postulacionId) {
    await aprobarPostulacion(postulacionId);
    const modal = bootstrap.Modal.getInstance(document.getElementById('modalDetallePostulacion'));
    modal.hide();
}

// Rechazar desde modal
async function rechazarPostulacionDesdeModal(postulacionId) {
    await rechazarPostulacion(postulacionId);
    const modal = bootstrap.Modal.getInstance(document.getElementById('modalDetallePostulacion'));
    modal.hide();
}

// Mostrar empleados
async function mostrarEmpleados() {
    const container = document.getElementById('seccionesContainer');
    container.innerHTML = `
        <div class="action-card">
            <h3 class="action-title">
                <i class="bi bi-people-fill me-2"></i>
                Gestión de Empleados
            </h3>
            <div id="empleadosContainer">
                <div class="d-flex justify-content-center p-4">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Cargando empleados...</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    cargarEmpleados();
}

// Cargar empleados
async function cargarEmpleados() {
    try {
        const response = await fetch('/api/admin/empleados', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('coomotor_token')}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                mostrarTablaEmpleados(result.data);
            }
        }
    } catch (error) {
        console.error('Error al cargar empleados:', error);
    }
}

// Mostrar tabla de empleados
function mostrarTablaEmpleados(empleados) {
    const container = document.getElementById('empleadosContainer');
    
    if (empleados.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-people"></i>
                <h4>No hay empleados registrados</h4>
            </div>
        `;
        return;
    }
    
    let html = `
        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>Empleado</th>
                        <th>Documento</th>
                        <th>Contacto</th>
                        <th>Tipo Conductor</th>
                        <th>Hijos</th>
                        <th>Postulaciones</th>
                        <th>Registro</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    empleados.forEach(empleado => {
        html += `
            <tr>
                <td>
                    <strong>${empleado.nombres} ${empleado.apellidos}</strong>
                </td>
                <td>${empleado.tipo_documento}: ${empleado.numero_documento}</td>
                <td>
                    <div>
                        <small><i class="bi bi-envelope"></i> ${empleado.correo}</small><br>
                        <small><i class="bi bi-phone"></i> ${empleado.celular}</small>
                    </div>
                </td>
                <td>
                    <span class="badge bg-primary">${empleado.tipo_conductor}</span>
                    ${empleado.subtipo_conductor ? `<br><small>${empleado.subtipo_conductor}</small>` : ''}
                </td>
                <td class="text-center">${empleado.total_hijos || 0}</td>
                <td class="text-center">${empleado.total_postulaciones || 0}</td>
                <td>${formatearFecha(empleado.fecha_registro)}</td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    container.innerHTML = html;
}

// Funciones de utilidad
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
    return new Date(fecha).toLocaleDateString('es-CO');
}

function obtenerBadgeEstado(estado) {
    const badges = {
        'pendiente': '<span class="badge bg-warning">Pendiente</span>',
        'documentos_solicitados': '<span class="badge bg-info">Docs Solicitados</span>',
        'documentos_recibidos': '<span class="badge bg-primary">Docs Recibidos</span>',
        'aprobada': '<span class="badge bg-success">Aprobada</span>',
        'rechazada': '<span class="badge bg-danger">Rechazada</span>',
        'entregada': '<span class="badge bg-dark">Entregada</span>'
    };
    return badges[estado] || '<span class="badge bg-secondary">Desconocido</span>';
}

function filtrarPostulaciones(filtro) {
    cargarPostulaciones(filtro);
}

// ============================================
// REPORTES Y ANALYTICS
// ============================================

// Mostrar sección de reportes (redirige a página dedicada)
function mostrarReportes() {
    window.location.href = 'reportes.html';
}

// Mostrar sección de regalos (placeholder)
function mostrarRegalos() {
    const container = document.getElementById('seccionesContainer');
    container.innerHTML = `
        <div class="action-card">
            <h3 class="action-title">
                <i class="bi bi-gift me-2"></i>
                Gestión de Regalos
            </h3>
            <p>Funcionalidad en desarrollo...</p>
            <div class="alert alert-info mt-3">
                <i class="bi bi-info-circle me-2"></i>
                Esta sección estará disponible próximamente para gestionar el inventario y asignación de regalos.
            </div>
        </div>
    `;
}

// ============================================
// GESTIÓN DE DOCUMENTOS
// ============================================

// Mostrar sección de documentos
async function mostrarDocumentos() {
    const container = document.getElementById('seccionesContainer');
    
    const html = `
        <div class="action-card">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h3 class="action-title mb-0">
                    <i class="bi bi-file-earmark-check me-2"></i>
                    Gestión de Documentos
                </h3>
                <div class="d-flex gap-2">
                    <select class="form-select form-select-sm" style="width: 150px; font-size: 0.75rem;" id="filtroEstadoDocumento" onchange="filtrarDocumentos()">
                        <option value="">Todos los estados</option>
                        <option value="pendiente" selected>Pendientes</option>
                        <option value="aprobado">Aprobados</option>
                        <option value="rechazado">Rechazados</option>
                    </select>
                    <button class="btn btn-primary btn-sm" onclick="cargarDocumentosAdmin()">
                        <i class="bi bi-arrow-clockwise me-1"></i>
                        Actualizar
                    </button>
                </div>
            </div>
            
            <div class="alert alert-info" style="font-size: 0.75rem; padding: 0.75rem;">
                <i class="bi bi-info-circle me-2"></i>
                <strong>Gestión de Documentos:</strong> Revisa y aprueba/rechaza los documentos subidos por los conductores. Los documentos aprobados permitirán completar las postulaciones.
            </div>
            
            <div id="documentosAdminContainer">
                <div class="text-center py-4">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Cargando...</span>
                    </div>
                    <p class="mt-2" style="font-size: 0.75rem;">Cargando documentos...</p>
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
    
    // Cargar documentos pendientes por defecto
    cargarDocumentosAdmin({ estado: 'pendiente' });
}

// Filtrar documentos
function filtrarDocumentos() {
    const estado = document.getElementById('filtroEstadoDocumento').value;
    cargarDocumentosAdmin({ estado: estado || undefined });
}

// ============================================
// GESTIÓN DE CONTACTOS
// ============================================

// Mostrar sección de contactos
async function mostrarContactos() {
    const container = document.getElementById('seccionesContainer');
    
    const html = `
        <div class="section-header">
            <h2><i class="bi bi-chat-dots me-2"></i>Mensajes de Contacto</h2>
            <p>Gestiona quejas, sugerencias y consultas de los empleados</p>
        </div>
        
        <!-- Estadísticas de contactos -->
        <div class="row mb-4">
            <div class="col-md-3">
                <div class="stat-card warning">
                    <div class="stat-icon">📋</div>
                    <div class="stat-number" id="contactosPendientesDetalle">0</div>
                    <div class="stat-label">Pendientes</div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="stat-card info">
                    <div class="stat-icon">🔄</div>
                    <div class="stat-number" id="contactosEnProceso">0</div>
                    <div class="stat-label">En Proceso</div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="stat-card success">
                    <div class="stat-icon">✅</div>
                    <div class="stat-number" id="contactosResueltos">0</div>
                    <div class="stat-label">Resueltos</div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="stat-card">
                    <div class="stat-icon">📞</div>
                    <div class="stat-number" id="contactosHoy">0</div>
                    <div class="stat-label">Hoy</div>
                </div>
            </div>
        </div>
        
        <!-- Filtros -->
        <div class="card mb-4">
            <div class="card-body">
                <div class="row">
                    <div class="col-md-3">
                        <select class="form-select" id="filtroEstadoContacto" onchange="filtrarContactos()">
                            <option value="">Todos los estados</option>
                            <option value="pendiente">Pendientes</option>
                            <option value="en_proceso">En Proceso</option>
                            <option value="resuelto">Resueltos</option>
                            <option value="cerrado">Cerrados</option>
                        </select>
                    </div>
                    <div class="col-md-3">
                        <select class="form-select" id="filtroTipoContacto" onchange="filtrarContactos()">
                            <option value="">Todos los tipos</option>
                            <option value="queja">🚨 Quejas</option>
                            <option value="sugerencia">💡 Sugerencias</option>
                            <option value="consulta">❓ Consultas</option>
                            <option value="felicitacion">🎉 Felicitaciones</option>
                            <option value="problema_tecnico">🔧 Problemas Técnicos</option>
                            <option value="otro">📋 Otros</option>
                        </select>
                    </div>
                    <div class="col-md-3">
                        <select class="form-select" id="filtroPrioridadContacto" onchange="filtrarContactos()">
                            <option value="">Todas las prioridades</option>
                            <option value="urgente">🔴 Urgente</option>
                            <option value="alta">🟠 Alta</option>
                            <option value="media">🟡 Media</option>
                            <option value="baja">🟢 Baja</option>
                        </select>
                    </div>
                    <div class="col-md-3">
                        <button class="btn btn-primary" onclick="cargarContactos()">
                            <i class="bi bi-arrow-clockwise me-1"></i>
                            Actualizar
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Lista de contactos -->
        <div class="card">
            <div class="card-header">
                <h5 class="mb-0">
                    <i class="bi bi-list-ul me-2"></i>
                    Lista de Mensajes de Contacto
                </h5>
            </div>
            <div class="card-body">
                <div id="contactosContainer">
                    <div class="text-center">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Cargando...</span>
                        </div>
                        <p class="mt-2">Cargando mensajes de contacto...</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
    
    // Cargar datos
    await cargarEstadisticasContactos();
    await cargarContactos();
}

// Cargar estadísticas de contactos
async function cargarEstadisticasContactos() {
    try {
        const response = await fetch('/api/contactos?estadisticas=true', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('coomotor_token')}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.success && result.estadisticas) {
                const stats = result.estadisticas;
                document.getElementById('contactosPendientesDetalle').textContent = stats.pendientes || 0;
                document.getElementById('contactosEnProceso').textContent = stats.en_proceso || 0;
                document.getElementById('contactosResueltos').textContent = stats.resueltos || 0;
                document.getElementById('contactosHoy').textContent = stats.hoy || 0;
                
                // Actualizar también las estadísticas generales
                document.getElementById('totalContactos').textContent = stats.total || 0;
                document.getElementById('contactosPendientes').textContent = stats.pendientes || 0;
            }
        }
    } catch (error) {
        console.error('Error al cargar estadísticas de contactos:', error);
    }
}

// Cargar lista de contactos
async function cargarContactos(filtros = {}) {
    try {
        const params = new URLSearchParams();
        
        if (filtros.estado) params.append('estado', filtros.estado);
        if (filtros.tipo) params.append('tipo', filtros.tipo);
        if (filtros.prioridad) params.append('prioridad', filtros.prioridad);
        
        const response = await fetch(`/api/contactos?${params.toString()}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('coomotor_token')}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                // Guardar en variable global para acceso posterior
                window.contactosData = result.data;
                mostrarListaContactos(result.data);
            } else {
                throw new Error(result.message);
            }
        } else {
            throw new Error('Error al cargar contactos');
        }
    } catch (error) {
        console.error('Error al cargar contactos:', error);
        document.getElementById('contactosContainer').innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle me-2"></i>
                Error al cargar los mensajes de contacto: ${error.message}
            </div>
        `;
    }
}

// Mostrar lista de contactos
function mostrarListaContactos(contactos) {
    const container = document.getElementById('contactosContainer');
    
    if (!contactos || contactos.length === 0) {
        container.innerHTML = `
            <div class="text-center py-4">
                <i class="bi bi-inbox" style="font-size: 3rem; color: #6c757d;"></i>
                <h5 class="mt-3 text-muted">No hay mensajes de contacto</h5>
                <p class="text-muted">Los mensajes aparecerán aquí cuando los empleados envíen consultas.</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    contactos.forEach(contacto => {
        const prioridadClass = {
            'urgente': 'danger',
            'alta': 'warning',
            'media': 'info',
            'baja': 'success'
        }[contacto.prioridad] || 'secondary';
        
        const estadoClass = {
            'pendiente': 'warning',
            'en_proceso': 'info',
            'resuelto': 'success',
            'cerrado': 'secondary'
        }[contacto.estado] || 'secondary';
        
        const tipoIcon = {
            'queja': '🚨',
            'sugerencia': '💡',
            'consulta': '❓',
            'felicitacion': '🎉',
            'problema_tecnico': '🔧',
            'otro': '📋'
        }[contacto.tipo_contacto] || '📋';
        
        html += `
            <div class="card mb-3 contacto-card" data-id="${contacto.id}">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="mb-0">
                            ${tipoIcon} ${contacto.asunto}
                        </h6>
                        <small class="text-muted">
                            Por: ${contacto.nombres} ${contacto.apellidos} | 
                            ${formatearFecha(contacto.fecha_creacion)}
                        </small>
                    </div>
                    <div>
                        <span class="badge bg-${prioridadClass} me-2">${contacto.prioridad.toUpperCase()}</span>
                        <span class="badge bg-${estadoClass}">${contacto.estado.replace('_', ' ').toUpperCase()}</span>
                    </div>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-8">
                            <p class="mb-2"><strong>Mensaje:</strong></p>
                            <p class="text-muted">${contacto.mensaje}</p>
                            
                            <div class="mt-3">
                                <small class="text-muted">
                                    <i class="bi bi-person me-1"></i>
                                    ${contacto.nombres} ${contacto.apellidos} | 
                                    <i class="bi bi-envelope me-1"></i>
                                    ${contacto.email} | 
                                    <i class="bi bi-telephone me-1"></i>
                                    ${contacto.telefono}
                                </small>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="d-grid gap-2">
                                <button class="btn btn-primary btn-sm" onclick="verDetalleContacto(${contacto.id})">
                                    <i class="bi bi-eye me-1"></i>
                                    Ver Detalle
                                </button>
                                ${contacto.estado === 'pendiente' ? `
                                    <button class="btn btn-success btn-sm" onclick="cambiarEstadoContacto(${contacto.id}, 'en_proceso')">
                                        <i class="bi bi-play me-1"></i>
                                        Tomar Caso
                                    </button>
                                ` : ''}
                                ${contacto.estado === 'en_proceso' ? `
                                    <button class="btn btn-success btn-sm" onclick="cambiarEstadoContacto(${contacto.id}, 'resuelto')">
                                        <i class="bi bi-check me-1"></i>
                                        Marcar Resuelto
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Filtrar contactos
function filtrarContactos() {
    const estado = document.getElementById('filtroEstadoContacto').value;
    const tipo = document.getElementById('filtroTipoContacto').value;
    const prioridad = document.getElementById('filtroPrioridadContacto').value;
    
    const filtros = {};
    if (estado) filtros.estado = estado;
    if (tipo) filtros.tipo = tipo;
    if (prioridad) filtros.prioridad = prioridad;
    
    cargarContactos(filtros);
}

// Ver detalle de contacto
function verDetalleContacto(id) {
    // Implementar modal con detalle completo del contacto
    alert(`Ver detalle del contacto ${id} - Funcionalidad en desarrollo`);
}

// Cambiar estado de contacto con modal mejorado
async function cambiarEstadoContacto(id, nuevoEstado) {
    // Primero, obtener el contacto actual para ver si ya tiene respuesta
    let respuestaActual = '';
    
    try {
        // Buscar el contacto en la lista actual
        const contactoActual = window.contactosData?.find(c => c.id === id);
        if (contactoActual && contactoActual.respuesta) {
            respuestaActual = contactoActual.respuesta;
        }
    } catch (error) {
        console.log('No se pudo obtener respuesta actual:', error);
    }
    
    // Crear modal para respuesta
    const modalHTML = `
        <div class="modal fade" id="modalRespuestaContacto" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title">
                            <i class="bi bi-reply-fill me-2"></i>
                            ${respuestaActual ? 'Editar Respuesta' : 'Responder Mensaje de Contacto'}
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-info">
                            <i class="bi bi-info-circle me-2"></i>
                            Cambiando estado a: <strong>${nuevoEstado}</strong>
                        </div>
                        ${respuestaActual ? `
                            <div class="alert alert-warning">
                                <i class="bi bi-exclamation-triangle me-2"></i>
                                <strong>Ya existe una respuesta anterior.</strong> Puedes editarla o mantenerla.
                            </div>
                        ` : ''}
                        <div class="mb-3">
                            <label class="form-label">Respuesta al Usuario *</label>
                            <textarea class="form-control" id="respuestaTexto" rows="5" 
                                placeholder="Escribe tu respuesta aquí. El usuario verá este mensaje en su dashboard." 
                                required>${respuestaActual}</textarea>
                            <small class="text-muted">Esta respuesta será visible para el usuario en su panel.</small>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-primary" onclick="enviarRespuestaContacto(${id}, '${nuevoEstado}')">
                            <i class="bi bi-send me-2"></i>${respuestaActual ? 'Actualizar Respuesta' : 'Enviar Respuesta'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remover modal anterior si existe
    const modalAnterior = document.getElementById('modalRespuestaContacto');
    if (modalAnterior) {
        modalAnterior.remove();
    }
    
    // Agregar modal al DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('modalRespuestaContacto'));
    modal.show();
}

// Enviar respuesta del contacto
async function enviarRespuestaContacto(id, nuevoEstado) {
    try {
        const respuestaTexto = document.getElementById('respuestaTexto').value.trim();
        
        if (!respuestaTexto) {
            alert('Por favor escribe una respuesta antes de enviar');
            return;
        }
        
        console.log('📤 Enviando respuesta:', {
            id: id,
            estado: nuevoEstado,
            respuesta: respuestaTexto
        });
        
        const response = await fetch(`/api/contactos/${id}/estado`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('coomotor_token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                estado: nuevoEstado,
                respuesta: respuestaTexto
            })
        });
        
        const result = await response.json();
        console.log('📥 Respuesta del servidor:', result);
        
        if (response.ok && result.success) {
            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalRespuestaContacto'));
            modal.hide();
            
            // Mostrar mensaje de éxito
            mostrarAlerta('success', '✅ Respuesta enviada exitosamente. El usuario podrá verla en su dashboard.');
            
            // Recargar datos
            cargarContactos();
            cargarEstadisticasContactos();
        } else {
            throw new Error(result.message || 'Error al actualizar el estado');
        }
    } catch (error) {
        console.error('❌ Error al enviar respuesta:', error);
        alert('Error al enviar la respuesta: ' + error.message);
    }
}

function mostrarAlerta(tipo, mensaje) {
    const alertContainer = document.createElement('div');
    alertContainer.className = 'position-fixed top-0 end-0 p-3';
    alertContainer.style.zIndex = '9999';
    
    const alertClass = tipo === 'success' ? 'alert-success' : 'alert-danger';
    const icon = tipo === 'success' ? 'check-circle-fill' : 'exclamation-triangle-fill';
    
    alertContainer.innerHTML = `
        <div class="alert ${alertClass} d-flex align-items-center alert-dismissible fade show" role="alert">
            <i class="bi bi-${icon} me-2"></i>
            <div>${mensaje}</div>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    document.body.appendChild(alertContainer);
    
    setTimeout(() => {
        if (alertContainer.parentElement) {
            alertContainer.remove();
        }
    }, 5000);
}



// ============================================
// GESTIÓN DE USUARIOS
// ============================================

// Cargar usuarios
async function cargarUsuarios() {
    try {
        const filtroEstado = document.getElementById('filtroEstado')?.value || '';
        const busqueda = document.getElementById('buscarUsuario')?.value.toLowerCase() || '';
        
        console.log('🔵 Cargando usuarios con filtros:', { filtroEstado, busqueda });
        
        // Construir URL con parámetros
        let url = '/api/admin/empleados';
        if (filtroEstado) {
            url += `?estado=${filtroEstado}`;
        }
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('coomotor_token')}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📥 Respuesta del servidor:', response.status);
        
        if (response.ok) {
            const result = await response.json();
            console.log('📊 Datos recibidos:', result);
            
            if (result.success) {
                let usuarios = result.data;
                
                console.log(`✅ Total usuarios recibidos: ${usuarios.length}`);
                
                // Filtrar por búsqueda en el frontend
                if (busqueda) {
                    usuarios = usuarios.filter(u => 
                        u.nombres.toLowerCase().includes(busqueda) ||
                        u.apellidos.toLowerCase().includes(busqueda) ||
                        u.correo.toLowerCase().includes(busqueda) ||
                        u.numero_documento.includes(busqueda)
                    );
                    console.log(`🔍 Después de búsqueda: ${usuarios.length} usuarios`);
                }
                
                mostrarUsuarios(usuarios);
            } else {
                throw new Error(result.error);
            }
        } else {
            const errorText = await response.text();
            console.error('❌ Error del servidor:', errorText);
            throw new Error(`Error ${response.status}: ${errorText}`);
        }
    } catch (error) {
        console.error('❌ Error al cargar usuarios:', error);
        document.getElementById('usuariosContainer').innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle me-2"></i>
                <strong>Error al cargar usuarios:</strong> ${error.message}
                <br><br>
                <small>Verifica que el servidor esté corriendo y que tengas permisos de administrador.</small>
            </div>
        `;
    }
}

// Mostrar usuarios en tabla
function mostrarUsuarios(usuarios) {
    const container = document.getElementById('usuariosContainer');
    
    if (!usuarios || usuarios.length === 0) {
        container.innerHTML = `
            <div class="text-center py-4">
                <i class="bi bi-people" style="font-size: 3rem; color: #6c757d;"></i>
                <h5 class="mt-3 text-muted">No se encontraron usuarios</h5>
                <p class="text-muted">Intenta cambiar los filtros de búsqueda</p>
            </div>
        `;
        return;
    }
    
    let html = `
        <div class="table-responsive">
            <table class="table table-hover">
                <thead class="table-light">
                    <tr>
                        <th>Usuario</th>
                        <th>Contacto</th>
                        <th>Documento</th>
                        <th>Tipo Conductor</th>
                        <th>Hijos</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    usuarios.forEach(usuario => {
        const estadoBadge = {
            'activo': '<span class="badge bg-success">Activo</span>',
            'inactivo': '<span class="badge bg-secondary">Inactivo</span>',
            'suspendido': '<span class="badge bg-warning">Suspendido</span>'
        }[usuario.estado] || '<span class="badge bg-secondary">Desconocido</span>';
        
        html += `
            <tr>
                <td>
                    <div>
                        <strong>${usuario.nombres} ${usuario.apellidos}</strong>
                        <br>
                        <small class="text-muted">${usuario.correo}</small>
                    </div>
                </td>
                <td>
                    <small>
                        <i class="bi bi-telephone me-1"></i>${usuario.celular}
                    </small>
                </td>
                <td>
                    <small>
                        ${usuario.tipo_documento}<br>
                        ${usuario.numero_documento}
                    </small>
                </td>
                <td>
                    <small>
                        ${usuario.tipo_conductor}
                        ${usuario.subtipo_conductor ? `<br>(${usuario.subtipo_conductor})` : ''}
                    </small>
                </td>
                <td class="text-center">
                    <span class="badge bg-info">${usuario.total_hijos || 0}</span>
                </td>
                <td>${estadoBadge}</td>
                <td>
                    <div class="btn-group btn-group-sm" role="group">
                        <button class="btn btn-outline-primary" onclick="verDetallesUsuario(${usuario.id})" title="Ver detalles">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-outline-warning" onclick="editarUsuario(${usuario.id})" title="Editar">
                            <i class="bi bi-pencil"></i>
                        </button>
                        ${usuario.estado === 'activo' ? 
                            `<button class="btn btn-outline-secondary" onclick="cambiarEstadoUsuario(${usuario.id}, 'inactivo')" title="Desactivar">
                                <i class="bi bi-pause-circle"></i>
                            </button>` :
                            `<button class="btn btn-outline-success" onclick="cambiarEstadoUsuario(${usuario.id}, 'activo')" title="Activar">
                                <i class="bi bi-play-circle"></i>
                            </button>`
                        }
                        <button class="btn btn-outline-danger" onclick="eliminarUsuario(${usuario.id})" title="Eliminar">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
        <div class="mt-3">
            <small class="text-muted">
                <i class="bi bi-info-circle me-1"></i>
                Mostrando ${usuarios.length} usuario(s)
            </small>
        </div>
    `;
    
    container.innerHTML = html;
}

// Ver detalles de usuario
async function verDetallesUsuario(id) {
    try {
        const response = await fetch(`/api/admin/usuarios/${id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('coomotor_token')}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                const usuario = result.data;
                
                const modalHTML = `
                    <div class="modal fade" id="modalDetallesUsuario" tabindex="-1">
                        <div class="modal-dialog modal-lg">
                            <div class="modal-content">
                                <div class="modal-header bg-primary text-white">
                                    <h5 class="modal-title">
                                        <i class="bi bi-person-circle me-2"></i>
                                        Detalles del Usuario
                                    </h5>
                                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                                </div>
                                <div class="modal-body">
                                    <div class="row">
                                        <div class="col-md-6">
                                            <h6 class="text-primary">Información Personal</h6>
                                            <p><strong>Nombres:</strong> ${usuario.nombres}</p>
                                            <p><strong>Apellidos:</strong> ${usuario.apellidos}</p>
                                            <p><strong>Correo:</strong> ${usuario.correo}</p>
                                            <p><strong>Celular:</strong> ${usuario.celular}</p>
                                        </div>
                                        <div class="col-md-6">
                                            <h6 class="text-primary">Información Laboral</h6>
                                            <p><strong>Tipo Documento:</strong> ${usuario.tipo_documento}</p>
                                            <p><strong>Número:</strong> ${usuario.numero_documento}</p>
                                            <p><strong>Tipo Conductor:</strong> ${usuario.tipo_conductor}</p>
                                            ${usuario.subtipo_conductor ? `<p><strong>Subtipo:</strong> ${usuario.subtipo_conductor}</p>` : ''}
                                        </div>
                                    </div>
                                    <hr>
                                    <div class="row">
                                        <div class="col-md-4">
                                            <h6 class="text-primary">Estado</h6>
                                            <p>
                                                ${usuario.estado === 'activo' ? '<span class="badge bg-success">Activo</span>' : 
                                                  usuario.estado === 'inactivo' ? '<span class="badge bg-secondary">Inactivo</span>' :
                                                  '<span class="badge bg-warning">Suspendido</span>'}
                                            </p>
                                        </div>
                                        <div class="col-md-4">
                                            <h6 class="text-primary">Hijos Registrados</h6>
                                            <p><span class="badge bg-info">${usuario.total_hijos || 0}</span></p>
                                        </div>
                                        <div class="col-md-4">
                                            <h6 class="text-primary">Postulaciones</h6>
                                            <p><span class="badge bg-success">${usuario.total_postulaciones || 0}</span></p>
                                        </div>
                                    </div>
                                    <hr>
                                    <div class="row">
                                        <div class="col-md-6">
                                            <p><strong>Fecha de Registro:</strong><br>${formatearFecha(usuario.fecha_registro)}</p>
                                        </div>
                                        <div class="col-md-6">
                                            <p><strong>Último Acceso:</strong><br>${usuario.ultimo_acceso ? formatearFecha(usuario.ultimo_acceso) : 'Nunca'}</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="modal-footer">
                                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                                    <button type="button" class="btn btn-warning" onclick="editarUsuario(${usuario.id}); bootstrap.Modal.getInstance(document.getElementById('modalDetallesUsuario')).hide();">
                                        <i class="bi bi-pencil me-2"></i>Editar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                
                document.getElementById('modalsContainer').innerHTML = modalHTML;
                new bootstrap.Modal(document.getElementById('modalDetallesUsuario')).show();
            }
        }
    } catch (error) {
        console.error('Error al obtener detalles:', error);
        alert('Error al cargar los detalles del usuario');
    }
}

// Editar usuario
async function editarUsuario(id) {
    try {
        const response = await fetch(`/api/admin/usuarios/${id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('coomotor_token')}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                const usuario = result.data;
                
                const modalHTML = `
                    <div class="modal fade" id="modalEditarUsuario" tabindex="-1">
                        <div class="modal-dialog modal-lg">
                            <div class="modal-content">
                                <div class="modal-header bg-warning text-dark">
                                    <h5 class="modal-title">
                                        <i class="bi bi-pencil-square me-2"></i>
                                        Editar Usuario
                                    </h5>
                                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                                </div>
                                <div class="modal-body">
                                    <form id="formEditarUsuario">
                                        <input type="hidden" id="editUsuarioId" value="${usuario.id}">
                                        
                                        <div class="row">
                                            <div class="col-md-6 mb-3">
                                                <label class="form-label">Nombres *</label>
                                                <input type="text" class="form-control" id="editNombres" value="${usuario.nombres}" required>
                                            </div>
                                            <div class="col-md-6 mb-3">
                                                <label class="form-label">Apellidos *</label>
                                                <input type="text" class="form-control" id="editApellidos" value="${usuario.apellidos}" required>
                                            </div>
                                        </div>
                                        
                                        <div class="row">
                                            <div class="col-md-6 mb-3">
                                                <label class="form-label">Celular *</label>
                                                <input type="text" class="form-control" id="editCelular" value="${usuario.celular}" required maxlength="10">
                                            </div>
                                            <div class="col-md-6 mb-3">
                                                <label class="form-label">Correo *</label>
                                                <input type="email" class="form-control" id="editCorreo" value="${usuario.correo}" required>
                                            </div>
                                        </div>
                                        
                                        <div class="row">
                                            <div class="col-md-6 mb-3">
                                                <label class="form-label">Tipo Documento *</label>
                                                <select class="form-select" id="editTipoDocumento" required>
                                                    <option value="cedula" ${usuario.tipo_documento === 'cedula' ? 'selected' : ''}>Cédula</option>
                                                    <option value="cedula_extranjeria" ${usuario.tipo_documento === 'cedula_extranjeria' ? 'selected' : ''}>Cédula de Extranjería</option>
                                                    <option value="pasaporte" ${usuario.tipo_documento === 'pasaporte' ? 'selected' : ''}>Pasaporte</option>
                                                </select>
                                            </div>
                                            <div class="col-md-6 mb-3">
                                                <label class="form-label">Número Documento *</label>
                                                <input type="text" class="form-control" id="editNumeroDocumento" value="${usuario.numero_documento}" required maxlength="10">
                                            </div>
                                        </div>
                                        
                                        <div class="row">
                                            <div class="col-md-6 mb-3">
                                                <label class="form-label">Tipo Conductor *</label>
                                                <select class="form-select" id="editTipoConductor" required onchange="mostrarSubtipoEdit()">
                                                    <option value="carretera" ${usuario.tipo_conductor === 'carretera' ? 'selected' : ''}>Carretera</option>
                                                    <option value="distancia_corta" ${usuario.tipo_conductor === 'distancia_corta' ? 'selected' : ''}>Distancia Corta</option>
                                                    <option value="urbanos" ${usuario.tipo_conductor === 'urbanos' ? 'selected' : ''}>Urbanos</option>
                                                    <option value="furgones" ${usuario.tipo_conductor === 'furgones' ? 'selected' : ''}>Furgones</option>
                                                </select>
                                            </div>
                                            <div class="col-md-6 mb-3" id="editSubtipoContainer" style="display: ${usuario.subtipo_conductor ? 'block' : 'none'};">
                                                <label class="form-label">Subtipo</label>
                                                <select class="form-select" id="editSubtipoConductor">
                                                    <option value="">Seleccionar...</option>
                                                    <option value="nomina" ${usuario.subtipo_conductor === 'nomina' ? 'selected' : ''}>Nómina</option>
                                                    <option value="contrato" ${usuario.subtipo_conductor === 'contrato' ? 'selected' : ''}>Contrato</option>
                                                    <option value="afiliado" ${usuario.subtipo_conductor === 'afiliado' ? 'selected' : ''}>Afiliado</option>
                                                </select>
                                            </div>
                                        </div>
                                        
                                        <div class="alert alert-warning">
                                            <i class="bi bi-exclamation-triangle me-2"></i>
                                            <strong>Nota:</strong> Los cambios se aplicarán inmediatamente.
                                        </div>
                                    </form>
                                </div>
                                <div class="modal-footer">
                                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                                    <button type="button" class="btn btn-warning" onclick="guardarCambiosUsuario()">
                                        <i class="bi bi-save me-2"></i>Guardar Cambios
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                
                document.getElementById('modalsContainer').innerHTML = modalHTML;
                new bootstrap.Modal(document.getElementById('modalEditarUsuario')).show();
            }
        }
    } catch (error) {
        console.error('Error al cargar usuario:', error);
        alert('Error al cargar los datos del usuario');
    }
}

// Mostrar subtipo en edición
function mostrarSubtipoEdit() {
    const tipoConductor = document.getElementById('editTipoConductor').value;
    const subtipoContainer = document.getElementById('editSubtipoContainer');
    
    if (tipoConductor === 'carretera' || tipoConductor === 'furgones') {
        subtipoContainer.style.display = 'block';
    } else {
        subtipoContainer.style.display = 'none';
        document.getElementById('editSubtipoConductor').value = '';
    }
}

// Guardar cambios de usuario
async function guardarCambiosUsuario() {
    const id = document.getElementById('editUsuarioId').value;
    const nombres = document.getElementById('editNombres').value.trim();
    const apellidos = document.getElementById('editApellidos').value.trim();
    const celular = document.getElementById('editCelular').value.trim();
    const correo = document.getElementById('editCorreo').value.trim();
    const tipoDocumento = document.getElementById('editTipoDocumento').value;
    const numeroDocumento = document.getElementById('editNumeroDocumento').value.trim();
    const tipoConductor = document.getElementById('editTipoConductor').value;
    const subtipoConductor = document.getElementById('editSubtipoConductor').value;
    
    // Validaciones básicas
    if (!nombres || !apellidos || !celular || !correo || !tipoDocumento || !numeroDocumento || !tipoConductor) {
        alert('Todos los campos obligatorios deben ser completados');
        return;
    }
    
    try {
        const response = await fetch(`/api/admin/usuarios/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('coomotor_token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nombres,
                apellidos,
                celular,
                correo,
                tipo_documento: tipoDocumento,
                numero_documento: numeroDocumento,
                tipo_conductor: tipoConductor,
                subtipo_conductor: subtipoConductor
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            mostrarAlerta('success', 'Usuario actualizado exitosamente');
            bootstrap.Modal.getInstance(document.getElementById('modalEditarUsuario')).hide();
            cargarUsuarios();
        } else {
            alert('Error: ' + result.error);
        }
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        alert('Error al actualizar el usuario');
    }
}

// Cambiar estado de usuario
async function cambiarEstadoUsuario(id, nuevoEstado) {
    const mensajes = {
        'activo': '¿Deseas activar este usuario?',
        'inactivo': '¿Deseas desactivar este usuario? No podrá iniciar sesión.',
        'suspendido': '¿Deseas suspender este usuario?'
    };
    
    if (!confirm(mensajes[nuevoEstado])) {
        return;
    }
    
    try {
        const response = await fetch(`/api/admin/usuarios/${id}/estado`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('coomotor_token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ estado: nuevoEstado })
        });
        
        const result = await response.json();
        
        if (result.success) {
            mostrarAlerta('success', result.message);
            cargarUsuarios();
        } else {
            alert('Error: ' + result.error);
        }
    } catch (error) {
        console.error('Error al cambiar estado:', error);
        alert('Error al cambiar el estado del usuario');
    }
}

// Eliminar usuario
async function eliminarUsuario(id) {
    if (!confirm('⚠️ ¿Estás seguro de que deseas eliminar este usuario?\n\nEsta acción desactivará al usuario y no podrá iniciar sesión.')) {
        return;
    }
    
    if (!confirm('Esta es tu última oportunidad. ¿Confirmas la eliminación?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/admin/usuarios/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('coomotor_token')}`,
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            mostrarAlerta('success', 'Usuario eliminado exitosamente');
            cargarUsuarios();
        } else {
            alert('Error: ' + result.error);
        }
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        alert('Error al eliminar el usuario');
    }
}

// Búsqueda en tiempo real
document.addEventListener('DOMContentLoaded', function() {
    const buscarInput = document.getElementById('buscarUsuario');
    if (buscarInput) {
        buscarInput.addEventListener('input', function() {
            clearTimeout(window.busquedaTimeout);
            window.busquedaTimeout = setTimeout(() => {
                cargarUsuarios();
            }, 500);
        });
    }
});


// ============================================
// ELIMINAR APROBACIÓN DE POSTULACIÓN
// ============================================

async function eliminarAprobacion(postulacionId, nombreHijo) {
    // Confirmar la acción
    const motivo = prompt(`⚠️ ATENCIÓN: Está a punto de ELIMINAR la aprobación de ${nombreHijo}.\n\nEsta acción notificará al empleado.\n\nPor favor, ingrese el motivo de la eliminación:`);
    
    if (!motivo || motivo.trim() === '') {
        mostrarAlerta('warning', 'Debe ingresar un motivo para eliminar la aprobación');
        return;
    }
    
    // Segunda confirmación
    if (!confirm(`¿Está completamente seguro de eliminar la aprobación de ${nombreHijo}?\n\nSe enviará una notificación al empleado con el motivo:\n"${motivo}"`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/admin/postulaciones/${postulacionId}/eliminar-aprobacion`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('coomotor_token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                motivo: motivo.trim(),
                nombreHijo: nombreHijo
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            mostrarAlerta('success', `Aprobación eliminada. Se ha notificado al empleado.`);
            cargarPostulaciones();
            cargarEstadisticas();
        } else {
            mostrarAlerta('danger', result.error || 'Error al eliminar la aprobación');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarAlerta('danger', 'Error de conexión al eliminar la aprobación');
    }
}


// ============================================
// SOLICITAR DOCUMENTOS A CONDUCTOR
// ============================================

// Mostrar modal para solicitar documentos
function mostrarModalSolicitarDocumentos(postulacionId, nombreHijo) {
    const modalHTML = `
        <div class="modal fade" id="modalSolicitarDocumentos" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-warning text-dark">
                        <h5 class="modal-title">
                            <i class="bi bi-file-earmark-arrow-up me-2"></i>
                            Solicitar Documentos
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-info">
                            <i class="bi bi-info-circle me-2"></i>
                            <strong>Postulación de:</strong> ${nombreHijo}
                        </div>
                        
                        <h6 class="mb-3">Selecciona los documentos que deseas solicitar:</h6>
                        
                        <div class="form-check mb-3">
                            <input class="form-check-input" type="checkbox" value="registro_civil" id="doc_registro_civil">
                            <label class="form-check-label" for="doc_registro_civil">
                                <i class="bi bi-file-earmark-text me-2"></i>
                                <strong>Registro Civil</strong>
                                <br>
                                <small class="text-muted">Documento de identidad del menor</small>
                            </label>
                        </div>
                        
                        <div class="form-check mb-3">
                            <input class="form-check-input" type="checkbox" value="tarjeta_identidad" id="doc_tarjeta_identidad">
                            <label class="form-check-label" for="doc_tarjeta_identidad">
                                <i class="bi bi-card-heading me-2"></i>
                                <strong>Tarjeta de Identidad</strong>
                                <br>
                                <small class="text-muted">Para mayores de 7 años</small>
                            </label>
                        </div>
                        
                        <div class="form-check mb-3">
                            <input class="form-check-input" type="checkbox" value="cedula" id="doc_cedula">
                            <label class="form-check-label" for="doc_cedula">
                                <i class="bi bi-person-badge me-2"></i>
                                <strong>Cédula de Ciudadanía</strong>
                                <br>
                                <small class="text-muted">Para mayores de edad</small>
                            </label>
                        </div>
                        
                        <div class="form-check mb-3">
                            <input class="form-check-input" type="checkbox" value="foto_hijo" id="doc_foto_hijo">
                            <label class="form-check-label" for="doc_foto_hijo">
                                <i class="bi bi-camera me-2"></i>
                                <strong>Foto del Hijo/a</strong>
                                <br>
                                <small class="text-muted">Fotografía reciente del menor</small>
                            </label>
                        </div>
                        
                        <div class="form-check mb-3">
                            <input class="form-check-input" type="checkbox" value="comprobante_residencia" id="doc_comprobante_residencia">
                            <label class="form-check-label" for="doc_comprobante_residencia">
                                <i class="bi bi-house me-2"></i>
                                <strong>Comprobante de Residencia</strong>
                                <br>
                                <small class="text-muted">Recibo de servicios públicos</small>
                            </label>
                        </div>
                        
                        <hr>
                        
                        <div class="mb-3">
                            <label class="form-label">Mensaje personalizado (opcional)</label>
                            <textarea class="form-control" id="mensajePersonalizado" rows="3" 
                                placeholder="Agrega un mensaje adicional para el conductor..."></textarea>
                            <small class="text-muted">Este mensaje se enviará junto con la solicitud de documentos</small>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-warning" onclick="solicitarDocumentos(${postulacionId})">
                            <i class="bi bi-send me-2"></i>Enviar Solicitud
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remover modal anterior si existe
    const modalAnterior = document.getElementById('modalSolicitarDocumentos');
    if (modalAnterior) {
        modalAnterior.remove();
    }
    
    // Agregar nuevo modal
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('modalSolicitarDocumentos'));
    modal.show();
}

// Solicitar documentos al conductor
async function solicitarDocumentos(postulacionId) {
    try {
        // Recoger documentos seleccionados
        const documentos = [];
        const checkboxes = document.querySelectorAll('#modalSolicitarDocumentos input[type="checkbox"]:checked');
        
        if (checkboxes.length === 0) {
            mostrarAlerta('warning', 'Debes seleccionar al menos un documento');
            return;
        }
        
        checkboxes.forEach(checkbox => {
            documentos.push(checkbox.value);
        });
        
        const mensaje = document.getElementById('mensajePersonalizado').value.trim();
        
        // Deshabilitar botón
        const btnEnviar = document.querySelector('#modalSolicitarDocumentos .btn-warning');
        const textoOriginal = btnEnviar.innerHTML;
        btnEnviar.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Enviando...';
        btnEnviar.disabled = true;
        
        // Enviar solicitud al backend
        const response = await fetch(`/api/admin/postulaciones/${postulacionId}/solicitar-documentos`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('coomotor_token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                documentos_solicitados: documentos,
                mensaje: mensaje
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalSolicitarDocumentos'));
            modal.hide();
            
            // Mostrar mensaje de éxito
            mostrarAlerta('success', '✅ Solicitud de documentos enviada exitosamente. El conductor recibirá un email con los detalles.');
            
            // Recargar lista de postulaciones
            cargarPostulaciones();
            cargarEstadisticas();
        } else {
            mostrarAlerta('danger', result.error || 'Error al enviar solicitud');
            btnEnviar.innerHTML = textoOriginal;
            btnEnviar.disabled = false;
        }
    } catch (error) {
        console.error('Error al solicitar documentos:', error);
        mostrarAlerta('danger', 'Error de conexión al enviar solicitud');
        const btnEnviar = document.querySelector('#modalSolicitarDocumentos .btn-warning');
        if (btnEnviar) {
            btnEnviar.innerHTML = '<i class="bi bi-send me-2"></i>Enviar Solicitud';
            btnEnviar.disabled = false;
        }
    }
}

// Eliminar aprobación de postulación
async function eliminarAprobacion(postulacionId, nombreHijo) {
    if (!confirm(`¿Estás seguro de eliminar la aprobación de ${nombreHijo}?\n\nEsto cambiará el estado de la postulación a pendiente.`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/admin/postulaciones/${postulacionId}/rechazar`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('coomotor_token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                motivo: 'Aprobación eliminada por el administrador'
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            mostrarAlerta('success', 'Aprobación eliminada exitosamente');
            cargarPostulaciones();
            cargarEstadisticas();
        } else {
            mostrarAlerta('danger', result.error || 'Error al eliminar aprobación');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarAlerta('danger', 'Error de conexión');
    }
}


// ============================================
// SECCIÓN DE CHAT EN TIEMPO REAL
// ============================================

function mostrarChat() {
    const container = document.getElementById('seccionesContainer');
    container.innerHTML = `
        <div class="action-card">
            <h3 class="action-title mb-4">
                <i class="bi bi-chat-heart-fill me-2"></i>
                Chat en Tiempo Real
            </h3>
            
            <div class="chat-container">
                <!-- Sidebar de conversaciones -->
                <div class="chat-sidebar">
                    <div class="chat-sidebar-header">
                        <h5><i class="bi bi-chat-dots me-2"></i>Conversaciones</h5>
                        <button class="btn btn-sm btn-light" onclick="mostrarModalNuevaConversacion()" title="Nueva conversación">
                            <i class="bi bi-plus-circle"></i>
                        </button>
                    </div>
                    <div class="chat-search">
                        <input type="text" placeholder="Buscar conversación..." id="buscarConversacion">
                    </div>
                    <div class="conversaciones-lista" id="listaConversaciones">
                        <div class="text-center p-4 text-muted">
                            <div class="spinner-border spinner-border-sm" role="status"></div>
                            <p class="mt-2 mb-0">Cargando conversaciones...</p>
                        </div>
                    </div>
                </div>
                
                <!-- Panel principal del chat -->
                <div class="chat-main">
                    <!-- Estado vacío -->
                    <div class="chat-vacio" id="chatVacio">
                        <i class="bi bi-chat-dots"></i>
                        <p>Selecciona una conversación para comenzar</p>
                        <button class="btn btn-primary mt-3" onclick="mostrarModalNuevaConversacion()">
                            <i class="bi bi-plus-circle me-2"></i>Iniciar Chat
                        </button>
                    </div>
                    
                    <!-- Chat activo -->
                    <div id="chatActivo" class="d-none" style="display: flex; flex-direction: column; height: 100%;">
                        <div class="chat-header" id="chatHeader">
                            <!-- Se llenará dinámicamente -->
                        </div>
                        
                        <div class="chat-messages" id="mensajesContainer">
                            <!-- Mensajes se cargarán aquí -->
                        </div>
                        
                        <div class="chat-input">
                            <div class="archivo-preview d-none" id="archivoPreview">
                                <i class="bi bi-paperclip"></i>
                                <span id="nombreArchivoPreview"></span>
                                <button type="button" onclick="cancelarArchivo()">
                                    <i class="bi bi-x"></i>
                                </button>
                            </div>
                            <div class="chat-input-container">
                                <textarea 
                                    id="mensajeInput" 
                                    placeholder="Escribe un mensaje..." 
                                    rows="1"
                                    onkeydown="if(event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); enviarMensaje(); }"
                                    oninput="onInputEscribiendo()"></textarea>
                                <div class="chat-input-buttons">
                                    <label for="archivoInput" class="btn-chat btn-chat-adjuntar" title="Adjuntar archivo">
                                        <i class="bi bi-paperclip"></i>
                                    </label>
                                    <input type="file" id="archivoInput" style="display: none;" onchange="onArchivoSeleccionado(this)" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx">
                                    <button class="btn-chat btn-chat-enviar" onclick="enviarMensaje()" title="Enviar mensaje">
                                        <i class="bi bi-send-fill"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Inicializar chat si no está inicializado
    if (!window.socket || !window.socket.connected) {
        inicializarChat();
    } else {
        cargarConversaciones();
    }
    
    // Solicitar permiso para notificaciones
    solicitarPermisoNotificaciones();
}

// Inicializar chat al cargar el dashboard
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar Socket.IO en segundo plano
    setTimeout(() => {
        if (typeof inicializarChat === 'function') {
            inicializarChat();
            
            // Actualizar badge de mensajes no leídos cada 30 segundos
            setInterval(actualizarBadgeMensajesNoLeidos, 30000);
            actualizarBadgeMensajesNoLeidos();
        }
    }, 2000);
});

// Actualizar badge de mensajes no leídos
async function actualizarBadgeMensajesNoLeidos() {
    try {
        const response = await fetch('/api/chat/no-leidos', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('coomotor_token')}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                const badge = document.getElementById('badgeMensajesNoLeidos');
                if (badge) {
                    if (result.data.total > 0) {
                        badge.textContent = result.data.total;
                        badge.style.display = 'block';
                    } else {
                        badge.style.display = 'none';
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error al actualizar badge de mensajes:', error);
    }
}
