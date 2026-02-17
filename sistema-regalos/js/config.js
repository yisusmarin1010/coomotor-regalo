/**
 * Configuración de API para el Sistema de Regalos Coomotor
 * 
 * Este archivo centraliza todas las URLs de la API para facilitar
 * el cambio entre desarrollo y producción
 */

const API_CONFIG = {
    // Detectar aautomáticamente el entorno
    BASE_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3001'  // Desarrollo local
        : window.location.origin,   // Producción (mismo dominio)
    
    // Timeout para peticiones (30 segundos)
    TIMEOUT: 30000,
    
    // Headers por defecto
    getHeaders: function() {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        // Agregar token si existe
        const token = localStorage.getItem('token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        return headers;
    },
    
    // Función helper para hacer peticiones
    fetch: async function(endpoint, options = {}) {
        const url = `${this.BASE_URL}${endpoint}`;
        
        const config = {
            ...options,
            headers: {
                ...this.getHeaders(),
                ...options.headers
            }
        };
        
        try {
            const response = await fetch(url, config);
            
            // Si es 401, redirigir a login
            if (response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/sistema-regalos/auth/login.html';
                return;
            }
            
            return response;
        } catch (error) {
            console.error('Error en petición:', error);
            throw error;
        }
    }
};

// Exportar para uso global
window.API_CONFIG = API_CONFIG;

console.log('🔧 API Config cargada:', API_CONFIG.BASE_URL);
