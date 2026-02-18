// ============================================
// INICIALIZACIÓN SIMPLE Y DIRECTA DEL CHAT
// ============================================

(function() {
    console.log('🔵 Script de inicialización simple cargado');
    
    // Esperar a que TODO esté listo
    window.addEventListener('load', function() {
        console.log('🔵 Window load event - Iniciando chat en 2 segundos...');
        
        setTimeout(function() {
            try {
                // Verificar userData
                const userDataStr = localStorage.getItem('userData');
                console.log('🔵 userData string:', userDataStr);
                
                if (!userDataStr) {
                    console.log('❌ No hay userData en localStorage');
                    return;
                }
                
                const userData = JSON.parse(userDataStr);
                console.log('🔵 userData parseado:', userData);
                
                if (!userData.id) {
                    console.log('❌ userData no tiene id');
                    return;
                }
                
                // Verificar clases
                console.log('🔵 ChatClient existe?', typeof ChatClient !== 'undefined');
                console.log('🔵 ChatUI existe?', typeof ChatUI !== 'undefined');
                
                if (typeof ChatClient === 'undefined') {
                    console.log('❌ ChatClient no está definido');
                    return;
                }
                
                if (typeof ChatUI === 'undefined') {
                    console.log('❌ ChatUI no está definido');
                    return;
                }
                
                // INICIALIZAR CHAT
                console.log('✅ TODO LISTO - INICIALIZANDO CHAT');
                console.log('   userId:', userData.id);
                console.log('   rol:', userData.rol || 'empleado');
                
                window.chatClient = new ChatClient(userData.id, userData.rol || 'empleado');
                window.chatUI = new ChatUI(window.chatClient);
                window.chatClient.connect();
                
                console.log('✅✅✅ CHAT INICIALIZADO EXITOSAMENTE ✅✅✅');
                console.log('   chatClient:', window.chatClient);
                console.log('   chatUI:', window.chatUI);
                
                // Verificar que el botón existe
                setTimeout(function() {
                    const boton = document.getElementById('chatToggle');
                    console.log('🔵 Botón de chat existe?', boton !== null);
                    if (boton) {
                        console.log('✅✅✅ BOTÓN DE CHAT CREADO ✅✅✅');
                    } else {
                        console.log('❌❌❌ BOTÓN NO ENCONTRADO ❌❌❌');
                    }
                }, 500);
                
            } catch (error) {
                console.error('❌❌❌ ERROR INICIALIZANDO CHAT:', error);
                console.error('   Stack:', error.stack);
            }
        }, 2000);
    });
})();
