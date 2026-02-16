// ============================================
// SERVIDOR API - COOMOTOR CON AZURE SQL
// ============================================

const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const { BlobServiceClient } = require('@azure/storage-blob');
require('dotenv').config();

// Importar servicios de notificaciones
const notificationService = require('./email-service-notifications');

// Crear app Express
const app = express();
const PORT = process.env.PORT || 10000; // Render usa variable PORT dinámica

// Configurar trust proxy para Render y otros servicios de hosting
app.set('trust proxy', 1); // Confiar en el primer proxy (Render, Heroku, etc.)

// ============================================
// CONFIGURACIÓN DE AZURE SQL DATABASE
// ============================================

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options: {
        encrypt: true, // Requerido para Azure
        trustServerCertificate: false,
        enableArithAbort: true,
        requestTimeout: 30000,
        connectionTimeout: 30000
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

// Variable global para la conexión
let poolConnection;

// ============================================
// CONFIGURACIÓN DE AZURE BLOB STORAGE
// ============================================

const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const CONTAINER_NAME = process.env.AZURE_STORAGE_CONTAINER_NAME || 'documentos-conductores';

let blobServiceClient;
let containerClient;

// Inicializar Azure Blob Storage
if (AZURE_STORAGE_CONNECTION_STRING) {
    try {
        blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
        containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
        console.log('✅ Azure Blob Storage configurado correctamente');
    } catch (error) {
        console.error('❌ Error al configurar Azure Blob Storage:', error.message);
        console.error('⚠️ Los documentos se guardarán localmente (se perderán al reiniciar)');
    }
} else {
    console.warn('⚠️ AZURE_STORAGE_CONNECTION_STRING no configurado');
    console.warn('⚠️ Los documentos se guardarán localmente (se perderán al reiniciar)');
}

// ============================================
// MIDDLEWARES DE SEGURIDAD
// ============================================

// Helmet para headers de seguridad
app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https:", "fonts.googleapis.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https:"],
            scriptSrcAttr: ["'unsafe-inline'"], // Permitir onclick en HTML
            imgSrc: ["'self'", "data:", "https:"],
            fontSrc: ["'self'", "https:", "fonts.gstatic.com"],
            connectSrc: ["'self'", "https:", "ws:", "wss:"],
        },
    },
}));

// CORS - Configuración dinámica para desarrollo y producción
const allowedOrigins = process.env.NODE_ENV === 'production' 
    ? [
        process.env.FRONTEND_URL,
        'https://coomotor-regalo.onrender.com',
        'https://coomotor-regalos.onrender.com',
        null, // Permitir requests sin origin en producción también
        undefined // Permitir undefined
    ]
    : [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
        'http://127.0.0.1:5500',
        'http://localhost:5500',
        'file://',
        null
    ];

const corsOptions = {
    origin: function(origin, callback) {
        // Permitir requests sin origin (archivos locales, Postman, etc.)
        if (!origin) {
            return callback(null, true);
        }
        
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.log('❌ CORS bloqueado para origen:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // límite de requests por IP
    message: {
        error: 'Demasiadas peticiones desde esta IP, intenta nuevamente más tarde.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);

// Logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// SERVIR ARCHIVOS ESTÁTICOS
// ============================================

// Servir archivos estáticos desde la carpeta sistema-regalos
app.use('/sistema-regalos', express.static(path.join(__dirname, 'sistema-regalos'), {
    setHeaders: (res, filePath) => {
        // Configurar headers para diferentes tipos de archivos
        if (filePath.endsWith('.html')) {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
        } else if (filePath.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css; charset=utf-8');
        } else if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        } else if (filePath.endsWith('.json')) {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
        }
    }
}));

// También servir desde la raíz para compatibilidad
app.use(express.static(path.join(__dirname, 'sistema-regalos'), {
    index: false,
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
        } else if (filePath.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css; charset=utf-8');
        } else if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        }
    }
}));

// Ruta principal - servir el sistema de regalos
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'sistema-regalos', 'index.html'));
});

// Rutas específicas para el sistema
app.get('/auth/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'sistema-regalos', 'auth', 'login.html'));
});

app.get('/auth/registro.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'sistema-regalos', 'auth', 'registro.html'));
});

app.get('/dashboards/empleado.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'sistema-regalos', 'dashboards', 'empleado.html'));
});

app.get('/dashboards/admin.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'sistema-regalos', 'dashboards', 'admin.html'));
});

// ============================================
// CONEXIÓN A AZURE SQL DATABASE
// ============================================

async function connectToDatabase() {
    try {
        console.log('🔵 Conectando a Azure SQL Database...');
        poolConnection = await sql.connect(dbConfig);
        console.log('🔵 Conectado a Azure SQL Database exitosamente');
        
        // Test de conexión
        const result = await poolConnection.request().query('SELECT 1 as test');
        console.log('✅ Test de conexión exitoso');
        
    } catch (error) {
        console.error('❌ Error conectando a Azure SQL Database:', error);
        process.exit(1);
    }
}

// ============================================
// MIDDLEWARE DE AUTENTICACIÓN
// ============================================

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'Acceso denegado. Token no proporcionado.'
        });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({
                success: false,
                error: 'Token inválido.'
            });
        }
        req.user = user;
        next();
    });
};

const requireAdmin = (req, res, next) => {
    if (req.user.rol !== 'admin') {
        return res.status(403).json({
            success: false,
            error: 'Acceso denegado. Se requieren permisos de administrador.'
        });
    }
    next();
};

// ============================================
// RUTAS DE LA API
// ============================================

// Ruta de salud
app.get('/api/health', async (req, res) => {
    try {
        const result = await poolConnection.request().query('SELECT GETDATE() as fecha');
        res.json({
            success: true,
            message: 'API Coomotor funcionando correctamente',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            database: 'Azure SQL Database',
            dbTime: result.recordset[0].fecha
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error de conexión a la base de datos'
        });
    }
});

// ============================================
// RUTAS DE USUARIOS
// ============================================

