// ============================================
// SISTEMA DE PERFIL PERSONALIZADO ULTRA AVANZADO
// ============================================

let perfilData = {
    avatar: null,
    banner: null,
    tema: 'blue',
    efectos: {
        nieve: false,
        luces: false,
        particulas: false,
        animaciones: true
    },
    albums: [],
    fotos: [],
    puntos: 0,
    nivel: 1,
    logros: [],
    estadisticas: {}
};

// ============================================
// INICIALIZACIÓN
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    cargarDatosUsuario();
    inicializarAOS();
    cargarAlbumes();
    cargarFotos();
    calcularProgresoPerfil();
});

function inicializarAOS() {
    AOS.init({
        duration: 800,
        once: true,
        offset: 100
    });
}

// ============================================
// NAVEGACIÓN ENTRE SECCIONES
// ============================================

function cambiarSeccion(seccion) {
    // Ocultar todas las secciones
    document.querySelectorAll('.content-section').forEach(s => {
        s.classList.remove('active');
    });
    
    // Mostrar sección seleccionada
    document.getElementById(`seccion-${seccion}`).classList.add('active');
    
    // Actualizar menú
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    event.target.closest('.menu-item').classList.add('active');
    
    // Scroll al top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================
// GESTIÓN DE AVATAR
// ============================================

function editarAvatar() {
    document.getElementById('avatarUpload').click();
}

function cargarAvatar(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const img = document.getElementById('avatarEditor');
            img.src = e.target.result;
            
            // Actualizar preview
            document.getElementById('avatarPreview').src = e.target.result;
            
            // Guardar en perfilData
            perfilData.avatar = e.target.result;
            
            // Mostrar notificación
            mostrarNotificacion('success', '¡Avatar cargado! Aplica filtros o marcos si deseas.');
            
            // Actualizar progreso
            actualizarProgresoPerfil();
            
            // Otorgar puntos
            otorgarPuntos(50, 'Avatar actualizado');
        };
        
        reader.readAsDataURL(input.files[0]);
    }
}

function aplicarFiltro(filtro) {
    const img = document.getElementById('avatarEditor');
    
    switch(filtro) {
        case 'none':
            img.style.filter = 'none';
            break;
        case 'grayscale':
            img.style.filter = 'grayscale(100%)';
            break;
        case 'sepia':
            img.style.filter = 'sepia(100%)';
            break;
        case 'christmas':
            img.style.filter = 'hue-rotate(120deg) saturate(150%)';
            break;
    }
    
    mostrarNotificacion('info', `Filtro ${filtro} aplicado`);
}

function aplicarMarco(marco) {
    const container = document.querySelector('.avatar-editor');
    
    // Remover marcos anteriores
    container.classList.remove('frame-christmas', 'frame-coomotor', 'frame-gold');
    
    // Aplicar nuevo marco
    if (marco !== 'none') {
        container.classList.add(`frame-${marco}`);
    }
    
    mostrarNotificacion('success', 'Marco aplicado correctamente');
}

function crearAvatar3D() {
    mostrarModal('Avatar 3D', `
        <div class="text-center">
            <div class="avatar-3d-creator mb-4">
                <div class="avatar-3d-preview">
                    <div style="font-size: 8rem;">👤</div>
                </div>
            </div>
            <p class="mb-3">Personaliza tu avatar 3D</p>
            <div class="row g-3">
                <div class="col-6">
                    <button class="btn btn-outline-primary w-100" onclick="cambiarCaracteristica('cara')">
                        <i class="bi bi-emoji-smile me-2"></i>Cara
                    </button>
                </div>
                <div class="col-6">
                    <button class="btn btn-outline-primary w-100" onclick="cambiarCaracteristica('pelo')">
                        <i class="bi bi-scissors me-2"></i>Pelo
                    </button>
                </div>
                <div class="col-6">
                    <button class="btn btn-outline-primary w-100" onclick="cambiarCaracteristica('ropa')">
                        <i class="bi bi-bag me-2"></i>Ropa
                    </button>
                </div>
                <div class="col-6">
                    <button class="btn btn-outline-primary w-100" onclick="cambiarCaracteristica('accesorios')">
                        <i class="bi bi-eyeglasses me-2"></i>Accesorios
                    </button>
                </div>
            </div>
            <button class="btn btn-success w-100 mt-4" onclick="guardarAvatar3D()">
                <i class="bi bi-check-circle me-2"></i>Guardar Avatar 3D
            </button>
        </div>
    `);
}

