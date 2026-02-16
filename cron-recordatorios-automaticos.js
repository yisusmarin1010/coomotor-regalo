// ============================================
// SISTEMA DE RECORDATORIOS AUTOMÁTICOS
// Envía notificaciones programadas por email
// ============================================

const cron = require('node-cron');
const sql = require('mssql');
const notificationService = require('./email-service-notifications');

class RecordatoriosAutomaticos {
    constructor(poolConnection) {
        this.pool = poolConnection;
        this.jobs = [];
        this.jobsStarted = false;
        console.log('🤖 Sistema de Recordatorios Automáticos inicializado');
    }

    // ============================================
    // 1. RECORDATORIO DE DOCUMENTOS PENDIENTES (cada 3 días)
    // ============================================
    iniciarRecordatorioDocumentos() {
        // Ejecutar cada 3 días a las 9:00 AM
        const job = cron.schedule('0 9 */3 * *', async () => {
            console.log('\n📄 [CRON] Ejecutando recordatorio de documentos pendientes...');
            await this.enviarRecordatorioDocumentos();
        }, {
            scheduled: false,
            timezone: "America/Bogota"
        });

        job.start();
        this.jobs.push({ name: 'recordatorio_documentos', job });
        console.log('✅ Recordatorio de documentos programado: cada 3 días a las 9:00 AM');
    }