// Registrar nuevo usuario
app.post('/api/usuarios/register', async (req, res) => {
    try {
        const { nombres, apellidos, celular, correo, tipo_documento, numero_documento, password, tipo_conductor, subtipo_conductor } = req.body;
        
        // Validaciones básicas
        if (!nombres || !apellidos || !celular || !correo || !tipo_documento || !numero_documento || !password || !tipo_conductor) {
            return res.status(400).json({
                success: false,
                error: 'Todos los campos obligatorios deben ser completados'
            });
        }
        
        // Validar nombres (solo letras y espacios)
        if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,50}$/.test(nombres)) {
            return res.status(400).json({
                success: false,
                error: 'Los nombres solo pueden contener letras y espacios (2-50 caracteres)'
            });
        }
        
        // Validar apellidos (solo letras y espacios)
        if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,50}$/.test(apellidos)) {
            return res.status(400).json({
                success: false,
                error: 'Los apellidos solo pueden contener letras y espacios (2-50 caracteres)'
            });
        }
        
        // Validar celular (10 dígitos, debe comenzar con 3)
        if (!/^3\d{9}$/.test(celular)) {
            return res.status(400).json({
                success: false,
                error: 'El celular debe tener 10 dígitos y comenzar con 3'
            });
        }
        
        // Validar correo (dominios permitidos)
        if (!/^[a-zA-Z0-9._-]+@(gmail\.com|hotmail\.com|outlook\.com|yahoo\.com|coomotor\.com)$/.test(correo)) {
            return res.status(400).json({
                success: false,
                error: 'El correo debe ser de Gmail, Hotmail, Outlook, Yahoo o Coomotor'
            });
        }
        
        // Validar número de documento (7-10 dígitos)
        if (!/^\d{7,10}$/.test(numero_documento)) {
            return res.status(400).json({
                success: false,
                error: 'El número de documento debe tener entre 7 y 10 dígitos'
            });
        }
        
        // Validar contraseña segura (mínimo 8 caracteres, mayúsculas, minúsculas, números y caracteres especiales)
        if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password)) {
            return res.status(400).json({
                success: false,
                error: 'La contraseña debe tener mínimo 8 caracteres, incluir mayúsculas, minúsculas, números y un carácter especial (@$!%*?&)'
            });
        }
        
        // Validar que se requiera subtipo para carretera y furgones
        if ((tipo_conductor === 'carretera' || tipo_conductor === 'furgones') && !subtipo_conductor) {
            return res.status(400).json({
                success: false,
                error: `Debe seleccionar un subtipo para ${tipo_conductor}`
            });
        }
        
        // Verificar si el usuario ya existe (por correo o documento)
        const checkUser = await poolConnection.request()
            .input('correo', sql.NVarChar, correo.toLowerCase())
            .input('numero_documento', sql.NVarChar, numero_documento)
            .query('SELECT id FROM usuarios WHERE correo = @correo OR numero_documento = @numero_documento');
            
        if (checkUser.recordset.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'El correo o número de documento ya está registrado'
            });
        }
        
        // Hash de la contraseña
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        
        // Determinar rol (por defecto empleado, conductor si es carretera)
        const rol = tipo_conductor === 'carretera' ? 'conductor' : 'empleado';
        
        // Insertar nuevo usuario
        const result = await poolConnection.request()
            .input('nombres', sql.NVarChar, nombres)
            .input('apellidos', sql.NVarChar, apellidos)
            .input('celular', sql.NVarChar, celular)
            .input('correo', sql.NVarChar, correo.toLowerCase())
            .input('tipo_documento', sql.NVarChar, tipo_documento)
            .input('numero_documento', sql.NVarChar, numero_documento)
            .input('password_hash', sql.NVarChar, passwordHash)
            .input('tipo_conductor', sql.NVarChar, tipo_conductor)
            .input('subtipo_conductor', sql.NVarChar, subtipo_conductor || null)
            .input('rol', sql.NVarChar, rol)
            .query(`
                INSERT INTO usuarios (nombres, apellidos, celular, correo, tipo_documento, numero_documento, password_hash, tipo_conductor, subtipo_conductor, rol, verificado)
                OUTPUT INSERTED.id, INSERTED.nombres, INSERTED.apellidos, INSERTED.correo, INSERTED.celular, INSERTED.tipo_conductor, INSERTED.subtipo_conductor, INSERTED.rol, INSERTED.fecha_registro
                VALUES (@nombres, @apellidos, @celular, @correo, @tipo_documento, @numero_documento, @password_hash, @tipo_conductor, @subtipo_conductor, @rol, 1)
            `);
            
        const nuevoUsuario = result.recordset[0];
        
        // Generar token JWT
        const token = jwt.sign(
            { 
                userId: nuevoUsuario.id,
                correo: nuevoUsuario.correo,
                rol: nuevoUsuario.rol
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        console.log(`✅ Nuevo usuario registrado: ${nuevoUsuario.nombres} ${nuevoUsuario.apellidos} (${nuevoUsuario.correo})`);
        
        res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente',
            data: {
                user: {
                    id: nuevoUsuario.id,
                    nombres: nuevoUsuario.nombres,
                    apellidos: nuevoUsuario.apellidos,
                    correo: nuevoUsuario.correo,
                    celular: nuevoUsuario.celular,
                    tipo_conductor: nuevoUsuario.tipo_conductor,
                    subtipo_conductor: nuevoUsuario.subtipo_conductor,
                    rol: nuevoUsuario.rol,
                    fechaRegistro: nuevoUsuario.fecha_registro
                },
                token
            }
        });
        
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// Login de usuario
app.post('/api/usuarios/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Validaciones básicas
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email y contraseña son obligatorios'
            });
        }
        
        // Buscar usuario por email (ahora correo)
        const result = await poolConnection.request()
            .input('correo', sql.NVarChar, email.toLowerCase())
            .query(`
                SELECT id, nombres, apellidos, correo, celular, password_hash, rol, estado, fecha_registro, tipo_conductor, subtipo_conductor, tipo_documento, numero_documento
                FROM usuarios 
                WHERE correo = @correo
            `);
        
        if (result.recordset.length === 0) {
            return res.status(401).json({
                success: false,
                error: 'Credenciales inválidas'
            });
        }
        
        const usuario = result.recordset[0];
        
        // Verificar contraseña
        const passwordValida = await bcrypt.compare(password, usuario.password_hash);
        if (!passwordValida) {
            return res.status(401).json({
                success: false,
                error: 'Credenciales inválidas'
            });
        }
        
        // Verificar si el usuario está activo
        if (usuario.estado !== 'activo') {
            return res.status(401).json({
                success: false,
                error: 'Cuenta inactiva. Contacta al administrador.'
            });
        }
        
        // Actualizar último acceso
        await poolConnection.request()
            .input('id', sql.Int, usuario.id)
            .query('UPDATE usuarios SET ultimo_acceso = GETDATE() WHERE id = @id');
        
        // Generar token JWT
        const token = jwt.sign(
            { 
                userId: usuario.id,
                correo: usuario.correo,
                rol: usuario.rol
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        res.json({
            success: true,
            message: 'Login exitoso',
            data: {
                user: {
                    id: usuario.id,
                    nombres: usuario.nombres,
                    apellidos: usuario.apellidos,
                    correo: usuario.correo,
                    celular: usuario.celular,
                    tipo_documento: usuario.tipo_documento,
                    numero_documento: usuario.numero_documento,
                    tipo_conductor: usuario.tipo_conductor,
                    subtipo_conductor: usuario.subtipo_conductor,
                    rol: usuario.rol,
                    fechaRegistro: usuario.fecha_registro
                },
                token
            }
        });
        
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// ============================================
// RECUPERACIÓN DE CONTRASEÑA
// ============================================

// Almacenamiento temporal de códigos de recuperación (en memoria)
const codigosRecuperacion = new Map();

// Generar código de 6 dígitos
function generarCodigoRecuperacion() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Solicitar recuperación de contraseña
app.post('/api/auth/recuperar-password/solicitar', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({
                success: false,
                error: 'El correo electrónico es requerido'
            });
        }
        
        // Verificar que el usuario existe
        const result = await poolConnection.request()
            .input('email', sql.NVarChar, email.toLowerCase())
            .query('SELECT id, nombres, apellidos, correo FROM usuarios WHERE correo = @email AND estado = \'activo\'');
        
        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'No existe una cuenta con ese correo electrónico'
            });
        }
        
        const usuario = result.recordset[0];
        
        // Generar código de 6 dígitos
        const codigo = generarCodigoRecuperacion();
        
        // Guardar código con expiración de 15 minutos
        codigosRecuperacion.set(email.toLowerCase(), {
            codigo: codigo,
            expiracion: Date.now() + (15 * 60 * 1000), // 15 minutos
            intentos: 0
        });
        
        // Enviar código por correo usando SendGrid
        try {
            const resultado = await notificationService.enviarCodigoRecuperacion({
                email: usuario.correo,
                codigo: codigo
            });
            
            if (resultado.success) {
                console.log(`📧 Código de recuperación enviado a: ${usuario.correo}`);
                res.json({
                    success: true,
                    message: 'Código enviado a tu correo electrónico'
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: 'Error al enviar el correo. Intenta nuevamente.'
                });
            }
        } catch (emailError) {
            console.error('Error al enviar correo:', emailError);
            res.status(500).json({
                success: false,
                error: 'Error al enviar el correo. Intenta nuevamente.'
            });
        }
        
    } catch (error) {
        console.error('Error en solicitud de recuperación:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// Verificar código de recuperación
app.post('/api/auth/recuperar-password/verificar', async (req, res) => {
    try {
        const { email, codigo } = req.body;
        
        if (!email || !codigo) {
            return res.status(400).json({
                success: false,
                error: 'Email y código son requeridos'
            });
        }
        
        const emailLower = email.toLowerCase();
        const datosRecuperacion = codigosRecuperacion.get(emailLower);
        
        if (!datosRecuperacion) {
            return res.status(400).json({
                success: false,
                error: 'No hay una solicitud de recuperación activa para este correo'
            });
        }
        
        // Verificar expiración
        if (Date.now() > datosRecuperacion.expiracion) {
            codigosRecuperacion.delete(emailLower);
            return res.status(400).json({
                success: false,
                error: 'El código ha expirado. Solicita uno nuevo.'
            });
        }
        
        // Verificar intentos
        if (datosRecuperacion.intentos >= 3) {
            codigosRecuperacion.delete(emailLower);
            return res.status(400).json({
                success: false,
                error: 'Demasiados intentos fallidos. Solicita un nuevo código.'
            });
        }
        
        // Verificar código
        if (datosRecuperacion.codigo !== codigo) {
            datosRecuperacion.intentos++;
            return res.status(400).json({
                success: false,
                error: `Código incorrecto. Intentos restantes: ${3 - datosRecuperacion.intentos}`
            });
        }
        
        // Código correcto - generar token temporal
        const token = jwt.sign(
            { email: emailLower, tipo: 'recuperacion' },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );
        
        console.log(`✅ Código verificado para: ${email}`);
        
        res.json({
            success: true,
            message: 'Código verificado correctamente',
            token: token
        });
        
    } catch (error) {
        console.error('Error en verificación de código:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// Cambiar contraseña
app.post('/api/auth/recuperar-password/cambiar', async (req, res) => {
    try {
        const { email, token, nuevaPassword } = req.body;
        
        if (!email || !token || !nuevaPassword) {
            return res.status(400).json({
                success: false,
                error: 'Todos los campos son requeridos'
            });
        }
        
        // Verificar token
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            if (decoded.email !== email.toLowerCase() || decoded.tipo !== 'recuperacion') {
                return res.status(400).json({
                    success: false,
                    error: 'Token inválido'
                });
            }
        } catch (jwtError) {
            return res.status(400).json({
                success: false,
                error: 'Token expirado o inválido'
            });
        }
        
        // Validar fortaleza de contraseña
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(nuevaPassword)) {
            return res.status(400).json({
                success: false,
                error: 'La contraseña debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas, números y caracteres especiales'
            });
        }
        
        // Hash de la nueva contraseña
        const passwordHash = await bcrypt.hash(nuevaPassword, 10);
        
        // Actualizar contraseña en la base de datos
        const result = await poolConnection.request()
            .input('email', sql.NVarChar, email.toLowerCase())
            .input('passwordHash', sql.NVarChar, passwordHash)
            .query('UPDATE usuarios SET password_hash = @passwordHash WHERE correo = @email');
        
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }
        
        // Eliminar código de recuperación
        codigosRecuperacion.delete(email.toLowerCase());
        
        console.log(`✅ Contraseña cambiada para: ${email}`);
        
        // Enviar confirmación por correo usando SendGrid
        const usuario = await poolConnection.request()
            .input('email', sql.NVarChar, email.toLowerCase())
            .query('SELECT nombres, apellidos FROM usuarios WHERE correo = @email');
        
        if (usuario.recordset.length > 0) {
            const { nombres, apellidos } = usuario.recordset[0];
            
            try {
                await notificationService.enviarConfirmacionRecuperacion({
                    email: email,
                    nombreEmpleado: `${nombres} ${apellidos}`
                });
                
                console.log(`📧 Confirmación de cambio enviada a: ${email}`);
            } catch (emailError) {
                console.error('Error al enviar confirmación:', emailError);
            }
        }
        
        res.json({
            success: true,
            message: 'Contraseña cambiada exitosamente'
        });
        
    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// Obtener todos los usuarios (solo admin)
app.get('/api/usuarios', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 10, rol, estado, buscar } = req.query;
        
        let whereClause = 'WHERE 1=1';
        const request = poolConnection.request();
        
        if (rol) {
            whereClause += ' AND rol = @rol';
            request.input('rol', sql.NVarChar, rol);
        }
        
        if (estado) {
            whereClause += ' AND estado = @estado';
            request.input('estado', sql.NVarChar, estado);
        }
        
        if (buscar) {
            whereClause += ' AND (nombre LIKE @buscar OR email LIKE @buscar)';
            request.input('buscar', sql.NVarChar, `%${buscar}%`);
        }
        
        // Paginación
        const offset = (page - 1) * limit;
        request.input('offset', sql.Int, offset);
        request.input('limit', sql.Int, parseInt(limit));
        
        const result = await request.query(`
            SELECT id, nombre, email, telefono, rol, estado, fecha_registro, ultimo_acceso, verificado
            FROM usuarios 
            ${whereClause}
            ORDER BY fecha_registro DESC
            OFFSET @offset ROWS
            FETCH NEXT @limit ROWS ONLY
        `);
        
        const countResult = await poolConnection.request().query(`
            SELECT COUNT(*) as total FROM usuarios ${whereClause}
        `);
        
        const total = countResult.recordset[0].total;
        
        res.json({
            success: true,
            data: {
                usuarios: result.recordset,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
        
    } catch (error) {
        console.error('Error obteniendo usuarios:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// ============================================
// RUTAS DE CONTACTO Y QUEJAS - SISTEMA COOMOTOR
// ============================================

// ============================================
// RUTAS DE ESTADÍSTICAS
// ============================================

// Obtener estadísticas del dashboard (solo admin)
app.get('/api/estadisticas', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const result = await poolConnection.request().query(`
            EXEC sp_obtener_estadisticas_dashboard
        `);
        
        const estadisticas = result.recordset[0];
        
        res.json({
            success: true,
            data: estadisticas
        });
        
    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// Obtener estadísticas de WhatsApp
app.get('/api/whatsapp/stats', async (req, res) => {
    try {
        const stats = await whatsappService.getStats();
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error obteniendo estadísticas de WhatsApp:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// Obtener mensajes de WhatsApp registrados
app.get('/api/whatsapp/messages', async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        const result = await whatsappService.getLoggedMessages(parseInt(limit));
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error obteniendo mensajes de WhatsApp:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// Ruta principal - servir index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Ruta específica para index.html
app.get('/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Ruta para inicializar datos de prueba
app.post('/api/init-test-data', async (req, res) => {
    try {
        console.log('🔧 Inicializando datos de prueba para sistema de regalos...');
        
        // Primero, verificar si la tabla usuarios tiene la estructura correcta
        try {
            const checkTable = await poolConnection.request()
                .query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'nombres'");
                
            if (checkTable.recordset.length === 0) {
                // La tabla no tiene la nueva estructura, necesitamos recrearla
                console.log('🔄 Actualizando estructura de la tabla usuarios...');
                
                // Hacer backup de datos existentes si los hay
                const backupData = await poolConnection.request()
                    .query("SELECT * FROM usuarios");
                
                // Eliminar tabla existente
                await poolConnection.request()
                    .query("DROP TABLE IF EXISTS usuarios");
                
                // Crear nueva tabla con estructura actualizada
                await poolConnection.request()
                    .query(`
                        CREATE TABLE usuarios (
                            id INT IDENTITY(1,1) PRIMARY KEY,
                            nombres NVARCHAR(100) NOT NULL,
                            apellidos NVARCHAR(100) NOT NULL,
                            celular NVARCHAR(20) NOT NULL,
                            correo NVARCHAR(255) NOT NULL UNIQUE,
                            tipo_documento NVARCHAR(20) NOT NULL,
                            numero_documento NVARCHAR(20) NOT NULL UNIQUE,
                            password_hash NVARCHAR(255) NOT NULL,
                            
                            -- Información laboral específica
                            tipo_conductor NVARCHAR(30) NOT NULL,
                            subtipo_conductor NVARCHAR(30),
                            
                            -- Campos del sistema
                            rol NVARCHAR(20) NOT NULL DEFAULT 'empleado',
                            estado NVARCHAR(20) NOT NULL DEFAULT 'activo',
                            fecha_registro DATETIME2 DEFAULT GETDATE(),
                            ultimo_acceso DATETIME2 DEFAULT GETDATE(),
                            verificado BIT DEFAULT 1,
                            
                            CONSTRAINT CK_usuarios_rol CHECK (rol IN ('empleado', 'conductor', 'admin')),
                            CONSTRAINT CK_usuarios_estado CHECK (estado IN ('activo', 'inactivo', 'suspendido')),
                            CONSTRAINT CK_usuarios_tipo_documento CHECK (tipo_documento IN ('cedula', 'cedula_extranjeria', 'pasaporte')),
                            CONSTRAINT CK_usuarios_tipo_conductor CHECK (tipo_conductor IN ('carretera', 'distancia_corta', 'urbanos', 'furgones'))
                        )
                    `);
                
                console.log('✅ Tabla usuarios actualizada correctamente');
            }
        } catch (error) {
            console.log('⚠️ Error verificando estructura de tabla:', error.message);
        }
        
        // Verificar si ya existen usuarios
        const existingUsers = await poolConnection.request()
            .query('SELECT COUNT(*) as count FROM usuarios');
            
        if (existingUsers.recordset[0].count > 0) {
            return res.json({
                success: true,
                message: 'Los datos de prueba ya existen',
                data: {
                    usuarios: existingUsers.recordset[0].count
                }
            });
        }
        
        // Crear usuario admin
        const adminPasswordHash = await bcrypt.hash('admin123', 12);
        await poolConnection.request()
            .input('nombres', sql.NVarChar, 'Administrador')
            .input('apellidos', sql.NVarChar, 'Coomotor')
            .input('celular', sql.NVarChar, '+57 300 123 4567')
            .input('correo', sql.NVarChar, 'admin@coomotor.com')
            .input('tipo_documento', sql.NVarChar, 'cedula')
            .input('numero_documento', sql.NVarChar, '12345678')
            .input('password_hash', sql.NVarChar, adminPasswordHash)
            .input('tipo_conductor', sql.NVarChar, 'carretera')
            .input('rol', sql.NVarChar, 'admin')
            .query(`
                INSERT INTO usuarios (nombres, apellidos, celular, correo, tipo_documento, numero_documento, password_hash, tipo_conductor, rol, verificado)
                VALUES (@nombres, @apellidos, @celular, @correo, @tipo_documento, @numero_documento, @password_hash, @tipo_conductor, @rol, 1)
            `);
            
        // Crear usuario conductor de ejemplo
        const conductorPasswordHash = await bcrypt.hash('conductor123', 12);
        await poolConnection.request()
            .input('nombres', sql.NVarChar, 'Juan Carlos')
            .input('apellidos', sql.NVarChar, 'Pérez González')
            .input('celular', sql.NVarChar, '+57 301 234 5678')
            .input('correo', sql.NVarChar, 'conductor@coomotor.com')
            .input('tipo_documento', sql.NVarChar, 'cedula')
            .input('numero_documento', sql.NVarChar, '87654321')
            .input('password_hash', sql.NVarChar, conductorPasswordHash)
            .input('tipo_conductor', sql.NVarChar, 'carretera')
            .input('subtipo_conductor', sql.NVarChar, 'nomina')
            .input('rol', sql.NVarChar, 'conductor')
            .query(`
                INSERT INTO usuarios (nombres, apellidos, celular, correo, tipo_documento, numero_documento, password_hash, tipo_conductor, subtipo_conductor, rol, verificado)
                VALUES (@nombres, @apellidos, @celular, @correo, @tipo_documento, @numero_documento, @password_hash, @tipo_conductor, @subtipo_conductor, @rol, 1)
            `);
            
        console.log('✅ Datos de prueba inicializados correctamente');
        
        res.json({
            success: true,
            message: 'Sistema de regalos navideños inicializado correctamente',
            data: {
                admin: 'admin@coomotor.com / admin123',
                conductor: 'conductor@coomotor.com / conductor123',
                mensaje: 'Base de datos actualizada para el sistema de regalos navideños'
            }
        });
        
    } catch (error) {
        console.error('❌ Error inicializando datos de prueba:', error);
        res.status(500).json({
            success: false,
            error: 'Error inicializando datos de prueba: ' + error.message
        });
    }
});

// ============================================
// RUTA DE CONTACTO Y QUEJAS
// ============================================

// Enviar mensaje de contacto
app.post('/api/contacto', async (req, res) => {
    try {
        const {
            nombres,
            apellidos,
            cedula,
            telefono,
            email,
            tipoContacto,
            prioridad,
            asunto,
            mensaje,
            autorizacion
        } = req.body;

        // Validaciones
        if (!nombres || !apellidos || !cedula || !telefono || !email || !tipoContacto || !asunto || !mensaje) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos obligatorios deben ser completados'
            });
        }

        if (!autorizacion) {
            return res.status(400).json({
                success: false,
                message: 'Debes autorizar el tratamiento de datos personales'
            });
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'El formato del correo electrónico no es válido'
            });
        }

        // Validar formato de teléfono
        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(telefono)) {
            return res.status(400).json({
                success: false,
                message: 'El teléfono debe tener 10 dígitos'
            });
        }

        // Validar formato de cédula
        const cedulaRegex = /^[0-9]{7,10}$/;
        if (!cedulaRegex.test(cedula)) {
            return res.status(400).json({
                success: false,
                message: 'La cédula debe tener entre 7 y 10 dígitos'
            });
        }

        // Generar número de ticket
        const ticketNumber = `COOMOTOR-${Date.now()}`;

        // Insertar en la base de datos
        const result = await poolConnection.request()
            .input('nombres', sql.NVarChar(100), nombres.trim())
            .input('apellidos', sql.NVarChar(100), apellidos.trim())
            .input('cedula', sql.NVarChar(20), cedula.trim())
            .input('telefono', sql.NVarChar(15), telefono.trim())
            .input('email', sql.NVarChar(100), email.trim().toLowerCase())
            .input('tipo_contacto', sql.NVarChar(50), tipoContacto)
            .input('prioridad', sql.NVarChar(20), prioridad || 'media')
            .input('asunto', sql.NVarChar(200), asunto.trim())
            .input('mensaje', sql.NVarChar(sql.MAX), mensaje.trim())
            .query(`
                INSERT INTO contactos (
                    nombres, apellidos, cedula, telefono, email, 
                    tipo_contacto, prioridad, asunto, mensaje, 
                    fecha_creacion, estado
                ) VALUES (
                    @nombres, @apellidos, @cedula, @telefono, @email,
                    @tipo_contacto, @prioridad, @asunto, @mensaje,
                    GETDATE(), 'pendiente'
                )
            `);

        console.log(`📞 Nuevo mensaje de contacto recibido:`);
        console.log(`   👤 De: ${nombres} ${apellidos}`);
        console.log(`   📧 Email: ${email}`);
        console.log(`   📋 Tipo: ${tipoContacto}`);
        console.log(`   🎯 Prioridad: ${prioridad}`);
        console.log(`   📝 Asunto: ${asunto}`);
        console.log(`   🎫 Ticket: ${ticketNumber}`);

        // Preparar datos para el correo
        const datosContacto = {
            nombres,
            apellidos,
            cedula,
            telefono,
            email,
            tipoContacto,
            prioridad: prioridad || 'media',
            asunto,
            mensaje,
            ticket: ticketNumber
        };

        // Enviar correos de forma asíncrona (no bloquear la respuesta)
        setImmediate(async () => {
            try {
                if (notificationService.initialized) {
                    console.log(`📧 Enviando notificación de contacto para ticket: ${ticketNumber}`);
                    // Aquí puedes agregar métodos específicos en notificationService si los necesitas
                } else {
                    console.log('⚠️  SendGrid no configurado - Mensaje guardado sin envío de correos');
                    console.log(`📞 Contacto manual requerido para: ${nombres} ${apellidos} (${email})`);
                    console.log(`📋 Revisar mensaje en el panel de administrador con ticket: ${ticketNumber}`);
                }
            } catch (error) {
                console.error('❌ Error en el proceso de envío de correos:', error);
                console.log('⚠️  Mensaje guardado correctamente, pero sin notificación por correo');
                console.log(`📞 Contacto manual requerido para: ${nombres} ${apellidos} (${email})`);
            }
        });

        res.json({
            success: true,
            message: 'Mensaje enviado exitosamente. Nos pondremos en contacto contigo pronto.',
            ticket: ticketNumber,
            data: {
                nombres: nombres,
                email: email,
                tipo: tipoContacto,
                prioridad: prioridad || 'media'
            },
            info: {
                mensaje: 'Tu mensaje ha sido guardado correctamente en nuestro sistema.',
                ticket: ticketNumber,
                contacto: 'Nos pondremos en contacto contigo a través del teléfono o correo proporcionado.',
                tiempo_respuesta: 'Tiempo estimado de respuesta: 24-48 horas.'
            }
        });

    } catch (error) {
        console.error('❌ Error al procesar mensaje de contacto:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor. Inténtalo de nuevo más tarde.'
        });
    }
});

// Obtener mensajes de contacto (para administradores)
app.get('/api/contactos', authenticateToken, async (req, res) => {
    try {
        // Verificar que sea administrador
        if (req.user.rol !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado. Solo administradores pueden ver los mensajes de contacto.'
            });
        }

        const { estado, tipo, prioridad, page = 1, limit = 20, estadisticas } = req.query;

        // Si se solicitan estadísticas
        if (estadisticas === 'true') {
            const statsResult = await poolConnection.request().query(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) as pendientes,
                    SUM(CASE WHEN estado = 'en_proceso' THEN 1 ELSE 0 END) as en_proceso,
                    SUM(CASE WHEN estado = 'resuelto' THEN 1 ELSE 0 END) as resueltos,
                    SUM(CASE WHEN estado = 'cerrado' THEN 1 ELSE 0 END) as cerrados,
                    SUM(CASE WHEN CAST(fecha_creacion AS DATE) = CAST(GETDATE() AS DATE) THEN 1 ELSE 0 END) as hoy
                FROM contactos
            `);

            return res.json({
                success: true,
                estadisticas: statsResult.recordset[0]
            });
        }

        const offset = (page - 1) * limit;

        let whereClause = 'WHERE 1=1';
        const inputs = [];

        if (estado) {
            whereClause += ' AND estado = @estado';
            inputs.push({ name: 'estado', type: sql.NVarChar(20), value: estado });
        }

        if (tipo) {
            whereClause += ' AND tipo_contacto = @tipo';
            inputs.push({ name: 'tipo', type: sql.NVarChar(50), value: tipo });
        }

        if (prioridad) {
            whereClause += ' AND prioridad = @prioridad';
            inputs.push({ name: 'prioridad', type: sql.NVarChar(20), value: prioridad });
        }

        const request = poolConnection.request();
        inputs.forEach(input => {
            request.input(input.name, input.type, input.value);
        });

        const query = `
            SELECT 
                id, nombres, apellidos, cedula, telefono, email,
                tipo_contacto, prioridad, asunto, mensaje,
                fecha_creacion, estado, fecha_respuesta
            FROM contactos 
            ${whereClause}
            ORDER BY 
                CASE prioridad 
                    WHEN 'urgente' THEN 1 
                    WHEN 'alta' THEN 2 
                    WHEN 'media' THEN 3 
                    WHEN 'baja' THEN 4 
                END,
                fecha_creacion DESC
            OFFSET ${offset} ROWS 
            FETCH NEXT ${limit} ROWS ONLY
        `;

        const result = await request.query(query);

        // Contar total de registros
        const countQuery = `SELECT COUNT(*) as total FROM contactos ${whereClause}`;
        const countRequest = poolConnection.request();
        inputs.forEach(input => {
            countRequest.input(input.name, input.type, input.value);
        });
        const countResult = await countRequest.query(countQuery);

        res.json({
            success: true,
            data: result.recordset,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: countResult.recordset[0].total,
                pages: Math.ceil(countResult.recordset[0].total / limit)
            }
        });

    } catch (error) {
        console.error('❌ Error al obtener mensajes de contacto:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Actualizar estado de mensaje de contacto
app.put('/api/contactos/:id/estado', authenticateToken, async (req, res) => {
    try {
        // Verificar que sea administrador
        if (req.user.rol !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado. Solo administradores pueden actualizar mensajes.'
            });
        }

        const { id } = req.params;
        const { estado, respuesta } = req.body;

        console.log('📝 Actualizando contacto:', {
            id: id,
            estado: estado,
            respuesta: respuesta,
            respuestaLength: respuesta ? respuesta.length : 0,
            adminId: req.user.userId
        });

        if (!estado || !['pendiente', 'en_proceso', 'resuelto', 'cerrado'].includes(estado)) {
            return res.status(400).json({
                success: false,
                message: 'Estado inválido'
            });
        }

        // Obtener datos del contacto y usuario antes de actualizar
        const contactoResult = await poolConnection.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT 
                    c.id,
                    c.asunto,
                    c.nombres,
                    c.apellidos,
                    c.email,
                    c.respuesta as respuesta_anterior
                FROM contactos c
                WHERE c.id = @id
            `);
        
        if (contactoResult.recordset.length === 0) {
            return res.status(404).json({ success: false, error: 'Contacto no encontrado' });
        }
        
        const contacto = contactoResult.recordset[0];

        const query = `
            UPDATE contactos 
            SET estado = @estado,
                respuesta = @respuesta,
                fecha_respuesta = CASE WHEN @respuesta IS NOT NULL AND @respuesta != '' THEN GETDATE() ELSE fecha_respuesta END,
                respondido_por = @respondido_por
            WHERE id = @id
        `;

        const result = await poolConnection.request()
            .input('id', sql.Int, id)
            .input('estado', sql.NVarChar(20), estado)
            .input('respuesta', sql.NVarChar(sql.MAX), respuesta || null)
            .input('respondido_por', sql.Int, req.user.userId)
            .query(query);

        console.log('✅ Contacto actualizado. Filas afectadas:', result.rowsAffected);

        // Verificar que se guardó correctamente
        const verificacion = await poolConnection.request()
            .input('id', sql.Int, id)
            .query('SELECT id, estado, respuesta, fecha_respuesta FROM contactos WHERE id = @id');
        
        console.log('🔍 Verificación después de actualizar:', verificacion.recordset[0]);

        // Enviar notificación si hay una respuesta nueva
        if (respuesta && respuesta.trim() !== '' && respuesta !== contacto.respuesta_anterior) {
            const datosNotificacion = {
                email: contacto.email,
                nombreUsuario: `${contacto.nombres} ${contacto.apellidos}`,
                asunto: contacto.asunto,
                respuesta: respuesta
            };
            
            // Enviar notificación (no bloqueante)
            notificationService.notificarRespuestaContacto(datosNotificacion)
                .then(result => {
                    if (result.success) {
                        console.log(`✅ Notificación de respuesta enviada a ${contacto.email}`);
                    } else {
                        console.log(`⚠️ No se pudo enviar notificación`);
                    }
                })
                .catch(err => console.error('Error al enviar notificación:', err));
        }

        res.json({
            success: true,
            message: respuesta ? 'Estado actualizado y notificación enviada al usuario' : 'Estado actualizado exitosamente',
            data: verificacion.recordset[0]
        });

    } catch (error) {
        console.error('❌ Error al actualizar estado de contacto:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Obtener mensajes de contacto del usuario autenticado (para empleados)
app.get('/api/mis-contactos', authenticateToken, async (req, res) => {
    try {
        const userData = await poolConnection.request()
            .input('userId', sql.Int, req.user.userId)
            .query('SELECT correo, numero_documento FROM usuarios WHERE id = @userId');
        
        if (userData.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        const usuario = userData.recordset[0];

        // Buscar mensajes por correo o cédula del usuario
        const result = await poolConnection.request()
            .input('email', sql.NVarChar(100), usuario.correo)
            .input('cedula', sql.NVarChar(20), usuario.numero_documento)
            .query(`
                SELECT 
                    id,
                    nombres,
                    apellidos,
                    cedula,
                    telefono,
                    email,
                    tipo_contacto,
                    prioridad,
                    asunto,
                    mensaje,
                    fecha_creacion,
                    estado,
                    respuesta,
                    fecha_respuesta
                FROM contactos 
                WHERE email = @email OR cedula = @cedula
                ORDER BY fecha_creacion DESC
            `);

        res.json({
            success: true,
            data: result.recordset
        });

    } catch (error) {
        console.error('❌ Error al obtener mensajes del usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ============================================
// ENDPOINT: ENVIAR ALERTAS DE PLAZO MANUALMENTE
// ============================================
app.post('/api/admin/enviar-alertas-plazo', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { diasRestantes, fechaLimite } = req.body;
        
        if (!diasRestantes || !fechaLimite) {
            return res.status(400).json({
                success: false,
                error: 'Se requieren diasRestantes y fechaLimite'
            });
        }
        
        // Obtener usuarios sin postulaciones
        const result = await poolConnection.request().query(`
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
                AND (h.id IS NULL OR (h.id IS NOT NULL AND p.id IS NULL))
            GROUP BY u.id, u.nombres, u.apellidos, u.correo
        `);
        
        const usuarios = result.recordset;
        
        if (usuarios.length === 0) {
            return res.json({
                success: true,
                message: 'No hay usuarios pendientes de postulación',
                enviados: 0
            });
        }
        
        // Enviar notificaciones (proceso asíncrono)
        let enviados = 0;
        const promesas = usuarios.map(async (usuario) => {
            try {
                const resultado = await notificationService.notificarAlertaPlazo(
                    usuario,
                    diasRestantes,
                    new Date(fechaLimite)
                );
                if (resultado.success) enviados++;
                return resultado;
            } catch (error) {
                console.error(`Error al enviar alerta a ${usuario.correo}:`, error);
                return { success: false, error: error.message };
            }
        });
        
        await Promise.all(promesas);
        
        console.log(`📧 Alertas de plazo enviadas: ${enviados}/${usuarios.length}`);
        
        res.json({
            success: true,
            message: `Alertas enviadas exitosamente`,
            enviados: enviados,
            total: usuarios.length
        });
        
    } catch (error) {
        console.error('❌ Error al enviar alertas de plazo:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// ============================================
// CONFIGURACIÓN DE MULTER PARA SUBIDA DE ARCHIVOS
// ============================================

// Usar memoria temporal en lugar de disco (para Azure Blob Storage)
const storage = multer.memoryStorage();

// Filtro de archivos (solo PDF, PNG, JPG)
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Tipo de archivo no permitido. Solo se aceptan PDF, PNG y JPG'), false);
    }
};

// Configurar multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB máximo
    }
});

// ============================================
// ENDPOINTS DE DOCUMENTOS
// ============================================

// Subir documento (Conductor)
app.post('/api/documentos/subir', authenticateToken, upload.single('documento'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No se proporcionó ningún archivo'
            });
        }

        const { tipo_documento, hijo_id, descripcion } = req.body;
        const usuario_id = req.user.userId;

        // Validar tipo de documento
        const tiposPermitidos = ['registro_civil', 'tarjeta_identidad', 'cedula', 'foto_hijo', 'comprobante_residencia', 'otro'];
        if (!tiposPermitidos.includes(tipo_documento)) {
            return res.status(400).json({
                success: false,
                error: 'Tipo de documento no válido'
            });
        }

        // Generar nombre único para el archivo
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(req.file.originalname);
        const blobName = `${usuario_id}/${uniqueSuffix}${ext}`;
        
        let rutaArchivo = blobName;
        
        // Subir a Azure Blob Storage si está configurado
        if (containerClient) {
            try {
                console.log('📤 Subiendo archivo a Azure Blob Storage:', blobName);
                const blockBlobClient = containerClient.getBlockBlobClient(blobName);
                
                await blockBlobClient.uploadData(req.file.buffer, {
                    blobHTTPHeaders: {
                        blobContentType: req.file.mimetype
                    }
                });
                
                rutaArchivo = blockBlobClient.url;
                console.log('✅ Archivo subido a Azure:', rutaArchivo);
            } catch (azureError) {
                console.error('❌ Error al subir a Azure:', azureError);
                return res.status(500).json({
                    success: false,
                    error: 'Error al guardar el archivo en Azure Storage'
                });
            }
        } else {
            console.warn('⚠️ Azure Blob Storage no configurado, archivo no se guardará permanentemente');
        }

        const pool = await sql.connect(dbConfig);

        // Insertar documento en la base de datos
        const result = await pool.request()
            .input('usuario_id', sql.Int, usuario_id)
            .input('hijo_id', sql.Int, hijo_id || null)
            .input('tipo_documento', sql.VarChar(50), tipo_documento)
            .input('nombre_archivo', sql.VarChar(255), req.file.originalname)
            .input('ruta_archivo', sql.VarChar(500), rutaArchivo)
            .input('tamano_archivo', sql.Int, req.file.size)
            .input('tipo_mime', sql.VarChar(100), req.file.mimetype)
            .input('descripcion', sql.VarChar(500), descripcion || null)
            .query(`
                INSERT INTO documentos_usuarios 
                (usuario_id, hijo_id, tipo_documento, nombre_archivo, ruta_archivo, tamano_archivo, tipo_mime, descripcion, estado, fecha_subida)
                VALUES 
                (@usuario_id, @hijo_id, @tipo_documento, @nombre_archivo, @ruta_archivo, @tamano_archivo, @tipo_mime, @descripcion, 'pendiente', GETDATE());
                
                SELECT SCOPE_IDENTITY() AS id;
            `);

        const documentoId = result.recordset[0].id;
        
        // Si el documento está relacionado con un hijo, verificar si hay postulación con documentos solicitados
        if (hijo_id) {
            console.log('📝 Verificando postulación para hijo_id:', hijo_id);
            
            const postulacionResult = await pool.request()
                .input('hijo_id', sql.Int, hijo_id)
                .input('usuario_id', sql.Int, usuario_id)
                .query(`
                    SELECT id, estado_postulacion 
                    FROM postulaciones_hijos 
                    WHERE hijo_id = @hijo_id 
                    AND usuario_id = @usuario_id
                    AND estado_postulacion = 'documentos_solicitados'
                `);
            
            if (postulacionResult.recordset.length > 0) {
                const postulacionId = postulacionResult.recordset[0].id;
                console.log('✅ Postulación encontrada, actualizando estado a documentos_recibidos');
                
                // Actualizar estado de la postulación
                await pool.request()
                    .input('postulacion_id', sql.Int, postulacionId)
                    .query(`
                        UPDATE postulaciones_hijos
                        SET estado_postulacion = 'documentos_recibidos'
                        WHERE id = @postulacion_id
                    `);
                
                console.log('✅ Estado actualizado correctamente');
            }
        }

        res.json({
            success: true,
            message: 'Documento subido exitosamente',
            data: {
                id: documentoId,
                nombre_archivo: req.file.originalname,
                tipo_documento: tipo_documento,
                tamano: req.file.size
            }
        });

    } catch (error) {
        console.error('❌ Error al subir documento:', error);
        res.status(500).json({
            success: false,
            error: 'Error al subir el documento'
        });
    }
});

// Obtener documentos del usuario (Conductor)
app.get('/api/documentos/mis-documentos', authenticateToken, async (req, res) => {
    try {
        const usuario_id = req.user.userId;
        const pool = await sql.connect(dbConfig);

        const result = await pool.request()
            .input('usuario_id', sql.Int, usuario_id)
            .query(`
                SELECT 
                    d.id,
                    d.tipo_documento,
                    d.nombre_archivo,
                    d.tamano_archivo,
                    d.tipo_mime,
                    d.descripcion,
                    d.estado,
                    d.fecha_subida,
                    d.fecha_revision,
                    d.observaciones_admin,
                    h.nombres + ' ' + h.apellidos AS nombre_hijo
                FROM documentos_usuarios d
                LEFT JOIN hijos h ON d.hijo_id = h.id
                WHERE d.usuario_id = @usuario_id
                ORDER BY d.fecha_subida DESC
            `);

        res.json({
            success: true,
            data: result.recordset
        });

    } catch (error) {
        console.error('❌ Error al obtener documentos:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener los documentos'
        });
    }
});

// Obtener todos los documentos (Admin)
app.get('/api/admin/documentos', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { estado, usuario_id } = req.query;
        const pool = await sql.connect(dbConfig);

        let query = `
            SELECT 
                d.id,
                d.usuario_id,
                d.tipo_documento,
                d.nombre_archivo,
                d.tamano_archivo,
                d.tipo_mime,
                d.descripcion,
                d.estado,
                d.fecha_subida,
                d.fecha_revision,
                d.observaciones_admin,
                u.nombres + ' ' + u.apellidos AS nombre_usuario,
                u.correo AS correo_usuario,
                u.tipo_conductor,
                h.nombres + ' ' + h.apellidos AS nombre_hijo
            FROM documentos_usuarios d
            INNER JOIN usuarios u ON d.usuario_id = u.id
            LEFT JOIN hijos h ON d.hijo_id = h.id
            WHERE 1=1
        `;

        const request = pool.request();

        if (estado) {
            query += ` AND d.estado = @estado`;
            request.input('estado', sql.VarChar(20), estado);
        }

        if (usuario_id) {
            query += ` AND d.usuario_id = @usuario_id`;
            request.input('usuario_id', sql.Int, usuario_id);
        }

        query += ` ORDER BY d.fecha_subida DESC`;

        const result = await request.query(query);

        res.json({
            success: true,
            data: result.recordset
        });

    } catch (error) {
        console.error('❌ Error al obtener documentos (admin):', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener los documentos'
        });
    }
});

// Descargar documento
app.get('/api/documentos/descargar/:id', authenticateToken, async (req, res) => {
    try {
        const documentoId = req.params.id;
        const usuario_id = req.user.userId;
        const esAdmin = req.user.rol === 'admin';

        const pool = await sql.connect(dbConfig);

        // Obtener información del documento
        const result = await pool.request()
            .input('id', sql.Int, documentoId)
            .query(`
                SELECT 
                    d.id,
                    d.usuario_id,
                    d.nombre_archivo,
                    d.ruta_archivo,
                    d.tipo_mime
                FROM documentos_usuarios d
                WHERE d.id = @id
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Documento no encontrado'
            });
        }

        const documento = result.recordset[0];

        // Verificar permisos (solo el dueño o admin pueden descargar)
        if (!esAdmin && documento.usuario_id !== usuario_id) {
            return res.status(403).json({
                success: false,
                error: 'No tienes permiso para descargar este documento'
            });
        }

        console.log('📥 Intentando descargar documento:', {
            id: documento.id,
            nombre: documento.nombre_archivo,
            ruta: documento.ruta_archivo
        });

        // Si la ruta es una URL de Azure, redirigir
        if (documento.ruta_archivo.startsWith('https://')) {
            console.log('✅ Descargando desde Azure Blob Storage');
            
            // Generar URL con SAS token temporal (válido por 1 hora)
            if (containerClient) {
                try {
                    const blobName = documento.ruta_archivo.split('/').slice(-2).join('/'); // Extraer usuario_id/archivo
                    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
                    
                    // Descargar el blob
                    const downloadResponse = await blockBlobClient.download();
                    
                    // Configurar headers
                    res.setHeader('Content-Type', documento.tipo_mime);
                    res.setHeader('Content-Disposition', `attachment; filename="${documento.nombre_archivo}"`);
                    
                    // Stream el archivo al cliente
                    downloadResponse.readableStreamBody.pipe(res);
                    return;
                } catch (azureError) {
                    console.error('❌ Error al descargar de Azure:', azureError);
                    return res.status(500).json({
                        success: false,
                        error: 'Error al descargar el archivo de Azure Storage'
                    });
                }
            }
        }
        
        // Fallback: intentar descargar desde sistema de archivos local (legacy)
        if (fs.existsSync(documento.ruta_archivo)) {
            res.setHeader('Content-Type', documento.tipo_mime);
            res.setHeader('Content-Disposition', `attachment; filename="${documento.nombre_archivo}"`);
            res.sendFile(path.resolve(documento.ruta_archivo));
        } else {
            console.error('❌ Archivo no encontrado:', documento.ruta_archivo);
            return res.status(404).json({
                success: false,
                error: 'Archivo no encontrado en el servidor'
            });
        }

    } catch (error) {
        console.error('❌ Error al descargar documento:', error);
        res.status(500).json({
            success: false,
            error: 'Error al descargar el documento'
        });
    }
});

// Revisar documento (Admin)
app.put('/api/admin/documentos/:id/revisar', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const documentoId = req.params.id;
        const { estado, observaciones } = req.body;

        // Validar estado
        const estadosPermitidos = ['aprobado', 'rechazado'];
        if (!estadosPermitidos.includes(estado)) {
            return res.status(400).json({
                success: false,
                error: 'Estado no válido'
            });
        }

        const pool = await sql.connect(dbConfig);

        const result = await pool.request()
            .input('id', sql.Int, documentoId)
            .input('estado', sql.VarChar(20), estado)
            .input('observaciones', sql.VarChar(500), observaciones || null)
            .query(`
                UPDATE documentos_usuarios
                SET 
                    estado = @estado,
                    observaciones_admin = @observaciones,
                    fecha_revision = GETDATE()
                WHERE id = @id;

                SELECT 
                    d.*,
                    u.nombres + ' ' + u.apellidos AS nombre_usuario,
                    u.correo AS correo_usuario
                FROM documentos_usuarios d
                INNER JOIN usuarios u ON d.usuario_id = u.id
                WHERE d.id = @id;
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Documento no encontrado'
            });
        }

        const documento = result.recordset[0];

        // Enviar notificación al usuario
        try {
            await notificationService.notificarRevisionDocumento(
                {
                    correo: documento.correo_usuario,
                    nombres: documento.nombre_usuario
                },
                {
                    tipo_documento: documento.tipo_documento,
                    estado: estado,
                    observaciones: observaciones
                }
            );
        } catch (emailError) {
            console.error('Error al enviar notificación:', emailError);
        }

        res.json({
            success: true,
            message: `Documento ${estado} exitosamente`,
            data: documento
        });

    } catch (error) {
        console.error('❌ Error al revisar documento:', error);
        res.status(500).json({
            success: false,
            error: 'Error al revisar el documento'
        });
    }
});

// Eliminar documento
app.delete('/api/documentos/:id', authenticateToken, async (req, res) => {
    try {
        const documentoId = req.params.id;
        const usuario_id = req.user.userId;
        const esAdmin = req.user.rol === 'admin';

        const pool = await sql.connect(dbConfig);

        // Obtener información del documento
        const result = await pool.request()
            .input('id', sql.Int, documentoId)
            .query(`
                SELECT 
                    d.id,
                    d.usuario_id,
                    d.ruta_archivo,
                    d.estado
                FROM documentos_usuarios d
                WHERE d.id = @id
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Documento no encontrado'
            });
        }

        const documento = result.recordset[0];

        // Verificar permisos
        if (!esAdmin && documento.usuario_id !== usuario_id) {
            return res.status(403).json({
                success: false,
                error: 'No tienes permiso para eliminar este documento'
            });
        }

        // No permitir eliminar documentos aprobados (solo admin puede)
        if (documento.estado === 'aprobado' && !esAdmin) {
            return res.status(403).json({
                success: false,
                error: 'No puedes eliminar un documento aprobado'
            });
        }

        // Eliminar archivo físico
        if (fs.existsSync(documento.ruta_archivo)) {
            fs.unlinkSync(documento.ruta_archivo);
        }

        // Eliminar registro de la base de datos
        await pool.request()
            .input('id', sql.Int, documentoId)
            .query(`DELETE FROM documentos_usuarios WHERE id = @id`);

        res.json({
            success: true,
            message: 'Documento eliminado exitosamente'
        });

    } catch (error) {
        console.error('❌ Error al eliminar documento:', error);
        res.status(500).json({
            success: false,
            error: 'Error al eliminar el documento'
        });
    }
});

// ============================================
// INICIAR SERVIDOR
// ============================================

async function startServer() {
    try {
        // Conectar a la base de datos primero
        await connectToDatabase();
        
        // Iniciar servidor
        const server = app.listen(PORT, () => {
            console.log(`🚀 Servidor Coomotor API ejecutándose en puerto ${PORT}`);
            console.log(`🌐 Entorno: ${process.env.NODE_ENV || 'production'}`);
            console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
            console.log(`🔵 Base de datos: Azure SQL Database`);
            console.log(`📧 Correo: SendGrid ${notificationService.initialized ? 'Activo ✓' : 'No configurado'}`);
        });
        
        // Manejo de cierre graceful
        process.on('SIGTERM', () => {
            console.log('🛑 SIGTERM recibido, cerrando servidor...');
            server.close(() => {
                console.log('✅ Servidor cerrado');
                if (poolConnection) {
                    poolConnection.close();
                    console.log('✅ Conexión Azure SQL cerrada');
                }
                process.exit(0);
            });
        });
        
        process.on('SIGINT', () => {
            console.log('🛑 SIGINT recibido, cerrando servidor...');
            server.close(() => {
                console.log('✅ Servidor cerrado');
                if (poolConnection) {
                    poolConnection.close();
                    console.log('✅ Conexión Azure SQL cerrada');
                }
                process.exit(0);
            });
        });
        
    } catch (error) {
        console.error('❌ Error iniciando servidor:', error);
        process.exit(1);
    }
}

// Iniciar el servidor - MOVIDO AL FINAL DEL ARCHIVO
// startServer();

// ============================================
// MANEJO DE ERRORES (AL FINAL)
// ============================================

// MANEJADORES DE ERROR MOVIDOS AL FINAL DEL ARCHIVO

module.exports = app;

// ============================================
// RUTAS ESPECÍFICAS PARA SISTEMA DE REGALOS
// ============================================

// Obtener perfil del usuario
app.get('/api/usuarios/perfil', authenticateToken, async (req, res) => {
    try {
        const result = await poolConnection.request()
            .input('userId', sql.Int, req.user.userId)
            .query(`
                SELECT id, nombres, apellidos, celular, correo, tipo_documento, numero_documento,
                       tipo_conductor, subtipo_conductor, rol, estado, fecha_registro
                FROM usuarios 
                WHERE id = @userId AND estado = 'activo'
            `);
        
        if (result.recordset.length === 0) {
            return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
        }
        
        res.json({ success: true, data: result.recordset[0] });
    } catch (error) {
        console.error('Error al obtener perfil:', error);
        res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
});

// Obtener estadísticas del empleado
app.get('/api/empleados/estadisticas', authenticateToken, async (req, res) => {
    try {
        const result = await poolConnection.request()
            .input('userId', sql.Int, req.user.userId)
            .query(`
                SELECT 
                    (SELECT COUNT(*) FROM hijos WHERE usuario_id = @userId AND estado = 'activo') as totalHijos,
                    (SELECT COUNT(*) FROM postulaciones_hijos WHERE usuario_id = @userId) as totalPostulaciones,
                    (SELECT COUNT(*) FROM postulaciones_hijos WHERE usuario_id = @userId AND estado_postulacion = 'aprobada') as postulacionesAprobadas,
                    (SELECT COUNT(*) FROM postulaciones_hijos WHERE usuario_id = @userId AND estado_postulacion = 'entregado') as regalosEntregados
            `);
        
        res.json({ success: true, data: result.recordset[0] });
    } catch (error) {
        console.error('Error al obtener estadísticas del empleado:', error);
        res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
});

// Obtener hijos del usuario
app.get('/api/hijos', authenticateToken, async (req, res) => {
    try {
        const result = await poolConnection.request()
            .input('userId', sql.Int, req.user.userId)
            .query(`
                SELECT 
                    h.*,
                    p.id as postulacion_id,
                    p.estado_postulacion
                FROM hijos h
                LEFT JOIN postulaciones_hijos p ON h.id = p.hijo_id 
                    AND p.estado_postulacion NOT IN ('rechazada', 'cancelada')
                WHERE h.usuario_id = @userId 
                  AND h.estado = 'activo'
                  AND h.id NOT IN (
                      SELECT hijo_id 
                      FROM postulaciones_hijos 
                      WHERE estado_postulacion IN ('rechazada', 'cancelada')
                  )
                ORDER BY h.fecha_registro DESC
            `);
        
        console.log(`📊 Hijos para usuario ${req.user.userId}:`, result.recordset.length);
        result.recordset.forEach(hijo => {
            console.log(`  - ${hijo.nombres}: postulacion_id=${hijo.postulacion_id}, estado=${hijo.estado_postulacion}`);
        });
        
        res.json({ success: true, data: result.recordset });
    } catch (error) {
        console.error('Error al obtener hijos:', error);
        res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
});

// Registrar nuevo hijo
app.post('/api/hijos', authenticateToken, async (req, res) => {
    try {
        const { nombres, apellidos, tipo_documento, numero_documento, fecha_nacimiento } = req.body;
        
        // Validar edad (máximo 12 años)
        const fechaNac = new Date(fecha_nacimiento);
        const hoy = new Date();
        const edad = hoy.getFullYear() - fechaNac.getFullYear();
        
        if (edad > 12) {
            return res.status(400).json({ success: false, error: 'Solo se pueden registrar hijos menores de 12 años' });
        }
        
        const result = await poolConnection.request()
            .input('userId', sql.Int, req.user.userId)
            .input('nombres', sql.NVarChar, nombres)
            .input('apellidos', sql.NVarChar, apellidos)
            .input('tipoDocumento', sql.NVarChar, tipo_documento)
            .input('numeroDocumento', sql.NVarChar, numero_documento)
            .input('fechaNacimiento', sql.Date, fecha_nacimiento)
            .input('genero', sql.NVarChar, 'masculino') // Por defecto
            .query(`
                INSERT INTO hijos (usuario_id, nombres, apellidos, tipo_documento, numero_documento, fecha_nacimiento, genero)
                VALUES (@userId, @nombres, @apellidos, @tipoDocumento, @numeroDocumento, @fechaNacimiento, @genero);
                SELECT SCOPE_IDENTITY() AS id;
            `);
        
        res.json({ success: true, data: { id: result.recordset[0].id }, message: 'Hijo registrado exitosamente' });
    } catch (error) {
        console.error('Error al registrar hijo:', error);
        if (error.message.includes('UNIQUE')) {
            res.status(400).json({ success: false, error: 'Ya existe un hijo con ese número de documento' });
        } else {
            res.status(500).json({ success: false, error: 'Error interno del servidor' });
        }
    }
});

// Crear postulación para regalo
app.post('/api/postulaciones', authenticateToken, async (req, res) => {
    try {
        const { hijo_id } = req.body;
        
        // Verificar que el hijo pertenece al usuario
        const hijoResult = await poolConnection.request()
            .input('hijoId', sql.Int, hijo_id)
            .input('userId', sql.Int, req.user.userId)
            .query(`
                SELECT h.id, h.nombres, h.apellidos, h.fecha_nacimiento,
                       u.nombres as usuario_nombres, u.apellidos as usuario_apellidos, u.correo
                FROM hijos h
                INNER JOIN usuarios u ON h.usuario_id = u.id
                WHERE h.id = @hijoId AND h.usuario_id = @userId AND h.estado = 'activo'
            `);
        
        if (hijoResult.recordset.length === 0) {
            return res.status(404).json({ success: false, error: 'Hijo no encontrado' });
        }
        
        const hijo = hijoResult.recordset[0];
        
        // Verificar que no existe una postulación previa
        const postulacionExistente = await poolConnection.request()
            .input('hijoId', sql.Int, hijo_id)
            .query('SELECT id FROM postulaciones_hijos WHERE hijo_id = @hijoId');
        
        if (postulacionExistente.recordset.length > 0) {
            return res.status(400).json({ success: false, error: 'Ya existe una postulación para este hijo' });
        }
        
        const result = await poolConnection.request()
            .input('userId', sql.Int, req.user.userId)
            .input('hijoId', sql.Int, hijo_id)
            .query(`
                INSERT INTO postulaciones_hijos (usuario_id, hijo_id, tipo_regalo_solicitado, estado_postulacion)
                VALUES (@userId, @hijoId, 'juguete', 'pendiente');
                SELECT SCOPE_IDENTITY() AS id;
            `);
        
        const postulacionId = result.recordset[0].id;
        
        // Enviar email de confirmación al conductor
        try {
            const edad = calcularEdad(hijo.fecha_nacimiento);
            await notificationService.notificarConfirmacionPostulacion({
                email: hijo.correo,
                nombreEmpleado: `${hijo.usuario_nombres} ${hijo.usuario_apellidos}`,
                nombreHijo: `${hijo.nombres} ${hijo.apellidos}`,
                edad: edad
            });
        } catch (emailError) {
            console.error('Error al enviar email de confirmación:', emailError);
        }
        
        res.json({ 
            success: true, 
            data: { id: postulacionId }, 
            message: 'Postulación creada exitosamente. Recibirás un correo de confirmación.' 
        });
    } catch (error) {
        console.error('Error al crear postulación:', error);
        res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
});

// Función auxiliar para calcular edad
function calcularEdad(fechaNacimiento) {
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
        edad--;
    }
    return edad;
}

// Obtener postulaciones del empleado actual
app.get('/api/postulaciones', authenticateToken, async (req, res) => {
    try {
        const result = await poolConnection.request()
            .input('userId', sql.Int, req.user.userId)
            .query(`
                SELECT 
                    p.*,
                    h.nombres as hijo_nombres,
                    h.apellidos as hijo_apellidos,
                    h.fecha_nacimiento as fecha_nacimiento_hijo,
                    h.tipo_documento,
                    h.numero_documento
                FROM postulaciones_hijos p
                INNER JOIN hijos h ON p.hijo_id = h.id
                WHERE p.usuario_id = @userId
                ORDER BY p.fecha_postulacion DESC
            `);
        
        res.json({ success: true, data: result.recordset });
    } catch (error) {
        console.error('Error al obtener postulaciones del empleado:', error);
        res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
});

// Estadísticas para admin
app.get('/api/admin/estadisticas', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const result = await poolConnection.request().query(`
            SELECT 
                (SELECT COUNT(*) FROM usuarios WHERE estado = 'activo' AND rol IN ('empleado', 'conductor')) as totalEmpleados,
                (SELECT COUNT(*) FROM hijos WHERE estado = 'activo') as totalHijos,
                (SELECT COUNT(*) FROM postulaciones_hijos WHERE estado_postulacion = 'pendiente') as postulacionesPendientes,
                (SELECT COUNT(*) FROM postulaciones_hijos WHERE estado_postulacion = 'aprobada') as postulacionesAprobadas,
                (SELECT COUNT(*) FROM postulaciones_hijos WHERE estado_postulacion = 'regalo_comprado') as regalosComprados,
                (SELECT COUNT(*) FROM postulaciones_hijos WHERE estado_postulacion = 'entregado') as regalosEntregados,
                (SELECT COUNT(*) FROM contactos) as totalContactos,
                (SELECT COUNT(*) FROM contactos WHERE estado = 'pendiente') as contactosPendientes
        `);
        
        res.json({ success: true, data: result.recordset[0] });
    } catch (error) {
        console.error('Error al obtener estadísticas admin:', error);
        res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
});

// Obtener postulaciones para admin
app.get('/api/admin/postulaciones', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { filtro = 'todas' } = req.query;
        // Excluir rechazadas y canceladas por defecto
        let whereClause = "WHERE p.estado_postulacion NOT IN ('rechazada', 'cancelada')"; 
        
        if (filtro !== 'todas') {
            whereClause = `WHERE p.estado_postulacion = '${filtro}'`;
        }
        
        const result = await poolConnection.request().query(`
            SELECT 
                p.*,
                u.nombres as empleado_nombres,
                u.apellidos as empleado_apellidos,
                u.tipo_conductor,
                u.subtipo_conductor,
                h.nombres as hijo_nombres,
                h.apellidos as hijo_apellidos,
                h.fecha_nacimiento as fecha_nacimiento_hijo,
                h.tipo_documento,
                h.numero_documento
            FROM postulaciones_hijos p
            INNER JOIN usuarios u ON p.usuario_id = u.id
            INNER JOIN hijos h ON p.hijo_id = h.id
            ${whereClause}
            ORDER BY p.fecha_postulacion DESC
        `);
        
        res.json({ success: true, data: result.recordset });
    } catch (error) {
        console.error('Error al obtener postulaciones:', error);
        res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
});

// Solicitar documentos al conductor (Admin)
app.put('/api/admin/postulaciones/:id/solicitar-documentos', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { documentos_solicitados, mensaje } = req.body;
        
        console.log('📝 Solicitud de documentos recibida:', { id, documentos_solicitados, mensaje });
        
        if (!documentos_solicitados || documentos_solicitados.length === 0) {
            console.log('❌ No se especificaron documentos');
            return res.status(400).json({ 
                success: false, 
                error: 'Debes especificar al menos un documento a solicitar' 
            });
        }
        
        // Obtener información de la postulación
        console.log('🔍 Buscando postulación con ID:', id);
        const postulacionResult = await poolConnection.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT 
                    p.id,
                    p.usuario_id,
                    p.hijo_id,
                    u.nombres as usuario_nombres,
                    u.apellidos as usuario_apellidos,
                    u.correo as usuario_correo,
                    h.nombres as hijo_nombres,
                    h.apellidos as hijo_apellidos
                FROM postulaciones_hijos p
                INNER JOIN usuarios u ON p.usuario_id = u.id
                INNER JOIN hijos h ON p.hijo_id = h.id
                WHERE p.id = @id
            `);
        
        if (postulacionResult.recordset.length === 0) {
            console.log('❌ Postulación no encontrada');
            return res.status(404).json({ success: false, error: 'Postulación no encontrada' });
        }
        
        const postulacion = postulacionResult.recordset[0];
        console.log('✅ Postulación encontrada:', postulacion);
        
        // Actualizar postulación con documentos solicitados
        console.log('💾 Actualizando postulación...');
        console.log('📊 Datos a actualizar:', {
            id,
            documentos: JSON.stringify(documentos_solicitados),
            mensaje: mensaje || 'Por favor sube los siguientes documentos para continuar con tu postulación'
        });
        
        try {
            const updateResult = await poolConnection.request()
                .input('id', sql.Int, id)
                .input('documentos', sql.VarChar(1000), JSON.stringify(documentos_solicitados))
                .input('mensaje', sql.VarChar(1000), mensaje || 'Por favor sube los siguientes documentos para continuar con tu postulación')
                .query(`
                    UPDATE postulaciones_hijos
                    SET 
                        estado_postulacion = 'documentos_solicitados',
                        documentos_solicitados = @documentos,
                        mensaje_admin = @mensaje,
                        fecha_solicitud_documentos = GETDATE()
                    WHERE id = @id
                `);
            
            console.log('✅ Postulación actualizada correctamente. Rows affected:', updateResult.rowsAffected);
        } catch (updateError) {
            console.error('❌ Error en UPDATE:', updateError.message);
            console.error('Stack:', updateError.stack);
            throw updateError;
        }
        
        // Enviar notificación al conductor
        try {
            console.log('📧 Enviando email de notificación...');
            await notificationService.notificarSolicitudDocumentos({
                email: postulacion.usuario_correo,
                nombreEmpleado: `${postulacion.usuario_nombres} ${postulacion.usuario_apellidos}`,
                nombreHijo: `${postulacion.hijo_nombres} ${postulacion.hijo_apellidos}`,
                documentosSolicitados: documentos_solicitados,
                mensaje: mensaje || 'Por favor sube los siguientes documentos para continuar con tu postulación',
                postulacionId: id
            });
            console.log('✅ Email enviado correctamente');
        } catch (emailError) {
            console.error('⚠️ Error al enviar email (no crítico):', emailError.message);
            // No lanzar error, continuar con la respuesta
        }
        
        console.log('🎉 Proceso completado exitosamente');
        res.json({ 
            success: true, 
            message: 'Solicitud de documentos enviada exitosamente' 
        });
        
    } catch (error) {
        console.error('❌ Error al solicitar documentos:', error);
        console.error('Stack trace:', error.stack);
        res.status(500).json({ 
            success: false, 
            error: 'Error interno del servidor',
            details: error.message 
        });
    }
});

// Aprobar postulación
app.put('/api/admin/postulaciones/:id/aprobar', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { observaciones } = req.body;
        
        // Obtener datos de la postulación, hijo y usuario
        const postulacionResult = await poolConnection.request()
            .input('postulacionId', sql.Int, id)
            .query(`
                SELECT 
                    p.id,
                    p.hijo_id,
                    h.nombres as hijo_nombres,
                    h.apellidos as hijo_apellidos,
                    DATEDIFF(YEAR, h.fecha_nacimiento, GETDATE()) as hijo_edad,
                    h.usuario_id,
                    u.nombres as usuario_nombres,
                    u.apellidos as usuario_apellidos,
                    u.correo as usuario_correo
                FROM postulaciones_hijos p
                INNER JOIN hijos h ON p.hijo_id = h.id
                INNER JOIN usuarios u ON h.usuario_id = u.id
                WHERE p.id = @postulacionId
            `);
        
        if (postulacionResult.recordset.length === 0) {
            return res.status(404).json({ success: false, error: 'Postulación no encontrada' });
        }
        
        const postulacion = postulacionResult.recordset[0];
        
        // Actualizar estado de la postulación
        await poolConnection.request()
            .input('postulacionId', sql.Int, id)
            .input('adminId', sql.Int, req.user.userId)
            .input('observaciones', sql.NText, observaciones || '')
            .query(`
                UPDATE postulaciones_hijos 
                SET estado_postulacion = 'aprobada',
                    fecha_aprobacion = GETDATE(),
                    aprobado_por = @adminId,
                    observaciones_admin = @observaciones
                WHERE id = @postulacionId
            `);
        
        // Enviar notificación por correo
        const datosNotificacion = {
            email: postulacion.usuario_correo,
            nombreEmpleado: `${postulacion.usuario_nombres} ${postulacion.usuario_apellidos}`,
            nombreHijo: `${postulacion.hijo_nombres} ${postulacion.hijo_apellidos}`,
            edad: postulacion.hijo_edad
        };
        
        // Enviar notificación (no bloqueante)
        notificationService.notificarPostulacionAprobada(datosNotificacion)
            .then(result => {
                if (result.success) {
                    console.log(`✅ Notificación de aprobación enviada a ${postulacion.usuario_correo}`);
                } else {
                    console.log(`⚠️ No se pudo enviar notificación`);
                }
            })
            .catch(err => console.error('Error al enviar notificación:', err));
        
        res.json({ 
            success: true, 
            message: 'Postulación aprobada exitosamente. Se ha enviado una notificación al usuario.' 
        });
    } catch (error) {
        console.error('Error al aprobar postulación:', error);
        res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
});

// Rechazar postulación
app.put('/api/admin/postulaciones/:id/rechazar', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { motivo } = req.body;
        
        // Obtener datos de la postulación, hijo y usuario
        const postulacionResult = await poolConnection.request()
            .input('postulacionId', sql.Int, id)
            .query(`
                SELECT 
                    p.id,
                    p.hijo_id,
                    h.nombres as hijo_nombres,
                    h.apellidos as hijo_apellidos,
                    DATEDIFF(YEAR, h.fecha_nacimiento, GETDATE()) as hijo_edad,
                    h.usuario_id,
                    u.nombres as usuario_nombres,
                    u.apellidos as usuario_apellidos,
                    u.correo as usuario_correo
                FROM postulaciones_hijos p
                INNER JOIN hijos h ON p.hijo_id = h.id
                INNER JOIN usuarios u ON h.usuario_id = u.id
                WHERE p.id = @postulacionId
            `);
        
        if (postulacionResult.recordset.length === 0) {
            return res.status(404).json({ success: false, error: 'Postulación no encontrada' });
        }
        
        const postulacion = postulacionResult.recordset[0];
        
        // Actualizar estado de la postulación
        await poolConnection.request()
            .input('postulacionId', sql.Int, id)
            .input('adminId', sql.Int, req.user.userId)
            .input('motivo', sql.NText, motivo || '')
            .query(`
                UPDATE postulaciones_hijos 
                SET estado_postulacion = 'rechazada',
                    fecha_revision = GETDATE(),
                    revisado_por = @adminId,
                    observaciones_admin = @motivo
                WHERE id = @postulacionId
            `);
        
        // Enviar notificación por correo
        const datosNotificacion = {
            email: postulacion.usuario_correo,
            nombreEmpleado: `${postulacion.usuario_nombres} ${postulacion.usuario_apellidos}`,
            nombreHijo: `${postulacion.hijo_nombres} ${postulacion.hijo_apellidos}`,
            motivo: motivo || 'No se proporcionó un motivo específico'
        };
        
        // Enviar notificación (no bloqueante)
        notificationService.notificarPostulacionRechazada(datosNotificacion)
            .then(result => {
                if (result.success) {
                    console.log(`✅ Notificación de rechazo enviada a ${postulacion.usuario_correo}`);
                } else {
                    console.log(`⚠️ No se pudo enviar notificación`);
                }
            })
            .catch(err => console.error('Error al enviar notificación:', err));
        
        res.json({ 
            success: true, 
            message: 'Postulación rechazada. Se ha enviado una notificación al usuario.' 
        });
    } catch (error) {
        console.error('Error al rechazar postulación:', error);
        res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
});

// Eliminar aprobación de postulación
app.put('/api/admin/postulaciones/:id/eliminar-aprobacion', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { motivo, nombreHijo } = req.body;
        
        // Verificar que la postulación existe y está aprobada
        const postulacionResult = await poolConnection.request()
            .input('postulacionId', sql.Int, id)
            .query(`
                SELECT 
                    p.id,
                    p.hijo_id,
                    p.estado_postulacion,
                    h.nombres as hijo_nombres,
                    h.apellidos as hijo_apellidos,
                    DATEDIFF(YEAR, h.fecha_nacimiento, GETDATE()) as hijo_edad,
                    h.usuario_id,
                    u.nombres as usuario_nombres,
                    u.apellidos as usuario_apellidos,
                    u.correo as usuario_correo
                FROM postulaciones_hijos p
                INNER JOIN hijos h ON p.hijo_id = h.id
                INNER JOIN usuarios u ON h.usuario_id = u.id
                WHERE p.id = @postulacionId
            `);
        
        if (postulacionResult.recordset.length === 0) {
            return res.status(404).json({ success: false, error: 'Postulación no encontrada' });
        }
        
        const postulacion = postulacionResult.recordset[0];
        
        // Verificar que está aprobada
        if (postulacion.estado_postulacion !== 'aprobada') {
            return res.status(400).json({ 
                success: false, 
                error: 'Solo se pueden eliminar postulaciones aprobadas' 
            });
        }
        
        // Cambiar el estado a "eliminada" o "cancelada"
        await poolConnection.request()
            .input('postulacionId', sql.Int, id)
            .input('adminId', sql.Int, req.user.userId)
            .input('motivo', sql.NText, motivo || '')
            .query(`
                UPDATE postulaciones_hijos 
                SET estado_postulacion = 'cancelada',
                    fecha_revision = GETDATE(),
                    revisado_por = @adminId,
                    observaciones_admin = CONCAT(observaciones_admin, CHAR(13) + CHAR(10) + '--- APROBACIÓN ELIMINADA --- ' + CHAR(13) + CHAR(10) + 'Motivo: ', @motivo)
                WHERE id = @postulacionId
            `);
        
        // Enviar notificación por correo
        const datosNotificacion = {
            email: postulacion.usuario_correo,
            nombreEmpleado: `${postulacion.usuario_nombres} ${postulacion.usuario_apellidos}`,
            nombreHijo: `${postulacion.hijo_nombres} ${postulacion.hijo_apellidos}`,
            motivo: motivo || 'No se proporcionó un motivo específico'
        };
        
        // Enviar notificación (no bloqueante)
        notificationService.notificarAprobacionEliminada(datosNotificacion)
            .then(result => {
                if (result.success) {
                    console.log(`✅ Notificación de eliminación de aprobación enviada a ${postulacion.usuario_correo}`);
                } else {
                    console.log(`⚠️ No se pudo enviar notificación`);
                }
            })
            .catch(err => console.error('Error al enviar notificación:', err));
        
        res.json({ 
            success: true, 
            message: 'Aprobación eliminada exitosamente. Se ha notificado al usuario.' 
        });
    } catch (error) {
        console.error('Error al eliminar aprobación:', error);
        res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
});

