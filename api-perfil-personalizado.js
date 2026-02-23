// ============================================
// API ENDPOINTS PARA PERFIL PERSONALIZADO ULTRA AVANZADO
// ============================================

const express = require('express');
const router = express.Router();
const sql = require('mssql');
const multer = require('multer');
const { BlobServiceClient } = require('@azure/storage-blob');

// Configuración de multer para subida de archivos
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten imágenes'));
        }
    }
});

// ============================================
// ENDPOINTS DE PERFIL
// ============================================

// Obtener perfil personalizado del usuario
router.get('/perfil/:usuarioId', async (req, res) => {
    try {
        const { usuarioId } = req.params;
        
        const pool = await sql.connect();
        
        // Obtener datos del perfil
        const perfil = await pool.request()
            .input('usuarioId', sql.Int, usuarioId)
            .query(`
                SELECT * FROM perfiles_personalizados 
                WHERE usuario_id = @usuarioId
            `);
        
        // Obtener puntos y nivel
        const puntos = await pool.request()
            .input('usuarioId', sql.Int, usuarioId)
            .query(`
                SELECT * FROM puntos_gamificacion 
                WHERE usuario_id = @usuarioId
            `);
        
        // Obtener estadísticas
        const estadisticas = await pool.request()
            .input('usuarioId', sql.Int, usuarioId)
            .query(`
                SELECT * FROM estadisticas_usuarios 
                WHERE usuario_id = @usuarioId
            `);
        
        // Obtener logros desbloqueados
        const logros = await pool.request()
            .input('usuarioId', sql.Int, usuarioId)
            .query(`
                SELECT l.*, ul.fecha_desbloqueo, ul.progreso
                FROM usuarios_logros ul
                INNER JOIN logros l ON ul.logro_id = l.id
                WHERE ul.usuario_id = @usuarioId
                ORDER BY ul.fecha_desbloqueo DESC
            `);
        
        res.json({
            success: true,
            data: {
                perfil: perfil.recordset[0] || null,
                puntos: puntos.recordset[0] || { puntos_totales: 0, nivel: 1 },
                estadisticas: estadisticas.recordset[0] || {},
                logros: logros.recordset
            }
        });
        
    } catch (error) {
        console.error('Error al obtener perfil:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener perfil'
        });
    }
});

// Actualizar perfil personalizado
router.put('/perfil/:usuarioId', async (req, res) => {
    try {
        const { usuarioId } = req.params;
        const { tema, temaPersonalizado, efectosVisuales, biografia, intereses } = req.body;
        
        const pool = await sql.connect();
        
        // Verificar si existe el perfil
        const existe = await pool.request()
            .input('usuarioId', sql.Int, usuarioId)
            .query('SELECT id FROM perfiles_personalizados WHERE usuario_id = @usuarioId');
        
        if (existe.recordset.length === 0) {
            // Crear perfil
            await pool.request()
                .input('usuarioId', sql.Int, usuarioId)
                .input('tema', sql.NVarChar, tema)
                .input('temaPersonalizado', sql.NVarChar, JSON.stringify(temaPersonalizado))
                .input('efectosVisuales', sql.NVarChar, JSON.stringify(efectosVisuales))
                .input('biografia', sql.NVarChar, biografia)
                .input('intereses', sql.NVarChar, JSON.stringify(intereses))
                .query(`
                    INSERT INTO perfiles_personalizados 
                    (usuario_id, tema, tema_personalizado, efectos_visuales, biografia, intereses)
                    VALUES (@usuarioId, @tema, @temaPersonalizado, @efectosVisuales, @biografia, @intereses)
                `);
        } else {
            // Actualizar perfil
            await pool.request()
                .input('usuarioId', sql.Int, usuarioId)
                .input('tema', sql.NVarChar, tema)
                .input('temaPersonalizado', sql.NVarChar, JSON.stringify(temaPersonalizado))
                .input('efectosVisuales', sql.NVarChar, JSON.stringify(efectosVisuales))
                .input('biografia', sql.NVarChar, biografia)
                .input('intereses', sql.NVarChar, JSON.stringify(intereses))
                .query(`
                    UPDATE perfiles_personalizados 
                    SET tema = @tema,
                        tema_personalizado = @temaPersonalizado,
                        efectos_visuales = @efectosVisuales,
                        biografia = @biografia,
                        intereses = @intereses,
                        fecha_actualizacion = GETDATE()
                    WHERE usuario_id = @usuarioId
                `);
        }
        
        // Otorgar puntos
        await otorgarPuntos(usuarioId, 30, 'Perfil actualizado');
        
        res.json({
            success: true,
            message: 'Perfil actualizado correctamente'
        });
        
    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        res.status(500).json({
            success: false,
            error: 'Error al actualizar perfil'
        });
    }
});

