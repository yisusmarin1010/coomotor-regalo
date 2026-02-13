// ============================================
// GESTIÓN DE DOCUMENTOS - SISTEMA REGALOS NAVIDEÑOS
// ============================================

let documentosUsuario = [];

// ============================================
// FUNCIONES PARA CONDUCTORES
// ============================================

// Mostrar modal para subir documento
function mostrarModalSubirDocumento() {
    const modal = `
        <div class="modal fade" id="modalSubirDocumento" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header" style="background: linear-gradient(135deg, var(--primary), #047857); color: white;">
                        <h5 class="modal-title">
                            <i class="bi bi-cloud-upload-fill me-2"></i>
                            Subir Documento
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="formSubirDocumento" enctype="multipart/form-data">
                            <div class="mb-3">
                                <label class="form-label">Tipo de Documento *</label>
                                <select class="form-select" id="tipoDocumento" required>
                                    <option value="">Seleccionar...</option>
                                    <option value="registro_civil">Registro Civil</option>
                                    <option value="tarjeta_identidad">Tarjeta de Identidad</option>
                                    <option value="cedula">Cédula de Ciudadanía</option>
                                    <option value="foto_hijo">Foto del Hijo/a</option>
                                    <option value="comprobante_residencia">Comprobante de Residencia</option>
                                    <option value="otro">Otro</option>
                                </select>
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Relacionado con (Opcional)</label>
                                <select class="form-select" id="hijoRelacionado">
                                    <option value="">No relacionado con ningún hijo</option>
                                </select>
                                <div class="form-text">Selecciona si el documento es de un hijo específico</div>
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Archivo (PDF, PNG, JPG) *</label>
                                <input type="file" class="form-control" id="archivoDocumento" 
                                       accept=".pdf,.png,.jpg,.jpeg" required>
                                <div class="form-text">Tamaño máximo: 5MB</div>
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Descripción (Opcional)</label>
                                <textarea class="form-control" id="descripcionDocumento" rows="2" 
                                          placeholder="Agrega una descripción si es necesario"></textarea>
                            </div>

                            <div class="alert alert-info" style="font-size: 0.875rem;">
                                <i class="bi bi-info-circle me-2"></i>
                                <strong>Importante:</strong> Solo se aceptan archivos PDF, PNG y JPG de máximo 5MB.
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-primary" onclick="subirDocumento()">
                            <i class="bi bi-upload me-1"></i>Subir Documento
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.getElementById('modalsContainer').innerHTML = modal;
    const modalElement = new bootstrap.Modal(document.getElementById('modalSubirDocumento'));
    modalElement.show();

    // Cargar hijos en el select
    cargarHijosEnSelect();
}

// Cargar hijos en el select
async function cargarHijosEnSelect() {
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
                const select = document.getElementById('hijoRelacionado');
                result.data.forEach(hijo => {
                    const option = document.createElement('option');
                    option.value = hijo.id;
                    option.textContent = `${hijo.nombres} ${hijo.apellidos}`;
                    select.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Error al cargar hijos:', error);
    }
}

// Subir documento
async function subirDocumento() {
    const tipoDocumento = document.getElementById('tipoDocumento').value;
    const hijoId = document.getElementById('hijoRelacionado').value;
    const archivo = document.getElementById('archivoDocumento').files[0];
    const descripcion = document.getElementById('descripcionDocumento').value;

    if (!tipoDocumento || !archivo) {
        mostrarAlerta('warning', 'Por favor completa todos los campos obligatorios');
        return;
    }

    // Validar tamaño del archivo (5MB)
    if (archivo.size > 5 * 1024 * 1024) {
        mostrarAlerta('danger', 'El archivo es demasiado grande. Máximo 5MB');
        return;
    }

    // Validar tipo de archivo
    const tiposPermitidos = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!tiposPermitidos.includes(archivo.type)) {
        mostrarAlerta('danger', 'Tipo de archivo no permitido. Solo PDF, PNG y JPG');
        return;
    }

    const btnSubir = event.target;
    const textoOriginal = btnSubir.innerHTML;
    btnSubir.innerHTML = '<i class="bi bi-hourglass-split me-1"></i>Subiendo...';
    btnSubir.disabled = true;

    try {
        const formData = new FormData();
        formData.append('documento', archivo);
        formData.append('tipo_documento', tipoDocumento);
        if (hijoId) formData.append('hijo_id', hijoId);
        if (descripcion) formData.append('descripcion', descripcion);

        const response = await fetch('/api/documentos/subir', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('coomotor_token')}`
            },
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            mostrarAlerta('success', 'Documento subido exitosamente');
            bootstrap.Modal.getInstance(document.getElementById('modalSubirDocumento')).hide();
            cargarMisDocumentos();
        } else {
            mostrarAlerta('danger', result.error || 'Error al subir el documento');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarAlerta('danger', 'Error de conexión al subir el documento');
    } finally {
        btnSubir.innerHTML = textoOriginal;
        btnSubir.disabled = false;
    }
}

