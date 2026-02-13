// ============================================
// SUBTAREAS - AGREGAR
// ============================================
function agregarSubtarea() {
    const input = document.getElementById('nuevaSubtarea');
    if (!input) return;
    
    const texto = input.value.trim();
    if (!texto) {
        mostrarNotificacion('Escribe una subtarea', 'warning');
        return;
    }
    
    if (!tareaEditando) {
        mostrarNotificacion('Guarda la tarea primero', 'warning');
        return;
    }
    
    // Crear nueva subtarea
    const subtarea = {
        id: generarId(),
        texto: texto,
        completada: false,
        creadoPor: usuarioActual ? usuarioActual.email : 'desconocido',
        fechaCreacion: new Date().toISOString()
    };
    
    // Obtener subtareas actuales
    const subtareasActuales = tareaEditando.subtareas || [];
    
    // Agregar nueva subtarea
    db.collection('tareas').doc(tareaEditando.id).update({
        subtareas: [...subtareasActuales, subtarea]
    }).then(() => {
        input.value = '';
        mostrarNotificacion('✅ Subtarea agregada', 'success');
        
        // Recargar tarea para mostrar cambios
        return db.collection('tareas').doc(tareaEditando.id).get();
    }).then(doc => {
        if (doc.exists) {
            tareaEditando = { id: doc.id, ...doc.data() };
            window.tareaEditando = tareaEditando;
            renderizarSubtareas(tareaEditando);
            
            // Actualizar avance basado en subtareas
            calcularYActualizarAvance(tareaEditando);
        }
    }).catch(error => {
        console.error('Error:', error);
        mostrarNotificacion('❌ Error al agregar subtarea', 'error');
    });
}