// Subir avatar
router.post('/perfil/:usuarioId/avatar', upload.single('avatar'), async (req, res) => {
    try {
        const { usuarioId } = req.params;
        
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No se proporcionó ninguna imagen'
            });
        }
        
        // Subir a Azure Blob Storage
        const blobName = `avatars/${usuarioId}-${Date.now()}.${req.file.mimetype.split('/')[1]}`;
        const avatarUrl = await subirAzureBlob(req.file.buffer, blobName, req.file.mimetype);
        
        // Actualizar en base de datos
        const pool = await sql.connect();
        await pool.request()
            .input('usuarioId', sql.Int, usuarioId)
            .input('avatarUrl', sql.NVarChar, avatarUrl)
            .query(`
                UPDATE perfiles_personalizados 
                SET avatar_url = @avatarUrl,
                    fecha_actualizacion = GETDATE()
                WHERE usuario_id = @usuarioId
                
                IF @@ROWCOUNT = 0
                BEGIN
                    INSERT INTO perfiles_personalizados (usuario_id, avatar_url)
                    VALUES (@usuarioId, @avatarUrl)
                END
            `);
        
        // Otorgar puntos y logro
        await otorgarPuntos(usuarioId, 50, 'Avatar actualizado');
        await verificarLogro(usuarioId, 'primer_avatar');
        
        res.json({
            success: true,
            message: 'Avatar subido correctamente',
            avatarUrl
        });
        
    } catch (error) {
        console.error('Error al subir avatar:', error);
        res.status(500).json({
            success: false,
            error: 'Error al subir avatar'
        });
    }
});

// Subir banner
router.post('/perfil/:usuarioId/banner', upload.single('banner'), async (req, res) => {
    try {
        const { usuarioId } = req.params;
        
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No se proporcionó ninguna imagen'
            });
        }
        
        // Subir a Azure Blob Storage
        const blobName = `banners/${usuarioId}-${Date.now()}.${req.file.mimetype.split('/')[1]}`;
        const bannerUrl = await subirAzureBlob(req.file.buffer, blobName, req.file.mimetype);
        
        // Actualizar en base de datos
        const pool = await sql.connect();
        await pool.request()
            .input('usuarioId', sql.Int, usuarioId)
            .input('bannerUrl', sql.NVarChar, bannerUrl)
            .query(`
                UPDATE perfiles_personalizados 
                SET banner_url = @bannerUrl,
                    fecha_actualizacion = GETDATE()
                WHERE usuario_id = @usuarioId
                
                IF @@ROWCOUNT = 0
                BEGIN
                    INSERT INTO perfiles_personalizados (usuario_id, banner_url)
                    VALUES (@usuarioId, @bannerUrl)
                END
            `);
        
        // Otorgar puntos
        await otorgarPuntos(usuarioId, 75, 'Banner personalizado');
        
        res.json({
            success: true,
            message: 'Banner subido correctamente',
            bannerUrl
        });
        
    } catch (error) {
        console.error('Error al subir banner:', error);
        res.status(500).json({
            success: false,
            error: 'Error al subir banner'
        });
    }
});

