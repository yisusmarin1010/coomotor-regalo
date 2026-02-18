// ============================================
// SERVICIO DE NOTIFICACIONES CON SENDGRID
// Sistema de Plantillas HTML Mejoradas
// ============================================

const sgMail = require('@sendgrid/mail');
const templateLoader = require('./email-template-loader');
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
            console.log('✅ Servicio de notificaciones por email inicializado correctamente');
            console.log('✨ Sistema de plantillas HTML mejoradas cargado');
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

    // ============================================
    // PLANTILLAS DE POSTULACIONES
    // ============================================

    async notificarPostulacionAprobada(datos) {
        const html = templateLoader.getProcessedTemplate('postulacion-aprobada', {
            nombreEmpleado: datos.nombreEmpleado,
            nombreHijo: datos.nombreHijo,
            edad: datos.edad
        });
        
        return await this.enviarEmail(
            datos.email, 
            '🎉 ¡Postulación Aprobada! - COOMOTOR', 
            html
        );
    }

    async notificarConfirmacionPostulacion(datos) {
        const html = templateLoader.getProcessedTemplate('confirmacion-postulacion', {
            nombreEmpleado: datos.nombreEmpleado,
            nombreHijo: datos.nombreHijo,
            edad: datos.edad
        });
        
        return await this.enviarEmail(
            datos.email, 
            '✅ Postulación Recibida - COOMOTOR', 
            html
        );
    }

    async notificarPostulacionRechazada(datos) {
        const html = templateLoader.getProcessedTemplate('postulacion-rechazada', {
            nombreEmpleado: datos.nombreEmpleado,
            nombreHijo: datos.nombreHijo,
            motivo: datos.motivo || 'No se especificó un motivo'
        });
        
        return await this.enviarEmail(
            datos.email, 
            '📋 Actualización de Postulación - COOMOTOR', 
            html
        );
    }

    async notificarAprobacionEliminada(datos) {
        const html = templateLoader.getProcessedTemplate('aprobacion-eliminada', {
            nombreEmpleado: datos.nombreEmpleado,
            nombreHijo: datos.nombreHijo,
            motivo: datos.motivo
        });
        
        return await this.enviarEmail(
            datos.email, 
            '⚠️ Cambio en Aprobación - COOMOTOR', 
            html
        );
    }

    // ============================================
    // PLANTILLAS DE SEGURIDAD Y AUTENTICACIÓN
    // ============================================

    async enviarCodigo2FA(datos) {
        const html = templateLoader.getProcessedTemplate('codigo-2fa', {
            nombre: datos.nombre,
            codigo: datos.codigo
        });
        
        return await this.enviarEmail(
            datos.email, 
            '🔐 Código de Verificación 2FA - COOMOTOR', 
            html
        );
    }

    async enviarCodigoRecuperacion(datos) {
        const html = templateLoader.getProcessedTemplate('codigo-recuperacion', {
            codigo: datos.codigo
        });
        
        return await this.enviarEmail(
            datos.email, 
            '🔐 Código de Recuperación - COOMOTOR', 
            html
        );
    }

    async enviarConfirmacionRecuperacion(datos) {
        const html = templateLoader.getProcessedTemplate('confirmacion-recuperacion', {});
        
        return await this.enviarEmail(
            datos.email, 
            '✅ Contraseña Actualizada - COOMOTOR', 
            html
        );
    }

    async enviarCambioRol(datos) {
        const esAdmin = datos.rolNuevo === 'admin';
        const iconoRol = esAdmin ? '👑' : datos.rolNuevo === 'conductor' ? '🚗' : '👤';
        const colorRol = esAdmin ? '#f59e0b' : datos.rolNuevo === 'conductor' ? '#3b82f6' : '#10b981';
        
        // Permisos de admin (si aplica)
        const permisosAdmin = esAdmin ? `
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef3c7;border-left:5px solid #f59e0b;border-radius:12px;margin:35px 0;">
                <tr>
                    <td style="padding:30px;">
                        <p style="margin:0 0 15px 0;font-size:16px;font-weight:800;color:#92400e;">
                            👑 PERMISOS DE ADMINISTRADOR:
                        </p>
                        <ul style="margin:0;padding-left:25px;color:#92400e;font-size:15px;line-height:2;">
                            <li>Gestionar todos los usuarios</li>
                            <li>Aprobar/rechazar postulaciones</li>
                            <li>Ver reportes y estadísticas</li>
                            <li>Configurar el sistema</li>
                            <li>Acceso completo al panel admin</li>
                        </ul>
                    </td>
                </tr>
            </table>
        ` : '';

        const seguridadAdmin = esAdmin ? `
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef2f2;border-left:5px solid #dc2626;border-radius:12px;margin:35px 0;">
                <tr>
                    <td style="padding:30px;">
                        <p style="margin:0 0 15px 0;font-size:16px;font-weight:800;color:#991b1b;">
                            🔐 SEGURIDAD IMPORTANTE:
                        </p>
                        <ul style="margin:0;padding-left:25px;color:#991b1b;font-size:15px;line-height:2;">
                            <li>Ahora tu cuenta requiere autenticación de 2 factores (2FA)</li>
                            <li>Recibirás un código por email cada vez que inicies sesión</li>
                            <li>Usa una contraseña fuerte y única</li>
                            <li>No compartas tus credenciales con nadie</li>
                        </ul>
                    </td>
                </tr>
            </table>
        ` : '';
        
        const html = templateLoader.getProcessedTemplate('cambio-rol', {
            nombre: datos.nombre,
            rolAnterior: datos.rolAnterior,
            rolNuevoNombre: datos.rolNuevoNombre || datos.rolNuevo,
            iconoRol: iconoRol,
            colorRol: colorRol,
            permisosAdmin: permisosAdmin,
            seguridadAdmin: seguridadAdmin
        });
        
        return await this.enviarEmail(
            datos.email, 
            `${iconoRol} Cambio de Rol - COOMOTOR`, 
            html
        );
    }

    // ============================================
    // PLANTILLAS DE DOCUMENTOS
    // ============================================

    async notificarSolicitudDocumentos(datos) {
        const tiposDocumento = {
            'registro_civil': 'Registro Civil',
            'tarjeta_identidad': 'Tarjeta de Identidad',
            'cedula': 'Cédula de Ciudadanía',
            'foto_hijo': 'Foto del Hijo/a',
            'comprobante_residencia': 'Comprobante de Residencia',
            'otro': 'Otro Documento'
        };

        let listaDocumentos = '<ul style="margin:0;padding-left:20px;">';
        datos.documentosSolicitados.forEach(doc => {
            listaDocumentos += `<li style="margin-bottom:10px;font-weight:600;">${tiposDocumento[doc] || doc}</li>`;
        });
        listaDocumentos += '</ul>';

        const html = templateLoader.getProcessedTemplate('solicitud-documentos', {
            nombreEmpleado: datos.nombreEmpleado,
            nombreHijo: datos.nombreHijo,
            listaDocumentos: listaDocumentos,
            mensaje: datos.mensaje || ''
        });
        
        return await this.enviarEmail(
            datos.email, 
            '📄 Documentos Requeridos - COOMOTOR', 
            html
        );
    }

    async notificarRevisionDocumento(usuario, documento) {
        const estadoTexto = documento.estado === 'aprobado' ? 'APROBADO ✅' : 'REQUIERE REVISIÓN ⚠️';
        const estadoColor = documento.estado === 'aprobado' ? '#10b981' : '#f59e0b';
        const estadoEmoji = documento.estado === 'aprobado' ? '✅' : '📋';
        
        const tiposDocumento = {
            'registro_civil': 'Registro Civil',
            'tarjeta_identidad': 'Tarjeta de Identidad',
            'cedula': 'Cédula de Ciudadanía',
            'foto_hijo': 'Foto del Hijo/a',
            'comprobante_residencia': 'Comprobante de Residencia',
            'otro': 'Otro Documento'
        };

        const mensajeEstado = documento.estado === 'aprobado' 
            ? 'Tu documento ha sido aprobado exitosamente. Puedes continuar con el proceso de postulación.'
            : 'Por favor, revisa las observaciones y sube nuevamente el documento corregido desde tu panel de empleado.';

        const html = templateLoader.getProcessedTemplate('revision-documento', {
            nombreEmpleado: usuario.nombres,
            tipoDocumento: tiposDocumento[documento.tipo_documento] || documento.tipo_documento,
            estadoTexto: estadoTexto,
            estadoColor: estadoColor,
            estadoEmoji: estadoEmoji,
            observaciones: documento.observaciones || 'Sin observaciones',
            mensajeEstado: mensajeEstado
        });
        
        return await this.enviarEmail(
            usuario.correo, 
            `📄 Revisión de Documento: ${tiposDocumento[documento.tipo_documento]} - COOMOTOR`, 
            html
        );
    }

    // ============================================
    // PLANTILLAS DE RECORDATORIOS Y ALERTAS
    // ============================================

    async enviarRecordatorioDocumentos(datos) {
        const urgencia = datos.diasTranscurridos >= 7 ? 'URGENTE' : 'IMPORTANTE';
        
        const html = templateLoader.getProcessedTemplate('recordatorio-documentos', {
            nombre: datos.nombre,
            urgencia: urgencia,
            docsPendientes: datos.docsPendientes || 0,
            docsRechazados: datos.docsRechazados || 0,
            diasTranscurridos: datos.diasTranscurridos
        });
        
        return await this.enviarEmail(
            datos.email, 
            `⚠️ ${urgencia}: Documentos Pendientes - COOMOTOR`, 
            html
        );
    }

    async enviarAlertaPlazo(datos) {
        const colorUrgencia = datos.diasRestantes <= 3 ? '#dc2626' : datos.diasRestantes <= 5 ? '#f59e0b' : '#3b82f6';
        const nivelUrgencia = datos.diasRestantes <= 3 ? '🚨 URGENTE' : datos.diasRestantes <= 5 ? '⚠️ IMPORTANTE' : 'ℹ️ RECORDATORIO';
        const pluralDias = datos.diasRestantes !== 1 ? 'S' : '';
        
        const html = templateLoader.getProcessedTemplate('alerta-plazo', {
            nombre: datos.nombre,
            diasRestantes: datos.diasRestantes,
            fechaLimite: datos.fechaLimite,
            hijosRegistrados: datos.hijosRegistrados || 0,
            postulacionesPendientes: datos.postulacionesPendientes || 'Ninguna completada',
            colorUrgencia: colorUrgencia,
            nivelUrgencia: nivelUrgencia,
            pluralDias: pluralDias
        });
        
        return await this.enviarEmail(
            datos.email, 
            `${nivelUrgencia} Plazo: ${datos.diasRestantes} día${pluralDias} restante${pluralDias} - COOMOTOR`, 
            html
        );
    }

    // ============================================
    // PLANTILLAS DE ENTREGA Y SATISFACCIÓN
    // ============================================

    async enviarConfirmacionEntrega(datos) {
        const html = templateLoader.getProcessedTemplate('confirmacion-entrega', {
            nombre: datos.nombre,
            nombreHijo: datos.nombreHijo,
            edad: datos.edad,
            fechaAprobacion: datos.fechaAprobacion
        });
        
        return await this.enviarEmail(
            datos.email, 
            `🎁 Regalo Listo: ${datos.nombreHijo} - COOMOTOR`, 
            html
        );
    }

    async enviarEncuestaSatisfaccion(datos) {
        const urlEncuesta = `https://coomotor-regalos.onrender.com/sistema-regalos/encuesta.html?p=${datos.postulacionId}`;
        
        const html = templateLoader.getProcessedTemplate('encuesta-satisfaccion', {
            nombre: datos.nombre,
            nombreHijo: datos.nombreHijo,
            urlEncuesta: urlEncuesta
        });
        
        return await this.enviarEmail(
            datos.email, 
            '⭐ Tu Opinión es Importante - COOMOTOR', 
            html
        );
    }

    // ============================================
    // PLANTILLAS DE CONTACTO
    // ============================================

    async notificarRespuestaContacto(datos) {
        const html = templateLoader.getProcessedTemplate('respuesta-contacto', {
            nombreUsuario: datos.nombreUsuario,
            asunto: datos.asunto,
            respuesta: datos.respuesta
        });
        
        return await this.enviarEmail(
            datos.email, 
            `💬 Respuesta: ${datos.asunto} - COOMOTOR`, 
            html
        );
    }

    // ============================================
    // MÉTODOS ADICIONALES (COMPATIBILIDAD)
    // ============================================

    async notificarAlertaPlazo(datos) {
        return await this.enviarAlertaPlazo(datos);
    }

    async notificarCambioEstadoRegalo(datos) {
        return { success: true };
    }
}

module.exports = new NotificationService();
