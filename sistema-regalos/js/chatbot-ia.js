// ============================================
// CHATBOT CON IA - SISTEMA REGALOS NAVIDEÑOS
// ============================================

class ChatbotIA {
    constructor() {
        this.conversacion = [];
        this.isOpen = false;
        this.apiKey = null; // Se configurará desde variables de entorno
        this.init();
    }

    init() {
        this.crearInterfaz();
        this.cargarHistorial();
    }

    crearInterfaz() {
        const chatbotHTML = `
            <!-- Botón flotante del chatbot -->
            <button id="chatbot-toggle" class="chatbot-toggle" onclick="chatbotIA.toggle()">
                <i class="bi bi-robot"></i>
                <span class="chatbot-badge" id="chatbot-badge" style="display: none;">1</span>
            </button>

            <!-- Ventana del chatbot -->
            <div id="chatbot-container" class="chatbot-container" style="display: none;">
                <div class="chatbot-header">
                    <div class="chatbot-header-info">
                        <div class="chatbot-avatar">
                            <i class="bi bi-robot"></i>
                        </div>
                        <div>
                            <h5 class="mb-0">Asistente COOMOTOR</h5>
                            <small class="chatbot-status">
                                <span class="status-dot"></span>
                                En línea
                            </small>
                        </div>
                    </div>
                    <div class="chatbot-header-actions">
                        <button class="btn-icon" onclick="chatbotIA.limpiarChat()" title="Nueva conversación">
                            <i class="bi bi-arrow-clockwise"></i>
                        </button>
                        <button class="btn-icon" onclick="chatbotIA.toggle()" title="Cerrar">
                            <i class="bi bi-x-lg"></i>
                        </button>
                    </div>
                </div>

                <div class="chatbot-messages" id="chatbot-messages">
                    <div class="message bot-message">
                        <div class="message-avatar">
                            <i class="bi bi-robot"></i>
                        </div>
                        <div class="message-content">
                            <p>¡Hola! 👋 Soy el asistente virtual de COOMOTOR.</p>
                            <p>Puedo ayudarte con:</p>
                            <ul>
                                <li>📋 Cómo registrar a tus hijos</li>
                                <li>📄 Qué documentos necesitas</li>
                                <li>🎁 Estado de tus postulaciones</li>
                                <li>📅 Fechas importantes</li>
                                <li>❓ Cualquier duda sobre el sistema</li>
                            </ul>
                            <p>¿En qué puedo ayudarte?</p>
                        </div>
                    </div>
                </div>

                <div class="chatbot-suggestions" id="chatbot-suggestions">
                    <button class="suggestion-btn" onclick="chatbotIA.enviarSugerencia('¿Cómo registro a mi hijo?')">
                        ¿Cómo registro a mi hijo?
                    </button>
                    <button class="suggestion-btn" onclick="chatbotIA.enviarSugerencia('¿Qué documentos necesito?')">
                        ¿Qué documentos necesito?
                    </button>
                    <button class="suggestion-btn" onclick="chatbotIA.enviarSugerencia('¿Cuándo entregan los regalos?')">
                        ¿Cuándo entregan los regalos?
                    </button>
                </div>

                <div class="chatbot-input">
                    <textarea 
                        id="chatbot-textarea" 
                        placeholder="Escribe tu pregunta aquí..."
                        rows="1"
                        onkeypress="if(event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); chatbotIA.enviarMensaje(); }"
                    ></textarea>
                    <button class="btn-send" onclick="chatbotIA.enviarMensaje()" id="btn-send">
                        <i class="bi bi-send-fill"></i>
                    </button>
                </div>

                <div class="chatbot-footer">
                    <small class="text-muted">
                        <i class="bi bi-shield-check"></i>
                        Tus datos están protegidos
                    </small>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', chatbotHTML);
    }

    toggle() {
        this.isOpen = !this.isOpen;
        const container = document.getElementById('chatbot-container');
        const badge = document.getElementById('chatbot-badge');
        
        if (this.isOpen) {
            container.style.display = 'flex';
            container.classList.add('chatbot-open');
            badge.style.display = 'none';
            this.scrollToBottom();
            document.getElementById('chatbot-textarea').focus();
        } else {
            container.classList.remove('chatbot-open');
            setTimeout(() => {
                container.style.display = 'none';
            }, 300);
        }
    }

    async enviarMensaje() {
        const textarea = document.getElementById('chatbot-textarea');
        const mensaje = textarea.value.trim();

        if (!mensaje) return;

        // Limpiar textarea
        textarea.value = '';
        textarea.style.height = 'auto';

        // Agregar mensaje del usuario
        this.agregarMensaje(mensaje, 'user');

        // Ocultar sugerencias
        document.getElementById('chatbot-suggestions').style.display = 'none';

        // Mostrar indicador de escritura
        this.mostrarEscribiendo();

        // Obtener respuesta de la IA
        try {
            const respuesta = await this.obtenerRespuestaIA(mensaje);
            this.quitarEscribiendo();
            this.agregarMensaje(respuesta, 'bot');
        } catch (error) {
            console.error('Error al obtener respuesta:', error);
            this.quitarEscribiendo();
            this.agregarMensaje('Lo siento, tuve un problema al procesar tu pregunta. ¿Podrías intentar de nuevo?', 'bot');
        }

        this.guardarHistorial();
    }

    enviarSugerencia(texto) {
        document.getElementById('chatbot-textarea').value = texto;
        this.enviarMensaje();
    }

    async obtenerRespuestaIA(pregunta) {
        // Contexto del sistema para la IA
        const contextoSistema = `
Eres un asistente virtual amigable y profesional de COOMOTOR, una empresa de transporte colombiana.
Estás ayudando con el sistema de regalos navideños 2024 para hijos de empleados.

INFORMACIÓN IMPORTANTE DEL SISTEMA:
- Solo pueden registrarse niños menores de 12 años
- Fechas clave:
  * Registro de hijos: Hasta el 10 de diciembre
  * Postulaciones: Hasta el 15 de diciembre
  * Revisión de documentos: 16-20 de diciembre
  * Entrega de regalos: 21-24 de diciembre

TIPOS DE CONDUCTORES:
- Carretera (sencillo, doble troque, tractomula)
- Urbano
- Furgones
- Administrativo

DOCUMENTOS REQUERIDOS:
- Registro civil del niño
- Foto del niño
- Cédula del empleado (para conductores)

PROCESO:
1. Registrar hijo(s) en el sistema
2. Hacer postulación para regalo
3. Subir documentos requeridos
4. Esperar aprobación del admin
5. Recoger regalo en fecha asignada

ESTADOS DE POSTULACIÓN:
- Pendiente: En revisión
- Documentos solicitados: Admin pidió documentos adicionales
- Aprobada: Lista para entrega
- Rechazada: No cumple requisitos
- Entregado: Regalo ya entregado

Responde de forma clara, amigable y concisa. Si no sabes algo, sé honesto y sugiere contactar al administrador.
Usa emojis ocasionalmente para ser más amigable. Habla en español colombiano.
`;

        // Intentar usar API de OpenAI (si está configurada)
        // Si no, usar respuestas predefinidas inteligentes
        
        const respuesta = await this.obtenerRespuestaLocal(pregunta, contextoSistema);
        return respuesta;
    }

    async obtenerRespuestaLocal(pregunta, contexto) {
        // Sistema de respuestas inteligente basado en palabras clave
        const preguntaLower = pregunta.toLowerCase();

        // Respuestas sobre registro
        if (preguntaLower.includes('registrar') || preguntaLower.includes('registro') || preguntaLower.includes('cómo') && preguntaLower.includes('hijo')) {
            return `Para registrar a tu hijo, sigue estos pasos:

1️⃣ Ve a tu dashboard de empleado
2️⃣ Click en "Registrar Hijo"
3️⃣ Completa el formulario con:
   • Nombres y apellidos
   • Fecha de nacimiento (debe ser menor de 12 años)
   • Tipo y número de documento
   • Género

4️⃣ Click en "Guardar"

✅ Una vez registrado, podrás hacer la postulación para el regalo.

¿Necesitas ayuda con algo más?`;
        }

        // Respuestas sobre documentos
        if (preguntaLower.includes('documento') || preguntaLower.includes('papeles') || preguntaLower.includes('necesito')) {
            return `Los documentos que necesitas son:

📄 **Documentos básicos:**
• Registro civil del niño
• Foto reciente del niño
• Cédula del empleado (para conductores)

📸 **Importante:**
• Las fotos deben ser claras y legibles
• Formatos aceptados: JPG, PNG, PDF
• Tamaño máximo: 5MB por archivo

💡 **Tip:** Puedes subirlos desde tu celular tomando fotos directamente.

¿Tienes alguna duda sobre los documentos?`;
        }

        // Respuestas sobre fechas
        if (preguntaLower.includes('fecha') || preguntaLower.includes('cuándo') || preguntaLower.includes('plazo')) {
            return `📅 **Fechas importantes 2024:**

✅ **Registro de hijos:** Hasta el 10 de diciembre
🎁 **Postulaciones:** Hasta el 15 de diciembre
📋 **Revisión:** 16 al 20 de diciembre
🎄 **Entrega de regalos:** 21 al 24 de diciembre

⏰ ¡No dejes todo para última hora! Registra a tus hijos cuanto antes.

¿Necesitas ayuda con el registro?`;
        }

        // Respuestas sobre estado
        if (preguntaLower.includes('estado') || preguntaLower.includes('postulación') || preguntaLower.includes('aprobada')) {
            return `Para ver el estado de tu postulación:

1️⃣ Ve a tu dashboard
2️⃣ En la sección "Mis Hijos" verás el estado de cada uno

📊 **Estados posibles:**
• ⏳ **Pendiente:** En revisión por el admin
• 📄 **Docs solicitados:** Necesitas subir documentos
• ✅ **Aprobada:** ¡Felicidades! Regalo confirmado
• 📦 **Entregado:** Ya recibiste el regalo

💡 Recibirás un email cuando cambie el estado.

¿Quieres saber algo más?`;
        }

        // Respuestas sobre edad
        if (preguntaLower.includes('edad') || preguntaLower.includes('años') || preguntaLower.includes('12')) {
            return `📏 **Requisito de edad:**

Solo pueden participar niños **menores de 12 años** al 24 de diciembre de 2024.

⚠️ **Importante:**
• Si tu hijo cumple 12 años antes del 24 de diciembre, NO puede participar
• El sistema calcula la edad automáticamente
• Debes ingresar la fecha de nacimiento correcta

¿Tu hijo cumple con el requisito de edad?`;
        }

        // Respuestas sobre entrega
        if (preguntaLower.includes('entrega') || preguntaLower.includes('recoger') || preguntaLower.includes('dónde')) {
            return `🎁 **Entrega de regalos:**

📍 **Lugar:** Se te notificará el punto de entrega cuando tu postulación sea aprobada

📅 **Fechas:** Del 21 al 24 de diciembre

📋 **Qué llevar:**
• Tu cédula
• Código de confirmación (te llegará por email)

💡 **Tip:** Puedes llevar a tu hijo para que reciba el regalo personalmente.

¿Tienes otra pregunta?`;
        }

        // Respuestas sobre problemas
        if (preguntaLower.includes('problema') || preguntaLower.includes('error') || preguntaLower.includes('no puedo')) {
            return `😟 Lamento que tengas problemas. Vamos a solucionarlo:

🔧 **Soluciones rápidas:**
1. Recarga la página (Ctrl + F5)
2. Verifica tu conexión a internet
3. Intenta desde otro navegador
4. Limpia el caché del navegador

📞 **Si persiste el problema:**
• Contacta al administrador
• Envía un mensaje desde la sección "Contacto"
• Describe exactamente qué error ves

¿Qué problema específico tienes?`;
        }

        // Respuestas sobre tipos de conductor
        if (preguntaLower.includes('conductor') || preguntaLower.includes('tipo') || preguntaLower.includes('carretera')) {
            return `🚛 **Tipos de conductores en COOMOTOR:**

• **Carretera:** Sencillo, doble troque, tractomula
• **Urbano:** Transporte urbano de pasajeros
• **Furgones:** Transporte de carga liviana
• **Administrativo:** Personal de oficina

💡 Selecciona el tipo correcto al registrarte, ya que puede afectar la prioridad de tu postulación.

¿Necesitas más información?`;
        }

        // Respuesta genérica inteligente
        return `Entiendo tu pregunta sobre "${pregunta}".

📋 **Puedo ayudarte con:**
• Cómo registrar a tus hijos
• Qué documentos necesitas
• Fechas importantes del proceso
• Estado de tus postulaciones
• Requisitos de edad
• Proceso de entrega

💬 ¿Podrías ser más específico sobre qué necesitas saber?

O si prefieres, puedes:
• Revisar la sección de ayuda en tu dashboard
• Contactar directamente al administrador
• Enviar un mensaje desde "Contacto"`;
    }

    agregarMensaje(texto, tipo) {
        const messagesContainer = document.getElementById('chatbot-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${tipo}-message`;

        if (tipo === 'bot') {
            messageDiv.innerHTML = `
                <div class="message-avatar">
                    <i class="bi bi-robot"></i>
                </div>
                <div class="message-content">
                    ${this.formatearTexto(texto)}
                    <small class="message-time">${this.obtenerHora()}</small>
                </div>
            `;
        } else {
            messageDiv.innerHTML = `
                <div class="message-content">
                    ${this.formatearTexto(texto)}
                    <small class="message-time">${this.obtenerHora()}</small>
                </div>
            `;
        }

        messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();

        // Guardar en historial
        this.conversacion.push({ tipo, texto, timestamp: new Date().toISOString() });
    }