// Cargar documentos del usuario
async function cargarMisDocumentos() {
    try {
        const response = await fetch('/api/documentos/mis-documentos', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('coomotor_token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                documentosUsuario = result.data;
                mostrarMisDocumentos(result.data);
            }
        }
    } catch (error) {
        console.error('Error al cargar documentos:', error);
    }
}

// Mostrar documentos del usuario
function mostrarMisDocumentos(documentos) {
    const container = document.getElementById('documentosContainer');
    
    if (!container) return;

    if (documentos.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-file-earmark-arrow-up"></i>
                <h4 style="font-size: 0.95rem; font-weight: 700;">No has subido documentos</h4>
                <p style="font-size: 0.75rem;">Sube los documentos requeridos para completar tu postulación</p>
                <button class="btn btn-christmas" onclick="mostrarModalSubirDocumento()">
                    <i class="bi bi-plus-circle"></i> Subir Primer Documento
                </button>
            </div>
        `;
        return;
    }

    const tiposDocumento = {
        'registro_civil': 'Registro Civil',
        'tarjeta_identidad': 'Tarjeta de Identidad',
        'cedula': 'Cédula',
        'foto_hijo': 'Foto del Hijo/a',
        'comprobante_residencia': 'Comprobante de Residencia',
        'otro': 'Otro'
    };

    let html = '<div class="row">';
    
    documentos.forEach(doc => {
        const estadoBadge = obtenerBadgeEstadoDocumento(doc.estado);
        const iconoArchivo = doc.tipo_mime === 'application/pdf' ? 'file-pdf' : 'file-image';
        const tamanoMB = (doc.tamano_archivo / (1024 * 1024)).toFixed(2);

        html += `
            <div class="col-md-6 mb-3">
                <div class="card" style="border-radius: 6px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                    <div class="card-body" style="padding: 1rem;">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <div class="d-flex align-items-center gap-2">
                                <i class="bi bi-${iconoArchivo}" style="font-size: 1.5rem; color: var(--primary);"></i>
                                <div>
                                    <h6 style="margin: 0; font-size: 0.875rem; font-weight: 700;">
                                        ${tiposDocumento[doc.tipo_documento] || doc.tipo_documento}
                                    </h6>
                                    <small class="text-muted" style="font-size: 0.7rem;">${tamanoMB} MB</small>
                                </div>
                            </div>
                            ${estadoBadge}
                        </div>
                        
                        ${doc.nombre_hijo ? `
                            <div class="mb-2">
                                <small class="text-muted" style="font-size: 0.7rem;">
                                    <i class="bi bi-person"></i> ${doc.nombre_hijo}
                                </small>
                            </div>
                        ` : ''}
                        
                        ${doc.descripcion ? `
                            <p class="mb-2" style="font-size: 0.75rem; color: var(--text-light); margin: 0;">
                                ${doc.descripcion}
                            </p>
                        ` : ''}
                        
                        <div class="mb-2">
                            <small class="text-muted" style="font-size: 0.7rem;">
                                <i class="bi bi-calendar"></i> ${formatearFecha(doc.fecha_subida)}
                            </small>
                        </div>
                        
                        ${doc.observaciones_admin ? `
                            <div class="alert alert-warning mb-2" style="padding: 0.5rem; font-size: 0.7rem; margin: 0;">
                                <strong>Observaciones:</strong> ${doc.observaciones_admin}
                            </div>
                        ` : ''}
                        
                        <div class="d-flex gap-2">
                            <button class="btn btn-outline-primary btn-sm" onclick="descargarDocumento(${doc.id})">
                                <i class="bi bi-download"></i> Descargar
                            </button>
                            ${doc.estado !== 'aprobado' ? `
                                <button class="btn btn-outline-danger btn-sm" onclick="eliminarDocumento(${doc.id})">
                                    <i class="bi bi-trash"></i>
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}

// Obtener badge de estado del documento
function obtenerBadgeEstadoDocumento(estado) {
    const badges = {
        'pendiente': '<span class="badge bg-warning" style="font-size: 0.65rem;">⏳ Pendiente</span>',
        'aprobado': '<span class="badge bg-success" style="font-size: 0.65rem;">✅ Aprobado</span>',
        'rechazado': '<span class="badge bg-danger" style="font-size: 0.65rem;">❌ Rechazado</span>'
    };
    return badges[estado] || '<span class="badge bg-secondary" style="font-size: 0.65rem;">Desconocido</span>';
}

// Descargar documento
async function descargarDocumento(documentoId) {
    try {
        const response = await fetch(`/api/documentos/descargar/${documentoId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('coomotor_token')}`
            }
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `documento-${documentoId}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } else {
            const result = await response.json();
            mostrarAlerta('danger', result.error || 'Error al descargar el documento');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarAlerta('danger', 'Error de conexión al descargar el documento');
    }
}

// Eliminar documento
async function eliminarDocumento(documentoId) {
    if (!confirm('¿Estás seguro de eliminar este documento?')) return;

    try {
        const response = await fetch(`/api/documentos/${documentoId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('coomotor_token')}`,
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();

        if (result.success) {
            mostrarAlerta('success', 'Documento eliminado exitosamente');
            cargarMisDocumentos();
        } else {
            mostrarAlerta('danger', result.error || 'Error al eliminar el documento');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarAlerta('danger', 'Error de conexión al eliminar el documento');
    }
}

// ============================================
// FUNCIONES PARA ADMINISTRADORES
// ============================================

// Cargar todos los documentos (Admin)
async function cargarDocumentosAdmin(filtros = {}) {
    try {
        let url = '/api/admin/documentos';
        const params = new URLSearchParams();
        
        if (filtros.estado) params.append('estado', filtros.estado);
        if (filtros.usuario_id) params.append('usuario_id', filtros.usuario_id);
        
        if (params.toString()) url += '?' + params.toString();

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('coomotor_token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                mostrarDocumentosAdmin(result.data);
            }
        }
    } catch (error) {
        console.error('Error al cargar documentos (admin):', error);
    }
}

// Mostrar documentos para admin
function mostrarDocumentosAdmin(documentos) {
    const container = document.getElementById('documentosAdminContainer');
    
    if (!container) return;

    if (documentos.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-inbox"></i>
                <h4>No hay documentos</h4>
                <p>No se encontraron documentos con los filtros aplicados</p>
            </div>
        `;
        return;
    }

    const tiposDocumento = {
        'registro_civil': 'Registro Civil',
        'tarjeta_identidad': 'Tarjeta de Identidad',
        'cedula': 'Cédula',
        'foto_hijo': 'Foto del Hijo/a',
        'comprobante_residencia': 'Comprobante de Residencia',
        'otro': 'Otro'
    };

    let html = `
        <div class="table-responsive">
            <table class="table table-hover" style="font-size: 0.75rem;">
                <thead>
                    <tr>
                        <th>Usuario</th>
                        <th>Tipo Documento</th>
                        <th>Hijo</th>
                        <th>Archivo</th>
                        <th>Fecha</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
    `;

    documentos.forEach(doc => {
        const estadoBadge = obtenerBadgeEstadoDocumento(doc.estado);
        const iconoArchivo = doc.tipo_mime === 'application/pdf' ? 'file-pdf' : 'file-image';
        const tamanoMB = (doc.tamano_archivo / (1024 * 1024)).toFixed(2);

        html += `
            <tr>
                <td>
                    <div>
                        <strong>${doc.nombre_usuario}</strong><br>
                        <small class="text-muted">${doc.correo_usuario}</small>
                    </div>
                </td>
                <td>${tiposDocumento[doc.tipo_documento] || doc.tipo_documento}</td>
                <td>${doc.nombre_hijo || '-'}</td>
                <td>
                    <i class="bi bi-${iconoArchivo}"></i> ${tamanoMB} MB
                </td>
                <td>${formatearFecha(doc.fecha_subida)}</td>
                <td>${estadoBadge}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="descargarDocumento(${doc.id})" title="Descargar">
                        <i class="bi bi-download"></i>
                    </button>
                    ${doc.estado === 'pendiente' ? `
                        <button class="btn btn-sm btn-success me-1" onclick="revisarDocumento(${doc.id}, 'aprobado')" title="Aprobar">
                            <i class="bi bi-check"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="mostrarModalRechazarDocumento(${doc.id})" title="Rechazar">
                            <i class="bi bi-x"></i>
                        </button>
                    ` : `
                        <button class="btn btn-sm btn-outline-secondary" onclick="verDetalleDocumento(${doc.id})" title="Ver detalle">
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

// Mostrar modal para rechazar documento
function mostrarModalRechazarDocumento(documentoId) {
    const modal = `
        <div class="modal fade" id="modalRechazarDocumento" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header bg-danger text-white">
                        <h5 class="modal-title">
                            <i class="bi bi-x-circle me-2"></i>
                            Rechazar Documento
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <label class="form-label">Observaciones *</label>
                            <textarea class="form-control" id="observacionesRechazo" rows="4" 
                                      placeholder="Indica el motivo del rechazo..." required></textarea>
                            <div class="form-text">Estas observaciones serán enviadas al usuario</div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-danger" onclick="revisarDocumento(${documentoId}, 'rechazado')">
                            <i class="bi bi-x me-1"></i>Rechazar Documento
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.getElementById('modalsContainer').innerHTML = modal;
    const modalElement = new bootstrap.Modal(document.getElementById('modalRechazarDocumento'));
    modalElement.show();
}

// Revisar documento (Admin)
async function revisarDocumento(documentoId, estado) {
    let observaciones = '';
    
    if (estado === 'rechazado') {
        observaciones = document.getElementById('observacionesRechazo').value.trim();
        if (!observaciones) {
            mostrarAlerta('warning', 'Por favor indica el motivo del rechazo');
            return;
        }
    }

    try {
        const response = await fetch(`/api/admin/documentos/${documentoId}/revisar`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('coomotor_token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                estado: estado,
                observaciones: observaciones
            })
        });

        const result = await response.json();

        if (result.success) {
            mostrarAlerta('success', `Documento ${estado} exitosamente`);
            
            // Cerrar modal si existe
            const modalElement = document.getElementById('modalRechazarDocumento');
            if (modalElement) {
                bootstrap.Modal.getInstance(modalElement).hide();
            }
            
            cargarDocumentosAdmin();
        } else {
            mostrarAlerta('danger', result.error || 'Error al revisar el documento');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarAlerta('danger', 'Error de conexión al revisar el documento');
    }
}

// Función auxiliar para formatear fechas
function formatearFecha(fecha) {
    return new Date(fecha).toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Función auxiliar para mostrar alertas
function mostrarAlerta(tipo, mensaje) {
    // Implementación básica, puede ser mejorada
    alert(mensaje);
}
