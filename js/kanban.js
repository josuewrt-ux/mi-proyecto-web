// ============================================
// RENDERIZAR KANBAN
// ============================================
function renderizarKanban(tareas) {
    const estados = ['PENDIENTE', 'EN CURSO', 'EN ESPERA', 'COMPLETADO', 'CANCELADO'];
    const container = document.getElementById('kanban-container');
    
    if (!container) return;
    
    let html = '';
    estados.forEach(estado => {
        const tareasEstado = tareas.filter(t => t.estado === estado);
        
        html += `
            <div class="kanban-columna" data-estado="${estado}">
                <h3>
                    <span>${estado}</span>
                    <span class="count">${tareasEstado.length}</span>
                </h3>
                <div class="kanban-tareas" id="kanban-${estado.replace(' ', '-')}">
        `;
        
        tareasEstado.forEach(tarea => {
            html += `
                <div class="kanban-tarjeta" data-id="${tarea.id}" ondblclick="editarTarea('${tarea.id}')">
                    <strong>${tarea.nombre || 'Sin nombre'}</strong><br>
                    <small>${tarea.equipo || 'Sin equipo'} | ${tarea.avance || 0}%</small><br>
                    <small>👤 ${tarea.asignado ? tarea.asignado.split('@')[0] : 'No asignado'}</small>
                </div>
            `;
        });
        
        html += `</div></div>`;
    });
    
    container.innerHTML = html;
    
    // Inicializar Sortable
    if (typeof Sortable !== 'undefined') {
        estados.forEach(estado => {
            const el = document.getElementById(`kanban-${estado.replace(' ', '-')}`);
            if (el) {
                new Sortable(el, {
                    group: 'tareas',
                    animation: 150,
                    onEnd: function(evt) {
                        const tareaId = evt.item.dataset.id;
                        const nuevoEstado = evt.to.closest('.kanban-columna').dataset.estado;
                        
                        db.collection('tareas').doc(tareaId).update({
                            estado: nuevoEstado,
                            ultimaModificacion: new Date().toISOString()
                        }).then(() => {
                            mostrarNotificacion(`✅ Tarea movida a ${nuevoEstado}`, 'success');
                        }).catch(error => {
                            mostrarNotificacion('❌ Error al mover tarea', 'error');
                        });
                    }
                });
            }
        });
    }
}

// Hacer función global
window.renderizarKanban = renderizarKanban;