// ============================================
// GESTIÓN DE BANNER
// ============================================

function editarBanner() {
    document.getElementById('bannerUpload').click();
}

function cargarBanner(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const banner = document.getElementById('bannerEditor');
            banner.style.backgroundImage = `url(${e.target.result})`;
            banner.style.backgroundSize = 'cover';
            banner.style.backgroundPosition = 'center';
            banner.innerHTML = '';
            
            // Actualizar preview
            const bannerPreview = document.getElementById('bannerPreview');
            bannerPreview.style.backgroundImage = `url(${e.target.result})`;
            bannerPreview.style.backgroundSize = 'cover';
            bannerPreview.style.backgroundPosition = 'center';
            
            // Guardar en perfilData
            perfilData.banner = e.target.result;
            
            mostrarNotificacion('success', '¡Banner actualizado correctamente!');
            actualizarProgresoPerfil();
            otorgarPuntos(75, 'Banner personalizado');
        };
        
        reader.readAsDataURL(input.files[0]);
    }
}

function seleccionarBanner(tipo) {
    const banner = document.getElementById('bannerEditor');
    const bannerPreview = document.getElementById('bannerPreview');
    
    let gradient = '';
    
    switch(tipo) {
        case 'christmas':
            gradient = 'linear-gradient(135deg, #dc2626 0%, #16a34a 50%, #fbbf24 100%)';
            break;
        case 'blue':
            gradient = 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)';
            break;
        case 'gold':
            gradient = 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)';
            break;
        case 'dark':
            gradient = 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)';
            break;
        case 'rainbow':
            gradient = 'linear-gradient(135deg, #ef4444 0%, #f59e0b 20%, #10b981 40%, #3b82f6 60%, #8b5cf6 80%, #ec4899 100%)';
            break;
        case 'forest':
            gradient = 'linear-gradient(135deg, #065f46 0%, #059669 50%, #10b981 100%)';
            break;
    }
    
    banner.style.background = gradient;
    banner.innerHTML = '';
    bannerPreview.style.background = gradient;
    
    perfilData.banner = tipo;
    
    mostrarNotificacion('success', 'Banner seleccionado correctamente');
    otorgarPuntos(25, 'Banner prediseñado');
}

function mostrarGaleriaBanners() {
    mostrarModal('Galería de Banners', `
        <div class="banner-gallery-modal">
            <div class="row g-3">
                <div class="col-md-6">
                    <div class="banner-option-large" onclick="seleccionarBanner('christmas'); cerrarModal();">
                        <div class="banner-thumb-large banner-christmas"></div>
                        <p class="text-center mt-2">Navideño Clásico</p>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="banner-option-large" onclick="seleccionarBanner('blue'); cerrarModal();">
                        <div class="banner-thumb-large banner-blue"></div>
                        <p class="text-center mt-2">Azul Corporativo</p>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="banner-option-large" onclick="seleccionarBanner('gold'); cerrarModal();">
                        <div class="banner-thumb-large banner-gold"></div>
                        <p class="text-center mt-2">Dorado Premium</p>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="banner-option-large" onclick="seleccionarBanner('dark'); cerrarModal();">
                        <div class="banner-thumb-large banner-dark"></div>
                        <p class="text-center mt-2">Oscuro Elegante</p>
                    </div>
                </div>
            </div>
        </div>
    `);
}

// ============================================
// GESTIÓN DE TEMAS
// ============================================

function aplicarTema(tema) {
    // Remover tema activo anterior
    document.querySelectorAll('.theme-option').forEach(opt => {
        opt.classList.remove('active');
    });
    
    // Activar nuevo tema
    document.querySelector(`[data-theme="${tema}"]`).classList.add('active');
    
    // Aplicar colores del tema
    const root = document.documentElement;
    
    switch(tema) {
        case 'christmas':
            root.style.setProperty('--primary', '#dc2626');
            root.style.setProperty('--primary-dark', '#b91c1c');
            root.style.setProperty('--primary-light', '#ef4444');
            break;
        case 'blue':
            root.style.setProperty('--primary', '#2563eb');
            root.style.setProperty('--primary-dark', '#1e40af');
            root.style.setProperty('--primary-light', '#3b82f6');
            break;
        case 'gold':
            root.style.setProperty('--primary', '#f59e0b');
            root.style.setProperty('--primary-dark', '#d97706');
            root.style.setProperty('--primary-light', '#fbbf24');
            break;
        case 'dark':
            root.style.setProperty('--primary', '#0f172a');
            root.style.setProperty('--primary-dark', '#020617');
            root.style.setProperty('--primary-light', '#1e293b');
            break;
        case 'rainbow':
            root.style.setProperty('--primary', '#8b5cf6');
            root.style.setProperty('--primary-dark', '#7c3aed');
            root.style.setProperty('--primary-light', '#a78bfa');
            break;
        case 'forest':
            root.style.setProperty('--primary', '#059669');
            root.style.setProperty('--primary-dark', '#047857');
            root.style.setProperty('--primary-light', '#10b981');
            break;
    }
    
    perfilData.tema = tema;
    localStorage.setItem('tema', tema);
    
    mostrarNotificacion('success', `Tema ${tema} aplicado correctamente`);
    otorgarPuntos(30, 'Tema personalizado');
}

