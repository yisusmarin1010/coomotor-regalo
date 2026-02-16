// ============================================
// FOOTER MINIMALISTA PARA PÁGINAS DE AUTENTICACIÓN
// Footer compacto y simple para login, registro y recuperar contraseña
// ============================================

// HTML del Footer Minimalista - PEGADO AL FONDO
const footerAuthHTML = `
    <!-- Footer Minimalista para Auth - Pegado al fondo -->
    <footer style="background: #0a0f1e; color: white; padding: 1.5rem 0; margin-top: auto; width: 100%;">
        <div class="container">
            <div class="row align-items-center">
                <!-- Copyright -->
                <div class="col-md-6 text-center text-md-start mb-2 mb-md-0">
                    <p style="color: rgba(255, 255, 255, 0.7); font-size: 0.8rem; margin: 0;">
                        &copy; <span id="currentYearAuth">2026</span> <strong>COOMOTOR</strong>. Todos los derechos reservados.
                    </p>
                </div>
                
                <!-- Enlaces Legales -->
                <div class="col-md-6 text-center text-md-end">
                    <div class="d-flex justify-content-center justify-content-md-end gap-2 flex-wrap" style="font-size: 0.8rem;">
                        <a href="#" onclick="mostrarPoliticasPrivacidad(); return false;" style="color: rgba(255, 255, 255, 0.6); text-decoration: none; transition: color 0.3s;" onmouseover="this.style.color='white'" onmouseout="this.style.color='rgba(255, 255, 255, 0.6)'">
                            Privacidad
                        </a>
                        <span style="color: rgba(255, 255, 255, 0.3);">|</span>
                        <a href="#" onclick="mostrarTerminosCondiciones(); return false;" style="color: rgba(255, 255, 255, 0.6); text-decoration: none; transition: color 0.3s;" onmouseover="this.style.color='white'" onmouseout="this.style.color='rgba(255, 255, 255, 0.6)'">
                            Términos
                        </a>
                        <span style="color: rgba(255, 255, 255, 0.3);">|</span>
                        <a href="#" onclick="mostrarProteccionDatos(); return false;" style="color: rgba(255, 255, 255, 0.6); text-decoration: none; transition: color 0.3s;" onmouseover="this.style.color='white'" onmouseout="this.style.color='rgba(255, 255, 255, 0.6)'">
                            Protección de Datos
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </footer>

    <!-- Modales Legales (mismos que el footer completo) -->
    ${getModalesLegales()}
`;

