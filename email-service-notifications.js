// ============================================
// SERVICIO DE NOTIFICACIONES CON SENDGRID
// ============================================

const sgMail = require('@sendgrid/mail');
require('dotenv').config();

class NotificationService {
    constructor() {
        this.initialized = false;
        this.initializeSendGrid();
    }

    initializeSendGrid() {
        try {
            const apiKey = process.env.SENDGRID_API_KEY;
            if (!apiKey) {
                console.log('⚠️  SendGrid no configurado');
                return;
            }
            sgMail.setApiKey(apiKey);
            this.initialized = true;
            console.log('📧 Servicio de notificaciones inicializado');
        } catch (error) {
            console.error('❌ Error:', error);
        }
    }

    async enviarEmail(to, subject, html) {
        if (!this.initialized) {
            console.log('⚠️  Email no enviado - SendGrid no configurado');
            return { success: false };
        }
        
        try {
            const msg = {
                to,
                from: {
                    email: process.env.SENDGRID_FROM_EMAIL || 'coomotorneivasistemaderegalos@gmail.com',
                    name: process.env.SENDGRID_FROM_NAME || 'COOMOTOR Regalos'
                },
                subject,
                html,
                // Configuraciones anti-spam
                trackingSettings: {
                    clickTracking: { enable: false },
                    openTracking: { enable: false }
                },
                mailSettings: {
                    sandboxMode: { enable: false }
                },
                // Agregar texto plano para mejor deliverability
                text: subject
            };
            
            await sgMail.send(msg);
            console.log(`📧 Email enviado a ${to}: ${subject}`);
            return { success: true };
        } catch (error) {
            console.error('❌ Error al enviar email:', error.message);
            if (error.response) {
                console.error('Detalles:', error.response.body);
            }
            return { success: false };
        }
    }

