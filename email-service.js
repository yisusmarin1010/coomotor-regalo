// ============================================
// SERVICIO DE CORREO ELECTRÓNICO - COOMOTOR
// ============================================

const nodemailer = require('nodemailer');
require('dotenv').config();

class EmailService {
    constructor() {
        this.transporter = null;
        this.initializeTransporter();
    }

    // Inicializar el transportador de correoo
    initializeTransporter() {
        try {
            const email = process.env.SMTP_USER;
            let config = {};

            // Detectar proveedor automáticamente basado en el email
            if (email && email.includes('@gmail.com')) {
                // Configuración para Gmail
                config = {
                    service: 'gmail',
                    host: 'smtp.gmail.com',
                    port: 587,
                    secure: false,
                    auth: {
                        user: process.env.SMTP_USER,
                        pass: process.env.SMTP_PASS
                    },
                    tls: {
                        rejectUnauthorized: false
                    }
                };
                console.log('📧 Configurando para Gmail...');
            } else if (email && (email.includes('@outlook.com') || email.includes('@hotmail.com') || email.includes('@live.com'))) {
                // Configuración para Microsoft Outlook
                config = {
                    host: 'smtp-mail.outlook.com',
                    port: 587,
                    secure: false,
                    auth: {
                        user: process.env.SMTP_USER,
                        pass: process.env.SMTP_PASS
                    },
                    tls: {
                        ciphers: 'SSLv3',
                        rejectUnauthorized: false
                    }
                };
                console.log('📧 Configurando para Microsoft Outlook...');
            } else {
                // Configuración manual desde variables de entorno
                config = {
                    host: process.env.SMTP_HOST || 'smtp.gmail.com',
                    port: parseInt(process.env.SMTP_PORT) || 587,
                    secure: process.env.SMTP_SECURE === 'true',
                    auth: {
                        user: process.env.SMTP_USER,
                        pass: process.env.SMTP_PASS
                    },
                    tls: {
                        rejectUnauthorized: false
                    }
                };
                console.log('📧 Configurando con parámetros manuales...');
            }

            this.transporter = nodemailer.createTransport(config);
            console.log('📧 Servicio de correo inicializado correctamente');
        } catch (error) {
            console.error('❌ Error al inicializar servicio de correo:', error);
        }
    }

    // Verificar conexión SMTP
    async verificarConexion() {
        try {
            await this.transporter.verify();
            console.log('✅ Conexión SMTP verificada exitosamente');
            return true;
        } catch (error) {
            console.error('❌ Error en conexión SMTP:', error);
            return false;
        }
    }

    // Obtener correo de destino según el tipo de contacto
    obtenerCorreoDestino(tipoContacto) {
        const correos = {
            'queja': process.env.EMAIL_QUEJAS || process.env.EMAIL_SOPORTE_GENERAL,
            'sugerencia': process.env.EMAIL_SUGERENCIAS || process.env.EMAIL_SOPORTE_GENERAL,
            'consulta': process.env.EMAIL_SOPORTE_GENERAL,
            'felicitacion': process.env.EMAIL_ADMIN || process.env.EMAIL_SOPORTE_GENERAL,
            'problema_tecnico': process.env.EMAIL_ADMIN || process.env.EMAIL_SOPORTE_GENERAL,
            'otro': process.env.EMAIL_SOPORTE_GENERAL
        };

        return correos[tipoContacto] || process.env.EMAIL_SOPORTE_GENERAL;
    }

