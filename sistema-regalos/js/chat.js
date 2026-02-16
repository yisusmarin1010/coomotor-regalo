// ============================================
// SISTEMA DE CHAT EN TIEMPO REAL - SOCKET.IO
// ============================================

let socket = null;
let conversacionActual = null;
let usuarioActual = null;
let escribiendoTimeout = null;

// Inicializar chat
function inicializarChat() {
    const token = localStorage.getItem('coomotor_token');
    const userData = localStorage.getItem('coomotor_user');
    
    if (!token || !userData) {
        console.error('❌ No hay sesión activa');
        return;
    }
    
    usuarioActual = JSON.parse(userData);
    
    // Conectar a Socket.IO
    const serverUrl = window.location.origin;
    socket = io(serverUrl, {
        auth: {
            token: token
        },
        transports: ['websocket', 'polling']
    });
    
    // Eventos de conexión
    socket.on('connect', () => {
        console.log('✅ Conectado al servidor de chat');
        cargarConversaciones();
    });
    
    socket.on('disconnect', () => {
        console.log('❌ Desconectado del servidor de chat');
    });
    
    socket.on('connect_error', (error) => {
        console.error('❌ Error de conexión:', error.message);
    });
    
    // Eventos de mensajes
    socket.on('nuevo_mensaje', (mensaje) => {
        console.log('📨 Nuevo mensaje recibido:', mensaje);
        agregarMensajeAConversacion(mensaje);
        actualizarListaConversaciones();
        
        // Reproducir sonido de notificación
        reproducirSonidoNotificacion();
        
        // Si el mensaje es de la conversación actual, marcarlo como leído
        if (conversacionActual && mensaje.remitente_id === conversacionActual.id) {
            marcarMensajeComoLeido(mensaje.id);
        } else {
            // Mostrar notificación
            mostrarNotificacionMensaje(mensaje);
        }
    });
    
    socket.on('mensaje_enviado', (mensaje) => {
        console.log('✅ Mensaje enviado confirmado:', mensaje);
        agregarMensajeAConversacion(mensaje);
    });
    
    socket.on('mensaje_leido', (data) => {
        console.log('👁️ Mensaje leído:', data);
        marcarMensajeVisualmenteComoLeido(data.mensaje_id);
    });
    
    socket.on('usuario_escribiendo', (data) => {
        if (conversacionActual && data.usuario_id === conversacionActual.id) {
            mostrarIndicadorEscribiendo();
        }
    });
    
    socket.on('usuario_dejo_escribir', (data) => {
        if (conversacionActual && data.usuario_id === conversacionActual.id) {
            ocultarIndicadorEscribiendo();
        }
    });
    
    socket.on('error_mensaje', (data) => {
        console.error('❌ Error al enviar mensaje:', data.error);
        mostrarAlerta('danger', data.error);
    });
}

// Cargar lista de conversaciones
async function cargarConversaciones() {
    try {
        const response = await fetch('/api/chat/conversaciones', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('coomotor_token')}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                mostrarListaConversaciones(result.data);
            }
        }
    } catch (error) {
        console.error('❌ Error al cargar conversaciones:', error);
    }
}