// ============================================
// ENDPOINTS DE ÁLBUMES Y FOTOS
// ============================================

// Obtener álbumes del usuario
router.get('/albums/:usuarioId', async (req, res) => {
    try {
        const { usuarioId } = req.params;
        
        const pool = await sql.connect();
        const result = await pool.request()
            .input('usuarioId', sql.Int, usuarioId)
            .query(`
                SELECT a.*, 
                       (SELECT COUNT(*) FROM fotos_galeria WHERE album_id = a.id) as total_fotos
                FROM albums_fotos a
                WHERE a.usuario_id = @usuarioId
                ORDER BY a.fecha_creacion DESC
            `);
        
        res.json({
            success: true,
            data: result.recordset
        });
        
    } catch (error) {
        console.error('Error al obtener álbumes:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener álbumes'
        });
    }
});

// Crear álbum
router.post('/albums', async (req, res) => {
    try {
        const { usuarioId, nombre, descripcion, icono, esPublico } = req.body;
        
        const pool = await sql.connect();
        const result = await pool.request()
            .input('usuarioId', sql.Int, usuarioId)
            .input('nombre', sql.NVarChar, nombre)
            .input('descripcion', sql.NVarChar, descripcion)
            .input('icono', sql.NVarChar, icono || '📷')
            .input('esPublico', sql.Bit, esPublico || 0)
            .query(`
                INSERT INTO albums_fotos (usuario_id, nombre, descripcion, icono, es_publico)
                OUTPUT INSERTED.*
                VALUES (@usuarioId, @nombre, @descripcion, @icono, @esPublico)
            `);
        
        // Actualizar estadísticas
        await actualizarEstadisticas(usuarioId, 'total_albums_creados', 1);
        
        // Otorgar puntos
        await otorgarPuntos(usuarioId, 50, 'Álbum creado');
        
        // Verificar logro
        await verificarLogro(usuarioId, 'coleccionista');
        
        res.json({
            success: true,
            message: 'Álbum creado correctamente',
            data: result.recordset[0]
        });
        
    } catch (error) {
        console.error('Error al crear álbum:', error);
        res.status(500).json({
            success: false,
            error: 'Error al crear álbum'
        });
    }
});

// Subir fotos
router.post('/fotos', upload.array('fotos', 10), async (req, res) => {
    try {
        const { usuarioId, albumId, titulo, descripcion, esPublica } = req.body;
        
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No se proporcionaron fotos'
            });
        }
        
        const pool = await sql.connect();
        const fotosSubidas = [];
        
        for (const file of req.files) {
            // Subir a Azure Blob Storage
            const blobName = `fotos/${usuarioId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${file.mimetype.split('/')[1]}`;
            const fotoUrl = await subirAzureBlob(file.buffer, blobName, file.mimetype);
            
            // Guardar en base de datos
            const result = await pool.request()
                .input('usuarioId', sql.Int, usuarioId)
                .input('albumId', sql.Int, albumId || null)
                .input('urlFoto', sql.NVarChar, fotoUrl)
                .input('titulo', sql.NVarChar, titulo || null)
                .input('descripcion', sql.NVarChar, descripcion || null)
                .input('esPublica', sql.Bit, esPublica || 0)
                .query(`
                    INSERT INTO fotos_galeria (usuario_id, album_id, url_foto, titulo, descripcion, es_publica)
                    OUTPUT INSERTED.*
                    VALUES (@usuarioId, @albumId, @urlFoto, @titulo, @descripcion, @esPublica)
                `);
            
            fotosSubidas.push(result.recordset[0]);
        }
        
        // Actualizar estadísticas
        await actualizarEstadisticas(usuarioId, 'total_fotos_subidas', req.files.length);
        
        // Otorgar puntos
        await otorgarPuntos(usuarioId, 10 * req.files.length, `${req.files.length} foto(s) subida(s)`);
        
        // Verificar logro
        await verificarLogro(usuarioId, 'fotografo');
        
        res.json({
            success: true,
            message: `${req.files.length} foto(s) subida(s) correctamente`,
            data: fotosSubidas
        });
        
    } catch (error) {
        console.error('Error al subir fotos:', error);
        res.status(500).json({
            success: false,
            error: 'Error al subir fotos'
        });
    }
});