    async notificarPostulacionAprobada(datos) {
        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
                <tr>
                    <td align="center">
                        <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                            <tr>
                                <td style="background: linear-gradient(135deg, #2e8b57, #c41e3a); color: white; padding: 30px; text-align: center;">
                                    <h1 style="margin: 0; font-size: 28px;">� COOMOTOR</h1>
                                    <p style="margin: 10px 0 0 0; font-size: 14px;">Sistema de Regalos Navideños</p>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 40px 30px;">
                                    <table width="100%" cellpadding="0" cellspacing="0">
                                        <tr>
                                            <td style="background: #d4edda; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
                                                <h2 style="color: #28a745; margin: 0; font-size: 24px;">🎉 ¡Postulación Aprobada!</h2>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 20px 0;">
                                                <p style="margin: 0 0 15px 0; font-size: 16px; line-height: 1.5;">Estimado/a <strong>${datos.nombreEmpleado}</strong>,</p>
                                                <p style="margin: 0 0 15px 0; font-size: 16px; line-height: 1.5;">Nos complace informarte que tu postulación para <strong>${datos.nombreHijo}</strong> ha sido <strong style="color: #28a745;">APROBADA</strong>.</p>
                                                <p style="margin: 0 0 15px 0; font-size: 16px; line-height: 1.5;"><strong>Edad del niño/a:</strong> ${datos.edad} años</p>
                                                <p style="margin: 0 0 15px 0; font-size: 16px; line-height: 1.5;">Pronto recibirás más información sobre la entrega del regalo.</p>
                                                <p style="margin: 20px 0 0 0; font-size: 16px; line-height: 1.5;">¡Felices fiestas! 🎅🎁</p>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            <tr>
                                <td style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #dee2e6;">
                                    <p style="margin: 0; font-size: 12px; color: #6c757d;">COOMOTOR - Cooperativa de Motoristas del Huila</p>
                                    <p style="margin: 5px 0 0 0; font-size: 12px; color: #6c757d;">Neiva, Huila - Colombia</p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>`;
        
        return await this.enviarEmail(datos.email, '🎉 Postulación Aprobada - COOMOTOR', html);
    }

    async notificarPostulacionRechazada(datos) {
        const html = `
        <div style="font-family: Arial; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #2e8b57, #c41e3a); color: white; padding: 20px; text-align: center;">
                <h1>🎄 COOMOTOR</h1>
            </div>
            <div style="padding: 30px; background: white;">
                <p>Estimado/a <strong>${datos.nombreEmpleado}</strong>,</p>
                <p>Tu postulación para <strong>${datos.nombreHijo}</strong> no ha sido aprobada.</p>
                ${datos.motivo ? `<p><strong>Motivo:</strong> ${datos.motivo}</p>` : ''}
                <p>Gracias por tu comprensión.</p>
            </div>
        </div>`;
        
        return await this.enviarEmail(datos.email, '📋 Actualización de Postulación - COOMOTOR', html);
    }

    async notificarRespuestaContacto(datos) {
        const html = `
        <div style="font-family: Arial; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #2e8b57, #c41e3a); color: white; padding: 20px; text-align: center;">
                <h1>🎄 COOMOTOR</h1>
            </div>
            <div style="padding: 30px; background: white;">
                <p>Estimado/a <strong>${datos.nombreUsuario}</strong>,</p>
                <p>Respuesta a tu mensaje: <strong>"${datos.asunto}"</strong></p>
                <div style="background: #d1ecf1; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">💬 Respuesta:</h3>
                    <p>${datos.respuesta}</p>
                </div>
            </div>
        </div>`;
        
        return await this.enviarEmail(datos.email, `💬 Respuesta: ${datos.asunto}`, html);
    }

    async enviarCodigoRecuperacion(datos) {
        const html = `
        <div style="font-family: Arial; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #2e8b57, #c41e3a); color: white; padding: 20px; text-align: center;">
                <h1>🔐 COOMOTOR</h1>
                <h2>Recuperación de Contraseña</h2>
            </div>
            <div style="padding: 30px; background: white;">
                <p>Tu código de verificación:</p>
                <div style="background: #f8f9fa; padding: 30px; text-align: center; border: 3px solid #2e8b57; border-radius: 8px; margin: 20px 0;">
                    <div style="font-size: 36px; font-weight: bold; color: #2e8b57; letter-spacing: 8px; font-family: monospace;">${datos.codigo}</div>
                    <p style="color: #666; margin: 10px 0 0 0;">Expira en 15 minutos</p>
                </div>
                <p><strong>⚠️ No compartas este código con nadie</strong></p>
            </div>
        </div>`;
        
        return await this.enviarEmail(datos.email, '🔐 Código de Recuperación - COOMOTOR', html);
    }

    async enviarConfirmacionRecuperacion(datos) {
        const html = `
        <div style="font-family: Arial; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #2e8b57, #c41e3a); color: white; padding: 20px; text-align: center;">
                <h1>✅ COOMOTOR</h1>
            </div>
            <div style="padding: 30px; background: white;">
                <div style="background: #d4edda; padding: 20px; border-radius: 8px; text-align: center;">
                    <h2 style="color: #28a745;">✅ Contraseña Actualizada</h2>
                </div>
                <p>Tu contraseña ha sido cambiada exitosamente.</p>
                <p>Ya puedes iniciar sesión con tu nueva contraseña.</p>
            </div>
        </div>`;
        
        return await this.enviarEmail(datos.email, '✅ Contraseña Actualizada - COOMOTOR', html);
    }

    async notificarAlertaPlazo(datos) {
        const html = `
        <div style="font-family: Arial; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #2e8b57, #c41e3a); color: white; padding: 20px; text-align: center;">
                <h1>⏰ COOMOTOR</h1>
            </div>
            <div style="padding: 30px; background: white;">
                <div style="background: #fff3cd; padding: 20px; border-radius: 8px; text-align: center;">
                    <h2 style="color: #856404;">⏰ Recordatorio de Plazo</h2>
                </div>
                <p>Estimado/a <strong>${datos.nombreEmpleado}</strong>,</p>
                <p>${datos.mensaje}</p>
                <p><strong>Días restantes:</strong> ${datos.diasRestantes}</p>
            </div>
        </div>`;
        
        return await this.enviarEmail(datos.email, '⏰ Recordatorio de Plazo - COOMOTOR', html);
    }

    async notificarCambioEstadoRegalo(datos) {
        const html = `
        <div style="font-family: Arial; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #2e8b57, #c41e3a); color: white; padding: 20px; text-align: center;">
                <h1>🎁 COOMOTOR</h1>
            </div>
            <div style="padding: 30px; background: white;">
                <p>Estimado/a <strong>${datos.nombreEmpleado}</strong>,</p>
                <p>El estado del regalo para <strong>${datos.nombreHijo}</strong> ha cambiado.</p>
                <p><strong>Nuevo estado:</strong> ${datos.nuevoEstado}</p>
            </div>
        </div>`;
        
        return await this.enviarEmail(datos.email, '🎁 Actualización de Regalo - COOMOTOR', html);
    }
}

module.exports = new NotificationService();
