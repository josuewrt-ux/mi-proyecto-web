// ============================================
// HISTORIAL DE CAMBIOS - VERSIÓN GLOBAL
// ============================================

// Registrar cambio en historial
window.registrarCambio = async function(tareaId, cambios) {
    if (!usuarioActual) return;
    
    const historialRef = db.collection('tareas').doc(tareaId)
        .collection('historial').doc();
    
    await historialRef.set({
        id: historialRef.id,
        usuario: usuarioActual.email,
        fecha: new Date().toISOString(),
        cambios: cambios,
        tareaId: tareaId
    });
};

// Guardar tarea con historial
window.guardarTareaConHistorial = async function(tareaId, tareaData, esNueva = false) {
    const tareaRef = db.collection('tareas').doc(tareaId);
    
    if (!esNueva) {
        try {
            // Obtener datos anteriores
            const oldDoc = await tareaRef.get();
            if (oldDoc.exists) {
                const oldData = oldDoc.data();
                
                // Detectar cambios
                const cambios = [];
                Object.keys(tareaData).forEach(key => {
                    if (JSON.stringify(oldData[key]) !== JSON.stringify(tareaData[key])) {
                        cambios.push({
                            campo: key,
                            valorAnterior: oldData[key] || 'vacío',
                            valorNuevo: tareaData[key] || 'vacío'
                        });
                    }
                });
                
                // Registrar en historial
                if (cambios.length > 0) {
                    await window.registrarCambio(tareaId, cambios);
                }
            }
        } catch (error) {
            console.error('Error al registrar historial:', error);
        }
    }
    
    // Actualizar tarea
    await tareaRef.update(tareaData);
};

// Obtener historial de una tarea
window.obtenerHistorial = async function(tareaId) {
    try {
        const snapshot = await db.collection('tareas').doc(tareaId)
            .collection('historial')
            .orderBy('fecha', 'desc')
            .get();
        
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error al obtener historial:', error);
        return [];
    }
};

// Renderizar historial en modal
window.renderizarHistorial = async function(tareaId) {
    const container = document.getElementById('historial-container-modal');
    if (!container) return;
    
    const historial = await window.obtenerHistorial(tareaId);
    
    if (historial.length === 0) {
        container.innerHTML = '<div class="no-archivos">📜 Sin historial de cambios</div>';
        return;
    }
    
    let html = '<h4 style="margin-bottom: 12px;">📜 Historial de cambios</h4>';
    
    historial.forEach(item => {
        const fecha = new Date(item.fecha).toLocaleString('es-ES');
        html += `<div class="historial-item">`;
        html += `<div style="display: flex; justify-content: space-between; margin-bottom: 8px;">`;
        html += `<strong>👤 ${item.usuario ? item.usuario.split('@')[0] : 'Usuario'}</strong>`;
        html += `<span class="historial-fecha">${fecha}</span>`;
        html += `</div>`;
        
        if (item.cambios && item.cambios.length > 0) {
            item.cambios.forEach(cambio => {
                html += `<div style="margin-bottom: 4px; font-size: 13px;">`;
                html += `<span class="historial-cambio">${cambio.campo || 'campo'}</span>: `;
                html += `<span style="color: #cb2431;">${cambio.valorAnterior || 'vacío'}</span> → `;
                html += `<span style="color: #2ea44f;">${cambio.valorNuevo || 'vacío'}</span>`;
                html += `</div>`;
            });
        }
        
        html += `</div>`;
    });
    
    container.innerHTML = html;
};