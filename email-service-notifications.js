// ============================================
// SERVICIO DE NOTIFICACIONES POR CORREO
// Sistema Completo de Notificaciones COOMOTOR
// Usando SendGrid para mejor compatibilidad
// ============================================

const sgMail = require('@sendgrid/mail');
require('dotenv').config();

class NotificationService {
    constructor() {
        this.initialized = false;
        this.initializeSendGrid();
    }

    // Inicializar SendGrid
    initializeSendGrid() {
        try {
            const apiKey = process.env.SENDGRID_API_KEY;
            
            if (!apiKey) {
                console.log('⚠️  SENDGRID_API_KEY no configurada - Los correos no se enviarán');
                return;
            }

            sgMail.setApiKey(apiKey);
            this.initialized = true;
            console.log('📧 Servicio de notificaciones inicializado');
        } catch (error) {
            console.error('❌ Error al inicializar notificaciones:', error);
        }
    }

    // Enviar email genérico
    async enviarEmail(opciones) {
        try {
            if (!this.initialized) {
                console.log('⚠️  SendGrid no configurado - Email no enviado');
                return { success: false, error: 'SendGrid no configurado' };
            }

            const msg = {
                to: opciones.to,
                from: {
                    email: process.env.SENDGRID_FROM_EMAIL || 'coomotorneivasistemaderegalos@gmail.com',
                    name: process.env.SENDGRID_FROM_NAME || 'COOMOTOR Regalos Navideños'
                },
                subject: opciones.subject,
                html: opciones.html
            };

            await sgMail.send(msg);
            
            console.log('📧 Email enviado:', opciones.subject);
            return { success: true };

        } catch (error) {
            console.error('❌ Error al enviar email:', error.message);
            return { success: false, error: error.message };
        }
    }
                        pass: process.env.SMTP_PASS
                    },
                    tls: { rejectUnauthorized: false }
                };
            }

            this.transporter = nodemailer.createTransport(config);
            console.log('📧 Servicio de notificaciones inicializado');
        } catch (error) {
            console.error('❌ Error al inicializar notificaciones:', error);
        }
    }

    // Plantilla base HTML
    generarPlantillaBase(titulo, contenido, colorHeader = '#2e8b57') {
        return `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa; }
                .container { background: white; border-radius: 10px; padding: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                .header { background: linear-gradient(135deg, ${colorHeader}, #c41e3a); color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center; margin: -30px -30px 30px -30px; }
                .header h1 { margin: 0; font-size: 24px; }
                .btn { display: inline-block; background: #2e8b57; color: white !important; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; font-weight: bold; }
                .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #ffd700; color: #666; }
                .alert { padding: 15px; border-radius: 8px; margin: 20px 0; }
                .alert-success { background: #d4edda; border-left: 4px solid #28a745; color: #155724; }
                .alert-danger { background: #f8d7da; border-left: 4px solid #dc3545; color: #721c24; }
                .alert-warning { background: #fff3cd; border-left: 4px solid #ffc107; color: #856404; }
                .alert-info { background: #d1ecf1; border-left: 4px solid #17a2b8; color: #0c5460; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎄 COOMOTOR - Regalos Navideños</h1>
                    <p>${titulo}</p>
                </div>
                ${contenido}
                <div class="footer">
                    <p><strong>🚌 COOMOTOR - Más de 60 años conectando Colombia</strong></p>
                    <p>Sistema de Regalos Navideños 2024</p>
                    <p style="font-size: 12px; color: #999;">Este es un correo automático. No responder.</p>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    // NOTIFICACIÓN: Postulación Aprobada
    async notificarPostulacionAprobada(usuario, hijo, observaciones = '') {
        try {
            if (!this.transporter) return { success: false, error: 'Servicio no disponible' };

            const contenido = `
                <div style="text-align: center; margin: 20px 0;">
                    <div style="font-size: 64px;">🎉</div>
                    <h2 style="color: #28a745;">¡Postulación Aprobada!</h2>
                </div>
                <p>Estimado/a <strong>${usuario.nombres} ${usuario.apellidos}</strong>,</p>
                <div class="alert alert-success">
                    <h3 style="margin-top: 0;">✅ ¡Excelentes Noticias!</h3>
                    <p>La postulación para <strong>${hijo.nombres} ${hijo.apellidos}</strong> ha sido <strong>APROBADA</strong>.</p>
                </div>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h4 style="color: #2e8b57; margin-top: 0;">📋 Detalles:</h4>
                    <p><strong>👶 Niño/a:</strong> ${hijo.nombres} ${hijo.apellidos}</p>
                    <p><strong>🎂 Edad:</strong> ${hijo.edad} años</p>
                    <p><strong>🎁 Estado:</strong> <span style="color: #28a745; font-weight: bold;">APROBADO</span></p>
                    ${observaciones ? `<p><strong>📝 Observaciones:</strong> ${observaciones}</p>` : ''}
                </div>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="http://localhost:3001/sistema-regalos/dashboards/empleado.html" class="btn">🎁 Ver Mi Panel</a>
                </div>
            `;

            const info = await this.transporter.sendMail({
                from: { name: 'COOMOTOR Regalos', address: process.env.SMTP_USER },
                to: usuario.correo,
                subject: '🎉 ¡Postulación Aprobada! - COOMOTOR',
                html: this.generarPlantillaBase('Postulación Aprobada', contenido, '#28a745')
            });

            console.log(`📧 ✅ Aprobación enviada a: ${usuario.correo}`);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('❌ Error notificación aprobación:', error);
            return { success: false, error: error.message };
        }
    }

    // NOTIFICACIÓN: Postulación Rechazada
    async notificarPostulacionRechazada(usuario, hijo, motivo = '') {
        try {
            if (!this.transporter) return { success: false, error: 'Servicio no disponible' };

            const contenido = `
                <div style="text-align: center; margin: 20px 0;">
                    <div style="font-size: 64px;">📋</div>
                    <h2 style="color: #dc3545;">Actualización de Postulación</h2>
                </div>
                <p>Estimado/a <strong>${usuario.nombres} ${usuario.apellidos}</strong>,</p>
                <div class="alert alert-warning">
                    <h3 style="margin-top: 0;">📋 Información Importante</h3>
                    <p>La postulación para <strong>${hijo.nombres} ${hijo.apellidos}</strong> no ha sido aprobada.</p>
                </div>
                ${motivo ? `
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h4 style="color: #dc3545; margin-top: 0;">📝 Motivo:</h4>
                    <p>${motivo}</p>
                </div>` : ''}
                <div class="alert alert-info">
                    <h4 style="margin-top: 0;">💡 ¿Qué puedes hacer?</h4>
                    <ul>
                        <li>Verifica que la información esté correcta</li>
                        <li>Contacta con el área administrativa</li>
                        <li>Puedes actualizar y volver a postular</li>
                    </ul>
                </div>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="http://localhost:3001/sistema-regalos/contacto.html" class="btn">📞 Contactar Soporte</a>
                </div>
            `;

            const info = await this.transporter.sendMail({
                from: { name: 'COOMOTOR Regalos', address: process.env.SMTP_USER },
                to: usuario.correo,
                subject: '📋 Actualización de Postulación - COOMOTOR',
                html: this.generarPlantillaBase('Actualización', contenido, '#dc3545')
            });

            console.log(`📧 📋 Rechazo enviado a: ${usuario.correo}`);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('❌ Error notificación rechazo:', error);
            return { success: false, error: error.message };
        }
    }

    // NOTIFICACIÓN: Respuesta a Contacto
    async notificarRespuestaContacto(usuario, asunto, respuesta) {
        try {
            if (!this.transporter) return { success: false, error: 'Servicio no disponible' };

            const contenido = `
                <div style="text-align: center; margin: 20px 0;">
                    <div style="font-size: 64px;">💬</div>
                    <h2 style="color: #2e8b57;">Respuesta a tu Mensaje</h2>
                </div>
                <p>Estimado/a <strong>${usuario.nombres} ${usuario.apellidos}</strong>,</p>
                <div class="alert alert-success">
                    <h3 style="margin-top: 0;">✅ Hemos Respondido</h3>
                    <p>Tu consulta sobre: <strong>"${asunto}"</strong></p>
                </div>
                <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
                    <h4 style="color: #2e8b57; margin-top: 0;">📝 Respuesta:</h4>
                    <p style="white-space: pre-wrap;">${respuesta}</p>
                </div>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="http://localhost:3001/sistema-regalos/dashboards/empleado.html" class="btn">📨 Ver Mis Mensajes</a>
                </div>
            `;

            const info = await this.transporter.sendMail({
                from: { name: 'COOMOTOR Regalos', address: process.env.SMTP_USER },
                to: usuario.correo,
                subject: `💬 Respuesta: ${asunto} - COOMOTOR`,
                html: this.generarPlantillaBase('Respuesta', contenido)
            });

            console.log(`📧 💬 Respuesta enviada a: ${usuario.correo}`);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('❌ Error notificación respuesta:', error);
            return { success: false, error: error.message };
        }
    }

    // NOTIFICACIÓN: Alerta de Plazo
    async notificarAlertaPlazo(usuario, diasRestantes, fechaLimite) {
        try {
            if (!this.transporter) return { success: false, error: 'Servicio no disponible' };

            const urgencia = diasRestantes <= 3 ? 'danger' : diasRestantes <= 7 ? 'warning' : 'info';
            const emoji = diasRestantes <= 3 ? '🚨' : diasRestantes <= 7 ? '⏰' : '📅';
            const color = urgencia === 'danger' ? '#dc3545' : urgencia === 'warning' ? '#ffc107' : '#17a2b8';

            const contenido = `
                <div style="text-align: center; margin: 20px 0;">
                    <div style="font-size: 64px;">${emoji}</div>
                    <h2 style="color: ${color};">¡Recordatorio de Plazo!</h2>
                </div>
                <p>Estimado/a <strong>${usuario.nombres} ${usuario.apellidos}</strong>,</p>
                <div class="alert alert-${urgencia}">
                    <h3 style="margin-top: 0;">${emoji} ¡Atención!</h3>
                    <p style="font-size: 18px;">Quedan <strong style="font-size: 24px;">${diasRestantes} día${diasRestantes !== 1 ? 's' : ''}</strong> para completar tu postulación.</p>
                </div>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h4 style="color: #2e8b57; margin-top: 0;">📅 Información:</h4>
                    <p><strong>Fecha límite:</strong> ${new Date(fechaLimite).toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    <p><strong>Días restantes:</strong> ${diasRestantes}</p>
                </div>
                <div class="alert alert-info">
                    <h4 style="margin-top: 0;">✅ ¿Qué debes hacer?</h4>
                    <ol>
                        <li>Ingresa a tu panel</li>
                        <li>Registra los datos de tus hijos</li>
                        <li>Completa la postulación</li>
                        <li>Verifica la información</li>
                    </ol>
                </div>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="http://localhost:3001/sistema-regalos/dashboards/empleado.html" class="btn">🎁 Completar Ahora</a>
                </div>
            `;

            const info = await this.transporter.sendMail({
                from: { name: 'COOMOTOR Regalos', address: process.env.SMTP_USER },
                to: usuario.correo,
                subject: `${emoji} Quedan ${diasRestantes} días - COOMOTOR`,
                html: this.generarPlantillaBase('Recordatorio', contenido, color)
            });

            console.log(`📧 ${emoji} Alerta enviada a: ${usuario.correo} (${diasRestantes} días)`);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('❌ Error alerta plazo:', error);
            return { success: false, error: error.message };
        }
    }

    // NOTIFICACIÓN: Cambio de Estado de Regalo
    async notificarCambioEstadoRegalo(usuario, hijo, nuevoEstado, observaciones = '') {
        try {
            if (!this.transporter) return { success: false, error: 'Servicio no disponible' };

            const estados = {
                'comprado': { emoji: '🛒', color: '#17a2b8', titulo: 'Regalo Comprado' },
                'en_camino': { emoji: '🚚', color: '#ffc107', titulo: 'Regalo en Camino' },
                'listo_entrega': { emoji: '📦', color: '#28a745', titulo: 'Listo para Entrega' },
                'entregado': { emoji: '✅', color: '#28a745', titulo: 'Regalo Entregado' }
            };

            const info = estados[nuevoEstado] || { emoji: '🎁', color: '#2e8b57', titulo: 'Actualización' };

            const contenido = `
                <div style="text-align: center; margin: 20px 0;">
                    <div style="font-size: 64px;">${info.emoji}</div>
                    <h2 style="color: ${info.color};">${info.titulo}</h2>
                </div>
                <p>Estimado/a <strong>${usuario.nombres} ${usuario.apellidos}</strong>,</p>
                <div class="alert alert-success">
                    <h3 style="margin-top: 0;">${info.emoji} Actualización</h3>
                    <p>El regalo para <strong>${hijo.nombres} ${hijo.apellidos}</strong> ha cambiado de estado.</p>
                </div>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h4 style="color: ${info.color}; margin-top: 0;">📋 Estado:</h4>
                    <p style="font-size: 20px; font-weight: bold; color: ${info.color};">${info.emoji} ${info.titulo.toUpperCase()}</p>
                    ${observaciones ? `<p><strong>📝 Info:</strong> ${observaciones}</p>` : ''}
                </div>
                ${nuevoEstado === 'listo_entrega' ? `
                <div class="alert alert-warning">
                    <h4 style="margin-top: 0;">📍 Entrega:</h4>
                    <ul>
                        <li>Presentar cédula</li>
                        <li>Verificar fecha y hora</li>
                        <li>Acudir al punto designado</li>
                    </ul>
                </div>` : ''}
                <div style="text-align: center; margin: 30px 0;">
                    <a href="http://localhost:3001/sistema-regalos/dashboards/empleado.html" class="btn">🎁 Ver Detalles</a>
                </div>
            `;

            const infoMail = await this.transporter.sendMail({
                from: { name: 'COOMOTOR Regalos', address: process.env.SMTP_USER },
                to: usuario.correo,
                subject: `${info.emoji} ${info.titulo} - COOMOTOR`,
                html: this.generarPlantillaBase(info.titulo, contenido, info.color)
            });

            console.log(`📧 ${info.emoji} Estado enviado a: ${usuario.correo}`);
            return { success: true, messageId: infoMail.messageId };
        } catch (error) {
            console.error('❌ Error notificación estado:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = new NotificationService();
