// ============================================
// MODO CONCENTRACIÓN
// ============================================
function toggleModoConcentracion() {
    document.body.classList.toggle('modo-concentracion');
    
    const activo = document.body.classList.contains('modo-concentracion');
    localStorage.setItem('modoConcentracion', activo);
    
    mostrarNotificacion(
        activo ? '🧘 Modo concentración activado' : '👥 Vista normal',
        'info'
    );
    
    // Actualizar botón
    const btn = document.getElementById('btnModoConcentracion');
    if (btn) {
        btn.innerHTML = activo ? '🧘 Salir' : '🧘 Concentración';
        btn.title = activo ? 'Desactivar modo concentración' : 'Activar modo concentración';
    }
}

function initModoConcentracion() {
    const activo = localStorage.getItem('modoConcentracion') === 'true';
    if (activo) {
        document.body.classList.add('modo-concentracion');
    }
    
    // Actualizar botón si existe
    const btn = document.getElementById('btnModoConcentracion');
    if (btn) {
        btn.innerHTML = activo ? '🧘 Salir' : '🧘 Concentración';
        btn.onclick = toggleModoConcentracion;
    }
}

// Hacer global
window.toggleModoConcentracion = toggleModoConcentracion;
window.initModoConcentracion = initModoConcentracion;