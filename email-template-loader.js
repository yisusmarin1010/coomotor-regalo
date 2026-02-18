// ============================================
// CARGADOR DE PLANTILLAS DE EMAIL
// ============================================

const fs = require('fs');
const path = require('path');

class EmailTemplateLoader {
    constructor() {
        this.templatesPath = path.join(__dirname, 'email-templates');
        this.cache = {};
    }

    /**
     * Cargar plantilla HTML desde archivo
     * @param {string} templateName - Nombre del archivo sin extensión
     * @returns {string} - HTML de la plantilla
     */
    loadTemplate(templateName) {
        // Verificar si está en caché
        if (this.cache[templateName]) {
            return this.cache[templateName];
        }

        try {
            const templatePath = path.join(this.templatesPath, `${templateName}.html`);
            const template = fs.readFileSync(templatePath, 'utf8');
            
            // Guardar en caché
            this.cache[templateName] = template;
            
            return template;
        } catch (error) {
            console.error(`❌ Error al cargar plantilla ${templateName}:`, error.message);
            return this.getFallbackTemplate();
        }
    }

    /**
     * Reemplazar variables en la plantilla
     * @param {string} template - HTML de la plantilla
     * @param {object} data - Datos para reemplazar
     * @returns {string} - HTML con variables reemplazadas
     */
    replaceVariables(template, data) {
        let result = template;

        // Reemplazar cada variable {{variable}} con su valor
        Object.keys(data).forEach(key => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            result = result.replace(regex, data[key] || '');
        });

        return result;
    }

    /**
     * Obtener plantilla procesada con datos
     * @param {string} templateName - Nombre de la plantilla
     * @param {object} data - Datos para la plantilla
     * @returns {string} - HTML final
     */
    getProcessedTemplate(templateName, data) {
        const template = this.loadTemplate(templateName);
        return this.replaceVariables(template, data);
    }

    /**
     * Plantilla de respaldo en caso de error
     * @returns {string} - HTML básico
     */
    getFallbackTemplate() {
        return `
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family:Arial,sans-serif;padding:40px;background:#f0f4f8;">
                <div style="max-width:600px;margin:0 auto;background:white;padding:40px;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.1);">
                    <h1 style="color:#2563eb;margin-bottom:20px;">COOMOTOR</h1>
                    <p style="font-size:16px;line-height:1.6;color:#475569;">
                        Este es un mensaje del sistema de regalos navideños COOMOTOR.
                    </p>
                    <hr style="margin:30px 0;border:none;border-top:2px solid #e2e8f0;">
                    <p style="font-size:14px;color:#64748b;text-align:center;">
                        Cooperativa de Motoristas del Huila<br>
                        Neiva, Huila - Colombia 🇨🇴
                    </p>
                </div>
            </body>
            </html>
        `;
    }

    /**
     * Limpiar caché de plantillas
     */
    clearCache() {
        this.cache = {};
        console.log('🗑️ Caché de plantillas limpiado');
    }
}

module.exports = new EmailTemplateLoader();
