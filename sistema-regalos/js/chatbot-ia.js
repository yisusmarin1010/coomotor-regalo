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

        // Respuestas a saludos
        if (preguntaLower.match(/^(hola|hi|hey|buenos dias|buenas tardes|buenas noches|saludos)$/i)) {
            return `¡Hola! 😊 Bienvenido al sistema de regalos navideños de COOMOTOR.

Estoy aquí para ayudarte. Puedes preguntarme sobre:

• 📋 Cómo registrar a tus hijos
• 📄 Qué documentos necesitas subir
• 📅 Fechas importantes y plazos
• 🎁 Estado de tus postulaciones
• 🎂 Requisitos de edad
• 📍 Dónde y cuándo recoger los regalos

¿Qué necesitas saber?`;
        }

        // Respuestas sobre NO cumplir requisitos
        if (preguntaLower.match(/^(no|nop|nope)$/i) || preguntaLower.includes('no cumple') || preguntaLower.includes('no puede') || preguntaLower.includes('mayor de 12') || preguntaLower.includes('tiene 12') || preguntaLower.includes('cumple 12')) {
            return `😔 Lamento informarte que si tu hijo **no cumple con el requisito de edad**, no podrá participar este año.

📋 **Requisito estricto:**
• Solo niños **menores de 12 años** al 24 de diciembre de 2024

❌ **No pueden participar:**
• Niños que cumplan 12 años antes del 24 de diciembre
• Niños que ya tengan 12 años o más

💡 **Alternativas:**
• Si tienes otros hijos menores de 12 años, puedes registrarlos
• El próximo año podrás participar con otros hijos que cumplan el requisito

📞 **¿Tienes dudas?**
Si crees que hay un error o tienes una situación especial, contacta al administrador para que revise tu caso.

¿Tienes otros hijos que sí cumplan el requisito?`;
        }

        // Respuestas sobre SÍ cumplir requisitos
        if (preguntaLower.match(/^(si|sí|yes|claro|por supuesto|cumple|si cumple)$/i)) {
            return `¡Excelente! 🎉 Si tu hijo cumple con el requisito de edad, puedes continuar con el proceso.

📋 **Próximos pasos:**

1️⃣ **Registrar a tu hijo**
   • Ve a tu dashboard
   • Click en "Registrar Hijo"
   • Completa todos los datos

2️⃣ **Hacer la postulación**
   • Selecciona al hijo registrado
   • Click en "Postular para Regalo"

3️⃣ **Subir documentos**
   • Registro civil del niño
   • Foto del niño
   • Tu cédula (si eres conductor)

⏰ **Recuerda las fechas:**
• Registro: Hasta el 10 de diciembre
• Postulaciones: Hasta el 15 de diciembre

¿Necesitas ayuda con algún paso específico?`;
        }

        // Respuestas sobre contactar admin
        if (preguntaLower.includes('admin') || preguntaLower.includes('contactar') || preguntaLower.includes('hablar') || preguntaLower.includes('comunicar')) {
            return `Para contactar al administrador:

📧 **Opción 1: Desde tu dashboard**
1. Ve a la sección "Contacto" o "Mensajes"
2. Completa el formulario con tu consulta
3. El admin te responderá por email

📞 **Opción 2: Mensaje directo**
• Busca la sección de "Contacto" en el menú
• Describe tu problema o consulta
• Recibirás respuesta en 24-48 horas

💡 **Tip:** Antes de contactar al admin, intenta preguntarme a mí. Puedo resolver la mayoría de dudas al instante.

¿Tienes alguna pregunta específica que pueda ayudarte a resolver ahora?`;
        }

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
• Si tu hijo cumple 12 años **antes** del 24 de diciembre, NO puede participar
• Si cumple 12 años **después** del 24 de diciembre, SÍ puede participar
• El sistema calcula la edad automáticamente

