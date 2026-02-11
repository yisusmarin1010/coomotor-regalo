// ============================================
// SCRIPT DE ALERTAS DE PLAZO
// Envía notificaciones a usuarios sin postulaciones
// ============================================

const sql = require('mssql');
require('dotenv').config();
const notificationService = require('./email-service-notifications');

// Configuración de base de datos
const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options: {
        encrypt: true,
        trustServerCertificate: false,
        enableArithAbort: true,
        requestTimeout: 30000,
        connectionTimeout: 30000
    }
};

// Fecha límite para postulaciones (configurable)
const FECHA_LIMITE = new Date('2024-12-15'); // Ajustar según necesidad

async function enviarAlertasPlazo() {
    let pool;
    
    try {
        console.log('🔔 Iniciando envío de alertas de plazo...');
        console.log(`📅 Fecha límite: ${FECHA_LIMITE.toLocaleDateString('es-CO')}`);
        
        // Conectar a la base de datos
        pool = await sql.connect(dbConfig);
        console.log('✅ Conectado a la base de datos');
        
        // Calcular días restantes
        const hoy = new Date();
        const diasRestantes = Math.ceil((FECHA_LIMITE - hoy) / (1000 * 60 * 60 * 24));
        
        console.log(`⏰ Días restantes: ${diasRestantes}`);
        
        if (diasRestantes < 0) {
            console.log('⚠️ La fecha límite ya pasó. No se enviarán alertas.');
            return;
        }
        
        // Solo enviar alertas en días específicos: 7, 3, 1
        if (![7, 3, 1].includes(diasRestantes)) {
            console.log(`ℹ️ No se envían alertas para ${diasRestantes} días restantes.`);
            console.log('📋 Alertas programadas para: 7, 3 y 1 día antes.');
            return;
        }
        
        // Obtener usuarios sin postulaciones o con postulaciones pendientes
        const result = await pool.request().query(`
            SELECT DISTINCT
                u.id,
                u.nombres,
                u.apellidos,
                u.correo,
                COUNT(DISTINCT h.id) as total_hijos,
                COUNT(DISTINCT p.id) as total_postulaciones
            FROM usuarios u
            LEFT JOIN hijos h ON u.id = h.usuario_id AND h.estado = 'activo'
            LEFT JOIN postulaciones_hijos p ON h.id = p.hijo_id
            WHERE u.rol IN ('empleado', 'conductor')
                AND u.estado = 'activo'
                AND (
                    -- Usuarios sin hijos registrados
                    h.id IS NULL
                    OR
                    -- Usuarios con hijos pero sin postulaciones
                    (h.id IS NOT NULL AND p.id IS NULL)
                )
            GROUP BY u.id, u.nombres, u.apellidos, u.correo
        `);
        
        const usuarios = result.recordset;
        console.log(`👥 Usuarios a notificar: ${usuarios.length}`);
        
        if (usuarios.length === 0) {
            console.log('✅ Todos los usuarios han completado sus postulaciones.');
            return;
        }
        
        // Enviar notificaciones
        let exitosos = 0;
        let fallidos = 0;
        
        for (const usuario of usuarios) {
            try {
                const resultado = await notificationService.notificarAlertaPlazo(
                    usuario,
                    diasRestantes,
                    FECHA_LIMITE
                );
                
                if (resultado.success) {
                    exitosos++;
                    console.log(`✅ [${exitosos}/${usuarios.length}] Alerta enviada a: ${usuario.correo}`);
                } else {
                    fallidos++;
                    console.log(`❌ [${fallidos}] Error al enviar a ${usuario.correo}: ${resultado.error}`);
                }
                
                // Pequeña pausa entre envíos para no saturar el servidor SMTP
                await new Promise(resolve => setTimeout(resolve, 1000));
                
            } catch (error) {
                fallidos++;
                console.error(`❌ Error al procesar ${usuario.correo}:`, error.message);
            }
        }
        
        console.log('\n📊 Resumen de envío:');
        console.log(`   ✅ Exitosos: ${exitosos}`);
        console.log(`   ❌ Fallidos: ${fallidos}`);
        console.log(`   📧 Total: ${usuarios.length}`);
        console.log(`   📅 Días restantes: ${diasRestantes}`);
        
    } catch (error) {
        console.error('❌ Error en el proceso de alertas:', error);
    } finally {
        if (pool) {
            await pool.close();
            console.log('🔌 Conexión cerrada');
        }
    }
}

// Ejecutar el script
if (require.main === module) {
    enviarAlertasPlazo()
        .then(() => {
            console.log('\n✅ Proceso completado');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ Error fatal:', error);
            process.exit(1);
        });
}

module.exports = { enviarAlertasPlazo, FECHA_LIMITE };
