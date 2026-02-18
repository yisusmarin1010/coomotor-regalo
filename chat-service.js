// ============================================
// SERVICIO DE CHAT EN VIVO - COOMOTOR
// ============================================

const WebSocket = require('ws');
const sql = require('mssql');

class ChatService {
    constructor(server, poolConnection) {
        this.wss = new WebSocket.Server({ server, path: '/chat' });
        this.poolConnection = poolConnection;
        this.clients = new Map(); // Map<userId, WebSocket>
        this.adminClients = new Set(); // Set de WebSockets de admins
        
        this.init();
    }

    init() {
        this.wss.on('connection', (ws, req) => {
            console.log('🔌 Nueva conexión de chat');

            ws.on('message', async (message) => {
                try {
                    const data = JSON.parse(message);
                    await this.handleMessage(ws, data);
                } catch (error) {
                    console.error('Error procesando mensaje:', error);
                    ws.send(JSON.stringify({ 
                        type: 'error', 
                        message: 'Error procesando mensaje' 
                    }));
                }
            });

            ws.on('close', () => {
                this.handleDisconnect(ws);
            });

            ws.on('error', (error) => {
                console.error('Error en WebSocket:', error);
            });
        });

        console.log('✅ Servicio de chat inicializado');
    }

    async handleMessage(ws, data) {
        const { type, userId, rol, mensaje, conversacionId } = data;

        switch (type) {
            case 'auth':
                await this.handleAuth(ws, userId, rol);
                break;

            case 'mensaje':
                await this.handleChatMessage(ws, userId, rol, mensaje, conversacionId);
                break;

            case 'typing':
                this.handleTyping(userId, rol, conversacionId);
                break;

            case 'getConversaciones':
                await this.getConversaciones(ws, userId, rol);
                break;

            case 'getHistorial':
                await this.getHistorial(ws, conversacionId);
                break;

            default:
                ws.send(JSON.stringify({ type: 'error', message: 'Tipo de mensaje desconocido' }));
        }
    }

    async handleAuth(ws, userId, rol) {
        ws.userId = userId;
        ws.rol = rol;
        
        this.clients.set(userId, ws);
        
        if (rol === 'admin') {
            this.adminClients.add(ws);
        }

        ws.send(JSON.stringify({ 
            type: 'auth_success', 
            message: 'Autenticado correctamente' 
        }));

        console.log(`✅ Usuario autenticado: ${userId} (${rol})`);
    }

    async handleChatMessage(ws, userId, rol, mensaje, conversacionId) {
        try {
            let convId = conversacionId;

            // Si no hay conversación, crear una nueva
            if (!convId && rol !== 'admin') {
                const result = await this.poolConnection.request()
                    .input('empleado_id', sql.Int, userId)
                    .query(`
                        INSERT INTO chat_conversaciones (empleado_id, estado, fecha_inicio)
                        OUTPUT INSERTED.id
                        VALUES (@empleado_id, 'activa', GETDATE())
                    `);
                
                convId = result.recordset[0].id;
            }

            // Guardar mensaje
            const result = await this.poolConnection.request()
                .input('conversacion_id', sql.Int, convId)
                .input('usuario_id', sql.Int, userId)
                .input('mensaje', sql.NVarChar, mensaje)
                .input('tipo_usuario', sql.NVarChar, rol)
                .query(`
                    INSERT INTO chat_mensajes (conversacion_id, usuario_id, mensaje, tipo_usuario, fecha_envio, leido)
                    OUTPUT INSERTED.id, INSERTED.fecha_envio
                    VALUES (@conversacion_id, @usuario_id, @mensaje, @tipo_usuario, GETDATE(), 0)
                `);

            const mensajeData = {
                id: result.recordset[0].id,
                conversacionId: convId,
                usuarioId: userId,
                mensaje,
                tipoUsuario: rol,
                fechaEnvio: result.recordset[0].fecha_envio,
                leido: false
            };

            // Enviar a todos los participantes
            if (rol === 'admin') {
                // Admin envía a empleado específico
                const empleadoWs = Array.from(this.clients.values()).find(
                    client => client.conversacionId === convId && client.rol !== 'admin'
                );
                
                if (empleadoWs && empleadoWs.readyState === WebSocket.OPEN) {
                    empleadoWs.send(JSON.stringify({ 
                        type: 'mensaje', 
                        data: mensajeData 
                    }));
                }
            } else {
                // Empleado envía a todos los admins
                this.adminClients.forEach(adminWs => {
                    if (adminWs.readyState === WebSocket.OPEN) {
                        adminWs.send(JSON.stringify({ 
                            type: 'mensaje', 
                            data: mensajeData 
                        }));
                    }
                });
            }

            // Confirmar al remitente
            ws.send(JSON.stringify({ 
                type: 'mensaje_enviado', 
                data: mensajeData 
            }));

            console.log(`💬 Mensaje enviado: ${userId} -> Conv ${convId}`);

        } catch (error) {
            console.error('Error guardando mensaje:', error);
            ws.send(JSON.stringify({ 
                type: 'error', 
                message: 'Error enviando mensaje' 
            }));
        }
    }