✅ **Ejemplo que SÍ puede:**
• Niño nace: 25 de diciembre de 2012
• Edad al 24 dic 2024: 11 años ✅

❌ **Ejemplo que NO puede:**
• Niño nace: 20 de diciembre de 2012
• Edad al 24 dic 2024: 12 años ❌

💡 **¿Tu hijo cumple el requisito?**
Responde "sí" o "no" y te ayudo con los siguientes pasos.`;
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
        if (preguntaLower.includes('problema') || preguntaLower.includes('no puedo')) {
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

        // Respuestas sobre cómo funciona el sistema
        if (preguntaLower.includes('funciona') || preguntaLower.includes('proceso') || preguntaLower.includes('pasos')) {
            return `📋 **Así funciona el sistema de regalos:**

**PASO 1: Registrar hijo(s)** 👶
• Ve a tu dashboard
• Click en "Registrar Hijo"
• Completa los datos del niño

**PASO 2: Hacer postulación** 🎁
• Selecciona el hijo registrado
• Click en "Postular para Regalo"
• Confirma la postulación

**PASO 3: Subir documentos** 📄
• Sube registro civil del niño
• Sube foto del niño
• Sube tu cédula (si eres conductor)

**PASO 4: Esperar aprobación** ⏳
• El admin revisa tu postulación
• Recibirás email con el resultado

**PASO 5: Recoger regalo** 🎄
• Si aprueba, recibirás fecha y lugar
• Lleva tu cédula y código
• ¡Recoge el regalo!

¿Tienes dudas sobre algún paso específico?`;
        }

        // Respuestas sobre quién puede participar
        if (preguntaLower.includes('quién') || preguntaLower.includes('quien') || preguntaLower.includes('puedo') || preguntaLower.includes('participar')) {
            return `👥 **¿Quién puede participar?**

✅ **Pueden participar:**
• Todos los empleados de COOMOTOR
• Conductores (carretera, urbano, furgones)
• Personal administrativo
• Con hijos menores de 12 años

❌ **NO pueden participar:**
• Niños que cumplan 12 años antes del 24 de diciembre
• Hijos que no estén registrados en el sistema
• Empleados que no completen el proceso a tiempo

📋 **Requisitos:**
• Estar activo en COOMOTOR
• Registrar al niño antes del 10 de diciembre
• Subir documentos completos
• Esperar aprobación del admin

¿Tu caso cumple con los requisitos?`;
        }

        // Respuestas sobre cuántos hijos
        if (preguntaLower.includes('cuántos') || preguntaLower.includes('cuantos') || preguntaLower.includes('varios') || preguntaLower.includes('múltiples')) {
            return `👨‍👩‍👧‍👦 **Registro de múltiples hijos:**

✅ Puedes registrar a **todos tus hijos** menores de 12 años.

📋 **Proceso:**
1. Registra al primer hijo
2. Click en "Registrar Nuevo Hijo"
3. Repite para cada hijo
4. Postula a cada uno individualmente

⚠️ **Importante:**
• Cada hijo necesita su propia postulación
• Cada hijo necesita sus propios documentos
• Todos deben ser menores de 12 años

💡 **Tip:** Registra a todos tus hijos de una vez para no olvidar ninguno.

¿Cuántos hijos vas a registrar?`;
        }

        // Respuestas sobre ayuda general

        // Respuestas sobre ayuda general
        if (preguntaLower.includes('ayuda') || preguntaLower.includes('ayudar') || preguntaLower.includes('necesito')) {
            return `¡Claro! Estoy aquí para ayudarte. 😊

Dime específicamente qué necesitas:

🔹 **Si quieres registrar a tu hijo:**
   Pregunta: "¿Cómo registro a mi hijo?"

🔹 **Si necesitas saber qué documentos subir:**
   Pregunta: "¿Qué documentos necesito?"

🔹 **Si quieres saber las fechas:**
   Pregunta: "¿Cuándo entregan los regalos?"