function actualizarTemaPersonalizado() {
    const primario = document.getElementById('colorPrimario').value;
    const secundario = document.getElementById('colorSecundario').value;
    const acento = document.getElementById('colorAcento').value;
    
    const root = document.documentElement;
    root.style.setProperty('--primary', primario);
    root.style.setProperty('--primary-dark', secundario);
    root.style.setProperty('--primary-light', acento);
}

function guardarTemaPersonalizado() {
    const primario = document.getElementById('colorPrimario').value;
    const secundario = document.getElementById('colorSecundario').value;
    const acento = document.getElementById('colorAcento').value;
    
    perfilData.temaPersonalizado = { primario, secundario, acento };
    localStorage.setItem('temaPersonalizado', JSON.stringify(perfilData.temaPersonalizado));
    
    mostrarNotificacion('success', '¡Tema personalizado guardado!');
    otorgarPuntos(100, 'Creador de temas');
    
    // Desbloquear logro
    desbloquearLogro('diseñador', 'Diseñador', 'Creaste tu primer tema personalizado');
}

// ============================================
// EFECTOS VISUALES
// ============================================

function toggleEfecto(efecto) {
    perfilData.efectos[efecto] = !perfilData.efectos[efecto];
    
    switch(efecto) {
        case 'nieve':
            if (perfilData.efectos.nieve) {
                crearNieve();
            } else {
                eliminarNieve();
            }
            break;
        case 'luces':
            if (perfilData.efectos.luces) {
                crearLuces();
            } else {
                eliminarLuces();
            }
            break;
        case 'particulas':
            if (perfilData.efectos.particulas) {
                crearParticulas();
            } else {
                eliminarParticulas();
            }
            break;
        case 'animaciones':
            document.body.classList.toggle('no-animations', !perfilData.efectos.animaciones);
            break;
    }
    
    localStorage.setItem('efectos', JSON.stringify(perfilData.efectos));
}

function crearNieve() {
    const container = document.body;
    
    for (let i = 0; i < 50; i++) {
        const snowflake = document.createElement('div');
        snowflake.className = 'snowflake';
        snowflake.innerHTML = '❄';
        snowflake.style.left = Math.random() * 100 + '%';
        snowflake.style.animationDuration = (Math.random() * 3 + 2) + 's';
        snowflake.style.animationDelay = Math.random() * 5 + 's';
        container.appendChild(snowflake);
    }
}

function eliminarNieve() {
    document.querySelectorAll('.snowflake').forEach(el => el.remove());
}

function crearLuces() {
    const lights = document.createElement('div');
    lights.className = 'christmas-lights';
    lights.id = 'christmasLights';
    document.body.appendChild(lights);
}

function eliminarLuces() {
    const lights = document.getElementById('christmasLights');
    if (lights) lights.remove();
}

function crearParticulas() {
    // Implementar partículas flotantes
    console.log('Partículas activadas');
}

function eliminarParticulas() {
    console.log('Partículas desactivadas');
}

// ============================================
// GALERÍA Y ÁLBUMES
// ============================================