    // Generar HTML para el correo de contacto
    generarHTMLContacto(datosContacto) {
        const tipoIcons = {
            'queja': '🚨',
            'sugerencia': '💡',
            'consulta': '❓',
            'felicitacion': '🎉',
            'problema_tecnico': '🔧',
            'otro': '📋'
        };

        const prioridadColors = {
            'urgente': '#dc3545',
            'alta': '#fd7e14',
            'media': '#0dcaf0',
            'baja': '#198754'
        };

        const icon = tipoIcons[datosContacto.tipoContacto] || '📋';
        const prioridadColor = prioridadColors[datosContacto.prioridad] || '#6c757d';

        return `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Nuevo Mensaje de Contacto - COOMOTOR</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #f8f9fa;
                }
                .container {
                    background: white;
                    border-radius: 10px;
                    padding: 30px;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                }
                .header {
                    background: linear-gradient(135deg, #2563eb, #c41e3a);
                    color: white;
                    padding: 20px;
                    border-radius: 10px 10px 0 0;
                    text-align: center;
                    margin: -30px -30px 30px -30px;
                }
                .header h1 {
                    margin: 0;
                    font-size: 24px;
                }
                .tipo-contacto {
                    display: inline-block;
                    background: ${prioridadColor};
                    color: white;
                    padding: 8px 16px;
                    border-radius: 20px;
                    font-weight: bold;
                    margin: 10px 0;
                    text-transform: uppercase;
                }
                .info-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                    margin: 20px 0;
                }
                .info-item {
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 8px;
                    border-left: 4px solid #ffd700;
                }
                .info-label {
                    font-weight: bold;
                    color: #2563eb;
                    margin-bottom: 5px;
                }
                .mensaje-box {
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 8px;
                    border-left: 4px solid #c41e3a;
                    margin: 20px 0;
                }
                .footer {
                    text-align: center;
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 2px solid #ffd700;
                    color: #666;
                }
                .btn {
                    display: inline-block;
                    background: #2563eb;
                    color: white;
                    padding: 12px 24px;
                    text-decoration: none;
                    border-radius: 5px;
                    margin: 10px 0;
                    font-weight: bold;
                }
                @media (max-width: 600px) {
                    .info-grid {
                        grid-template-columns: 1fr;
                    }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎄 COOMOTOR - Regalos Navideños</h1>
                    <p>Nuevo Mensaje de Contacto Recibido</p>
                </div>

                <div style="text-align: center; margin: 20px 0;">
                    <span class="tipo-contacto">
                        ${icon} ${datosContacto.tipoContacto.toUpperCase()} - ${datosContacto.prioridad.toUpperCase()}
                    </span>
                </div>

                <h2 style="color: #2563eb; margin-bottom: 20px;">
                    📝 ${datosContacto.asunto}
                </h2>

                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">👤 Nombre Completo</div>
                        <div>${datosContacto.nombres} ${datosContacto.apellidos}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">🆔 Cédula</div>
                        <div>${datosContacto.cedula}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">📧 Correo Electrónico</div>
                        <div><a href="mailto:${datosContacto.email}">${datosContacto.email}</a></div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">📞 Teléfono</div>
                        <div><a href="tel:${datosContacto.telefono}">${datosContacto.telefono}</a></div>
                    </div>
                </div>

                <div class="mensaje-box">
                    <div class="info-label">💬 Mensaje Detallado:</div>
                    <p style="margin: 10px 0 0 0; white-space: pre-wrap;">${datosContacto.mensaje}</p>
                </div>

                <div style="text-align: center; margin: 30px 0;">
                    <a href="http://localhost:3000/sistema-regalos/dashboards/admin.html" class="btn">
                        🎛️ Ir al Panel Administrativo
                    </a>
                </div>

                <div style="background: #e9ecef; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <h4 style="color: #2563eb; margin-top: 0;">📋 Información del Ticket:</h4>
                    <p><strong>Ticket ID:</strong> ${datosContacto.ticket || 'COOMOTOR-' + Date.now()}</p>
                    <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-CO')}</p>
                    <p><strong>Estado:</strong> Pendiente de revisión</p>
                </div>

                <div class="footer">
                    <p><strong>🚌 COOMOTOR - Más de 60 años conectando Colombia</strong></p>
                    <p>Sistema de Regalos Navideños 2024</p>
                    <p style="font-size: 12px; color: #999;">
                        Este es un correo automático del sistema. Por favor no responder a esta dirección.
                    </p>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    // Enviar correo de notificación de contacto
    async enviarNotificacionContacto(datosContacto) {
        try {
            if (!this.transporter) {
                throw new Error('Transportador de correo no inicializado');
            }

            const correoDestino = this.obtenerCorreoDestino(datosContacto.tipoContacto);
            const tipoTexto = datosContacto.tipoContacto.charAt(0).toUpperCase() + datosContacto.tipoContacto.slice(1);
            
            const mailOptions = {
                from: {
                    name: process.env.EMAIL_FROM_NAME || 'Sistema COOMOTOR Regalos Navideños',
                    address: process.env.EMAIL_FROM_ADDRESS || process.env.SMTP_USER
                },
                to: correoDestino,
                cc: process.env.EMAIL_ADMIN, // Copia al admin
                subject: `🎄 COOMOTOR - Nueva ${tipoTexto}: ${datosContacto.asunto}`,
                html: this.generarHTMLContacto(datosContacto),
                text: this.generarTextoPlano(datosContacto)
            };

            const info = await this.transporter.sendMail(mailOptions);
            
            console.log('📧 Correo de contacto enviado exitosamente:');
            console.log(`   📨 Para: ${correoDestino}`);
            console.log(`   📋 Tipo: ${datosContacto.tipoContacto}`);
            console.log(`   🎯 Prioridad: ${datosContacto.prioridad}`);
            console.log(`   📝 Asunto: ${datosContacto.asunto}`);
            console.log(`   🆔 Message ID: ${info.messageId}`);

            return {
                success: true,
                messageId: info.messageId,
                destinatario: correoDestino
            };

        } catch (error) {
            console.error('❌ Error al enviar correo de contacto:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Generar versión de texto plano
    generarTextoPlano(datosContacto) {
        return `
COOMOTOR - SISTEMA DE REGALOS NAVIDEÑOS
Nuevo Mensaje de Contacto Recibido

TIPO: ${datosContacto.tipoContacto.toUpperCase()}
PRIORIDAD: ${datosContacto.prioridad.toUpperCase()}
ASUNTO: ${datosContacto.asunto}

DATOS DEL CONTACTO:
- Nombre: ${datosContacto.nombres} ${datosContacto.apellidos}
- Cédula: ${datosContacto.cedula}
- Email: ${datosContacto.email}
- Teléfono: ${datosContacto.telefono}

MENSAJE:
${datosContacto.mensaje}

INFORMACIÓN DEL TICKET:
- Ticket ID: ${datosContacto.ticket || 'COOMOTOR-' + Date.now()}
- Fecha: ${new Date().toLocaleString('es-CO')}
- Estado: Pendiente de revisión

---
COOMOTOR - Más de 60 años conectando Colombia
Sistema de Regalos Navideños 2024
        `;
    }

    // Enviar correo de confirmación al usuario
    async enviarConfirmacionUsuario(datosContacto) {
        try {
            if (!this.transporter) {
                throw new Error('Transportador de correo no inicializado');
            }

            const mailOptions = {
                from: {
                    name: process.env.EMAIL_FROM_NAME || 'Sistema COOMOTOR Regalos Navideños',
                    address: process.env.EMAIL_FROM_ADDRESS || process.env.SMTP_USER
                },
                to: datosContacto.email,
                subject: `🎄 COOMOTOR - Hemos recibido tu mensaje: ${datosContacto.asunto}`,
                html: this.generarHTMLConfirmacion(datosContacto),
                text: this.generarTextoConfirmacion(datosContacto)
            };

            const info = await this.transporter.sendMail(mailOptions);
            
            console.log('📧 Correo de confirmación enviado al usuario:');
            console.log(`   📨 Para: ${datosContacto.email}`);
            console.log(`   🆔 Message ID: ${info.messageId}`);

            return {
                success: true,
                messageId: info.messageId
            };

        } catch (error) {
            console.error('❌ Error al enviar confirmación al usuario:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Generar HTML de confirmación para el usuario
    generarHTMLConfirmacion(datosContacto) {
        return `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Confirmación de Mensaje - COOMOTOR</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #f8f9fa;
                }
                .container {
                    background: white;
                    border-radius: 10px;
                    padding: 30px;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                }
                .header {
                    background: linear-gradient(135deg, #2563eb, #c41e3a);
                    color: white;
                    padding: 20px;
                    border-radius: 10px 10px 0 0;
                    text-align: center;
                    margin: -30px -30px 30px -30px;
                }
                .success-icon {
                    font-size: 48px;
                    margin: 20px 0;
                }
                .ticket-box {
                    background: #e8f5e8;
                    border: 2px solid #28a745;
                    border-radius: 8px;
                    padding: 20px;
                    text-align: center;
                    margin: 20px 0;
                }
                .footer {
                    text-align: center;
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 2px solid #ffd700;
                    color: #666;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎄 COOMOTOR - Regalos Navideños</h1>
                    <p>Confirmación de Mensaje Recibido</p>
                </div>

                <div style="text-align: center;">
                    <div class="success-icon">✅</div>
                    <h2 style="color: #28a745;">¡Mensaje Recibido Exitosamente!</h2>
                </div>

                <p>Estimado/a <strong>${datosContacto.nombres} ${datosContacto.apellidos}</strong>,</p>

                <p>Hemos recibido tu mensaje sobre: <strong>"${datosContacto.asunto}"</strong></p>

                <p>Nuestro equipo de soporte revisará tu ${datosContacto.tipoContacto} y te contactaremos pronto a través del correo <strong>${datosContacto.email}</strong> o al teléfono <strong>${datosContacto.telefono}</strong>.</p>

                <div class="ticket-box">
                    <h3 style="margin-top: 0; color: #28a745;">📋 Número de Ticket</h3>
                    <h2 style="margin: 10px 0; color: #2563eb; font-family: monospace;">${datosContacto.ticket || 'COOMOTOR-' + Date.now()}</h2>
                    <p style="margin-bottom: 0;">Guarda este número para futuras referencias</p>
                </div>

                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <h4 style="color: #2563eb; margin-top: 0;">⏰ Tiempos de Respuesta:</h4>
                    <ul style="margin: 0;">
                        <li><strong>Consultas generales:</strong> 24-48 horas</li>
                        <li><strong>Quejas y problemas:</strong> 12-24 horas</li>
                        <li><strong>Casos urgentes:</strong> 2-6 horas</li>
                    </ul>
                </div>

                <div class="footer">
                    <p><strong>🚌 COOMOTOR - Más de 60 años conectando Colombia</strong></p>
                    <p>Gracias por ser parte de nuestra gran familia navideña 🎄</p>
                    <p style="font-size: 12px; color: #999;">
                        Si tienes preguntas adicionales, puedes contactarnos en soporte@coomotor.com
                    </p>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    // Generar texto plano de confirmación
    generarTextoConfirmacion(datosContacto) {
        return `
COOMOTOR - SISTEMA DE REGALOS NAVIDEÑOS
Confirmación de Mensaje Recibido

Estimado/a ${datosContacto.nombres} ${datosContacto.apellidos},

Hemos recibido tu mensaje sobre: "${datosContacto.asunto}"

Nuestro equipo de soporte revisará tu ${datosContacto.tipoContacto} y te contactaremos pronto.

NÚMERO DE TICKET: ${datosContacto.ticket || 'COOMOTOR-' + Date.now()}
(Guarda este número para futuras referencias)

TIEMPOS DE RESPUESTA:
- Consultas generales: 24-48 horas
- Quejas y problemas: 12-24 horas  
- Casos urgentes: 2-6 horas

Gracias por ser parte de nuestra gran familia navideña.

---
COOMOTOR - Más de 60 años conectando Colombia
Sistema de Regalos Navideños 2024
        `;
    }
}

// Exportar instancia única del servicio
module.exports = new EmailService();