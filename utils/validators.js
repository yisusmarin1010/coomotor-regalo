/**
 * MÓDULO DE VALIDACIÓN CENTRALIZADO
 * Evita duplicación de código de validación
 */

class ValidationError extends Error {
    constructor(message, field = null) {
        super(message);
        this.name = 'ValidationError';
        this.field = field;
    }
}

/**
 * Valida que todos los campos requeridos estén presentes
 */
function validateRequiredFields(data, requiredFields) {
    const missing = [];
    
    for (const field of requiredFields) {
        if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
            missing.push(field);
        }
    }
    
    if (missing.length > 0) {
        throw new ValidationError(
            'Todos los campos obligatorios deben ser completados',
            missing
        );
    }
    
    return true;
}

/**
 * Valida formato de email
 */
function validateEmail(email) {
    const emailRegex = /^[a-zA-Z0-9._-]+@(gmail\.com|hotmail\.com|outlook\.com|yahoo\.com|coomotor\.com)$/;
    
    if (!emailRegex.test(email)) {
        throw new ValidationError('El correo debe ser de Gmail, Hotmail, Outlook, Yahoo o Coomotor', 'email');
    }
    
    return true;
}

/**
 * Valida formato de celular colombiano
 */
function validateCelular(celular) {
    const celularRegex = /^3\d{9}$/;
    
    if (!celularRegex.test(celular)) {
        throw new ValidationError('El celular debe tener 10 dígitos y comenzar con 3', 'celular');
    }
    
    return true;
}

/**
 * Valida número de documento
 */
function validateDocumento(numero) {
    const documentoRegex = /^\d{7,10}$/;
    
    if (!documentoRegex.test(numero)) {
        throw new ValidationError('El número de documento debe tener entre 7 y 10 dígitos', 'numero_documento');
    }
    
    return true;
}

/**
 * Valida contraseña segura
 */
function validatePassword(password) {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    
    if (!passwordRegex.test(password)) {
        throw new ValidationError(
            'La contraseña debe tener mínimo 8 caracteres, incluir mayúsculas, minúsculas, números y un carácter especial (@$!%*?&)',
            'password'
        );
    }
    
    return true;
}

/**
 * Valida nombres (solo letras y espacios)
 */
function validateNombres(nombres) {
    const nombresRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,50}$/;
    
    if (!nombresRegex.test(nombres)) {
        throw new ValidationError('Los nombres solo pueden contener letras y espacios (2-50 caracteres)', 'nombres');
    }
    
    return true;
}

/**
 * Valida edad (menor de 12 años)
 */
function validateEdadMenor12(fechaNacimiento) {
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    
    if (nacimiento > hoy) {
        throw new ValidationError('La fecha de nacimiento no puede ser futura', 'fecha_nacimiento');
    }
    
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
        edad--;
    }
    
    if (edad >= 12) {
        throw new ValidationError('Solo se pueden registrar hijos menores de 12 años', 'fecha_nacimiento');
    }
    
    return true;
}

/**
 * Valida datos de registro de usuario
 */
function validateRegistroUsuario(data) {
    validateRequiredFields(data, [
        'nombres', 'apellidos', 'celular', 'correo', 
        'tipo_documento', 'numero_documento', 'password', 'tipo_conductor'
    ]);
    
    validateNombres(data.nombres);
    validateNombres(data.apellidos);
    validateCelular(data.celular);
    validateEmail(data.correo);
    validateDocumento(data.numero_documento);
    validatePassword(data.password);
    
    // Validar subtipo si es necesario
    if ((data.tipo_conductor === 'carretera' || data.tipo_conductor === 'furgones') && !data.subtipo_conductor) {
        throw new ValidationError(`Debe seleccionar un subtipo para ${data.tipo_conductor}`, 'subtipo_conductor');
    }
    
    return true;
}

/**
 * Valida datos de hijo
 */
function validateHijo(data) {
    validateRequiredFields(data, [
        'nombres', 'apellidos', 'tipo_documento', 
        'numero_documento', 'fecha_nacimiento'
    ]);
    
    validateNombres(data.nombres);
    validateNombres(data.apellidos);
    validateDocumento(data.numero_documento);
    validateEdadMenor12(data.fecha_nacimiento);
    
    return true;
}

/**
 * Valida datos de contacto
 */
function validateContacto(data) {
    validateRequiredFields(data, [
        'nombres', 'apellidos', 'cedula', 'telefono', 
        'email', 'tipoContacto', 'asunto', 'mensaje'
    ]);
    
    validateEmail(data.email);
    validateDocumento(data.cedula);
    
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(data.telefono)) {
        throw new ValidationError('El teléfono debe tener 10 dígitos', 'telefono');
    }
    
    if (!data.autorizacion) {
        throw new ValidationError('Debes autorizar el tratamiento de datos personales', 'autorizacion');
    }
    
    return true;
}

module.exports = {
    ValidationError,
    validateRequiredFields,
    validateEmail,
    validateCelular,
    validateDocumento,
    validatePassword,
    validateNombres,
    validateEdadMenor12,
    validateRegistroUsuario,
    validateHijo,
    validateContacto
};
