// ============================================
// SERVICIO DE NOTIFICACIONES SMS - VONAGE
// Sistema de envío de SMS para notificaciones COOMOTOR
// ============================================

const { Vonage } = require('@vonage/server-sdk');

class SMSService {
    constructor() {
        // Inicializar cliente de Vonage
        this.vonage = new Vonage({
            apiKey: process.env.VONAGE_API_KEY,
            apiSecret: process.env.VONAGE_API_SECRET
        });
        
        this.fromNumber = process.env.VONAGE_FROM_NUMBER || 'COOMOTOR';
        
        console.log('✅ Servicio SMS inicializado correctamente');
    }

    // ============================================
    // MÉTODO PRINCIPAL PARA ENVIAR SMS
    // ============================================
    async enviarSMS(telefono, mensaje) {
        try {
            // Validar que el teléfono tenga formato internacional
            const telefonoFormateado = this.formatearTelefono(telefono);
            
            if (!telefonoFormateado) {
                throw new Error('Número de teléfono inválido');
            }

            // Enviar SMS usando Vonage
            const response = await this.vonage.sms.send({
                to: telefonoFormateado,
                from: this.fromNumber,
                text: mensaje
            });

            if (response.messages[0].status === '0') {
                console.log(`✅ SMS enviado exitosamente a ${telefonoFormateado}`);
                return {
                    success: true,
                    messageId: response.messages[0]['message-id'],
                    telefono: telefonoFormateado
                };
            } else {
                throw new Error(response.messages[0]['error-text']);
            }

        } catch (error) {
            console.error('❌ Error al enviar SMS:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // ============================================
    // FORMATEAR TELÉFONO A FORMATO INTERNACIONAL
    // ============================================
    formatearTelefono(telefono) {
        // Remover espacios, guiones y paréntesis
        let tel = telefono.replace(/[\s\-\(\)]/g, '');
        
        // Si empieza con 57 (Colombia), agregar +
        if (tel.startsWith('57') && tel.length === 12) {
            return tel;
        }
        
        // Si empieza con 3 (celular Colombia), agregar código de país
        if (tel.startsWith('3') && tel.length === 10) {
            return '57' + tel;
        }
        
        // Si ya tiene +, removerlo
        if (tel.startsWith('+')) {
            return tel.substring(1);
        }
        
        return tel;
    }

    // ============================================
    // PLANTILLAS DE MENSAJES SMS
    // ============================================

    // SMS: Registro exitoso
    async notificarRegistro(datos) {
        const mensaje = `🎄 Bienvenido a COOMOTOR Regalos Navideños!

Hola ${datos.nombres},

Tu cuenta ha sido creada exitosamente. Ya puedes postular a tus hijos para recibir regalos esta Navidad.

Ingresa en: ${process.env.FRONTEND_URL}

¡Felices Fiestas! 🎅`;

        return await this.enviarSMS(datos.celular, mensaje);
    }

    // SMS: Postulación aprobada
    async notificarPostulacionAprobada(datos) {
        const mensaje = `🎉 ¡Postulación Aprobada! - COOMOTOR

Hola ${datos.nombres},

Tu postulación para ${datos.nombre_hijo} ha sido APROBADA.

Regalo: ${datos.tipo_regalo}
Próximos pasos: Revisa tu email para más detalles.

¡Feliz Navidad! 🎄`;

        return await this.enviarSMS(datos.celular, mensaje);
    }

    // SMS: Postulación rechazada
    async notificarPostulacionRechazada(datos) {
        const mensaje = `📋 Actualización de Postulación - COOMOTOR

Hola ${datos.nombres},

Tu postulación para ${datos.nombre_hijo} no pudo ser aprobada.

Motivo: ${datos.motivo_rechazo}

Contáctanos para más información.

COOMOTOR`;

        return await this.enviarSMS(datos.celular, mensaje);
    }

    // SMS: Documentos solicitados
    async notificarDocumentosSolicitados(datos) {
        const mensaje = `📄 Documentos Requeridos - COOMOTOR

Hola ${datos.nombres},

Necesitamos que subas los siguientes documentos para ${datos.nombre_hijo}:

${datos.documentos_faltantes}

Ingresa a tu panel: ${process.env.FRONTEND_URL}/dashboards/empleado.html

COOMOTOR`;

        return await this.enviarSMS(datos.celular, mensaje);
    }

    // SMS: Regalo listo para entrega
    async notificarRegaloListo(datos) {
        const mensaje = `🎁 ¡Tu Regalo está Listo! - COOMOTOR

Hola ${datos.nombres},

El regalo de ${datos.nombre_hijo} está listo para entrega.

Fecha: ${datos.fecha_entrega}
Lugar: ${datos.lugar_entrega}

¡Nos vemos pronto! 🎅`;

        return await this.enviarSMS(datos.celular, mensaje);
    }

    // SMS: Recordatorio de fecha límite
    async notificarRecordatorioFecha(datos) {
        const mensaje = `⏰ Recordatorio - COOMOTOR

Hola ${datos.nombres},

Recuerda que la fecha límite para ${datos.accion} es el ${datos.fecha_limite}.

No pierdas esta oportunidad.

Ingresa: ${process.env.FRONTEND_URL}

COOMOTOR`;

        return await this.enviarSMS(datos.celular, mensaje);
    }

    // SMS: Código de recuperación de contraseña
    async enviarCodigoRecuperacion(datos) {
        const mensaje = `🔐 Código de Recuperación - COOMOTOR

Tu código de verificación es: ${datos.codigo}

Este código expira en 15 minutos.

Si no solicitaste este código, ignora este mensaje.

COOMOTOR`;

        return await this.enviarSMS(datos.celular, mensaje);
    }

    // ============================================
    // ENVÍO MASIVO DE SMS
    // ============================================
    async enviarSMSMasivo(destinatarios, mensaje) {
        const resultados = [];
        
        for (const destinatario of destinatarios) {
            const resultado = await this.enviarSMS(destinatario.celular, mensaje);
            resultados.push({
                nombre: destinatario.nombres,
                celular: destinatario.celular,
                ...resultado
            });
            
            // Esperar 100ms entre envíos para no saturar la API
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        return resultados;
    }
}

// Exportar instancia única del servicio
module.exports = new SMSService();