    formatearTexto(texto) {
        // Convertir saltos de línea a <br>
        let formatted = texto.replace(/\n/g, '<br>');
        
        // Convertir listas con •
        formatted = formatted.replace(/• /g, '<br>• ');
        
        // Convertir texto en negrita **texto**
        formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        return formatted;
    }

    mostrarEscribiendo() {
        const messagesContainer = document.getElementById('chatbot-messages');
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot-message typing-indicator';
        typingDiv.id = 'typing-indicator';
        typingDiv.innerHTML = `
            <div class="message-avatar">
                <i class="bi bi-robot"></i>
            </div>
            <div class="message-content">
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        messagesContainer.appendChild(typingDiv);
        this.scrollToBottom();
    }

    quitarEscribiendo() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    scrollToBottom() {
        const messagesContainer = document.getElementById('chatbot-messages');
        setTimeout(() => {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 100);
    }

    obtenerHora() {
        const now = new Date();
        return now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    }

    limpiarChat() {
        if (confirm('¿Quieres iniciar una nueva conversación?')) {
            this.conversacion = [];
            const messagesContainer = document.getElementById('chatbot-messages');
            messagesContainer.innerHTML = `
                <div class="message bot-message">
                    <div class="message-avatar">
                        <i class="bi bi-robot"></i>
                    </div>
                    <div class="message-content">
                        <p>¡Hola! 👋 Soy el asistente virtual de COOMOTOR.</p>
                        <p>¿En qué puedo ayudarte?</p>
                    </div>
                </div>
            `;
            document.getElementById('chatbot-suggestions').style.display = 'flex';
            this.guardarHistorial();
        }
    }

    guardarHistorial() {
        try {
            localStorage.setItem('chatbot_historial', JSON.stringify(this.conversacion));
        } catch (error) {
            console.error('Error al guardar historial:', error);
        }
    }

    cargarHistorial() {
        try {
            const historial = localStorage.getItem('chatbot_historial');
            if (historial) {
                this.conversacion = JSON.parse(historial);
            }
        } catch (error) {
            console.error('Error al cargar historial:', error);
        }
    }
}

// Inicializar chatbot cuando cargue la página
let chatbotIA;
document.addEventListener('DOMContentLoaded', function() {
    chatbotIA = new ChatbotIA();
});