function cargarAlbumes() {
    const albumsGrid = document.getElementById('albumsGrid');
    
    // Álbumes predeterminados
    const albumsPredeterminados = [
        { id: 1, nombre: 'Mis Hijos', icono: '👶', fotos: 0 },
        { id: 2, nombre: 'Navidades Anteriores', icono: '🎄', fotos: 0 },
        { id: 3, nombre: 'Momentos COOMOTOR', icono: '🚌', fotos: 0 },
        { id: 4, nombre: 'Entregas de Regalos', icono: '🎁', fotos: 0 }
    ];
    
    albumsGrid.innerHTML = albumsPredeterminados.map(album => `
        <div class="album-card" onclick="abrirAlbum(${album.id})">
            <div class="album-cover">
                ${album.icono}
            </div>
            <div class="album-info">
                <h6>${album.nombre}</h6>
                <p>${album.fotos} fotos</p>
            </div>
        </div>
    `).join('');
}

function crearAlbum() {
    mostrarModal('Crear Nuevo Álbum', `
        <form onsubmit="guardarAlbum(event)">
            <div class="mb-3">
                <label class="form-label">Nombre del Álbum</label>
                <input type="text" class="form-control" id="nombreAlbum" required>
            </div>
            <div class="mb-3">
                <label class="form-label">Icono</label>
                <div class="icon-selector">
                    <button type="button" class="btn btn-outline-primary" onclick="seleccionarIcono('📷')">📷</button>
                    <button type="button" class="btn btn-outline-primary" onclick="seleccionarIcono('🎉')">🎉</button>
                    <button type="button" class="btn btn-outline-primary" onclick="seleccionarIcono('❤️')">❤️</button>
                    <button type="button" class="btn btn-outline-primary" onclick="seleccionarIcono('🌟')">🌟</button>
                </div>
                <input type="hidden" id="iconoAlbum" value="📷">
            </div>
            <button type="submit" class="btn btn-primary w-100">
                <i class="bi bi-plus-circle me-2"></i>Crear Álbum
            </button>
        </form>
    `);
}