// Función para obtener los modales legales (igual que footer-legal.js)
function getModalesLegales() {
    return `
    <!-- Modal para Políticas de Privacidad -->
    <div class="modal fade" id="modalPoliticasPrivacidad" tabindex="-1">
        <div class="modal-dialog modal-lg modal-dialog-scrollable">
            <div class="modal-content">
                <div class="modal-header" style="background: linear-gradient(135deg, #16a34a, #15803d); color: white;">
                    <h5 class="modal-title"><i class="bi bi-shield-check me-2"></i>Políticas de Privacidad</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body" style="font-size: 0.95rem; line-height: 1.8;">
                    <h6 style="color: #16a34a; font-weight: 700;">1. Información que Recopilamos</h6>
                    <p>COOMOTOR recopila información personal necesaria para la gestión del programa de regalos navideños, incluyendo: nombres, apellidos, documento de identidad, correo electrónico, teléfono, y datos de los hijos menores de 12 años.</p>
                    
                    <h6 style="color: #16a34a; font-weight: 700;">2. Uso de la Información</h6>
                    <p>La información recopilada se utiliza exclusivamente para: gestionar postulaciones, verificar elegibilidad, coordinar entregas de regalos, y comunicaciones relacionadas con el programa.</p>
                    
                    <h6 style="color: #16a34a; font-weight: 700;">3. Protección de Datos</h6>
                    <p>Implementamos medidas de seguridad técnicas y organizativas para proteger sus datos personales contra acceso no autorizado, pérdida o alteración.</p>
                    
                    <h6 style="color: #16a34a; font-weight: 700;">4. Compartir Información</h6>
                    <p>No compartimos, vendemos ni alquilamos su información personal a terceros. Los datos solo son accesibles por personal autorizado de COOMOTOR.</p>
                    
                    <h6 style="color: #16a34a; font-weight: 700;">5. Derechos del Usuario</h6>
                    <p>Usted tiene derecho a acceder, rectificar, actualizar o solicitar la eliminación de sus datos personales contactando a info@coomotor.com</p>
                    
                    <p class="mt-4" style="font-size: 0.85rem; color: #64748b;">
                        <strong>Última actualización:</strong> Diciembre 2026
                    </p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal para Términos y Condiciones -->
    <div class="modal fade" id="modalTerminosCondiciones" tabindex="-1">
        <div class="modal-dialog modal-lg modal-dialog-scrollable">
            <div class="modal-content">
                <div class="modal-header" style="background: linear-gradient(135deg, #16a34a, #15803d); color: white;">
                    <h5 class="modal-title"><i class="bi bi-file-text me-2"></i>Términos y Condiciones</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body" style="font-size: 0.95rem; line-height: 1.8;">
                    <h6 style="color: #16a34a; font-weight: 700;">1. Aceptación de Términos</h6>
                    <p>Al utilizar este sistema, usted acepta estos términos y condiciones en su totalidad. Si no está de acuerdo, no utilice el sistema.</p>
                    
                    <h6 style="color: #16a34a; font-weight: 700;">2. Elegibilidad</h6>
                    <p>El programa está disponible únicamente para empleados y conductores activos de COOMOTOR. Los hijos deben ser menores de 12 años al momento de la postulación.</p>
                    
                    <h6 style="color: #16a34a; font-weight: 700;">3. Registro y Cuenta</h6>
                    <p>Usted es responsable de mantener la confidencialidad de su cuenta y contraseña. Debe proporcionar información veraz y actualizada.</p>
                    
                    <h6 style="color: #16a34a; font-weight: 700;">4. Proceso de Postulación</h6>
                    <p>Las postulaciones están sujetas a revisión y aprobación. COOMOTOR se reserva el derecho de rechazar postulaciones que no cumplan con los requisitos.</p>
                    
                    <h6 style="color: #16a34a; font-weight: 700;">5. Limitación de Responsabilidad</h6>
                    <p>COOMOTOR no se hace responsable por errores en la información proporcionada por los usuarios o por circunstancias fuera de su control.</p>
                    
                    <h6 style="color: #16a34a; font-weight: 700;">6. Modificaciones</h6>
                    <p>COOMOTOR se reserva el derecho de modificar estos términos en cualquier momento. Los cambios serán notificados a través del sistema.</p>
                    
                    <p class="mt-4" style="font-size: 0.85rem; color: #64748b;">
                        <strong>Última actualización:</strong> Diciembre 2026
                    </p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal para Protección de Datos -->
    <div class="modal fade" id="modalProteccionDatos" tabindex="-1">
        <div class="modal-dialog modal-lg modal-dialog-scrollable">
            <div class="modal-content">
                <div class="modal-header" style="background: linear-gradient(135deg, #16a34a, #15803d); color: white;">
                    <h5 class="modal-title"><i class="bi bi-lock-fill me-2"></i>Protección de Datos Personales (Ley 1581/2012)</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body" style="font-size: 0.95rem; line-height: 1.8;">
                    <div class="alert alert-info">
                        <i class="bi bi-info-circle-fill me-2"></i>
                        <strong>COOMOTOR</strong> cumple con la Ley 1581 de 2012 de Protección de Datos Personales de Colombia.
                    </div>
                    
                    <h6 style="color: #16a34a; font-weight: 700;">Responsable del Tratamiento</h6>
                    <p><strong>COOMOTOR</strong><br>
                    Correo electrónico: info@coomotor.com<br>
                    Colombia</p>
                    
                    <h6 style="color: #16a34a; font-weight: 700;">Finalidad del Tratamiento</h6>
                    <p>Los datos personales recopilados serán utilizados para:</p>
                    <ul>
                        <li>Gestionar el programa de regalos navideños</li>
                        <li>Verificar la elegibilidad de los participantes</li>
                        <li>Coordinar la entrega de regalos</li>
                        <li>Enviar comunicaciones relacionadas con el programa</li>
                        <li>Cumplir con obligaciones legales</li>
                    </ul>
                    
                    <h6 style="color: #16a34a; font-weight: 700;">Derechos del Titular</h6>
                    <p>Como titular de los datos, usted tiene derecho a:</p>
                    <ul>
                        <li>Conocer, actualizar y rectificar sus datos personales</li>
                        <li>Solicitar prueba de la autorización otorgada</li>
                        <li>Ser informado sobre el uso de sus datos</li>
                        <li>Presentar quejas ante la Superintendencia de Industria y Comercio</li>
                        <li>Revocar la autorización y solicitar la supresión de datos</li>
                        <li>Acceder de forma gratuita a sus datos personales</li>
                    </ul>
                    
                    <h6 style="color: #16a34a; font-weight: 700;">Autorización</h6>
                    <p>Al registrarse en este sistema, usted autoriza expresamente a COOMOTOR para recopilar, almacenar, usar, circular y suprimir sus datos personales de acuerdo con la Ley 1581 de 2012.</p>
                    
                    <h6 style="color: #16a34a; font-weight: 700;">Contacto</h6>
                    <p>Para ejercer sus derechos o presentar consultas sobre el tratamiento de sus datos personales, puede contactarnos en: <strong>info@coomotor.com</strong></p>
                    
                    <p class="mt-4" style="font-size: 0.85rem; color: #64748b;">
                        <strong>Última actualización:</strong> Diciembre 2026
                    </p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal para Habeas Data -->
    <div class="modal fade" id="modalHabeasData" tabindex="-1">
        <div class="modal-dialog modal-lg modal-dialog-scrollable">
            <div class="modal-content">
                <div class="modal-header" style="background: linear-gradient(135deg, #16a34a, #15803d); color: white;">
                    <h5 class="modal-title"><i class="bi bi-person-check me-2"></i>Habeas Data</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body" style="font-size: 0.95rem; line-height: 1.8;">
                    <h6 style="color: #16a34a; font-weight: 700;">¿Qué es el Habeas Data?</h6>
                    <p>El Habeas Data es un derecho fundamental que permite a las personas conocer, actualizar y rectificar la información que se haya recogido sobre ellas en bases de datos o archivos.</p>
                    
                    <h6 style="color: #16a34a; font-weight: 700;">Sus Derechos</h6>
                    <ul>
                        <li><strong>Derecho de Acceso:</strong> Conocer qué datos personales tenemos sobre usted</li>
                        <li><strong>Derecho de Rectificación:</strong> Corregir datos inexactos o incompletos</li>
                        <li><strong>Derecho de Actualización:</strong> Mantener sus datos al día</li>
                        <li><strong>Derecho de Supresión:</strong> Solicitar la eliminación de sus datos cuando sea procedente</li>
                        <li><strong>Derecho de Oposición:</strong> Oponerse al tratamiento de sus datos en ciertos casos</li>
                    </ul>
                    
                    <h6 style="color: #16a34a; font-weight: 700;">Cómo Ejercer sus Derechos</h6>
                    <p>Para ejercer cualquiera de estos derechos, puede:</p>
                    <ol>
                        <li>Enviar un correo electrónico a: <strong>info@coomotor.com</strong></li>
                        <li>Incluir en su solicitud:
                            <ul>
                                <li>Nombre completo y documento de identidad</li>
                                <li>Descripción clara de su solicitud</li>
                                <li>Dirección de correo electrónico para respuesta</li>
                            </ul>
                        </li>
                        <li>Esperar respuesta en un plazo máximo de 15 días hábiles</li>
                    </ol>
                    
                    <h6 style="color: #16a34a; font-weight: 700;">Protección de Menores</h6>
                    <p>Los datos de menores de edad son tratados con especial cuidado y protección. Los padres o tutores legales tienen derecho a acceder, rectificar y suprimir los datos de sus hijos.</p>
                    
                    <div class="alert alert-warning mt-4">
                        <i class="bi bi-exclamation-triangle-fill me-2"></i>
                        <strong>Importante:</strong> Si considera que sus derechos han sido vulnerados, puede presentar una queja ante la Superintendencia de Industria y Comercio de Colombia.
                    </div>
                    
                    <p class="mt-4" style="font-size: 0.85rem; color: #64748b;">
                        <strong>Última actualización:</strong> Diciembre 2026
                    </p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                </div>
            </div>
        </div>
    </div>
    `;
}