// Obtener empleados para admin
app.get('/api/admin/empleados', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { estado } = req.query;
        
        let whereClause = "WHERE u.rol IN ('empleado', 'conductor')";
        const request = poolConnection.request();
        
        // Filtrar por estado si se proporciona
        if (estado) {
            whereClause += ` AND u.estado = @estado`;
            request.input('estado', sql.NVarChar, estado);
        }
        
        const result = await request.query(`
            SELECT 
                u.id,
                u.nombres,
                u.apellidos,
                u.celular,
                u.correo,
                u.tipo_documento,
                u.numero_documento,
                u.tipo_conductor,
                u.subtipo_conductor,
                u.rol,
                u.estado,
                u.fecha_registro,
                u.ultimo_acceso,
                u.verificado,
                (SELECT COUNT(*) FROM hijos WHERE usuario_id = u.id AND estado = 'activo') as total_hijos,
                (SELECT COUNT(*) FROM postulaciones_hijos ph 
                 INNER JOIN hijos h ON ph.hijo_id = h.id 
                 WHERE h.usuario_id = u.id) as total_postulaciones
            FROM usuarios u
            ${whereClause}
            ORDER BY u.fecha_registro DESC
        `);
        
        res.json({ success: true, data: result.recordset });
    } catch (error) {
        console.error('Error al obtener empleados:', error);
        res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
});