    handleTyping(userId, rol, conversacionId) {
        if (rol === 'admin') {
            const empleadoWs = Array.from(this.clients.values()).find(
                client => client.conversacionId === conversacionId && client.rol !== 'admin'
            );
            
            if (empleadoWs && empleadoWs.readyState === WebSocket.OPEN) {
                empleadoWs.send(JSON.stringify({ type: 'typing', userId }));
            }
        } else {
            this.adminClients.forEach(adminWs => {
                if (adminWs.readyState === WebSocket.OPEN) {
                    adminWs.send(JSON.stringify({ 
                        type: 'typing', 
                        userId, 
                        conversacionId 
                    }));
                }
            });
        }
    }

    async getConversaciones(ws, userId, rol) {
        try {
            let query;
            
            if (rol === 'admin') {
                query = `
                    SELECT 
                        c.id,
                        c.empleado_id,
                        u.nombres + ' ' + u.apellidos as empleado_nombre,
                        c.estado,
                        c.fecha_inicio,
                        c.fecha_cierre,
                        (SELECT TOP 1 mensaje FROM chat_mensajes WHERE conversacion_id = c.id ORDER BY fecha_envio DESC) as ultimo_mensaje,
                        (SELECT TOP 1 fecha_envio FROM chat_mensajes WHERE conversacion_id = c.id ORDER BY fecha_envio DESC) as fecha_ultimo_mensaje,
                        (SELECT COUNT(*) FROM chat_mensajes WHERE conversacion_id = c.id AND leido = 0 AND tipo_usuario != 'admin') as mensajes_no_leidos
                    FROM chat_conversaciones c
                    INNER JOIN usuarios u ON c.empleado_id = u.id
                    WHERE c.estado = 'activa'
                    ORDER BY fecha_ultimo_mensaje DESC
                `;
            } else {
                query = `
                    SELECT 
                        c.id,
                        c.estado,
                        c.fecha_inicio,
                        c.fecha_cierre,
                        (SELECT TOP 1 mensaje FROM chat_mensajes WHERE conversacion_id = c.id ORDER BY fecha_envio DESC) as ultimo_mensaje,
                        (SELECT TOP 1 fecha_envio FROM chat_mensajes WHERE conversacion_id = c.id ORDER BY fecha_envio DESC) as fecha_ultimo_mensaje,
                        (SELECT COUNT(*) FROM chat_mensajes WHERE conversacion_id = c.id AND leido = 0 AND tipo_usuario = 'admin') as mensajes_no_leidos
                    FROM chat_conversaciones c
                    WHERE c.empleado_id = ${userId}
                    ORDER BY fecha_ultimo_mensaje DESC
                `;
            }

            const result = await this.poolConnection.request().query(query);

            ws.send(JSON.stringify({ 
                type: 'conversaciones', 
                data: result.recordset 
            }));

        } catch (error) {
            console.error('Error obteniendo conversaciones:', error);
            ws.send(JSON.stringify({ 
                type: 'error', 
                message: 'Error obteniendo conversaciones' 
            }));
        }
    }

    async getHistorial(ws, conversacionId) {
        try {
            const result = await this.poolConnection.request()
                .input('conversacion_id', sql.Int, conversacionId)
                .query(`
                    SELECT 
                        m.id,
                        m.usuario_id,
                        m.mensaje,
                        m.tipo_usuario,
                        m.fecha_envio,
                        m.leido,
                        u.nombres + ' ' + u.apellidos as usuario_nombre
                    FROM chat_mensajes m
                    INNER JOIN usuarios u ON m.usuario_id = u.id
                    WHERE m.conversacion_id = @conversacion_id
                    ORDER BY m.fecha_envio ASC
                `);

            // Marcar como leídos
            await this.poolConnection.request()
                .input('conversacion_id', sql.Int, conversacionId)
                .query(`
                    UPDATE chat_mensajes 
                    SET leido = 1 
                    WHERE conversacion_id = @conversacion_id AND leido = 0
                `);

            ws.send(JSON.stringify({ 
                type: 'historial', 
                data: result.recordset 
            }));

        } catch (error) {
            console.error('Error obteniendo historial:', error);
            ws.send(JSON.stringify({ 
                type: 'error', 
                message: 'Error obteniendo historial' 
            }));
        }
    }

    handleDisconnect(ws) {
        if (ws.userId) {
            this.clients.delete(ws.userId);
            
            if (ws.rol === 'admin') {
                this.adminClients.delete(ws);
            }
            
            console.log(`👋 Usuario desconectado: ${ws.userId}`);
        }
    }
}

module.exports = ChatService;