// Obtener fotos del usuario
router.get('/fotos/:usuarioId', async (req, res) => {
    try {
        const { usuarioId } = req.params;
        const { albumId } = req.query;
        
        const pool = await sql.connect();
        
        let query = `
            SELECT f.*, a.nombre as album_nombre
            FROM fotos_galeria f
            LEFT JOIN albums_fotos a ON f.album_id = a.id
            WHERE f.usuario_id = @usuarioId
        `;
        
        if (albumId) {
            query += ' AND f.album_id = @albumId';
        }
        
        query += ' ORDER BY f.fecha_subida DESC';
        
        const request = pool.request().input('usuarioId', sql.Int, usuarioId);
        
        if (albumId) {
            request.input('albumId', sql.Int, albumId);
        }
        
        const result = await request.query(query);
        
        res.json({
            success: true,
            data: result.recordset
        });
        
    } catch (error) {
        console.error('Error al obtener fotos:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener fotos'
        });
    }
});

// ============================================
// ENDPOINTS DE PUNTOS Y LOGROS
// ============================================

// Obtener ranking de usuarios
router.get('/ranking', async (req, res) => {
    try {
        const { limite = 10 } = req.query;
        
        const pool = await sql.connect();
        const result = await pool.request()
            .input('limite', sql.Int, limite)
            .query(`
                SELECT TOP (@limite)
                    u.id, u.nombres, u.apellidos,
                    p.puntos_totales, p.nivel, p.racha_dias,
                    pp.avatar_url
                FROM puntos_gamificacion p
                INNER JOIN usuarios u ON p.usuario_id = u.id
                LEFT JOIN perfiles_personalizados pp ON u.id = pp.usuario_id
                ORDER BY p.puntos_totales DESC
            `);
        
        res.json({
            success: true,
            data: result.recordset
        });
        
    } catch (error) {
        console.error('Error al obtener ranking:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener ranking'
        });
    }
});

// Obtener todos los logros disponibles
router.get('/logros', async (req, res) => {
    try {
        const pool = await sql.connect();
        const result = await pool.request()
            .query('SELECT * FROM logros WHERE activo = 1 ORDER BY rareza, categoria');
        
        res.json({
            success: true,
            data: result.recordset
        });
        
    } catch (error) {
        console.error('Error al obtener logros:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener logros'
        });
    }
});

// ============================================
// FUNCIONES AUXILIARES
// ============================================

async function subirAzureBlob(buffer, blobName, contentType) {
    try {
        const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
        const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'perfiles';
        
        const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
        const containerClient = blobServiceClient.getContainerClient(containerName);
        
        // Crear contenedor si no existe
        await containerClient.createIfNotExists({ access: 'blob' });
        
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        await blockBlobClient.upload(buffer, buffer.length, {
            blobHTTPHeaders: { blobContentType: contentType }
        });
        
        return blockBlobClient.url;
    } catch (error) {
        console.error('Error al subir a Azure:', error);
        throw error;
    }
}

