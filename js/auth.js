// ============================================
// AUTENTICACIÓN
// ============================================
auth.onAuthStateChanged((user) => {
    if (user) {
        usuarioActual = user;
        const userDisplay = document.getElementById('userDisplay');
        const btnLogin = document.getElementById('btnLogin');
        
        if (userDisplay) userDisplay.innerHTML = `👤 ${user.email}`;
        if (btnLogin) btnLogin.textContent = 'Cerrar sesión';
        
        // Registrar usuario en Firestore
        db.collection('usuarios').doc(user.uid).set({
            email: user.email,
            nombre: user.displayName || user.email,
            uid: user.uid,
            ultimoAcceso: new Date().toISOString()
        }, { merge: true });
        
        // Cargar datos
        if (typeof cargarTareas === 'function') cargarTareas();
        if (typeof cargarUsuarios === 'function') cargarUsuarios();
    } else {
        usuarioActual = null;
        const userDisplay = document.getElementById('userDisplay');
        const btnLogin = document.getElementById('btnLogin');
        const tablaBody = document.getElementById('tabla-body');
        
        if (userDisplay) userDisplay.innerHTML = 'No has iniciado sesión';
        if (btnLogin) btnLogin.textContent = 'Iniciar sesión con Google';
        if (tablaBody) {
            tablaBody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 40px;">🔐 Inicia sesión para ver y editar tareas</td></tr>';
        }
    }
});

// Evento del botón de login
document.getElementById('btnLogin')?.addEventListener('click', () => {
    if (usuarioActual) {
        auth.signOut();
        mostrarNotificacion('Sesión cerrada', 'info');
    } else {
        auth.signInWithPopup(googleProvider)
            .then(() => mostrarNotificacion('✅ Sesión iniciada', 'success'))
            .catch(error => mostrarNotificacion('❌ Error: ' + error.message, 'error'));
    }
});