// Funciones para mostrar modales legales
function mostrarPoliticasPrivacidad() {
    const modal = new bootstrap.Modal(document.getElementById('modalPoliticasPrivacidad'));
    modal.show();
}

function mostrarTerminosCondiciones() {
    const modal = new bootstrap.Modal(document.getElementById('modalTerminosCondiciones'));
    modal.show();
}

function mostrarProteccionDatos() {
    const modal = new bootstrap.Modal(document.getElementById('modalProteccionDatos'));
    modal.show();
}

function mostrarHabeasData() {
    const modal = new bootstrap.Modal(document.getElementById('modalHabeasData'));
    modal.show();
}

// Función para insertar el footer minimalista
function insertarFooterAuth() {
    // Asegurar que el body tenga flexbox para pegar el footer al fondo
    document.body.style.display = 'flex';
    document.body.style.flexDirection = 'column';
    document.body.style.minHeight = '100vh';
    document.body.style.margin = '0';
    
    // Buscar si ya existe un footer
    const footerExistente = document.querySelector('footer');
    
    if (footerExistente) {
        // Reemplazar footer existente
        footerExistente.outerHTML = footerAuthHTML;
    } else {
        // Insertar antes del cierre del body
        document.body.insertAdjacentHTML('beforeend', footerAuthHTML);
    }
    
    // Actualizar año actual
    const yearElement = document.getElementById('currentYearAuth');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
    
    console.log('✅ Footer minimalista de autenticación insertado correctamente');
}

// Auto-ejecutar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', insertarFooterAuth);
} else {
    insertarFooterAuth();
}
