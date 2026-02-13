// ============================================
// PWA - PROGRESSIVE WEB APP
// ============================================
let deferredPrompt;
let instalacionDisponible = false;

// Detectar si se puede instalar
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    instalacionDisponible = true;
    
    // Mostrar banner de instalación después de 3 segundos
    // Solo si no ha sido ignorado antes
    if (!localStorage.getItem('pwa-install-ignored') && !localStorage.getItem('pwa-installed')) {
        setTimeout(() => {
            if (instalacionDisponible) {
                mostrarBannerInstalacion();
            }
        }, 3000);
    }
});

// Mostrar banner de instalación
function mostrarBannerInstalacion() {
    // No mostrar si ya hay un banner
    if (document.getElementById('pwa-banner')) return;
    
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const banner = document.createElement('div');
    banner.className = 'pwa-install-banner';
    banner.id = 'pwa-banner';
    banner.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 28px;">📱</span>
            <div>
                <strong style="font-size: 16px;">Instala nuestra app</strong>
                <p style="margin: 0; font-size: 13px; opacity: 0.9;">Más rápido y sin internet</p>
            </div>
        </div>
        <div style="display: flex; gap: 12px;">
            <button onclick="instalarPWA()" style="background: white; color: #667eea; border: none; padding: 10px 24px; border-radius: 30px; font-weight: 600; cursor: pointer;">
                Instalar
            </button>
            <button onclick="cerrarBannerPWA()" style="background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.3); padding: 10px 16px; border-radius: 30px; cursor: pointer;">
                ✕
            </button>
        </div>
    `;
    
    container.appendChild(banner);
}

// Función para instalar
window.instalarPWA = async function() {
    if (!deferredPrompt) {
        mostrarNotificacion('La app ya está instalada o no es instalable', 'info');
        return;
    }
    
    try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            console.log('✅ Usuario instaló la app');
            localStorage.setItem('pwa-installed', 'true');
            mostrarNotificacion('✅ App instalada correctamente', 'success');
            cerrarBannerPWA();
        }
    } catch (error) {
        console.error('Error en instalación PWA:', error);
    }
    
    deferredPrompt = null;
    instalacionDisponible = false;
};

window.cerrarBannerPWA = function() {
    const banner = document.getElementById('pwa-banner');
    if (banner) banner.remove();
    localStorage.setItem('pwa-install-ignored', 'true');
};

// Registrar Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('✅ Service Worker registrado:', reg.scope))
            .catch(err => console.log('❌ Error Service Worker:', err));
    });
}

// Detectar si está instalada
window.addEventListener('appinstalled', (e) => {
    console.log('✅ App instalada');
    localStorage.setItem('pwa-installed', 'true');
    cerrarBannerPWA();
    mostrarNotificacion('🎉 ¡Gracias por instalar la app!', 'success');
});

// Detectar modo standalone
window.addEventListener('load', () => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
        console.log('✅ Ejecutándose como app instalada');
        document.body.classList.add('pwa-standalone');
    }
});