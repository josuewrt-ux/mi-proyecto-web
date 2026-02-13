// ============================================
// TAGS / ETIQUETAS
// ============================================

function agregarTag() {
    const input = document.getElementById('nuevoTag');
    if (!input) return;
    
    const texto = input.value.trim();
    if (!texto) {
        mostrarNotificacion('Escribe una etiqueta', 'warning');
        return;
    }
    
    if (!tareaEditando) {
        mostrarNotificacion('Guarda la tarea primero', 'warning');
        return;
    }
    
    const tagsActuales = tareaEditando.tags || [];
    
    if (tagsActuales.includes(texto)) {
        mostrarNotificacion('La etiqueta ya existe', 'warning');
        return;
    }
    
    db.collection('tareas').doc(tareaEditando.id).update({
        tags: [...tagsActuales, texto]
    }).then(() => {
        input.value = '';
        mostrarNotificacion('✅ Etiqueta agregada', 'success');
        return db.collection('tareas').doc(tareaEditando.id).get();
    }).then(doc => {
        if (doc.exists) {
            tareaEditando = { id: doc.id, ...doc.data() };
            window.tareaEditando = tareaEditando;
            renderizarTags(tareaEditando.tags || []);
        }
    }).catch(error => {
        console.error('Error:', error);
        mostrarNotificacion('❌ Error al agregar etiqueta', 'error');
    });
}

function eliminarTag(tag) {
    if (!tareaEditando) return;
    
    if (!confirm(`¿Eliminar la etiqueta "${tag}"?`)) return;
    
    const tagsActuales = tareaEditando.tags || [];
    const nuevosTags = tagsActuales.filter(t => t !== tag);
    
    db.collection('tareas').doc(tareaEditando.id).update({
        tags: nuevosTags
    }).then(() => {
        mostrarNotificacion('🗑️ Etiqueta eliminada', 'success');
        tareaEditando.tags = nuevosTags;
        window.tareaEditando = tareaEditando;
        renderizarTags(nuevosTags);
    }).catch(error => {
        console.error('Error:', error);
        mostrarNotificacion('❌ Error al eliminar etiqueta', 'error');
    });
}

function renderizarTags(tags) {
    const container = document.getElementById('tags-container-modal');
    if (!container) return;
    
    if (!tags || tags.length === 0) {
        container.innerHTML = '';
        return;
    }
    
    let html = '';
    tags.forEach(tag => {
        html += `<span class="tag">
            ${tag}
            <button onclick="eliminarTag('${tag}')" title="Eliminar etiqueta">✕</button>
        </span>`;
    });
    
    container.innerHTML = html;
}

// Hacer globales
window.agregarTag = agregarTag;
window.eliminarTag = eliminarTag;
window.renderizarTags = renderizarTags;