function cargarFotos() {
    const photosGrid = document.getElementById('photosGrid');
    
    // Mensaje si no hay fotos
    if (perfilData.fotos.length === 0) {
        photosGrid.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="bi bi-images" style="font-size: 4rem; opacity: 0.3;"></i>
                <p class="text-muted mt-3">No hay fotos aún. ¡Sube tu primera foto!</p>
                <button class="btn btn-primary" onclick="subirFotos()">
                    <i class="bi bi-upload me-2"></i>Subir Fotos
                </button>
            </div>
        `;
    }
}

function subirFotos() {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*';
    input.onchange = function(e) {
        const files = Array.from(e.target.files);
        procesarFotos(files);
    };
    input.click();
}

function procesarFotos(files) {
    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = function(e) {
            perfilData.fotos.push({
                id: Date.now(),
                url: e.target.result,
                fecha: new Date()
            });
            
            cargarFotos();
            mostrarNotificacion('success', `${files.length} foto(s) subida(s) correctamente`);
            otorgarPuntos(10 * files.length, 'Fotos subidas');
        };
        reader.readAsDataURL(file);
    });
}

// ============================================
// SISTEMA DE PUNTOS Y LOGROS
// ============================================

function otorgarPuntos(cantidad, razon) {
    perfilData.puntos += cantidad;
    document.getElementById('userPoints').textContent = perfilData.puntos;
    
    // Verificar subida de nivel
    const nivelAnterior = perfilData.nivel;
    perfilData.nivel = Math.floor(perfilData.puntos / 500) + 1;
    
    if (perfilData.nivel > nivelAnterior) {
        subirNivel();
    }
    
    // Mostrar notificación
    mostrarNotificacion('success', `+${cantidad} puntos: ${razon}`);
    
    // Guardar en localStorage
    localStorage.setItem('perfilData', JSON.stringify(perfilData));
}

function subirNivel() {
    document.getElementById('userLevel').textContent = perfilData.nivel;
    
    // Animación de celebración
    mostrarCelebracion();
    
    mostrarModal('¡Nivel Alcanzado!', `
        <div class="text-center">
            <div class="level-up-animation mb-4">
                <i class="bi bi-trophy-fill" style="font-size: 5rem; color: #fbbf24;"></i>
            </div>
            <h3>¡Felicitaciones!</h3>
            <p class="lead">Has alcanzado el <strong>Nivel ${perfilData.nivel}</strong></p>
            <p>Sigue personalizando tu perfil para ganar más puntos</p>
        </div>
    `);
}

function desbloquearLogro(id, nombre, descripcion) {
    if (!perfilData.logros.find(l => l.id === id)) {
        perfilData.logros.push({ id, nombre, descripcion, fecha: new Date() });
        
        mostrarNotificacion('success', `🏆 Logro desbloqueado: ${nombre}`);
        otorgarPuntos(50, `Logro: ${nombre}`);
    }
}

// ============================================
// PROGRESO DEL PERFIL
// ============================================

function calcularProgresoPerfil() {
    let progreso = 0;
    const items = [
        { campo: 'avatar', puntos: 20 },
        { campo: 'banner', puntos: 20 },
        { campo: 'tema', puntos: 10 },
        { campo: 'fotos', puntos: 20, minimo: 5 },
        { campo: 'albums', puntos: 15, minimo: 2 },
        { campo: 'efectos', puntos: 15 }
    ];
    
    items.forEach(item => {
        if (item.minimo) {
            if (perfilData[item.campo] && perfilData[item.campo].length >= item.minimo) {
                progreso += item.puntos;
            }
        } else {
            if (perfilData[item.campo]) {
                progreso += item.puntos;
            }
        }
    });
    
    actualizarBarraProgreso(progreso);
}

function actualizarBarraProgreso(progreso) {
    document.getElementById('profileProgress').style.width = progreso + '%';
    document.getElementById('profilePercentage').textContent = progreso + '%';
    
    if (progreso === 100) {
        desbloquearLogro('perfil_completo', 'Perfil Completo', 'Completaste tu perfil al 100%');
    }
}

function actualizarProgresoPerfil() {
    calcularProgresoPerfil();
}

// ============================================
// UTILIDADES
// ============================================

function mostrarNotificacion(tipo, mensaje) {
    const colores = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
    };
    
    const notif = document.createElement('div');
    notif.className = 'notification';
    notif.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colores[tipo]};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    notif.textContent = mensaje;
    
    document.body.appendChild(notif);
    
    setTimeout(() => {
        notif.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notif.remove(), 300);
    }, 3000);
}

function mostrarModal(titulo, contenido) {
    const modal = `
        <div class="modal fade show" id="modalGenerico" style="display: block; background: rgba(0,0,0,0.5);">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${titulo}</h5>
                        <button type="button" class="btn-close" onclick="cerrarModal()"></button>
                    </div>
                    <div class="modal-body">
                        ${contenido}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modalsContainer').innerHTML = modal;
}

function cerrarModal() {
    document.getElementById('modalsContainer').innerHTML = '';
}

function mostrarCelebracion() {
    // Confeti
    for (let i = 0; i < 100; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.cssText = `
            position: fixed;
            width: 10px;
            height: 10px;
            background: ${['#ef4444', '#10b981', '#3b82f6', '#fbbf24'][Math.floor(Math.random() * 4)]};
            left: ${Math.random() * 100}%;
            top: -10px;
            animation: confettiFall ${Math.random() * 3 + 2}s linear;
            z-index: 10000;
        `;
        document.body.appendChild(confetti);
        
        setTimeout(() => confetti.remove(), 5000);
    }
}

function cargarDatosUsuario() {
    // Cargar datos del usuario desde localStorage o API
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    
    document.getElementById('userName').textContent = userData.nombres || 'Usuario';
    document.getElementById('userRole').textContent = userData.rol || 'Empleado';
    
    // Cargar datos guardados del perfil
    const savedProfile = localStorage.getItem('perfilData');
    if (savedProfile) {
        perfilData = JSON.parse(savedProfile);
        aplicarDatosGuardados();
    }
}

function aplicarDatosGuardados() {
    // Aplicar avatar guardado
    if (perfilData.avatar) {
        document.getElementById('avatarPreview').src = perfilData.avatar;
        document.getElementById('avatarEditor').src = perfilData.avatar;
    }
    
    // Aplicar banner guardado
    if (perfilData.banner) {
        if (perfilData.banner.startsWith('data:')) {
            document.getElementById('bannerPreview').style.backgroundImage = `url(${perfilData.banner})`;
        } else {
            seleccionarBanner(perfilData.banner);
        }
    }
    
    // Aplicar tema guardado
    if (perfilData.tema) {
        aplicarTema(perfilData.tema);
    }
    
    // Aplicar puntos y nivel
    document.getElementById('userPoints').textContent = perfilData.puntos;
    document.getElementById('userLevel').textContent = perfilData.nivel;
}

// Agregar estilos de animación
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    @keyframes confettiFall {
        to { transform: translateY(100vh) rotate(360deg); }
    }
`;
document.head.appendChild(style);

console.log('✅ Sistema de Perfil Personalizado cargado');