// Obtener un usuario específico (para admin)
app.get('/api/admin/usuarios/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await poolConnection.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT 
                    u.id,
                    u.nombres,
                    u.apellidos,
                    u.celular,
                    u.correo,
                    u.tipo_documento,
                    u.numero_documento,
                    u.tipo_conductor,
                    u.subtipo_conductor,
                    u.rol,
                    u.estado,
                    u.fecha_registro,
                    u.ultimo_acceso,
                    u.verificado,
                    u.telefono_alternativo,
                    (SELECT COUNT(*) FROM hijos WHERE usuario_id = u.id AND estado = 'activo') as total_hijos,
                    (SELECT COUNT(*) FROM postulaciones_hijos ph 
                     INNER JOIN hijos h ON ph.hijo_id = h.id 
                     WHERE h.usuario_id = u.id) as total_postulaciones
                FROM usuarios u
                WHERE u.id = @id
            `);
        
        if (result.recordset.length === 0) {
            return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
        }
        
        res.json({ success: true, data: result.recordset[0] });
    } catch (error) {
        console.error('Error al obtener usuario:', error);
        res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
});

// Actualizar usuario (para admin)
app.put('/api/admin/usuarios/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { nombres, apellidos, celular, correo, tipo_documento, numero_documento, tipo_conductor, subtipo_conductor } = req.body;
        
        // Validaciones
        if (!nombres || !apellidos || !celular || !correo || !tipo_documento || !numero_documento || !tipo_conductor) {
            return res.status(400).json({
                success: false,
                error: 'Todos los campos obligatorios deben ser completados'
            });
        }
        
        // Validar nombres
        if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,50}$/.test(nombres)) {
            return res.status(400).json({
                success: false,
                error: 'Los nombres solo pueden contener letras y espacios'
            });
        }
        
        // Validar apellidos
        if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,50}$/.test(apellidos)) {
            return res.status(400).json({
                success: false,
                error: 'Los apellidos solo pueden contener letras y espacios'
            });
        }
        
        // Validar celular
        if (!/^3\d{9}$/.test(celular)) {
            return res.status(400).json({
                success: false,
                error: 'El celular debe tener 10 dígitos y comenzar con 3'
            });
        }
        
        // Validar correo
        if (!/^[a-zA-Z0-9._-]+@(gmail\.com|hotmail\.com|outlook\.com|yahoo\.com|coomotor\.com)$/.test(correo)) {
            return res.status(400).json({
                success: false,
                error: 'El correo debe ser de Gmail, Hotmail, Outlook, Yahoo o Coomotor'
            });
        }
        
        // Validar documento
        if (!/^\d{7,10}$/.test(numero_documento)) {
            return res.status(400).json({
                success: false,
                error: 'El número de documento debe tener entre 7 y 10 dígitos'
            });
        }
        
        // Verificar si el correo o documento ya existe en otro usuario
        const checkDuplicate = await poolConnection.request()
            .input('id', sql.Int, id)
            .input('correo', sql.NVarChar, correo.toLowerCase())
            .input('numero_documento', sql.NVarChar, numero_documento)
            .query('SELECT id FROM usuarios WHERE (correo = @correo OR numero_documento = @numero_documento) AND id != @id');
        
        if (checkDuplicate.recordset.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'El correo o número de documento ya está registrado en otro usuario'
            });
        }
        
        // Actualizar usuario
        await poolConnection.request()
            .input('id', sql.Int, id)
            .input('nombres', sql.NVarChar, nombres)
            .input('apellidos', sql.NVarChar, apellidos)
            .input('celular', sql.NVarChar, celular)
            .input('correo', sql.NVarChar, correo.toLowerCase())
            .input('tipo_documento', sql.NVarChar, tipo_documento)
            .input('numero_documento', sql.NVarChar, numero_documento)
            .input('tipo_conductor', sql.NVarChar, tipo_conductor)
            .input('subtipo_conductor', sql.NVarChar, subtipo_conductor || null)
            .query(`
                UPDATE usuarios 
                SET nombres = @nombres,
                    apellidos = @apellidos,
                    celular = @celular,
                    correo = @correo,
                    tipo_documento = @tipo_documento,
                    numero_documento = @numero_documento,
                    tipo_conductor = @tipo_conductor,
                    subtipo_conductor = @subtipo_conductor
                WHERE id = @id
            `);
        
        console.log(`✅ Usuario actualizado por admin: ID ${id}`);
        
        res.json({
            success: true,
            message: 'Usuario actualizado exitosamente'
        });
        
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// Cambiar estado de usuario (para admin)
app.put('/api/admin/usuarios/:id/estado', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;
        
        if (!estado || !['activo', 'inactivo', 'suspendido'].includes(estado)) {
            return res.status(400).json({
                success: false,
                error: 'Estado inválido'
            });
        }
        
        await poolConnection.request()
            .input('id', sql.Int, id)
            .input('estado', sql.NVarChar, estado)
            .query('UPDATE usuarios SET estado = @estado WHERE id = @id');
        
        console.log(`✅ Estado de usuario ${id} cambiado a: ${estado}`);
        
        res.json({
            success: true,
            message: `Usuario ${estado === 'activo' ? 'activado' : estado === 'inactivo' ? 'desactivado' : 'suspendido'} exitosamente`
        });
        
    } catch (error) {
        console.error('Error al cambiar estado de usuario:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// Eliminar usuario (para admin) - Eliminación lógica
app.delete('/api/admin/usuarios/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verificar que no sea el admin actual
        if (parseInt(id) === req.user.userId) {
            return res.status(400).json({
                success: false,
                error: 'No puedes eliminar tu propia cuenta'
            });
        }
        
        // Verificar que el usuario existe
        const checkUser = await poolConnection.request()
            .input('id', sql.Int, id)
            .query('SELECT id, nombres, apellidos FROM usuarios WHERE id = @id');
        
        if (checkUser.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }
        
        const usuario = checkUser.recordset[0];
        
        // Eliminación lógica: cambiar estado a inactivo
        await poolConnection.request()
            .input('id', sql.Int, id)
            .query('UPDATE usuarios SET estado = \'inactivo\' WHERE id = @id');
        
        console.log(`🗑️ Usuario eliminado (lógicamente) por admin: ${usuario.nombres} ${usuario.apellidos} (ID: ${id})`);
        
        res.json({
            success: true,
            message: 'Usuario eliminado exitosamente'
        });
        
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// Actualizar información de hijo
app.put('/api/hijos/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { nombres, apellidos, tipo_documento, numero_documento, fecha_nacimiento } = req.body;
        
        // Validaciones básicas
        if (!nombres || !apellidos || !tipo_documento || !numero_documento || !fecha_nacimiento) {
            return res.status(400).json({
                success: false,
                error: 'Todos los campos son obligatorios'
            });
        }
        
        // Validar edad
        const fechaNac = new Date(fecha_nacimiento);
        const hoy = new Date();
        const edad = hoy.getFullYear() - fechaNac.getFullYear();
        
        if (edad > 12) {
            return res.status(400).json({
                success: false,
                error: 'Solo se pueden registrar hijos menores de 12 años'
            });
        }
        
        // Verificar que el hijo pertenece al usuario
        const verificacion = await poolConnection.request()
            .input('hijoId', sql.Int, id)
            .input('userId', sql.Int, req.user.userId)
            .query('SELECT id FROM hijos WHERE id = @hijoId AND usuario_id = @userId');
        
        if (verificacion.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Hijo no encontrado'
            });
        }
        
        // Actualizar información
        await poolConnection.request()
            .input('hijoId', sql.Int, id)
            .input('nombres', sql.NVarChar, nombres)
            .input('apellidos', sql.NVarChar, apellidos)
            .input('tipoDocumento', sql.NVarChar, tipo_documento)
            .input('numeroDocumento', sql.NVarChar, numero_documento)
            .input('fechaNacimiento', sql.Date, fecha_nacimiento)
            .query(`
                UPDATE hijos 
                SET nombres = @nombres,
                    apellidos = @apellidos,
                    tipo_documento = @tipoDocumento,
                    numero_documento = @numeroDocumento,
                    fecha_nacimiento = @fechaNacimiento,
                    fecha_actualizacion = GETDATE()
                WHERE id = @hijoId
            `);
        
        res.json({
            success: true,
            message: 'Información actualizada exitosamente'
        });
        
    } catch (error) {
        console.error('Error al actualizar hijo:', error);
        if (error.message.includes('UNIQUE')) {
            res.status(400).json({
                success: false,
                error: 'Ya existe otro hijo con ese número de documento'
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    }
});

// Obtener detalles de una postulación específica
app.get('/api/postulaciones/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await poolConnection.request()
            .input('postulacionId', sql.Int, id)
            .input('userId', sql.Int, req.user.userId)
            .query(`
                SELECT 
                    p.*,
                    h.nombres as hijo_nombres,
                    h.apellidos as hijo_apellidos,
                    h.fecha_nacimiento,
                    h.tipo_documento,
                    h.numero_documento
                FROM postulaciones_hijos p
                INNER JOIN hijos h ON p.hijo_id = h.id
                WHERE p.id = @postulacionId AND p.usuario_id = @userId
            `);
        
        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Postulación no encontrada'
            });
        }
        
        res.json({
            success: true,
            data: result.recordset[0]
        });
        
    } catch (error) {
        console.error('Error al obtener postulación:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// ============================================
// RUTAS DE REPORTES Y ANALYTICS
// ============================================

// Obtener reportes completos con analytics
app.get('/api/admin/reportes/completo', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const result = await poolConnection.request().query(`
            -- Estadísticas generales
            SELECT 
                (SELECT COUNT(*) FROM usuarios WHERE estado = 'activo' AND rol IN ('empleado', 'conductor')) as totalEmpleados,
                (SELECT COUNT(*) FROM hijos WHERE estado = 'activo') as totalHijos,
                (SELECT COUNT(*) FROM postulaciones_hijos) as totalPostulaciones,
                (SELECT COUNT(*) FROM postulaciones_hijos WHERE estado_postulacion = 'pendiente') as postulacionesPendientes,
                (SELECT COUNT(*) FROM postulaciones_hijos WHERE estado_postulacion = 'aprobada') as postulacionesAprobadas,
                (SELECT COUNT(*) FROM postulaciones_hijos WHERE estado_postulacion = 'rechazada') as postulacionesRechazadas,
                (SELECT COUNT(*) FROM postulaciones_hijos WHERE estado_postulacion = 'entregado') as regalosEntregados,
                (SELECT COUNT(*) FROM contactos) as totalContactos,
                (SELECT COUNT(*) FROM contactos WHERE estado = 'pendiente') as contactosPendientes
        `);
        
        res.json({
            success: true,
            data: result.recordset[0]
        });
    } catch (error) {
        console.error('Error al obtener reporte completo:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// Distribución por tipo de conductor
app.get('/api/admin/reportes/distribucion-conductores', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const result = await poolConnection.request().query(`
            SELECT 
                u.tipo_conductor,
                u.subtipo_conductor,
                COUNT(DISTINCT u.id) as total_empleados,
                COUNT(DISTINCT h.id) as total_hijos,
                COUNT(DISTINCT p.id) as total_postulaciones,
                COUNT(DISTINCT CASE WHEN p.estado_postulacion = 'aprobada' THEN p.id END) as postulaciones_aprobadas,
                COUNT(DISTINCT CASE WHEN p.estado_postulacion = 'entregado' THEN p.id END) as regalos_entregados
            FROM usuarios u
            LEFT JOIN hijos h ON u.id = h.usuario_id AND h.estado = 'activo'
            LEFT JOIN postulaciones_hijos p ON h.id = p.hijo_id
            WHERE u.rol IN ('empleado', 'conductor') AND u.estado = 'activo'
            GROUP BY u.tipo_conductor, u.subtipo_conductor
            ORDER BY total_empleados DESC
        `);
        
        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error('Error al obtener distribución por conductores:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// Estadísticas de edad de hijos
app.get('/api/admin/reportes/estadisticas-edad', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const result = await poolConnection.request().query(`
            SELECT 
                DATEDIFF(YEAR, h.fecha_nacimiento, GETDATE()) as edad,
                COUNT(*) as cantidad,
                COUNT(CASE WHEN p.id IS NOT NULL THEN 1 END) as con_postulacion,
                COUNT(CASE WHEN p.estado_postulacion = 'aprobada' THEN 1 END) as aprobadas,
                COUNT(CASE WHEN p.estado_postulacion = 'entregado' THEN 1 END) as entregadas
            FROM hijos h
            LEFT JOIN postulaciones_hijos p ON h.id = p.hijo_id
            WHERE h.estado = 'activo'
            GROUP BY DATEDIFF(YEAR, h.fecha_nacimiento, GETDATE())
            ORDER BY edad
        `);
        
        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error('Error al obtener estadísticas de edad:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// Métricas de tiempo de respuesta
app.get('/api/admin/reportes/metricas-tiempo', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const result = await poolConnection.request().query(`
            SELECT 
                AVG(DATEDIFF(HOUR, p.fecha_postulacion, p.fecha_aprobacion)) as promedio_horas_aprobacion,
                MIN(DATEDIFF(HOUR, p.fecha_postulacion, p.fecha_aprobacion)) as minimo_horas_aprobacion,
                MAX(DATEDIFF(HOUR, p.fecha_postulacion, p.fecha_aprobacion)) as maximo_horas_aprobacion,
                AVG(DATEDIFF(HOUR, p.fecha_aprobacion, p.fecha_entrega)) as promedio_horas_entrega,
                COUNT(CASE WHEN DATEDIFF(HOUR, p.fecha_postulacion, p.fecha_aprobacion) <= 24 THEN 1 END) as aprobadas_24h,
                COUNT(CASE WHEN DATEDIFF(HOUR, p.fecha_postulacion, p.fecha_aprobacion) > 24 AND DATEDIFF(HOUR, p.fecha_postulacion, p.fecha_aprobacion) <= 48 THEN 1 END) as aprobadas_48h,
                COUNT(CASE WHEN DATEDIFF(HOUR, p.fecha_postulacion, p.fecha_aprobacion) > 48 THEN 1 END) as aprobadas_mas_48h
            FROM postulaciones_hijos p
            WHERE p.estado_postulacion IN ('aprobada', 'entregado')
            AND p.fecha_aprobacion IS NOT NULL
        `);
        
        res.json({
            success: true,
            data: result.recordset[0]
        });
    } catch (error) {
        console.error('Error al obtener métricas de tiempo:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// Timeline de postulaciones (últimos 30 días)
app.get('/api/admin/reportes/timeline-postulaciones', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const result = await poolConnection.request().query(`
            SELECT 
                CAST(p.fecha_postulacion AS DATE) as fecha,
                COUNT(*) as total_postulaciones,
                COUNT(CASE WHEN p.estado_postulacion = 'aprobada' THEN 1 END) as aprobadas,
                COUNT(CASE WHEN p.estado_postulacion = 'rechazada' THEN 1 END) as rechazadas,
                COUNT(CASE WHEN p.estado_postulacion = 'pendiente' THEN 1 END) as pendientes
            FROM postulaciones_hijos p
            WHERE p.fecha_postulacion >= DATEADD(DAY, -30, GETDATE())
            GROUP BY CAST(p.fecha_postulacion AS DATE)
            ORDER BY fecha DESC
        `);
        
        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error('Error al obtener timeline:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// Reporte de contactos por tipo y prioridad
app.get('/api/admin/reportes/contactos-analytics', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const result = await poolConnection.request().query(`
            SELECT 
                tipo_contacto,
                prioridad,
                estado,
                COUNT(*) as cantidad,
                AVG(DATEDIFF(HOUR, fecha_creacion, fecha_respuesta)) as promedio_horas_respuesta
            FROM contactos
            GROUP BY tipo_contacto, prioridad, estado
            ORDER BY cantidad DESC
        `);
        
        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error('Error al obtener analytics de contactos:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// Exportar reporte completo en formato JSON
app.get('/api/admin/reportes/exportar', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { formato = 'json' } = req.query;
        
        // Obtener todos los datos
        const [
            estadisticas,
            distribucion,
            edades,
            metricas,
            timeline,
            contactos
        ] = await Promise.all([
            poolConnection.request().query(`
                SELECT 
                    (SELECT COUNT(*) FROM usuarios WHERE estado = 'activo' AND rol IN ('empleado', 'conductor')) as totalEmpleados,
                    (SELECT COUNT(*) FROM hijos WHERE estado = 'activo') as totalHijos,
                    (SELECT COUNT(*) FROM postulaciones_hijos) as totalPostulaciones,
                    (SELECT COUNT(*) FROM postulaciones_hijos WHERE estado_postulacion = 'aprobada') as postulacionesAprobadas,
                    (SELECT COUNT(*) FROM postulaciones_hijos WHERE estado_postulacion = 'entregado') as regalosEntregados
            `),
            poolConnection.request().query(`
                SELECT 
                    u.tipo_conductor,
                    COUNT(DISTINCT u.id) as total_empleados,
                    COUNT(DISTINCT h.id) as total_hijos
                FROM usuarios u
                LEFT JOIN hijos h ON u.id = h.usuario_id AND h.estado = 'activo'
                WHERE u.rol IN ('empleado', 'conductor') AND u.estado = 'activo'
                GROUP BY u.tipo_conductor
            `),
            poolConnection.request().query(`
                SELECT 
                    DATEDIFF(YEAR, h.fecha_nacimiento, GETDATE()) as edad,
                    COUNT(*) as cantidad
                FROM hijos h
                WHERE h.estado = 'activo'
                GROUP BY DATEDIFF(YEAR, h.fecha_nacimiento, GETDATE())
            `),
            poolConnection.request().query(`
                SELECT 
                    AVG(DATEDIFF(HOUR, p.fecha_postulacion, p.fecha_aprobacion)) as promedio_horas_aprobacion
                FROM postulaciones_hijos p
                WHERE p.fecha_aprobacion IS NOT NULL
            `),
            poolConnection.request().query(`
                SELECT 
                    CAST(p.fecha_postulacion AS DATE) as fecha,
                    COUNT(*) as total
                FROM postulaciones_hijos p
                WHERE p.fecha_postulacion >= DATEADD(DAY, -30, GETDATE())
                GROUP BY CAST(p.fecha_postulacion AS DATE)
            `),
            poolConnection.request().query(`
                SELECT 
                    tipo_contacto,
                    COUNT(*) as cantidad
                FROM contactos
                GROUP BY tipo_contacto
            `)
        ]);
        
        const reporteCompleto = {
            fecha_generacion: new Date().toISOString(),
            generado_por: req.user.correo,
            estadisticas_generales: estadisticas.recordset[0],
            distribucion_conductores: distribucion.recordset,
            estadisticas_edad: edades.recordset,
            metricas_tiempo: metricas.recordset[0],
            timeline_30_dias: timeline.recordset,
            contactos_por_tipo: contactos.recordset
        };
        
        if (formato === 'json') {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename=reporte_coomotor_${Date.now()}.json`);
            res.json(reporteCompleto);
        } else {
            // Para futuras implementaciones de CSV o PDF
            res.json({
                success: true,
                data: reporteCompleto
            });
        }
        
    } catch (error) {
        console.error('Error al exportar reporte:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// Marcar regalo como entregado
app.put('/api/admin/postulaciones/:id/entregar', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        await poolConnection.request()
            .input('postulacionId', sql.Int, id)
            .input('adminId', sql.Int, req.user.userId)
            .query(`
                UPDATE postulaciones_hijos 
                SET estado_postulacion = 'entregado',
                    fecha_entrega = GETDATE(),
                    entregado_por = @adminId
                WHERE id = @postulacionId
            `);
        
        res.json({ 
            success: true, 
            message: 'Regalo marcado como entregado exitosamente' 
        });
        
    } catch (error) {
        console.error('Error al marcar regalo como entregado:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// Marcar regalo como comprado
app.put('/api/admin/postulaciones/:id/comprar', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        await poolConnection.request()
            .input('postulacionId', sql.Int, id)
            .input('adminId', sql.Int, req.user.userId)
            .query(`
                UPDATE postulaciones_hijos 
                SET estado_postulacion = 'regalo_comprado',
                    fecha_compra = GETDATE(),
                    comprado_por = @adminId
                WHERE id = @postulacionId
            `);
        
        res.json({ 
            success: true, 
            message: 'Regalo marcado como comprado exitosamente' 
        });
        
    } catch (error) {
        console.error('Error al marcar regalo como comprado:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// Obtener estadísticas detalladas del empleado
app.get('/api/empleados/estadisticas-detalladas', authenticateToken, async (req, res) => {
    try {
        const result = await poolConnection.request()
            .input('userId', sql.Int, req.user.userId)
            .query(`
                SELECT 
                    (SELECT COUNT(*) FROM hijos WHERE usuario_id = @userId AND estado = 'activo') as totalHijos,
                    (SELECT COUNT(*) FROM postulaciones_hijos WHERE usuario_id = @userId) as totalPostulaciones,
                    (SELECT COUNT(*) FROM postulaciones_hijos WHERE usuario_id = @userId AND estado_postulacion = 'pendiente') as postulacionesPendientes,
                    (SELECT COUNT(*) FROM postulaciones_hijos WHERE usuario_id = @userId AND estado_postulacion = 'aprobada') as postulacionesAprobadas,
                    (SELECT COUNT(*) FROM postulaciones_hijos WHERE usuario_id = @userId AND estado_postulacion = 'regalo_comprado') as regalosComprados,
                    (SELECT COUNT(*) FROM postulaciones_hijos WHERE usuario_id = @userId AND estado_postulacion = 'entregado') as regalosEntregados,
                    (SELECT COUNT(*) FROM postulaciones_hijos WHERE usuario_id = @userId AND estado_postulacion = 'rechazada') as postulacionesRechazadas,
                    (SELECT AVG(DATEDIFF(year, fecha_nacimiento, GETDATE())) FROM hijos WHERE usuario_id = @userId AND estado = 'activo') as edadPromedio
            `);
        
        const stats = result.recordset[0];
        
        // Calcular porcentajes
        const porcentajeAprobacion = stats.totalPostulaciones > 0 ? 
            Math.round((stats.postulacionesAprobadas / stats.totalPostulaciones) * 100) : 0;
        
        const porcentajeEntrega = stats.postulacionesAprobadas > 0 ? 
            Math.round((stats.regalosEntregados / stats.postulacionesAprobadas) * 100) : 0;
        
        res.json({
            success: true,
            data: {
                ...stats,
                porcentajeAprobacion,
                porcentajeEntrega,
                edadPromedio: Math.round(stats.edadPromedio || 0)
            }
        });
        
    } catch (error) {
        console.error('Error al obtener estadísticas detalladas:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});


// ============================================
// MANEJADORES DE ERROR (AL FINAL DE TODAS LAS RUTAS)
// ============================================

// Ruta no encontrada (solo para rutas de API)
app.use('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Ruta de API no encontrada',
        path: req.originalUrl
    });
});

// Manejador global de errores
app.use((error, req, res, next) => {
    console.error('❌ Error:', error);
    
    // Error de SQL Server
    if (error.code && error.code.startsWith('E')) {
        return res.status(500).json({
            success: false,
            error: 'Error de base de datos'
        });
    }
    
    // Error de JWT
    if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            error: 'Token inválido'
        });
    }
    
    // Error de JWT expirado
    if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            error: 'Token expirado'
        });
    }
    
    // Error genérico
    res.status(500).json({
        success: false,
        error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno del servidor'
    });
});

// ============================================
// INICIAR SERVIDOR (AL FINAL DE TODAS LAS RUTAS)
// ============================================
startServer();