🔹 **Si tienes dudas sobre la edad:**
   Pregunta: "¿Mi hijo puede participar?"

🔹 **Si quieres ver el estado:**
   Pregunta: "¿Cómo veo mi postulación?"

También puedo ayudarte con problemas técnicos, dudas sobre el proceso, o cualquier otra consulta.

¿Qué necesitas saber?`;
        }

        // Respuestas sobre no entender o no saber
        if (preguntaLower.includes('no entiendo') || preguntaLower.includes('no sé') || preguntaLower.includes('confundido') || preguntaLower.includes('explicar mejor')) {
            return `Entiendo que puede ser confuso. Déjame explicarte de forma más simple. 😊

🎁 **El sistema de regalos en 3 pasos:**

**PASO 1: Registrar** 👶
• Entra a tu dashboard
• Agrega los datos de tu hijo
• Solo menores de 12 años

**PASO 2: Postular** 📋
• Selecciona al hijo que registraste
• Haz click en "Postular"
• Sube los documentos que te pidan

**PASO 3: Esperar** ⏰
• El admin revisa tu postulación
• Te llega un email con la respuesta
• Si aprueban, te dicen cuándo recoger

💡 **¿Qué parte específica no entiendes?**
Dime y te explico con más detalle.`;
        }

        // Respuestas sobre problemas o errores
        if (preguntaLower.includes('error') || preguntaLower.includes('no funciona') || preguntaLower.includes('problema') || preguntaLower.includes('falla')) {
            return `😟 Lamento que tengas problemas. Vamos a solucionarlo:

🔧 **Soluciones rápidas:**

1️⃣ **Recarga la página**
   • Presiona Ctrl + F5 (Windows)
   • Presiona Cmd + Shift + R (Mac)

2️⃣ **Verifica tu conexión**
   • Asegúrate de tener internet
   • Intenta desde otro navegador

3️⃣ **Limpia el caché**
   • Borra datos del navegador
   • Cierra y vuelve a abrir

4️⃣ **Intenta desde otro dispositivo**
   • Usa tu celular
   • Prueba desde otra computadora

📞 **Si persiste el problema:**
• Describe exactamente qué error ves
• Toma captura de pantalla
• Contacta al administrador

¿Qué error específico estás viendo?`;
        }

        // Respuestas sobre gracias
        if (preguntaLower.match(/^(gracias|muchas gracias|thanks|thank you|ok|vale|perfecto|excelente|genial)$/i)) {
            return `¡De nada! 😊 Fue un placer ayudarte.

Si tienes más preguntas, aquí estaré. ¡Que tengas un excelente día! 🎄✨`;
        }

        // Respuestas sobre despedidas
        if (preguntaLower.match(/^(adios|adiós|chao|hasta luego|bye|nos vemos)$/i)) {
            return `¡Hasta pronto! 👋 

Recuerda que estoy disponible 24/7 para ayudarte con cualquier duda sobre el sistema de regalos.

¡Felices fiestas! 🎄🎁`;
        }

        // Respuesta genérica mejorada
        return `Hmm, no estoy seguro de entender exactamente qué necesitas. 🤔

Pero puedo ayudarte con estas cosas:

📋 **Registro:** "¿Cómo registro a mi hijo?"
📄 **Documentos:** "¿Qué documentos necesito?"
📅 **Fechas:** "¿Cuándo es el plazo?"
🎁 **Estado:** "¿Cómo veo mi postulación?"
🎂 **Edad:** "¿Mi hijo puede participar?"
📍 **Entrega:** "¿Dónde recojo el regalo?"
🔧 **Problemas:** "Tengo un error"
📞 **Contacto:** "¿Cómo contacto al admin?"

Intenta preguntarme de forma más específica, por ejemplo:
• "¿Cómo registro a mi hijo?"
• "¿Qué documentos necesito subir?"
• "¿Hasta cuándo puedo registrar?"

¿Qué te gustaría saber?`;
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
