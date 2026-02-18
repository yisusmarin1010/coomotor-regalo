-- ============================================
-- TABLAS PARA SISTEMA DE CHAT EN VIVO
-- ============================================

-- Tabla de conversaciones
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'chat_conversaciones')
BEGIN
    CREATE TABLE chat_conversaciones (
        id INT IDENTITY(1,1) PRIMARY KEY,
        empleado_id INT NOT NULL,
        estado NVARCHAR(20) NOT NULL DEFAULT 'activa',
        fecha_inicio DATETIME2 DEFAULT GETDATE(),
        fecha_cierre DATETIME2 NULL,
        
        CONSTRAINT FK_chat_conversaciones_empleado FOREIGN KEY (empleado_id) 
            REFERENCES usuarios(id) ON DELETE CASCADE,
        CONSTRAINT CK_chat_conversaciones_estado CHECK (estado IN ('activa', 'cerrada'))
    );
    
    CREATE INDEX IX_chat_conversaciones_empleado ON chat_conversaciones(empleado_id);
    CREATE INDEX IX_chat_conversaciones_estado ON chat_conversaciones(estado);
    
    PRINT '✅ Tabla chat_conversaciones creada';
END
ELSE
BEGIN
    PRINT '⚠️ Tabla chat_conversaciones ya existe';
END
GO

-- Tabla de mensajes
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'chat_mensajes')
BEGIN
    CREATE TABLE chat_mensajes (
        id INT IDENTITY(1,1) PRIMARY KEY,
        conversacion_id INT NOT NULL,
        usuario_id INT NOT NULL,
        mensaje NVARCHAR(MAX) NOT NULL,
        tipo_usuario NVARCHAR(20) NOT NULL,
        fecha_envio DATETIME2 DEFAULT GETDATE(),
        leido BIT DEFAULT 0,
        
        CONSTRAINT FK_chat_mensajes_conversacion FOREIGN KEY (conversacion_id) 
            REFERENCES chat_conversaciones(id) ON DELETE CASCADE,
        CONSTRAINT FK_chat_mensajes_usuario FOREIGN KEY (usuario_id) 
            REFERENCES usuarios(id),
        CONSTRAINT CK_chat_mensajes_tipo CHECK (tipo_usuario IN ('empleado', 'conductor', 'admin'))
    );
    
    CREATE INDEX IX_chat_mensajes_conversacion ON chat_mensajes(conversacion_id);
    CREATE INDEX IX_chat_mensajes_fecha ON chat_mensajes(fecha_envio);
    CREATE INDEX IX_chat_mensajes_leido ON chat_mensajes(leido);
    
    PRINT '✅ Tabla chat_mensajes creada';
END
ELSE
BEGIN
    PRINT '⚠️ Tabla chat_mensajes ya existe';
END
GO

PRINT '✅ Tablas de chat creadas exitosamente';
