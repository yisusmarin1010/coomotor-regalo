// ============================================
// CLIENTE DE CHAT EN VIVO - COOMOTOR
// ============================================

class ChatClient {
    constructor(userId, rol) {
        this.userId = userId;
        this.rol = rol;
        this.ws = null;
        this.conversacionId = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.messageHandlers = [];
        this.isOpen = false;
    }

    connect() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/chat`;
        
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
            console.log('✅ Conectado al chat');
            this.isOpen = true;
            this.reconnectAttempts = 0;
            
            // Autenticar
            this.send({
                type: 'auth',
                userId: this.userId,
                rol: this.rol
            });
        };

        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.handleMessage(data);
            } catch (error) {
                console.error('Error procesando mensaje:', error);
            }
        };

        this.ws.onclose = () => {
            console.log('❌ Desconectado del chat');
            this.isOpen = false;
            this.attemptReconnect();
        };

        this.ws.onerror = (error) => {
            console.error('Error en WebSocket:', error);
        };
    }

    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`🔄 Reintentando conexión (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
            setTimeout(() => this.connect(), 3000 * this.reconnectAttempts);
        } else {
            console.error('❌ No se pudo reconectar al chat');
            this.notifyError('No se pudo conectar al chat. Recarga la página.');
        }
    }

    send(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        } else {
            console.error('WebSocket no está conectado');
        }
    }

    handleMessage(data) {
        switch (data.type) {
            case 'auth_success':
                console.log('✅ Autenticado en el chat');
                this.loadConversaciones();
                break;

            case 'mensaje':
                this.onNewMessage(data.data);
                break;

            case 'mensaje_enviado':
                this.onMessageSent(data.data);
                break;

            case 'typing':
                this.onTyping(data);
                break;

            case 'conversaciones':
                this.onConversaciones(data.data);
                break;

            case 'historial':
                this.onHistorial(data.data);
                break;

            case 'error':
                this.notifyError(data.message);
                break;
        }

        // Notificar a handlers registrados
        this.messageHandlers.forEach(handler => handler(data));
    }

    onMessageHandler(callback) {
        this.messageHandlers.push(callback);
    }

    enviarMensaje(mensaje) {
        this.send({
            type: 'mensaje',
            userId: this.userId,
            rol: this.rol,
            mensaje: mensaje,
            conversacionId: this.conversacionId
        });
    }

    notifyTyping() {
        this.send({
            type: 'typing',
            userId: this.userId,
            rol: this.rol,
            conversacionId: this.conversacionId
        });
    }

    loadConversaciones() {
        this.send({
            type: 'getConversaciones',
            userId: this.userId,
            rol: this.rol
        });
    }

    loadHistorial(conversacionId) {
        this.conversacionId = conversacionId;
        this.send({
            type: 'getHistorial',
            conversacionId: conversacionId
        });
    }

    onNewMessage(mensaje) {
        // Implementar en la UI
        console.log('Nuevo mensaje:', mensaje);
    }

    onMessageSent(mensaje) {
        // Implementar en la UI
        console.log('Mensaje enviado:', mensaje);
    }

    onTyping(data) {
        // Implementar en la UI
        console.log('Usuario escribiendo:', data);
    }

    onConversaciones(conversaciones) {
        // Implementar en la UI
        console.log('Conversaciones:', conversaciones);
    }

    onHistorial(mensajes) {
        // Implementar en la UI
        console.log('Historial:', mensajes);
    }

    notifyError(message) {
        console.error('Error:', message);
        alert(message);
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
        }
    }
}