    async enviarRecordatorioDocumentos() {
        try {
            // Buscar conductores con documentos pendientes o rechazados
            const result = await this.pool.request().query(`
                SELECT DISTINCT
                    u.id,
                    u.nombres,
                    u.apellidos,
                    u.correo,
                    COUNT(CASE WHEN d.estado = 'pendiente' THEN 1 END) as docs_pendientes,
                    COUNT(CASE WHEN d.estado = 'rechazado' THEN 1 END) as docs_rechazados,
                    MAX(d.fecha_subida) as ultima_subida
                FROM usuarios u
                INNER JOIN documentos d ON u.id = d.usuario_id
                WHERE u.rol = 'conductor'
                    AND u.estado = 'activo'
                    AND d.estado IN ('pendiente', 'rechazado')
                    AND DATEDIFF(day, d.fecha_subida, GETDATE()) >= 3
                GROUP BY u.id, u.nombres, u.apellidos, u.correo
                HAVING COUNT(CASE WHEN d.estado IN ('pendiente', 'rechazado') THEN 1 END) > 0
            `);

            const usuarios = result.recordset;
            console.log(`👥 Usuarios con documentos pendientes: ${usuarios.length}`);

            let enviados = 0;
            for (const usuario of usuarios) {
                const resultado = await notificationService.enviarRecordatorioDocumentos({
                    email: usuario.correo,
                    nombre: `${usuario.nombres} ${usuario.apellidos}`,
                    docsPendientes: usuario.docs_pendientes,
                    docsRechazados: usuario.docs_rechazados,
                    diasTranscurridos: Math.floor((new Date() - new Date(usuario.ultima_subida)) / (1000 * 60 * 60 * 24))
                });

                if (resultado.success) {
                    enviados++;
                    console.log(`✅ Recordatorio enviado a: ${usuario.correo}`);
                }

                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            console.log(`📊 Recordatorios de documentos enviados: ${enviados}/${usuarios.length}`);
        } catch (error) {
            console.error('❌ Error en recordatorio de documentos:', error);
        }
    }

    // ============================================
    // 2. ALERTA DE PLAZO PRÓXIMO A VENCER
    // ============================================
    iniciarAlertaPlazo() {
        // Ejecutar diariamente a las 8:00 AM
        const job = cron.schedule('0 8 * * *', async () => {
            console.log('\n⏰ [CRON] Ejecutando alerta de plazo próximo a vencer...');
            await this.enviarAlertaPlazo();
        }, {
            scheduled: false,
            timezone: "America/Bogota"
        });

        job.start();
        this.jobs.push({ name: 'alerta_plazo', job });
        console.log('✅ Alerta de plazo programada: diariamente a las 8:00 AM');
    }

    async enviarAlertaPlazo() {
        try {
            const FECHA_LIMITE = new Date(process.env.FECHA_LIMITE_POSTULACIONES || '2024-12-15');
            const hoy = new Date();
            const diasRestantes = Math.ceil((FECHA_LIMITE - hoy) / (1000 * 60 * 60 * 24));

            // Solo enviar en días específicos: 7, 5, 3, 1
            if (![7, 5, 3, 1].includes(diasRestantes)) {
                console.log(`ℹ️ No se envían alertas para ${diasRestantes} días restantes`);
                return;
            }

            console.log(`📅 Días restantes hasta el plazo: ${diasRestantes}`);

            // Buscar usuarios sin postulaciones o con postulaciones incompletas
            const result = await this.pool.request().query(`
                SELECT DISTINCT
                    u.id,
                    u.nombres,
                    u.apellidos,
                    u.correo,
                    COUNT(DISTINCT h.id) as total_hijos,
                    COUNT(DISTINCT p.id) as total_postulaciones,
                    COUNT(DISTINCT CASE WHEN p.estado = 'pendiente' THEN p.id END) as postulaciones_pendientes
                FROM usuarios u
                LEFT JOIN hijos h ON u.id = h.usuario_id AND h.estado = 'activo'
                LEFT JOIN postulaciones_hijos p ON h.id = p.hijo_id
                WHERE u.rol IN ('empleado', 'conductor')
                    AND u.estado = 'activo'
                    AND (
                        h.id IS NULL
                        OR (h.id IS NOT NULL AND p.id IS NULL)
                        OR p.estado = 'pendiente'
                    )
                GROUP BY u.id, u.nombres, u.apellidos, u.correo
            `);

            const usuarios = result.recordset;
            console.log(`👥 Usuarios a notificar: ${usuarios.length}`);

            let enviados = 0;
            for (const usuario of usuarios) {
                const resultado = await notificationService.enviarAlertaPlazo({
                    email: usuario.correo,
                    nombre: `${usuario.nombres} ${usuario.apellidos}`,
                    diasRestantes: diasRestantes,
                    fechaLimite: FECHA_LIMITE.toLocaleDateString('es-CO', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    }),
                    hijosRegistrados: usuario.total_hijos,
                    postulacionesPendientes: usuario.postulaciones_pendientes
                });

                if (resultado.success) {
                    enviados++;
                    console.log(`✅ Alerta enviada a: ${usuario.correo}`);
                }

                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            console.log(`📊 Alertas de plazo enviadas: ${enviados}/${usuarios.length}`);
        } catch (error) {
            console.error('❌ Error en alerta de plazo:', error);
        }
    }

    // ============================================
    // 3. CONFIRMACIÓN DE ENTREGA DE REGALO
    // ============================================
    iniciarConfirmacionEntrega() {
        // Ejecutar diariamente a las 10:00 AM durante diciembre
        const job = cron.schedule('0 10 * 12 *', async () => {
            console.log('\n🎁 [CRON] Ejecutando confirmación de entrega de regalos...');
            await this.enviarConfirmacionEntrega();
        }, {
            scheduled: false,
            timezone: "America/Bogota"
        });

        job.start();
        this.jobs.push({ name: 'confirmacion_entrega', job });
        console.log('✅ Confirmación de entrega programada: diariamente a las 10:00 AM en diciembre');
    }

    async enviarConfirmacionEntrega() {
        try {
            // Buscar postulaciones aprobadas sin confirmación de entrega
            const result = await this.pool.request().query(`
                SELECT 
                    u.id as usuario_id,
                    u.nombres,
                    u.apellidos,
                    u.correo,
                    h.nombre as nombre_hijo,
                    h.edad,
                    p.id as postulacion_id,
                    p.fecha_aprobacion
                FROM postulaciones_hijos p
                INNER JOIN hijos h ON p.hijo_id = h.id
                INNER JOIN usuarios u ON h.usuario_id = u.id
                WHERE p.estado = 'aprobado'
                    AND p.entrega_confirmada = 0
                    AND u.estado = 'activo'
                    AND DATEDIFF(day, p.fecha_aprobacion, GETDATE()) >= 1
                ORDER BY p.fecha_aprobacion ASC
            `);

            const postulaciones = result.recordset;
            console.log(`🎁 Postulaciones aprobadas sin confirmar entrega: ${postulaciones.length}`);

            let enviados = 0;
            for (const post of postulaciones) {
                const resultado = await notificationService.enviarConfirmacionEntrega({
                    email: post.correo,
                    nombre: `${post.nombres} ${post.apellidos}`,
                    nombreHijo: post.nombre_hijo,
                    edad: post.edad,
                    postulacionId: post.postulacion_id,
                    fechaAprobacion: new Date(post.fecha_aprobacion).toLocaleDateString('es-CO')
                });

                if (resultado.success) {
                    enviados++;
                    console.log(`✅ Confirmación enviada a: ${post.correo} (${post.nombre_hijo})`);
                }

                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            console.log(`📊 Confirmaciones de entrega enviadas: ${enviados}/${postulaciones.length}`);
        } catch (error) {
            console.error('❌ Error en confirmación de entrega:', error);
        }
    }

    // ============================================
    // 4. ENCUESTA DE SATISFACCIÓN POST-ENTREGA
    // ============================================
    iniciarEncuestaSatisfaccion() {
        // Ejecutar diariamente a las 6:00 PM durante diciembre y enero
        const job = cron.schedule('0 18 * 12,1 *', async () => {
            console.log('\n📋 [CRON] Ejecutando envío de encuesta de satisfacción...');
            await this.enviarEncuestaSatisfaccion();
        }, {
            scheduled: false,
            timezone: "America/Bogota"
        });

        job.start();
        this.jobs.push({ name: 'encuesta_satisfaccion', job });
        console.log('✅ Encuesta de satisfacción programada: diariamente a las 6:00 PM en dic-ene');
    }

    async enviarEncuestaSatisfaccion() {
        try {
            // Buscar postulaciones con entrega confirmada pero sin encuesta
            const result = await this.pool.request().query(`
                SELECT 
                    u.id as usuario_id,
                    u.nombres,
                    u.apellidos,
                    u.correo,
                    h.nombre as nombre_hijo,
                    h.edad,
                    p.id as postulacion_id,
                    p.fecha_entrega_confirmada
                FROM postulaciones_hijos p
                INNER JOIN hijos h ON p.hijo_id = h.id
                INNER JOIN usuarios u ON h.usuario_id = u.id
                WHERE p.estado = 'aprobado'
                    AND p.entrega_confirmada = 1
                    AND p.encuesta_enviada = 0
                    AND u.estado = 'activo'
                    AND DATEDIFF(day, p.fecha_entrega_confirmada, GETDATE()) >= 2
                    AND DATEDIFF(day, p.fecha_entrega_confirmada, GETDATE()) <= 7
                ORDER BY p.fecha_entrega_confirmada ASC
            `);

            const postulaciones = result.recordset;
            console.log(`📋 Usuarios para enviar encuesta: ${postulaciones.length}`);

            let enviados = 0;
            for (const post of postulaciones) {
                const resultado = await notificationService.enviarEncuestaSatisfaccion({
                    email: post.correo,
                    nombre: `${post.nombres} ${post.apellidos}`,
                    nombreHijo: post.nombre_hijo,
                    edad: post.edad,
                    postulacionId: post.postulacion_id
                });

                if (resultado.success) {
                    // Marcar encuesta como enviada
                    await this.pool.request()
                        .input('postulacion_id', sql.Int, post.postulacion_id)
                        .query('UPDATE postulaciones_hijos SET encuesta_enviada = 1, fecha_encuesta_enviada = GETDATE() WHERE id = @postulacion_id');

                    enviados++;
                    console.log(`✅ Encuesta enviada a: ${post.correo} (${post.nombre_hijo})`);
                }

                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            console.log(`📊 Encuestas enviadas: ${enviados}/${postulaciones.length}`);
        } catch (error) {
            console.error('❌ Error en encuesta de satisfacción:', error);
        }
    }

    // ============================================
    // INICIAR TODOS LOS RECORDATORIOS
    // ============================================
    iniciarTodos() {
        console.log('\n🚀 Iniciando todos los recordatorios automáticos...\n');
        
        this.iniciarRecordatorioDocumentos();
        this.iniciarAlertaPlazo();
        this.iniciarConfirmacionEntrega();
        this.iniciarEncuestaSatisfaccion();
        
        this.jobsStarted = true;
        console.log('\n✅ Todos los recordatorios están activos\n');
        this.mostrarEstado();
    }

    // ============================================
    // DETENER TODOS LOS RECORDATORIOS
    // ============================================
    detenerTodos() {
        console.log('\n🛑 Deteniendo todos los recordatorios...');
        this.jobs.forEach(({ name, job }) => {
            job.stop();
            console.log(`   ⏸️  ${name} detenido`);
        });
        this.jobsStarted = false;
        console.log('✅ Todos los recordatorios detenidos\n');
    }

    // ============================================
    // MOSTRAR ESTADO DE RECORDATORIOS
    // ============================================
    mostrarEstado() {
        console.log('📊 Estado de Recordatorios Automáticos:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        if (!this.jobsStarted) {
            console.log('   🔴 Sistema detenido');
        } else {
            this.jobs.forEach(({ name }) => {
                console.log(`   🟢 Activo - ${name}`);
            });
        }
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }
}

module.exports = RecordatoriosAutomaticos;
