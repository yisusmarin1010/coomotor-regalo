// ============================================
// UI DEL CHAT EN VIVO - COOMOTOR
// ============================================

class ChatUI {
    constructor(chatClient) {
        this.chatClient = chatClient;
        this.isOpen = false;
        this.currentConversacionId = null;
        this.unreadCount = 0;
        this.typingTimeout = null;
        
        this.init();
    }

    init() {
        this.createChatWidget();
        this.attachEventListeners();
        this.setupMessageHandlers();
    }

    createChatWidget() {
        const widget = document.createElement('div');
        widget.className = 'chat-widget';
        widget.innerHTML = `
            <button class="chat-button" id="chatToggle">
                <i class="bi bi-chat-dots-fill"></i>
                <span class="badge" id="chatBadge" style="display: none;">0</span>
            </button>
            
            <div class="chat-window" id="chatWindow">
                <div class="chat-header">
                    <div>
                        <h3>Chat de Soporte</h3>
                        <div class="status">
                            <i class="bi bi-circle-fill" style="font-size: 8px;"></i>
                            <span id="chatStatus">Conectando...</span>
                        </div>
                    </div>
                    <button class="close-btn" id="chatClose">
                        <i class="bi bi-x"></i>
                    </button>
                </div>
                
                ${this.chatClient.rol === 'admin' ? this.createConversacionesList() : ''}
                
                <div class="chat-messages" id="chatMessages">
                    <div class="chat-empty">
                        <i class="bi bi-chat-heart"></i>
                        <h4>¡Hola! 👋</h4>
                        <p>¿En qué podemos ayudarte hoy?</p>
                    </div>
                </div>
                
                <div class="typing-indicator" id="typingIndicator">
                    <i class="bi bi-three-dots"></i> Escribiendo...
                </div>
                
                <div class="chat-input-container">
                    <div class="chat-input-wrapper">
                        <input 
                            type="text" 
                            class="chat-input" 
                            id="chatInput" 
                            placeholder="Escribe tu mensaje..."
                            maxlength="500"
                        >
                        <button class="chat-send-btn" id="chatSend">
                            <i class="bi bi-send-fill"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(widget);
    }

    createConversacionesList() {
        return `
            <div class="chat-conversaciones" id="chatConversaciones">
                <div class="text-center py-3">
                    <div class="spinner-border spinner-border-sm" role="status"></div>
                    <p class="mt-2 mb-0" style="font-size: 12px; color: #64748b;">Cargando conversaciones...</p>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        document.getElementById('chatToggle').addEventListener('click', () => this.toggle());
        document.getElementById('chatClose').addEventListener('click', () => this.close());
        
        const input = document.getElementById('chatInput');
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });
        
        input.addEventListener('input', () => {
            this.handleTyping();
        });
        
        document.getElementById('chatSend').addEventListener('click', () => this.sendMessage());
    }

    setupMessageHandlers() {
        this.chatClient.onNewMessage = (mensaje) => this.addMessage(mensaje, false);
        this.chatClient.onMessageSent = (mensaje) => this.addMessage(mensaje, true);
        this.chatClient.onTyping = (data) => this.showTyping();
        this.chatClient.onConversaciones = (conversaciones) => this.renderConversaciones(conversaciones);
        this.chatClient.onHistorial = (mensajes) => this.renderHistorial(mensajes);
        
        this.chatClient.onMessageHandler((data) => {
            if (data.type === 'auth_success') {
                document.getElementById('chatStatus').textContent = 'En línea';
            }
        });
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        document.getElementById('chatWindow').classList.add('open');
        this.isOpen = true;
        this.resetUnreadCount();
        
        if (this.chatClient.rol !== 'admin') {
            this.chatClient.loadConversaciones();
        }
    }

    close() {
        document.getElementById('chatWindow').classList.remove('open');
        this.isOpen = false;
    }

    sendMessage() {
        const input = document.getElementById('chatInput');
        const mensaje = input.value.trim();
        
        if (!mensaje) return;
        
        this.chatClient.enviarMensaje(mensaje);
        input.value = '';
    }

    addMessage(mensaje, isSent) {
        const messagesContainer = document.getElementById('chatMessages');
        
        // Remover empty state si existe
        const emptyState = messagesContainer.querySelector('.chat-empty');
        if (emptyState) {
            emptyState.remove();
        }
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${isSent ? 'sent' : 'received'}`;
        
        const time = new Date(mensaje.fechaEnvio).toLocaleTimeString('es-CO', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        messageDiv.innerHTML = `
            ${!isSent && this.chatClient.rol === 'admin' ? `<div class="message-sender">${mensaje.usuario_nombre || 'Usuario'}</div>` : ''}
            <div class="message-bubble">${this.escapeHtml(mensaje.mensaje)}</div>
            <div class="message-time">${time}</div>
        `;
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        // Incrementar contador si la ventana está cerrada
        if (!this.isOpen && !isSent) {
            this.incrementUnreadCount();
        }
    }

    renderHistorial(mensajes) {
        const messagesContainer = document.getElementById('chatMessages');
        messagesContainer.innerHTML = '';
        
        if (mensajes.length === 0) {
            messagesContainer.innerHTML = `
                <div class="chat-empty">
                    <i class="bi bi-chat-heart"></i>
                    <h4>¡Hola! 👋</h4>
                    <p>¿En qué podemos ayudarte hoy?</p>
                </div>
            `;
            return;
        }
        
        mensajes.forEach(mensaje => {
            const isSent = mensaje.usuario_id === this.chatClient.userId;
            this.addMessage(mensaje, isSent);
        });
    }

    renderConversaciones(conversaciones) {
        const container = document.getElementById('chatConversaciones');
        
        if (!container) return;
        
        if (conversaciones.length === 0) {
            container.innerHTML = `
                <div class="text-center py-3">
                    <p style="font-size: 12px; color: #64748b; margin: 0;">No hay conversaciones activas</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = conversaciones.map(conv => `
            <div class="conversacion-item ${conv.id === this.currentConversacionId ? 'active' : ''}" 
                 data-id="${conv.id}" 
                 onclick="chatUI.selectConversacion(${conv.id})">
                <div class="conversacion-nombre">
                    ${conv.empleado_nombre}
                    ${conv.mensajes_no_leidos > 0 ? `<span class="conversacion-badge">${conv.mensajes_no_leidos}</span>` : ''}
                </div>
                <div class="conversacion-preview">
                    ${conv.ultimo_mensaje || 'Sin mensajes'}
                </div>
            </div>
        `).join('');
    }

    selectConversacion(conversacionId) {
        this.currentConversacionId = conversacionId;
        this.chatClient.loadHistorial(conversacionId);
        
        // Actualizar UI
        document.querySelectorAll('.conversacion-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-id="${conversacionId}"]`)?.classList.add('active');
    }

    handleTyping() {
        clearTimeout(this.typingTimeout);
        
        this.chatClient.notifyTyping();
        
        this.typingTimeout = setTimeout(() => {
            // Typing stopped
        }, 1000);
    }

    showTyping() {
        const indicator = document.getElementById('typingIndicator');
        indicator.classList.add('active');
        
        setTimeout(() => {
            indicator.classList.remove('active');
        }, 3000);
    }

    incrementUnreadCount() {
        this.unreadCount++;
        this.updateBadge();
    }

    resetUnreadCount() {
        this.unreadCount = 0;
        this.updateBadge();
    }

    updateBadge() {
        const badge = document.getElementById('chatBadge');
        if (this.unreadCount > 0) {
            badge.textContent = this.unreadCount;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Variables globales
let chatClient;
let chatUI;

// Inicializar chat cuando el usuario esté autenticado
function initChat(userId, rol) {
    chatClient = new ChatClient(userId, rol);
    chatUI = new ChatUI(chatClient);
    chatClient.connect();
}
