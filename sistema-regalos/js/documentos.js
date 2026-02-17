// ============================================
// GESTIÓN DE DOCUMENTOS - SISTEMA REGALOS NAVIDEÑOS
// ============================================

let documentosUsuario = [];

// ============================================
// FUNCIONES PARA CONDUCTORES
// ============================================

// Mostrar modal para subir documento
function mostrarModalSubirDocumento() {
    // Verificar si hay documentos solicitados
    if (!documentosSolicitados || documentosSolicitados.length === 0) {
        mostrarAlerta('warning', 'No hay documentos solicitados por el administrador');
        return;
    }
    
    // Verificar si hay hijo solicitado
    if (!hijoSolicitado) {
        mostrarAlerta('warning', 'No se pudo identificar el hijo para el cual se solicitaron documentos');
        return;
    }
    
    // Mapear nombres de documentos
    const nombresDocumentos = {
        'registro_civil': 'Registro Civil',
        'tarjeta_identidad': 'Tarjeta de Identidad',
        'cedula': 'Cédula de Ciudadanía',
        'foto_hijo': 'Foto del Hijo/a',
        'comprobante_residencia': 'Comprobante de Residencia'
    };
    
    // Generar opciones solo para documentos solicitados
    const opcionesDocumentos = documentosSolicitados
        .map(doc => `<option value="${doc}">${nombresDocumentos[doc] || doc}</option>`)
        .join('');
    
    const modal = `
        <div class="modal fade" id="modalSubirDocumento" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header" style="background: linear-gradient(135deg, var(--primary), #1e40af); color: white;">
                        <h5 class="modal-title">
                            <i class="bi bi-cloud-upload-fill me-2"></i>
                            Subir Documento Solicitado
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-info mb-3" style="font-size: 0.875rem;">
                            <i class="bi bi-info-circle me-2"></i>
                            <strong>Mensaje del administrador:</strong><br>
                            ${mensajeAdmin}
                        </div>
                        
                        <form id="formSubirDocumento" enctype="multipart/form-data">
                            <div class="mb-3">
                                <label class="form-label">Tipo de Documento *</label>
                                <select class="form-select" id="tipoDocumento" required>
                                    <option value="">Seleccionar documento solicitado...</option>
                                    ${opcionesDocumentos}
                                </select>
                                <div class="form-text">Solo puedes subir los documentos solicitados por el administrador</div>
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Documento para</label>
                                <input type="text" class="form-control" value="${hijoSolicitado.nombre}" disabled>
                                <input type="hidden" id="hijoRelacionado" value="${hijoSolicitado.id}">
                                <div class="form-text">Los documentos se subirán automáticamente para este hijo</div>
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Archivo (PDF, PNG, JPG) *</label>
                                <input type="file" class="form-control" id="archivoDocumento" 
                                       accept=".pdf,.png,.jpg,.jpeg" required onchange="previsualizarDocumento(this)">
                                <div class="form-text">Tamaño máximo: 5MB</div>
                            </div>
                            
                            <!-- Vista Previa del Documento -->
                            <div id="previewContainer" class="mb-3" style="display: none;">
                                <label class="form-label">Vista Previa:</label>
                                <div id="previewContent" style="border: 2px solid #e2e8f0; border-radius: 12px; padding: 20px; background: #f8fafc; text-align: center; min-height: 200px;">
                                    <!-- Aquí se mostrará la preview -->
                                </div>
                                <div class="d-flex justify-content-between align-items-center mt-2">
                                    <small class="text-muted" id="fileInfo"></small>
                                    <button type="button" class="btn btn-sm btn-outline-danger" onclick="limpiarPreview()">
                                        <i class="bi bi-x-circle me-1"></i>Cambiar archivo
                                    </button>
                                </div>
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Descripción (Opcional)</label>
                                <textarea class="form-control" id="descripcionDocumento" rows="2" 
                                          placeholder="Agrega una descripción si es necesario"></textarea>
                            </div>

                            <div class="alert alert-warning" style="font-size: 0.875rem;">
                                <i class="bi bi-exclamation-triangle me-2"></i>
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

// ============================================
// VISTA PREVIA DE DOCUMENTOS
// ============================================

// Previsualizar documento antes de subir
function previsualizarDocumento(input) {
    const archivo = input.files[0];
    const previewContainer = document.getElementById('previewContainer');
    const previewContent = document.getElementById('previewContent');
    const fileInfo = document.getElementById('fileInfo');
    
    if (!archivo) {
        previewContainer.style.display = 'none';
        return;
    }
    
    // Validar tamaño (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (archivo.size > maxSize) {
        mostrarAlerta('danger', 'El archivo es demasiado grande. Máximo 5MB');
        input.value = '';
        previewContainer.style.display = 'none';
        return;
    }
    
    // Validar tipo de archivo
    const tiposPermitidos = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!tiposPermitidos.includes(archivo.type)) {
        mostrarAlerta('danger', 'Tipo de archivo no permitido. Solo PDF, PNG y JPG');
        input.value = '';
        previewContainer.style.display = 'none';
        return;
    }
    
    // Mostrar información del archivo
    const tamanoMB = (archivo.size / (1024 * 1024)).toFixed(2);
    fileInfo.innerHTML = `
        <i class="bi bi-file-earmark-check text-success me-1"></i>
        <strong>${archivo.name}</strong> (${tamanoMB} MB)
    `;
    
    // Mostrar preview según el tipo
    if (archivo.type === 'application/pdf') {
        previsualizarPDF(archivo, previewContent);
    } else {
        previsualizarImagen(archivo, previewContent);
    }
    
    previewContainer.style.display = 'block';
}

// Previsualizar PDF
function previsualizarPDF(archivo, container) {
    // Crear URL del blob para el PDF
    const blobURL = URL.createObjectURL(archivo);
    
    // Guardar el blob URL globalmente
    window.currentPDFBlobURL = blobURL;
    window.currentPDFFileName = archivo.name;
    
    container.innerHTML = `
        <div style="position: relative;">
            <i class="bi bi-file-pdf-fill text-danger" style="font-size: 80px; margin-bottom: 15px;"></i>
            <h5 style="color: #dc2626; font-weight: 700; margin-bottom: 10px;">
                Documento PDF
            </h5>
            <p style="color: #64748b; font-size: 0.9rem; margin-bottom: 20px;">
                ${archivo.name}
            </p>
            
            <!-- Vista previa embebida del PDF -->
            <div style="margin: 20px 0;">
                <iframe src="${blobURL}" 
                        style="width: 100%; height: 400px; border: 2px solid #e2e8f0; border-radius: 8px;"
                        title="Vista previa PDF">
                </iframe>
            </div>
            
            <div class="d-flex gap-2 justify-content-center">
                <button type="button" class="btn btn-sm btn-outline-primary" onclick="abrirPDFEnNuevaVentana()">
                    <i class="bi bi-arrows-fullscreen me-1"></i>Ver en pantalla completa
                </button>
                <button type="button" class="btn btn-sm btn-outline-secondary" onclick="descargarPDFPreview()">
                    <i class="bi bi-download me-1"></i>Descargar preview
                </button>
            </div>
            
            <div class="alert alert-success mt-3" style="font-size: 0.85rem; margin: 0;">
                <i class="bi bi-check-circle me-2"></i>
                <strong>PDF válido</strong> - Puedes ver el contenido arriba
            </div>
        </div>
    `;
}

// Abrir PDF en nueva ventana
function abrirPDFEnNuevaVentana() {
    if (window.currentPDFBlobURL) {
        // Abrir directamente el blob URL en nueva ventana
        window.open(window.currentPDFBlobURL, '_blank');
    } else {
        alert('No hay PDF cargado para mostrar');
    }
}

// Descargar PDF de preview
function descargarPDFPreview() {
    if (window.currentPDFBlobURL && window.currentPDFFileName) {
        const a = document.createElement('a');
        a.href = window.currentPDFBlobURL;
        a.download = window.currentPDFFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    } else {
        alert('No hay PDF cargado para descargar');
    }
}

// Previsualizar imagen
function previsualizarImagen(archivo, container) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            // Calcular dimensiones para la preview (máximo 400px de ancho)
            let width = this.width;
            let height = this.height;
            const maxWidth = 400;
            
            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }
            
            container.innerHTML = `
                <div style="position: relative;">
                    <div style="margin-bottom: 15px;">
                        <img src="${e.target.result}" 
                             style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);"
                             alt="Vista previa">
                    </div>
                    <div class="alert alert-success" style="font-size: 0.85rem; margin: 0;">
                        <i class="bi bi-check-circle me-2"></i>
                        <strong>Imagen válida</strong> - Dimensiones: ${this.width} x ${this.height} px
                    </div>
                    <div class="mt-2">
                        <button type="button" class="btn btn-sm btn-outline-primary" onclick="verImagenCompleta()">
                            <i class="bi bi-arrows-fullscreen me-1"></i>Ver tamaño completo
                        </button>
                    </div>
                </div>
            `;
            
            // Guardar la imagen para verla en tamaño completo
            window.currentImageDataURL = e.target.result;
        };
        
        img.onerror = function() {
            container.innerHTML = `
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    Error al cargar la imagen. Por favor, selecciona otro archivo.
                </div>
            `;
        };
        
        img.src = e.target.result;
    };
    
    reader.readAsDataURL(archivo);
}

// Ver imagen en tamaño completo
function verImagenCompleta() {
    if (window.currentImageDataURL) {
        const modal = `
            <div class="modal fade" id="modalImagenCompleta" tabindex="-1">
                <div class="modal-dialog modal-xl modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="bi bi-image me-2"></i>Vista Previa - Tamaño Completo
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body text-center" style="background: #f8fafc;">
                            <img src="${window.currentImageDataURL}" 
                                 style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);"
                                 alt="Vista previa completa">
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Crear modal temporal
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = modal;
        document.body.appendChild(tempDiv);
        
        const modalElement = new bootstrap.Modal(document.getElementById('modalImagenCompleta'));
        modalElement.show();
        
        // Limpiar al cerrar
        document.getElementById('modalImagenCompleta').addEventListener('hidden.bs.modal', function() {
            tempDiv.remove();
        });
    }
}

// Limpiar preview
function limpiarPreview() {
    const input = document.getElementById('archivoDocumento');
    const previewContainer = document.getElementById('previewContainer');
    
    input.value = '';
    previewContainer.style.display = 'none';
    
    // Liberar blob URLs para evitar memory leaks
    if (window.currentPDFBlobURL) {
        URL.revokeObjectURL(window.currentPDFBlobURL);
        window.currentPDFBlobURL = null;
    }
    
    // Limpiar variables globales
    window.currentPDFFileName = null;
    window.currentImageDataURL = null;
}

// Función auxiliar para mostrar alertas
function mostrarAlerta(tipo, mensaje) {
    // Implementación básica, puede ser mejorada
    alert(mensaje);
}
