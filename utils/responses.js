/**
 * MÓDULO DE RESPUESTAS HTTP ESTANDARIZADAS
 * Evita duplicación de código de respuestas
 */

/**
 * Respuesta exitosa
 */
function success(res, data = null, message = 'Operación exitosa', statusCode = 200) {
    return res.status(statusCode).json({
        success: true,
        message,
        data
    });
}

/**
 * Respuesta de error
 */
function error(res, message = 'Error interno del servidor', statusCode = 500, details = null) {
    const response = {
        success: false,
        error: message
    };
    
    if (details) {
        response.details = details;
    }
    
    return res.status(statusCode).json(response);
}

/**
 * Respuesta de validación fallida
 */
function validationError(res, message, field = null) {
    return res.status(400).json({
        success: false,
        error: message,
        field
    });
}

/**
 * Respuesta de no autorizado
 */
function unauthorized(res, message = 'Acceso denegado. Token no proporcionado.') {
    return res.status(401).json({
        success: false,
        error: message
    });
}

/**
 * Respuesta de prohibido
 */
function forbidden(res, message = 'No tienes permisos para realizar esta acción.') {
    return res.status(403).json({
        success: false,
        error: message
    });
}

/**
 * Respuesta de no encontrado
 */
function notFound(res, message = 'Recurso no encontrado.') {
    return res.status(404).json({
        success: false,
        error: message
    });
}

/**
 * Respuesta de conflicto
 */
function conflict(res, message = 'El recurso ya existe.') {
    return res.status(409).json({
        success: false,
        error: message
    });
}

module.exports = {
    success,
    error,
    validationError,
    unauthorized,
    forbidden,
    notFound,
    conflict
};
