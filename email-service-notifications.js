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
                trackingSettings: {
                    clickTracking: { enable: false },
                    openTracking: { enable: false }
                },
                mailSettings: {
                    sandboxMode: { enable: false }
                },
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


    // PLANTILLA: Postulación Aprobada - Diseño espectacular
    async notificarPostulacionAprobada(datos) {
        const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap');body{margin:0;padding:0;font-family:'Poppins',Arial,sans-serif}</style></head><body style="margin:0;padding:0;background:linear-gradient(135deg,#1e3c72 0%,#2a5298 100%)"><table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background:white;border-radius:20px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.3)"><tr><td style="background:linear-gradient(135deg,#2e8b57 0%,#c41e3a 100%);padding:50px 30px;text-align:center"><div style="font-size:80px;margin-bottom:10px">🎄</div><h1 style="margin:0;color:white;font-size:36px;font-weight:700;text-shadow:2px 2px 4px rgba(0,0,0,0.3)">COOMOTOR</h1><p style="margin:10px 0 0 0;color:rgba(255,255,255,0.9);font-size:16px">Sistema de Regalos Navideños 2024</p></td></tr><tr><td style="padding:50px 40px"><table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:30px"><tr><td align="center"><div style="background:linear-gradient(135deg,#11998e 0%,#38ef7d 100%);padding:30px;border-radius:15px;box-shadow:0 10px 30px rgba(17,153,142,0.3)"><div style="font-size:60px;margin-bottom:10px">🎉</div><h2 style="margin:0;color:white;font-size:28px;font-weight:700;text-shadow:1px 1px 2px rgba(0,0,0,0.2)">¡POSTULACIÓN APROBADA!</h2></div></td></tr></table><p style="margin:0 0 20px 0;font-size:18px;line-height:1.6;color:#333">Estimado/a <strong style="color:#2e8b57">${datos.nombreEmpleado}</strong>,</p><p style="margin:0 0 25px 0;font-size:16px;line-height:1.8;color:#555">Nos complace informarte que tu postulación para <strong style="color:#c41e3a">${datos.nombreHijo}</strong> ha sido <strong style="color:#11998e">APROBADA</strong> exitosamente.</p><table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#f093fb 0%,#f5576c 100%);border-radius:12px;margin:30px 0;overflow:hidden"><tr><td style="padding:25px;color:white"><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="font-size:14px;font-weight:600;opacity:0.9;padding-bottom:8px">INFORMACIÓN DEL NIÑO/A</td></tr><tr><td style="font-size:24px;font-weight:700">${datos.nombreHijo}</td></tr><tr><td style="font-size:16px;padding-top:5px"><strong>Edad:</strong> ${datos.edad} años 🎂</td></tr></table></td></tr></table><p style="margin:25px 0;font-size:16px;line-height:1.8;color:#555">Pronto recibirás más información sobre la <strong>fecha y lugar de entrega</strong> del regalo.</p><table width="100%" cellpadding="0" cellspacing="0" style="margin-top:40px"><tr><td align="center" style="padding:25px;background:linear-gradient(135deg,#ffecd2 0%,#fcb69f 100%);border-radius:12px"><p style="margin:0;font-size:20px;font-weight:600;color:#c41e3a">¡Felices Fiestas! 🎅🎁✨</p><p style="margin:10px 0 0 0;font-size:14px;color:#666">Que la magia de la Navidad llene tu hogar de alegría</p></td></tr></table></td></tr><tr><td style="background:linear-gradient(135deg,#2e8b57 0%,#1a5c3a 100%);padding:30px;text-align:center"><p style="margin:0 0 5px 0;font-size:14px;color:white;font-weight:600">COOMOTOR</p><p style="margin:0;font-size:12px;color:rgba(255,255,255,0.8)">Cooperativa de Motoristas del Huila</p><p style="margin:10px 0 0 0;font-size:12px;color:rgba(255,255,255,0.7)">Neiva, Huila - Colombia 🇨🇴</p></td></tr></table></td></tr></table></body></html>`;
        return await this.enviarEmail(datos.email, '🎉 ¡Postulación Aprobada! - COOMOTOR', html);
    }


    // PLANTILLA: Postulación Rechazada
    async notificarPostulacionRechazada(datos) {
        const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap');body{margin:0;padding:0;font-family:'Poppins',Arial,sans-serif}</style></head><body style="margin:0;padding:0;background:linear-gradient(135deg,#434343 0%,#000000 100%)"><table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background:white;border-radius:20px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.3)"><tr><td style="background:linear-gradient(135deg,#2e8b57 0%,#c41e3a 100%);padding:50px 30px;text-align:center"><div style="font-size:80px;margin-bottom:10px">🎄</div><h1 style="margin:0;color:white;font-size:36px;font-weight:700;text-shadow:2px 2px 4px rgba(0,0,0,0.3)">COOMOTOR</h1><p style="margin:10px 0 0 0;color:rgba(255,255,255,0.9);font-size:16px">Sistema de Regalos Navideños 2024</p></td></tr><tr><td style="padding:50px 40px"><table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:30px"><tr><td align="center"><div style="background:linear-gradient(135deg,#ff6b6b 0%,#ee5a6f 100%);padding:30px;border-radius:15px;box-shadow:0 10px 30px rgba(255,107,107,0.3)"><div style="font-size:60px;margin-bottom:10px">📋</div><h2 style="margin:0;color:white;font-size:28px;font-weight:700;text-shadow:1px 1px 2px rgba(0,0,0,0.2)">Actualización de Postulación</h2></div></td></tr></table><p style="margin:0 0 20px 0;font-size:18px;line-height:1.6;color:#333">Estimado/a <strong style="color:#2e8b57">${datos.nombreEmpleado}</strong>,</p><p style="margin:0 0 25px 0;font-size:16px;line-height:1.8;color:#555">Lamentamos informarte que tu postulación para <strong style="color:#c41e3a">${datos.nombreHijo}</strong> no ha sido aprobada en esta ocasión.</p>${datos.motivo ? `<table width="100%" cellpadding="0" cellspacing="0" style="background:#fff3cd;border-left:4px solid #ffc107;border-radius:8px;margin:25px 0"><tr><td style="padding:20px"><p style="margin:0 0 10px 0;font-size:14px;font-weight:600;color:#856404">MOTIVO:</p><p style="margin:0;font-size:15px;line-height:1.6;color:#856404">${datos.motivo}</p></td></tr></table>` : ''}<p style="margin:25px 0;font-size:16px;line-height:1.8;color:#555">Agradecemos tu comprensión y participación en nuestro programa de regalos navideños.</p><table width="100%" cellpadding="0" cellspacing="0" style="margin-top:40px"><tr><td align="center" style="padding:25px;background:linear-gradient(135deg,#ffecd2 0%,#fcb69f 100%);border-radius:12px"><p style="margin:0;font-size:18px;font-weight:600;color:#c41e3a">Gracias por tu participación</p><p style="margin:10px 0 0 0;font-size:14px;color:#666">COOMOTOR - Juntos construimos futuro</p></td></tr></table></td></tr><tr><td style="background:linear-gradient(135deg,#2e8b57 0%,#1a5c3a 100%);padding:30px;text-align:center"><p style="margin:0 0 5px 0;font-size:14px;color:white;font-weight:600">COOMOTOR</p><p style="margin:0;font-size:12px;color:rgba(255,255,255,0.8)">Cooperativa de Motoristas del Huila</p><p style="margin:10px 0 0 0;font-size:12px;color:rgba(255,255,255,0.7)">Neiva, Huila - Colombia 🇨🇴</p></td></tr></table></td></tr></table></body></html>`;
        return await this.enviarEmail(datos.email, '📋 Actualización de Postulación - COOMOTOR', html);
    }


    // PLANTILLA: Respuesta de Contacto
    async notificarRespuestaContacto(datos) {
        const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap');body{margin:0;padding:0;font-family:'Poppins',Arial,sans-serif}</style></head><body style="margin:0;padding:0;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%)"><table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background:white;border-radius:20px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.3)"><tr><td style="background:linear-gradient(135deg,#2e8b57 0%,#c41e3a 100%);padding:50px 30px;text-align:center"><div style="font-size:80px;margin-bottom:10px">💬</div><h1 style="margin:0;color:white;font-size:36px;font-weight:700;text-shadow:2px 2px 4px rgba(0,0,0,0.3)">COOMOTOR</h1><p style="margin:10px 0 0 0;color:rgba(255,255,255,0.9);font-size:16px">Respuesta a tu Mensaje</p></td></tr><tr><td style="padding:50px 40px"><table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:30px"><tr><td align="center"><div style="background:linear-gradient(135deg,#4facfe 0%,#00f2fe 100%);padding:30px;border-radius:15px;box-shadow:0 10px 30px rgba(79,172,254,0.3)"><div style="font-size:60px;margin-bottom:10px">📨</div><h2 style="margin:0;color:white;font-size:28px;font-weight:700;text-shadow:1px 1px 2px rgba(0,0,0,0.2)">¡Tenemos una Respuesta!</h2></div></td></tr></table><p style="margin:0 0 20px 0;font-size:18px;line-height:1.6;color:#333">Estimado/a <strong style="color:#2e8b57">${datos.nombreUsuario}</strong>,</p><p style="margin:0 0 25px 0;font-size:16px;line-height:1.8;color:#555">Hemos respondido a tu mensaje sobre: <strong style="color:#667eea">"${datos.asunto}"</strong></p><table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#a8edea 0%,#fed6e3 100%);border-radius:12px;margin:30px 0;overflow:hidden"><tr><td style="padding:30px"><p style="margin:0 0 15px 0;font-size:14px;font-weight:600;color:#2e8b57;text-transform:uppercase;letter-spacing:1px">💬 Nuestra Respuesta:</p><div style="background:white;padding:20px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.1)"><p style="margin:0;font-size:16px;line-height:1.8;color:#333">${datos.respuesta}</p></div></td></tr></table><p style="margin:25px 0;font-size:16px;line-height:1.8;color:#555">Si tienes más preguntas, no dudes en contactarnos nuevamente.</p><table width="100%" cellpadding="0" cellspacing="0" style="margin-top:40px"><tr><td align="center" style="padding:25px;background:linear-gradient(135deg,#ffecd2 0%,#fcb69f 100%);border-radius:12px"><p style="margin:0;font-size:18px;font-weight:600;color:#c41e3a">Gracias por comunicarte con nosotros</p><p style="margin:10px 0 0 0;font-size:14px;color:#666">Estamos aquí para ayudarte 🤝</p></td></tr></table></td></tr><tr><td style="background:linear-gradient(135deg,#2e8b57 0%,#1a5c3a 100%);padding:30px;text-align:center"><p style="margin:0 0 5px 0;font-size:14px;color:white;font-weight:600">COOMOTOR</p><p style="margin:0;font-size:12px;color:rgba(255,255,255,0.8)">Cooperativa de Motoristas del Huila</p><p style="margin:10px 0 0 0;font-size:12px;color:rgba(255,255,255,0.7)">Neiva, Huila - Colombia 🇨🇴</p></td></tr></table></td></tr></table></body></html>`;
        return await this.enviarEmail(datos.email, `💬 Respuesta: ${datos.asunto} - COOMOTOR`, html);
    }


    // PLANTILLA: Código de Recuperación
    async enviarCodigoRecuperacion(datos) {
        const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap');body{margin:0;padding:0;font-family:'Poppins',Arial,sans-serif}</style></head><body style="margin:0;padding:0;background:linear-gradient(135deg,#f093fb 0%,#f5576c 100%)"><table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background:white;border-radius:20px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.3)"><tr><td style="background:linear-gradient(135deg,#2e8b57 0%,#c41e3a 100%);padding:50px 30px;text-align:center"><div style="font-size:80px;margin-bottom:10px">🔐</div><h1 style="margin:0;color:white;font-size:36px;font-weight:700;text-shadow:2px 2px 4px rgba(0,0,0,0.3)">COOMOTOR</h1><p style="margin:10px 0 0 0;color:rgba(255,255,255,0.9);font-size:16px">Recuperación de Contraseña</p></td></tr><tr><td style="padding:50px 40px"><table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:30px"><tr><td align="center"><div style="background:linear-gradient(135deg,#fa709a 0%,#fee140 100%);padding:30px;border-radius:15px;box-shadow:0 10px 30px rgba(250,112,154,0.3)"><div style="font-size:60px;margin-bottom:10px">🔑</div><h2 style="margin:0;color:white;font-size:28px;font-weight:700;text-shadow:1px 1px 2px rgba(0,0,0,0.2)">Código de Verificación</h2></div></td></tr></table><p style="margin:0 0 30px 0;font-size:16px;line-height:1.8;color:#555;text-align:center">Usa este código para recuperar tu contraseña:</p><table width="100%" cellpadding="0" cellspacing="0" style="margin:30px 0"><tr><td align="center"><div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:40px;border-radius:15px;box-shadow:0 10px 30px rgba(102,126,234,0.4)"><p style="margin:0 0 15px 0;font-size:14px;color:rgba(255,255,255,0.9);font-weight:600;letter-spacing:2px">TU CÓDIGO ES:</p><div style="background:white;padding:25px 40px;border-radius:10px;margin:15px 0"><p style="margin:0;font-size:48px;font-weight:700;color:#667eea;letter-spacing:12px;font-family:monospace">${datos.codigo}</p></div><p style="margin:15px 0 0 0;font-size:13px;color:rgba(255,255,255,0.8)">⏰ Expira en 15 minutos</p></div></td></tr></table><table width="100%" cellpadding="0" cellspacing="0" style="background:#fff3cd;border-left:4px solid #ffc107;border-radius:8px;margin:30px 0"><tr><td style="padding:20px"><p style="margin:0 0 10px 0;font-size:14px;font-weight:600;color:#856404">⚠️ IMPORTANTE:</p><ul style="margin:0;padding-left:20px;color:#856404;font-size:14px;line-height:1.8"><li>No compartas este código con nadie</li><li>Si no solicitaste este cambio, ignora este correo</li><li>El código solo es válido por 15 minutos</li></ul></td></tr></table></td></tr><tr><td style="background:linear-gradient(135deg,#2e8b57 0%,#1a5c3a 100%);padding:30px;text-align:center"><p style="margin:0 0 5px 0;font-size:14px;color:white;font-weight:600">COOMOTOR</p><p style="margin:0;font-size:12px;color:rgba(255,255,255,0.8)">Cooperativa de Motoristas del Huila</p><p style="margin:10px 0 0 0;font-size:12px;color:rgba(255,255,255,0.7)">Neiva, Huila - Colombia 🇨🇴</p></td></tr></table></td></tr></table></body></html>`;
        return await this.enviarEmail(datos.email, '🔐 Código de Recuperación - COOMOTOR', html);
    }

    // PLANTILLA: Confirmación de Recuperación
    async enviarConfirmacionRecuperacion(datos) {
        const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap');body{margin:0;padding:0;font-family:'Poppins',Arial,sans-serif}</style></head><body style="margin:0;padding:0;background:linear-gradient(135deg,#11998e 0%,#38ef7d 100%)"><table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background:white;border-radius:20px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.3)"><tr><td style="background:linear-gradient(135deg,#2e8b57 0%,#c41e3a 100%);padding:50px 30px;text-align:center"><div style="font-size:80px;margin-bottom:10px">✅</div><h1 style="margin:0;color:white;font-size:36px;font-weight:700;text-shadow:2px 2px 4px rgba(0,0,0,0.3)">COOMOTOR</h1><p style="margin:10px 0 0 0;color:rgba(255,255,255,0.9);font-size:16px">Contraseña Actualizada</p></td></tr><tr><td style="padding:50px 40px"><table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:30px"><tr><td align="center"><div style="background:linear-gradient(135deg,#11998e 0%,#38ef7d 100%);padding:30px;border-radius:15px;box-shadow:0 10px 30px rgba(17,153,142,0.3)"><div style="font-size:60px;margin-bottom:10px">🎉</div><h2 style="margin:0;color:white;font-size:28px;font-weight:700;text-shadow:1px 1px 2px rgba(0,0,0,0.2)">¡Contraseña Cambiada!</h2></div></td></tr></table><p style="margin:0 0 25px 0;font-size:16px;line-height:1.8;color:#555;text-align:center">Tu contraseña ha sido actualizada exitosamente.</p><p style="margin:0 0 25px 0;font-size:16px;line-height:1.8;color:#555;text-align:center">Ya puedes iniciar sesión con tu nueva contraseña.</p><table width="100%" cellpadding="0" cellspacing="0" style="margin-top:40px"><tr><td align="center" style="padding:25px;background:linear-gradient(135deg,#ffecd2 0%,#fcb69f 100%);border-radius:12px"><p style="margin:0;font-size:18px;font-weight:600;color:#2e8b57">¡Todo listo! 🚀</p><p style="margin:10px 0 0 0;font-size:14px;color:#666">Tu cuenta está segura</p></td></tr></table></td></tr><tr><td style="background:linear-gradient(135deg,#2e8b57 0%,#1a5c3a 100%);padding:30px;text-align:center"><p style="margin:0 0 5px 0;font-size:14px;color:white;font-weight:600">COOMOTOR</p><p style="margin:0;font-size:12px;color:rgba(255,255,255,0.8)">Cooperativa de Motoristas del Huila</p><p style="margin:10px 0 0 0;font-size:12px;color:rgba(255,255,255,0.7)">Neiva, Huila - Colombia 🇨🇴</p></td></tr></table></td></tr></table></body></html>`;
        return await this.enviarEmail(datos.email, '✅ Contraseña Actualizada - COOMOTOR', html);
    }

    // Métodos adicionales (alertas y cambios de estado)
    async notificarAlertaPlazo(datos) {
        return { success: true };
    }

    async notificarCambioEstadoRegalo(datos) {
        return { success: true };
    }
}

module.exports = new NotificationService();