async function otorgarPuntos(usuarioId, puntos, razon) {
    try {
        const pool = await sql.connect();
        
        // Actualizar puntos
        await pool.request()
            .input('usuarioId', sql.Int, usuarioId)
            .input('puntos', sql.Int, puntos)
            .query(`
                UPDATE puntos_gamificacion 
                SET puntos_totales = puntos_totales + @puntos,
                    experiencia = experiencia + @puntos,
                    nivel = (puntos_totales + @puntos) / 500 + 1,
                    ultima_actividad = GETDATE()
                WHERE usuario_id = @usuarioId
                
                IF @@ROWCOUNT = 0
                BEGIN
                    INSERT INTO puntos_gamificacion (usuario_id, puntos_totales, experiencia, nivel)
                    VALUES (@usuarioId, @puntos, @puntos, 1)
                END
            `);
        
        // Registrar en historial
        await pool.request()
            .input('usuarioId', sql.Int, usuarioId)
            .input('puntos', sql.Int, puntos)
            .input('razon', sql.NVarChar, razon)
            .query(`
                INSERT INTO historial_puntos (usuario_id, puntos, razon, tipo)
                VALUES (@usuarioId, @puntos, @razon, 'ganado')
            `);
        
    } catch (error) {
        console.error('Error al otorgar puntos:', error);
    }
}

async function verificarLogro(usuarioId, codigoLogro) {
    try {
        const pool = await sql.connect();
        
        // Obtener logro
        const logro = await pool.request()
            .input('codigo', sql.NVarChar, codigoLogro)
            .query('SELECT * FROM logros WHERE codigo = @codigo');
        
        if (logro.recordset.length === 0) return;
        
        const logroData = logro.recordset[0];
        
        // Verificar si ya lo tiene
        const tiene = await pool.request()
            .input('usuarioId', sql.Int, usuarioId)
            .input('logroId', sql.Int, logroData.id)
            .query('SELECT id FROM usuarios_logros WHERE usuario_id = @usuarioId AND logro_id = @logroId');
        
        if (tiene.recordset.length > 0) return;
        
        // Verificar requisitos según el logro
        let cumpleRequisitos = false;
        
        switch(codigoLogro) {
            case 'fotografo':
                const fotos = await pool.request()
                    .input('usuarioId', sql.Int, usuarioId)
                    .query('SELECT COUNT(*) as total FROM fotos_galeria WHERE usuario_id = @usuarioId');
                cumpleRequisitos = fotos.recordset[0].total >= 20;
                break;
            
            case 'coleccionista':
                const albums = await pool.request()
                    .input('usuarioId', sql.Int, usuarioId)
                    .query('SELECT COUNT(*) as total FROM albums_fotos WHERE usuario_id = @usuarioId');
                cumpleRequisitos = albums.recordset[0].total >= 5;
                break;
            
            default:
                cumpleRequisitos = true;
        }
        
        if (cumpleRequisitos) {
            // Desbloquear logro
            await pool.request()
                .input('usuarioId', sql.Int, usuarioId)
                .input('logroId', sql.Int, logroData.id)
                .query(`
                    INSERT INTO usuarios_logros (usuario_id, logro_id, progreso)
                    VALUES (@usuarioId, @logroId, 100)
                `);
            
            // Otorgar puntos de recompensa
            await otorgarPuntos(usuarioId, logroData.puntos_recompensa, `Logro: ${logroData.nombre}`);
        }
        
    } catch (error) {
        console.error('Error al verificar logro:', error);
    }
}

async function actualizarEstadisticas(usuarioId, campo, incremento) {
    try {
        const pool = await sql.connect();
        
        await pool.request()
            .input('usuarioId', sql.Int, usuarioId)
            .input('incremento', sql.Int, incremento)
            .query(`
                UPDATE estadisticas_usuarios 
                SET ${campo} = ${campo} + @incremento,
                    fecha_ultima_actualizacion = GETDATE()
                WHERE usuario_id = @usuarioId
                
                IF @@ROWCOUNT = 0
                BEGIN
                    INSERT INTO estadisticas_usuarios (usuario_id, ${campo})
                    VALUES (@usuarioId, @incremento)
                END
            `);
        
    } catch (error) {
        console.error('Error al actualizar estadísticas:', error);
    }
}

module.exports = router;