// Mostrar lista de conversaciones
function mostrarListaConversaciones(conversaciones) {
    const container = document.getElementById('listaConversaciones');
    if (!container) return;
    
    if (conversaciones.length === 0) {
        container.innerHTML = `
            <div class="text-center p-4 text-muted">
                <i class="bi bi-chat-dots" style="font-size: 3rem;"></i>
                <p class="mt-2">No hay conversaciones</p>
                <button class="btn btn-sm btn-primary" onclick="mostrarModalNuevaConversacion()">
                    <i class="bi bi-plus-circle me-1"></i>Iniciar Chat
                </button>
            </div>
        `;
        return;
    }
    
    let html = '';
    conversaciones.forEach(conv => {
        const activa = conversacionActual && conversacionActual.id === conv.id ? 'active' : '';
        const noLeidos = conv.mensajes_no_leidos > 0 ? `<span class="badge bg-danger rounded-pill">${conv.mensajes_no_leidos}</span>` : '';
        
        html += `
            <div class="conversacion-item ${activa}" onclick="abrirConversacion(${conv.id}, '${conv.nombres}', '${conv.apellidos}', '${conv.rol}')">
                <div class="d-flex align-items-center">
                    <div class="avatar-chat me-2">
                        <i class="bi bi-person-circle"></i>
                    </div>
                    <div class="flex-grow-1">
                        <div class="d-flex justify-content-between align-items-start">
                            <h6 class="mb-0">${conv.nombres} ${conv.apellidos}</h6>
                            ${noLeidos}
                        </div>
                        <small class="text-muted text-truncate d-block">${conv.ultimo_mensaje || 'Sin mensajes'}</small>
                        <small class="text-muted">${formatearFechaChat(conv.ultima_fecha)}</small>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Abrir conversación
async function abrirConversacion(userId, nombres, apellidos, rol) {
    conversacionActual = { id: userId, nombres, apellidos, rol };
    
    // Actualizar header del chat
    document.getElementById('chatHeader').innerHTML = `
        <div class="d-flex align-items-center">
            <div class="avatar-chat me-2">
                <i class="bi bi-person-circle"></i>
            </div>
            <div>
                <h6 class="mb-0">${nombres} ${apellidos}</h6>
                <small class="text-muted">${rol === 'admin' ? 'Administrador' : 'Conductor'}</small>
            </div>
        </div>
    `;
    
    // Mostrar área de chat
    document.getElementById('chatVacio').classList.add('d-none');
    document.getElementById('chatActivo').classList.remove('d-none');
    
    // Cargar mensajes
    await cargarMensajes(userId);
    
    // Marcar conversación como activa
    document.querySelectorAll('.conversacion-item').forEach(el => el.classList.remove('active'));
    event.currentTarget?.classList.add('active');
}

// Cargar mensajes de una conversación
async function cargarMensajes(destinatarioId) {
    try {
        const response = await fetch(`/api/chat/mensajes/${destinatarioId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('coomotor_token')}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                mostrarMensajes(result.data);
                
                // Marcar mensajes no leídos como leídos
                result.data.forEach(mensaje => {
                    if (mensaje.destinatario_id === usuarioActual.id && !mensaje.leido) {
                        marcarMensajeComoLeido(mensaje.id);
                    }
                });
            }
        }
    } catch (error) {
        console.error('❌ Error al cargar mensajes:', error);
    }
}

// Mostrar mensajes en el chat
function mostrarMensajes(mensajes) {
    const container = document.getElementById('mensajesContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    mensajes.forEach(mensaje => {
        const esMio = mensaje.remitente_id === usuarioActual.id;
        const claseAlineacion = esMio ? 'mensaje-propio' : 'mensaje-otro';
        
        let contenidoMensaje = '';
        
        if (mensaje.mensaje) {
            contenidoMensaje += `<p class="mb-1">${escapeHtml(mensaje.mensaje)}</p>`;
        }
        
        if (mensaje.archivo_url) {
            const esImagen = mensaje.archivo_tipo?.startsWith('image/');
            if (esImagen) {
                contenidoMensaje += `
                    <div class="mensaje-imagen">
                        <img src="${mensaje.archivo_url}" alt="${mensaje.archivo_nombre}" onclick="abrirImagenModal('${mensaje.archivo_url}')">
                    </div>
                `;
            } else {
                contenidoMensaje += `
                    <div class="mensaje-archivo">
                        <i class="bi bi-file-earmark"></i>
                        <a href="${mensaje.archivo_url}" target="_blank" download="${mensaje.archivo_nombre}">
                            ${mensaje.archivo_nombre}
                        </a>
                        <small class="text-muted">(${formatearTamanoArchivo(mensaje.archivo_tamano)})</small>
                    </div>
                `;
            }
        }
        
        const html = `
            <div class="mensaje ${claseAlineacion}" data-mensaje-id="${mensaje.id}">
                <div class="mensaje-contenido">
                    ${contenidoMensaje}
                    <div class="mensaje-info">
                        <small class="text-muted">${formatearFechaChat(mensaje.fecha_envio)}</small>
                        ${esMio ? `<i class="bi bi-check2${mensaje.leido ? '-all text-primary' : ''} ms-1"></i>` : ''}
                    </div>
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', html);
    });
    
    // Scroll al final
    container.scrollTop = container.scrollHeight;
}

// Agregar mensaje a la conversación actual
function agregarMensajeAConversacion(mensaje) {
    if (!conversacionActual) return;
    
    // Solo agregar si el mensaje es de/para la conversación actual
    const esDeConversacionActual = 
        (mensaje.remitente_id === conversacionActual.id && mensaje.destinatario_id === usuarioActual.id) ||
        (mensaje.remitente_id === usuarioActual.id && mensaje.destinatario_id === conversacionActual.id);
    
    if (!esDeConversacionActual) return;
    
    const container = document.getElementById('mensajesContainer');
    if (!container) return;
    
    const esMio = mensaje.remitente_id === usuarioActual.id;
    const claseAlineacion = esMio ? 'mensaje-propio' : 'mensaje-otro';
    
    let contenidoMensaje = '';
    
    if (mensaje.mensaje) {
        contenidoMensaje += `<p class="mb-1">${escapeHtml(mensaje.mensaje)}</p>`;
    }
    
    if (mensaje.archivo_url) {
        const esImagen = mensaje.archivo_tipo?.startsWith('image/');
        if (esImagen) {
            contenidoMensaje += `
                <div class="mensaje-imagen">
                    <img src="${mensaje.archivo_url}" alt="${mensaje.archivo_nombre}" onclick="abrirImagenModal('${mensaje.archivo_url}')">
                </div>
            `;
        } else {
            contenidoMensaje += `
                <div class="mensaje-archivo">
                    <i class="bi bi-file-earmark"></i>
                    <a href="${mensaje.archivo_url}" target="_blank" download="${mensaje.archivo_nombre}">
                        ${mensaje.archivo_nombre}
                    </a>
                    <small class="text-muted">(${formatearTamanoArchivo(mensaje.archivo_tamano)})</small>
                </div>
            `;
        }
    }
    
    const html = `
        <div class="mensaje ${claseAlineacion}" data-mensaje-id="${mensaje.id}">
            <div class="mensaje-contenido">
                ${contenidoMensaje}
                <div class="mensaje-info">
                    <small class="text-muted">${formatearFechaChat(mensaje.fecha_envio)}</small>
                    ${esMio ? `<i class="bi bi-check2 ms-1"></i>` : ''}
                </div>
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', html);
    container.scrollTop = container.scrollHeight;
}

// Enviar mensaje
function enviarMensaje() {
    const input = document.getElementById('mensajeInput');
    const archivoInput = document.getElementById('archivoInput');
    
    const mensaje = input.value.trim();
    const archivo = archivoInput.files[0];
    
    if (!mensaje && !archivo) {
        return;
    }
    
    if (!conversacionActual) {
        mostrarAlerta('warning', 'Selecciona una conversación primero');
        return;
    }
    
    // Si hay archivo, convertirlo a base64
    if (archivo) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const archivoData = {
                buffer: e.target.result.split(',')[1], // Remover el prefijo data:...;base64,
                nombre: archivo.name,
                tipo: archivo.type
            };
            
            socket.emit('enviar_mensaje', {
                destinatario_id: conversacionActual.id,
                mensaje: mensaje || null,
                archivo: archivoData
            });
        };
        reader.readAsDataURL(archivo);
    } else {
        socket.emit('enviar_mensaje', {
            destinatario_id: conversacionActual.id,
            mensaje: mensaje,
            archivo: null
        });
    }
    
    // Limpiar inputs
    input.value = '';
    archivoInput.value = '';
    document.getElementById('archivoPreview').classList.add('d-none');
}

