// ============================================
// TAREAS - CRUD COMPLETO
// ============================================

// ============================================
// RENDERIZAR TABLA DE TAREAS
// ============================================
window.renderizarTabla = function(tareas) {
    const tablaBody = document.getElementById('tabla-body');
    if (!tablaBody) return;
    
    if (!tareas || tareas.length === 0) {
        tablaBody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 40px;">📭 No hay tareas que coincidan con los filtros</td></tr>';
        return;
    }
    
    let html = '';
    const hoy = new Date().toISOString().split('T')[0];
    
    tareas.forEach(tarea => {
        const fechaLimite = tarea.fechaLimite || '';
        const esUrgente = fechaLimite === hoy;
        const nombreEscapado = (tarea.nombre || 'Sin nombre').replace(/'/g, "\\'");
        
        html += `<tr>
            <td style="font-weight: 500;">${tarea.nombre || 'Sin nombre'}</td>
            <td><span class="estado-badge ${(tarea.estado || 'PENDIENTE').replace(' ', '-')}">${tarea.estado || 'PENDIENTE'}</span></td>
            <td>
                <div class="avance">
                    <span>${tarea.avance || 0}%</span>
                    <div class="barra-avance">
                        <div class="barra-avance-fill" style="width: ${tarea.avance || 0}%;"></div>
                    </div>
                </div>
            </td>
            <td>${tarea.equipo || '-'}</td>
            <td>${tarea.asignado ? tarea.asignado.split('@')[0] : 'No asignado'}</td>
            <td class="${esUrgente ? 'fecha-urgente' : ''}">${fechaLimite || '-'}</td>
            <td>${tarea.etapa || 'OP'}</td>
            <td>
                ${(tarea.tags || []).slice(0, 2).map(tag => 
                    `<span style="display: inline-block; background: #0366d620; color: #0366d6; padding: 2px 8px; border-radius: 12px; font-size: 11px; margin-right: 4px;">${tag}</span>`
                ).join('')}
                ${(tarea.tags || []).length > 2 ? `<span style="font-size: 11px; color: #586069;">+${tarea.tags.length - 2}</span>` : ''}
            </td>
            <td>${tarea.creadoPor ? tarea.creadoPor.split('@')[0] : '-'}</td>
            <td style="white-space: nowrap;">
                <button onclick="editarTarea('${tarea.id}')" style="background: none; border: none; cursor: pointer; font-size: 16px; padding: 4px;" title="Editar tarea" aria-label="Editar tarea">✏️</button>
                <button onclick="eliminarTarea('${tarea.id}', '${nombreEscapado}')" class="btn-eliminar" title="Eliminar tarea" aria-label="Eliminar tarea">🗑️</button>
            </td>
        </tr>`;
    });
    
    tablaBody.innerHTML = html;
};

// ============================================
// CARGAR TAREAS
// ============================================
function cargarTareas() {
    if (!db) {
        console.error('❌ Firebase no inicializado');
        return;
    }
    
    db.collection('tareas').orderBy('fechaCreacion', 'desc').onSnapshot((snapshot) => {
        let tareas = [];
        let contadores = {
            COMPLETADO: 0, 'EN ESPERA': 0, CANCELADO: 0, 'EN CURSO': 0, PENDIENTE: 0
        };
        let contadoresProyectos = { Osinergmin: 0, Chinalco: 0, Contugas: 0 };
        let vencenHoy = 0;
        const hoy = new Date().toISOString().split('T')[0];

        snapshot.forEach((doc) => {
            const tarea = { id: doc.id, ...doc.data() };
            
            // Corregir URLs de Storage
            if (tarea.archivos) {
                tarea.archivos = tarea.archivos.map(archivo => {
                    if (archivo.url) archivo.url = corregirURLStorage(archivo.url);
                    return archivo;
                });
            }
            
            tareas.push(tarea);
            
            if (contadores[tarea.estado] !== undefined) contadores[tarea.estado]++;
            if (tarea.proyecto === 'Osinergmin') contadoresProyectos.Osinergmin++;
            if (tarea.proyecto === 'Chinalco') contadoresProyectos.Chinalco++;
            if (tarea.proyecto === 'Contugas') contadoresProyectos.Contugas++;
            
            if (tarea.fechaLimite === hoy) vencenHoy++;
        });

        window.todasLasTareas = tareas;
        
        // Actualizar contadores
        if (typeof actualizarContadores === 'function') {
            actualizarContadores(contadores, contadoresProyectos, vencenHoy, tareas.length);
        }
        
        // Actualizar métricas
        const metricCompletadas = document.getElementById('metric-completadas');
        const metricPendientes = document.getElementById('metric-pendientes');
        const metricVencenHoy = document.getElementById('metric-vencen-hoy');
        const metricTotal = document.getElementById('metric-total');
        
        if (metricCompletadas) metricCompletadas.textContent = contadores.COMPLETADO || 0;
        if (metricPendientes) metricPendientes.textContent = (contadores.PENDIENTE || 0) + (contadores['EN CURSO'] || 0) + (contadores['EN ESPERA'] || 0);
        if (metricVencenHoy) metricVencenHoy.textContent = vencenHoy || 0;
        if (metricTotal) metricTotal.textContent = tareas.length || 0;

        if (typeof aplicarFiltros === 'function') {
            aplicarFiltros();
        }
        
        if (typeof actualizarGrafico === 'function') {
            actualizarGrafico(contadores);
        }
        
        // Actualizar vista actual
        if (window.vistaActual === 'kanban' && typeof renderizarKanban === 'function') {
            renderizarKanban(window.tareasFiltradasActuales || tareas);
        } else if (window.vistaActual === 'calendario' && typeof actualizarCalendario === 'function') {
            actualizarCalendario();
        }
    }, error => {
        console.error('❌ Error al cargar tareas:', error);
        mostrarNotificacion('❌ Error al cargar tareas', 'error');
    });
}

// ============================================
// CARGAR USUARIOS
// ============================================
function cargarUsuarios() {
    if (!db) return Promise.resolve([]);
    
    return db.collection('usuarios').get().then(snapshot => {
        window.cacheUsuarios = [];
        snapshot.forEach((doc) => {
            window.cacheUsuarios.push({ id: doc.id, ...doc.data() });
        });
        actualizarSelectUsuarios();
        return window.cacheUsuarios;
    }).catch(error => {
        console.error('Error al cargar usuarios:', error);
        return [];
    });
}

function actualizarSelectUsuarios() {
    const selectAsignado = document.getElementById('tareaAsignado');
    if (selectAsignado) {
        selectAsignado.innerHTML = '<option value="no asignado">No asignado</option>';
        
        (window.cacheUsuarios || []).forEach(user => {
            if (user.email) {
                selectAsignado.innerHTML += `<option value="${user.email}">${user.email}</option>`;
            }
        });
    }
    
    const listaUsuarios = document.getElementById('lista-usuarios');
    if (listaUsuarios) {
        listaUsuarios.innerHTML = '<h3 style="font-size: 12px; text-transform: uppercase; color: #586069; margin-bottom: 8px;">👥 Miembros</h3>';
        (window.cacheUsuarios || []).forEach(user => {
            if (user.email) {
                listaUsuarios.innerHTML += `<li class="proyecto-item" onclick="filtrarPorUsuario('${user.email}')" style="cursor: pointer;">👤 ${user.email.split('@')[0]} <span class="count" id="count-user-${user.email.replace(/[.@]/g, '-')}">0</span></li>`;
            }
        });
    }
    
    if (window.usuarioActual && window.usuarioActual.email) {
        const userExists = (window.cacheUsuarios || []).some(u => u.email === window.usuarioActual.email);
        if (!userExists && db) {
            db.collection('usuarios').doc(window.usuarioActual.uid).set({
                email: window.usuarioActual.email,
                nombre: window.usuarioActual.displayName || window.usuarioActual.email,
                uid: window.usuarioActual.uid,
                ultimoAcceso: new Date().toISOString()
            }).then(() => cargarUsuarios());
        }
    }
}

// ============================================
// ELIMINAR TAREA
// ============================================
function eliminarTarea(id, nombre) {
    if (!id) return;
    
    mostrarConfirmacionConUndo(`¿Eliminar la tarea "${nombre || 'Sin nombre'}"?`, async () => {
        try {
            // Eliminar archivos de Storage si existen
            const tareaDoc = await db.collection('tareas').doc(id).get();
            if (tareaDoc.exists) {
                const tarea = tareaDoc.data();
                if (tarea.archivos && tarea.archivos.length > 0) {
                    tarea.archivos.forEach(archivo => {
                        try {
                            if (archivo.url) {
                                const storageRef = storage.refFromURL(archivo.url);
                                storageRef.delete().catch(e => console.warn('No se pudo eliminar archivo:', e));
                            }
                        } catch (e) {
                            console.warn('URL inválida:', e);
                        }
                    });
                }
            }
            
            await db.collection('tareas').doc(id).delete();
            mostrarNotificacion('✅ Tarea eliminada', 'success');
        } catch (error) {
            console.error('Error al eliminar:', error);
            mostrarNotificacion('❌ Error: ' + (error.message || 'Error desconocido'), 'error');
        }
    });
}

// ============================================
// EDITAR TAREA
// ============================================
function editarTarea(id) {
    if (!id) return;
    
    db.collection('tareas').doc(id).get().then((doc) => {
        if (doc.exists) {
            if (typeof abrirModal === 'function') {
                abrirModal({ id: doc.id, ...doc.data() });
            }
        } else {
            mostrarNotificacion('❌ Tarea no encontrada', 'error');
        }
    }).catch(error => {
        console.error('Error al editar:', error);
        mostrarNotificacion('❌ Error al cargar tarea', 'error');
    });
}

// Hacer funciones globales
window.cargarTareas = cargarTareas;
window.cargarUsuarios = cargarUsuarios;
window.actualizarSelectUsuarios = actualizarSelectUsuarios;
window.eliminarTarea = eliminarTarea;
window.editarTarea = editarTarea;
window.renderizarTabla = renderizarTabla;