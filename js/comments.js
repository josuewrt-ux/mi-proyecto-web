// ============================================
// AGREGAR COMENTARIO
// ============================================
function agregarComentario() {
    const input = document.getElementById('nuevoComentario');
    if (!input) return;
    
    const texto = input.value;
    if (!texto.trim()) {
        mostrarNotificacion('Escribe un comentario', 'warning');
        return;
    }
    
    if (!tareaEditando) {
        mostrarNotificacion('Guarda la tarea primero', 'warning');
        return;
    }
    
    if (!usuarioActual) {
        mostrarNotificacion('Debes iniciar sesión', 'warning');
        return;
    }
    
    const comentario = {
        usuario: usuarioActual.email,
        texto: texto,
        fecha: new Date().toISOString()
    };
    
    db.collection('tareas').doc(tareaEditando.id).update({
        comentarios: firebase.firestore.FieldValue.arrayUnion(comentario)
    }).then(() => {
        input.value = '';
        return db.collection('tareas').doc(tareaEditando.id).get();
    }).then(doc => {
        if (doc.exists) {
            const tarea = doc.data();
            renderizarComentarios(tarea.comentarios || []);
            mostrarNotificacion('✅ Comentario agregado', 'success');
        }
    }).catch(error => {
        console.error('Error:', error);
        mostrarNotificacion('❌ Error al agregar comentario', 'error');
    });
}

// Hacer función global
window.agregarComentario = agregarComentario;