// ============================================
// RENDERIZAR SUBTAREAS EN MODAL
// ============================================
function renderizarSubtareas(tarea) {
    const container = document.getElementById('subtareas-container-modal');
    if (!container) return;
    
    if (!tarea.subtareas || tarea.subtareas.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 20px; color: #586069; background: #f6f8fa; border-radius: 8px;">📭 No hay subtareas. ¡Crea una!</div>';
        return;
    }
    
    let html = '';
    tarea.subtareas.forEach(sub => {
        html += `
            <div style="display: flex; align-items: center; gap: 12px; padding: 10px 12px; background: ${sub.completada ? '#e6f7e6' : '#f6f8fa'}; border-radius: 8px; margin-bottom: 6px; border-left: 4px solid ${sub.completada ? '#2ea44f' : '#0366d6'}; transition: all 0.2s;">
                <input type="checkbox" 
                       ${sub.completada ? 'checked' : ''}
                       onchange="toggleSubtarea('${tarea.id}', '${sub.id}')"
                       style="width: 20px; height: 20px; cursor: pointer;">
                <span style="flex: 1; font-size: 14px; ${sub.completada ? 'text-decoration: line-through; color: #586069;' : ''}">
                    ${sub.texto}
                </span>
                <small style="color: #586069; font-size: 11px;">
                    ${sub.creadoPor ? sub.creadoPor.split('@')[0] : ''}
                </small>
                <button onclick="eliminarSubtarea('${tarea.id}', '${sub.id}')"
                        style="background: none; border: none; color: #cb2431; cursor: pointer; font-size: 16px; padding: 4px 8px; border-radius: 4px;"
                        onmouseover="this.style.background='#ff000020'"
                        onmouseout="this.style.background='none'"
                        title="Eliminar subtarea">
                    🗑️
                </button>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// ============================================
// TOGGLE SUBTAREA (MARCAR/DESMARCAR)
// ============================================
function toggleSubtarea(tareaId, subtareaId) {
    db.collection('tareas').doc(tareaId).get().then(doc => {
        if (!doc.exists) return;
        
        const tarea = { id: doc.id, ...doc.data() };
        const subtareas = tarea.subtareas || [];
        
        // Buscar y cambiar estado
        const subtareaIndex = subtareas.findIndex(s => s.id === subtareaId);
        if (subtareaIndex !== -1) {
            subtareas[subtareaIndex].completada = !subtareas[subtareaIndex].completada;
            
            // Calcular nuevo avance
            const completadas = subtareas.filter(s => s.completada).length;
            const nuevoAvance = subtareas.length > 0 ? Math.round((completadas / subtareas.length) * 100) : 0;
            
            // Actualizar en Firestore
            db.collection('tareas').doc(tareaId).update({
                subtareas: subtareas,
                avance: nuevoAvance
            }).then(() => {
                mostrarNotificacion(
                    subtareas[subtareaIndex].completada ? '✅ Subtarea completada' : '↩️ Subtarea reabierta',
                    'info'
                );
                
                // Actualizar vista si estamos editando esta tarea
                if (tareaEditando && tareaEditando.id === tareaId) {
                    tareaEditando.subtareas = subtareas;
                    tareaEditando.avance = nuevoAvance;
                    window.tareaEditando = tareaEditando;
                    renderizarSubtareas(tareaEditando);
                    
                    // Actualizar campo de avance
                    const avanceInput = document.getElementById('tareaAvance');
                    if (avanceInput) avanceInput.value = nuevoAvance;
                }
            }).catch(error => {
                console.error('Error:', error);
                mostrarNotificacion('❌ Error al actualizar subtarea', 'error');
            });
        }
    });
}

// ============================================
// ELIMINAR SUBTAREA
// ============================================
function eliminarSubtarea(tareaId, subtareaId) {
    if (!confirm('¿Eliminar esta subtarea?')) return;
    
    db.collection('tareas').doc(tareaId).get().then(doc => {
        if (!doc.exists) return;
        
        const tarea = doc.data();
        const subtareas = (tarea.subtareas || []).filter(s => s.id !== subtareaId);
        
        // Recalcular avance
        let nuevoAvance = 0;
        if (subtareas.length > 0) {
            const completadas = subtareas.filter(s => s.completada).length;
            nuevoAvance = Math.round((completadas / subtareas.length) * 100);
        }
        
        // Actualizar Firestore
        return db.collection('tareas').doc(tareaId).update({
            subtareas: subtareas,
            avance: nuevoAvance
        });
    }).then(() => {
        mostrarNotificacion('🗑️ Subtarea eliminada', 'success');
        
        // Actualizar vista si estamos editando esta tarea
        if (tareaEditando && tareaEditando.id === tareaId) {
            return db.collection('tareas').doc(tareaId).get();
        }
    }).then(doc => {
        if (doc && doc.exists) {
            tareaEditando = { id: doc.id, ...doc.data() };
            window.tareaEditando = tareaEditando;
            renderizarSubtareas(tareaEditando);
            
            // Actualizar campo de avance
            const avanceInput = document.getElementById('tareaAvance');
            if (avanceInput) avanceInput.value = tareaEditando.avance || 0;
        }
    }).catch(error => {
        console.error('Error:', error);
        mostrarNotificacion('❌ Error al eliminar subtarea', 'error');
    });
}

// ============================================
// CALCULAR Y ACTUALIZAR AVANCE
// ============================================
function calcularYActualizarAvance(tarea) {
    if (!tarea.subtareas || tarea.subtareas.length === 0) {
        // Si no hay subtareas, mantener el avance manual
        return;
    }
    
    const completadas = tarea.subtareas.filter(s => s.completada).length;
    const nuevoAvance = Math.round((completadas / tarea.subtareas.length) * 100);
    
    // Solo actualizar si el avance cambió
    if (tarea.avance !== nuevoAvance) {
        db.collection('tareas').doc(tarea.id).update({
            avance: nuevoAvance
        }).then(() => {
            // Actualizar campo de avance en el modal
            const avanceInput = document.getElementById('tareaAvance');
            if (avanceInput) avanceInput.value = nuevoAvance;
            
            if (tareaEditando && tareaEditando.id === tarea.id) {
                tareaEditando.avance = nuevoAvance;
                window.tareaEditando = tareaEditando;
            }
        }).catch(error => {
            console.error('Error al actualizar avance:', error);
        });
    }
}

// Hacer funciones globales
window.agregarSubtarea = agregarSubtarea;
window.toggleSubtarea = toggleSubtarea;
window.eliminarSubtarea = eliminarSubtarea;
window.renderizarSubtareas = renderizarSubtareas;
window.calcularYActualizarAvance = calcularYActualizarAvance;