// Detectar cuando el usuario está escribiendo
function onInputEscribiendo() {
    if (!conversacionActual) return;
    
    socket.emit('escribiendo', { destinatario_id: conversacionActual.id });
    
    // Cancelar timeout anterior
    if (escribiendoTimeout) {
        clearTimeout(escribiendoTimeout);
    }
    
    // Después de 2 segundos sin escribir, enviar evento de "dejó de escribir"
    escribiendoTimeout = setTimeout(() => {
        socket.emit('dejo_escribir', { destinatario_id: conversacionActual.id });
    }, 2000);
}

// Marcar mensaje como leído
function marcarMensajeComoLeido(mensajeId) {
    socket.emit('marcar_leido', { mensaje_id: mensajeId });
}

// Marcar mensaje visualmente como leído
function marcarMensajeVisualmenteComoLeido(mensajeId) {
    const mensajeElement = document.querySelector(`[data-mensaje-id="${mensajeId}"]`);
    if (mensajeElement) {
        const checkIcon = mensajeElement.querySelector('.bi-check2');
        if (checkIcon) {
            checkIcon.classList.remove('bi-check2');
            checkIcon.classList.add('bi-check2-all', 'text-primary');
        }
    }
}

// Mostrar indicador de "escribiendo..."
function mostrarIndicadorEscribiendo() {
    const container = document.getElementById('mensajesContainer');
    if (!container) return;
    
    // Remover indicador anterior si existe
    const indicadorAnterior = container.querySelector('.indicador-escribiendo');
    if (indicadorAnterior) {
        indicadorAnterior.remove();
    }
    
    const html = `
        <div class="mensaje mensaje-otro indicador-escribiendo">
            <div class="mensaje-contenido">
                <div class="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', html);
    container.scrollTop = container.scrollHeight;
}

// Ocultar indicador de "escribiendo..."
function ocultarIndicadorEscribiendo() {
    const indicador = document.querySelector('.indicador-escribiendo');
    if (indicador) {
        indicador.remove();
    }
}

// Mostrar modal para nueva conversación
async function mostrarModalNuevaConversacion() {
    try {
        const response = await fetch('/api/chat/usuarios-disponibles', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('coomotor_token')}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                mostrarListaUsuariosDisponibles(result.data);
            }
        }
    } catch (error) {
        console.error('❌ Error al cargar usuarios:', error);
    }
}

// Mostrar lista de usuarios disponibles
function mostrarListaUsuariosDisponibles(usuarios) {
    let html = '<div class="list-group">';
    
    usuarios.forEach(usuario => {
        html += `
            <button class="list-group-item list-group-item-action" onclick="iniciarConversacionCon(${usuario.id}, '${usuario.nombres}', '${usuario.apellidos}', '${usuario.rol}')">
                <div class="d-flex align-items-center">
                    <i class="bi bi-person-circle me-2" style="font-size: 2rem;"></i>
                    <div>
                        <h6 class="mb-0">${usuario.nombres} ${usuario.apellidos}</h6>
                        <small class="text-muted">${usuario.rol === 'admin' ? 'Administrador' : 'Conductor'}</small>
                    </div>
                </div>
            </button>
        `;
    });
    
    html += '</div>';
    
    // Mostrar en modal o en el área de conversaciones
    const modal = document.getElementById('modalNuevaConversacion');
    if (modal) {
        modal.querySelector('.modal-body').innerHTML = html;
        new bootstrap.Modal(modal).show();
    }
}

// Iniciar conversación con un usuario
function iniciarConversacionCon(userId, nombres, apellidos, rol) {
    // Cerrar modal si está abierto
    const modal = document.getElementById('modalNuevaConversacion');
    if (modal) {
        bootstrap.Modal.getInstance(modal)?.hide();
    }
    
    abrirConversacion(userId, nombres, apellidos, rol);
}

// Preview de archivo seleccionado
function onArchivoSeleccionado(input) {
    const preview = document.getElementById('archivoPreview');
    const nombreArchivo = document.getElementById('nombreArchivoPreview');
    
    if (input.files && input.files[0]) {
        const archivo = input.files[0];
        
        // Validar tamaño (máximo 10MB)
        if (archivo.size > 10 * 1024 * 1024) {
            mostrarAlerta('warning', 'El archivo no puede superar los 10MB');
            input.value = '';
            return;
        }
        
        nombreArchivo.textContent = archivo.name;
        preview.classList.remove('d-none');
    } else {
        preview.classList.add('d-none');
    }
}

// Cancelar archivo seleccionado
function cancelarArchivo() {
    document.getElementById('archivoInput').value = '';
    document.getElementById('archivoPreview').classList.add('d-none');
}

// Abrir imagen en modal
function abrirImagenModal(url) {
    const modal = document.getElementById('modalImagenGrande');
    if (modal) {
        modal.querySelector('img').src = url;
        new bootstrap.Modal(modal).show();
    }
}

// Utilidades
function formatearFechaChat(fecha) {
    if (!fecha) return '';
    
    const date = new Date(fecha);
    const hoy = new Date();
    const ayer = new Date(hoy);
    ayer.setDate(ayer.getDate() - 1);
    
    if (date.toDateString() === hoy.toDateString()) {
        return date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === ayer.toDateString()) {
        return 'Ayer ' + date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    } else {
        return date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }) + ' ' + 
               date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    }
}

function formatearTamanoArchivo(bytes) {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

function reproducirSonidoNotificacion() {
    // Crear un sonido simple con Web Audio API
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
        console.log('No se pudo reproducir sonido de notificación');
    }
}

function mostrarNotificacionMensaje(mensaje) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Nuevo mensaje', {
            body: `${mensaje.remitente_nombres}: ${mensaje.mensaje || 'Archivo adjunto'}`,
            icon: '/sistema-regalos/img/logo.png'
        });
    }
}

// Solicitar permiso para notificaciones
function solicitarPermisoNotificaciones() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

// Actualizar lista de conversaciones después de enviar/recibir mensaje
function actualizarListaConversaciones() {
    cargarConversaciones();
}

// Exportar funciones globales
window.inicializarChat = inicializarChat;
window.abrirConversacion = abrirConversacion;
window.enviarMensaje = enviarMensaje;
window.onInputEscribiendo = onInputEscribiendo;
window.mostrarModalNuevaConversacion = mostrarModalNuevaConversacion;
window.iniciarConversacionCon = iniciarConversacionCon;
window.onArchivoSeleccionado = onArchivoSeleccionado;
window.cancelarArchivo = cancelarArchivo;
window.abrirImagenModal = abrirImagenModal;
window.solicitarPermisoNotificaciones = solicitarPermisoNotificaciones;
