// ============================================
// UI - VERSIÓN 100% FUNCIONAL (CORREGIDA)
// ============================================

// ============================================
// CAMBIAR VISTA (TABLA/KANBAN/CALENDARIO)
// ============================================
window.cambiarVista = function(vista, event) {
    console.log('🔄 Cambiando a vista:', vista);
    
    // Actualizar tabs
    document.querySelectorAll('.vista-tab').forEach(tab => {
        tab.classList.remove('active');
        tab.setAttribute('aria-selected', 'false');
    });
    
    if (event && event.target) {
        event.target.classList.add('active');
        event.target.setAttribute('aria-selected', 'true');
    }
    
    // Ocultar todas las vistas
    const vistaTabla = document.getElementById('vistaTabla');
    const vistaKanban = document.getElementById('vistaKanban');
    const vistaCalendario = document.getElementById('vistaCalendario');
    
    if (vistaTabla) vistaTabla.style.display = 'none';
    if (vistaKanban) vistaKanban.style.display = 'none';
    if (vistaCalendario) vistaCalendario.style.display = 'none';
    
    // Mostrar vista seleccionada
    if (vista === 'tabla') {
        if (vistaTabla) vistaTabla.style.display = 'block';
    } else if (vista === 'kanban') {
        if (vistaKanban) {
            vistaKanban.style.display = 'block';
            if (typeof renderizarKanban === 'function') {
                renderizarKanban(window.tareasFiltradasActuales || window.todasLasTareas || []);
            }
        }
    } else if (vista === 'calendario') {
        if (vistaCalendario) {
            vistaCalendario.style.display = 'block';
            // Inicializar calendario si no existe
            if (!window.calendario) {
                setTimeout(() => {
                    if (typeof initCalendario === 'function') {
                        initCalendario();
                    }
                }, 100);
            } else {
                if (typeof actualizarCalendario === 'function') {
                    actualizarCalendario();
                }
            }
        }
    }
    
    window.vistaActual = vista;
    localStorage.setItem('vistaActual', vista);
};

// ============================================
// ABRIR MODAL
// ============================================
window.abrirModal = function(tarea = null) {
    console.log('🔵 abrirModal llamado', tarea);
    
    window.tareaEditando = tarea;
    
    const modal = document.getElementById('modalTarea');
    if (!modal) {
        console.error('❌ Modal no encontrado');
        return;
    }
    
    const title = document.getElementById('modalTitle');
    if (title) title.textContent = tarea ? '✏️ Editar tarea' : '➕ Nueva tarea';
    
    // Limpiar o llenar campos
    if (tarea) {
        if (document.getElementById('tareaNombre')) document.getElementById('tareaNombre').value = tarea.nombre || '';
        if (document.getElementById('tareaEstado')) document.getElementById('tareaEstado').value = tarea.estado || 'PENDIENTE';
        if (document.getElementById('tareaAvance')) document.getElementById('tareaAvance').value = tarea.avance || 0;
        if (document.getElementById('tareaEquipo')) document.getElementById('tareaEquipo').value = tarea.equipo || '';
        if (document.getElementById('tareaAsignado')) document.getElementById('tareaAsignado').value = tarea.asignado || 'no asignado';
        if (document.getElementById('tareaProyecto')) document.getElementById('tareaProyecto').value = tarea.proyecto || 'Osinergmin';
        if (document.getElementById('tareaEtapa')) document.getElementById('tareaEtapa').value = tarea.etapa || 'OP';
        
        if (tarea.fechaLimite && document.getElementById('tareaFecha')) {
            const fecha = new Date(tarea.fechaLimite);
            document.getElementById('tareaFecha').value = fecha.toISOString().split('T')[0];
        }
        
        // Renderizar subtareas, tags, archivos, comentarios, historial
        if (typeof renderizarSubtareas === 'function') renderizarSubtareas(tarea);
        if (typeof renderizarTags === 'function') renderizarTags(tarea.tags || []);
        if (typeof mostrarArchivosModal === 'function') mostrarArchivosModal(tarea.archivos || []);
        if (typeof renderizarComentarios === 'function') renderizarComentarios(tarea.comentarios || []);
        if (typeof renderizarHistorial === 'function') renderizarHistorial(tarea.id);
    } else {
        const form = document.getElementById('formTarea');
        if (form) form.reset();
        if (document.getElementById('tareaAvance')) document.getElementById('tareaAvance').value = 0;
        
        // Limpiar secciones
        if (typeof renderizarSubtareas === 'function') renderizarSubtareas({ subtareas: [] });
        if (typeof renderizarTags === 'function') renderizarTags([]);
        if (typeof mostrarArchivosModal === 'function') mostrarArchivosModal([]);
        if (typeof renderizarComentarios === 'function') renderizarComentarios([]);
        
        const historialContainer = document.getElementById('historial-container-modal');
        if (historialContainer) historialContainer.innerHTML = '';
        
        const qrContainer = document.getElementById('qr-container-modal');
        if (qrContainer) qrContainer.innerHTML = '';
    }
    
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden'; // Prevenir scroll
    
    console.log('✅ Modal abierto');
};

// ============================================
// CERRAR MODAL
// ============================================
window.cerrarModal = function() {
    console.log('🔴 cerrarModal llamado');
    
    const modal = document.getElementById('modalTarea');
    if (modal) {
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = ''; // Restaurar scroll
    }
    
    window.tareaEditando = null;
};

// ============================================
// GUARDAR TAREA
// ============================================
window.guardarTarea = function(e) {
    e.preventDefault();
    console.log('💾 guardarTarea llamado');
    
    if (!window.usuarioActual) {
        mostrarNotificacion('❌ Debes iniciar sesión', 'error');
        return;
    }
    
    // Validar nombre
    const nombreInput = document.getElementById('tareaNombre');
    if (!nombreInput.value.trim()) {
        mostrarNotificacion('❌ El nombre es obligatorio', 'error');
        nombreInput.focus();
        return;
    }
    
    // Recopilar datos
    const tareaData = {
        nombre: nombreInput.value.trim(),
        estado: document.getElementById('tareaEstado').value,
        avance: parseInt(document.getElementById('tareaAvance').value) || 0,
        equipo: document.getElementById('tareaEquipo').value.trim() || 'Sin equipo',
        asignado: document.getElementById('tareaAsignado').value,
        proyecto: document.getElementById('tareaProyecto').value,
        etapa: document.getElementById('tareaEtapa').value,
        fechaLimite: document.getElementById('tareaFecha').value || null,
        ultimaModificacion: new Date().toISOString()
    };
    
    const btnGuardar = e.target.closest('button') || document.getElementById('btnGuardarTarea');
    const textoOriginal = btnGuardar.textContent;
    btnGuardar.disabled = true;
    btnGuardar.innerHTML = '<span class="spinner"></span> Guardando...';
    
    if (window.tareaEditando) {
        // ACTUALIZAR - usar función con historial
        if (typeof window.guardarTareaConHistorial === 'function') {
            window.guardarTareaConHistorial(window.tareaEditando.id, tareaData, false)
                .then(() => {
                    mostrarNotificacion('✅ Tarea actualizada', 'success');
                    window.cerrarModal();
                })
                .catch(error => {
                    console.error(error);
                    mostrarNotificacion('❌ Error: ' + (error.message || 'Error desconocido'), 'error');
                })
                .finally(() => {
                    btnGuardar.disabled = false;
                    btnGuardar.innerHTML = textoOriginal;
                });
        } else {
            // Fallback
            db.collection('tareas').doc(window.tareaEditando.id).update(tareaData)
                .then(() => {
                    mostrarNotificacion('✅ Tarea actualizada', 'success');
                    window.cerrarModal();
                })
                .catch(error => {
                    console.error(error);
                    mostrarNotificacion('❌ Error: ' + (error.message || 'Error desconocido'), 'error');
                })
                .finally(() => {
                    btnGuardar.disabled = false;
                    btnGuardar.innerHTML = textoOriginal;
                });
        }
    } else {
        // NUEVA
        tareaData.fechaCreacion = new Date().toISOString();
        tareaData.creadoPor = window.usuarioActual.email;
        tareaData.comentarios = [];
        tareaData.archivos = [];
        tareaData.subtareas = [];
        tareaData.tags = [];
        
        db.collection('tareas').add(tareaData)
            .then(() => {
                mostrarNotificacion('✅ Tarea creada', 'success');
                window.cerrarModal();
            })
            .catch(error => {
                console.error(error);
                mostrarNotificacion('❌ Error: ' + (error.message || 'Error desconocido'), 'error');
            })
            .finally(() => {
                btnGuardar.disabled = false;
                btnGuardar.innerHTML = textoOriginal;
            });
    }
};

// ============================================
// RENDERIZAR COMENTARIOS
// ============================================
window.renderizarComentarios = function(comentarios) {
    const container = document.getElementById('lista-comentarios-modal');
    if (!container) return;
    
    if (!comentarios || comentarios.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 20px; color: #586069;">💬 No hay comentarios</div>';
        return;
    }
    
    let html = '';
    comentarios.forEach(com => {
        const fecha = com.fecha ? new Date(com.fecha).toLocaleString('es-ES') : '';
        html += `<div class="comentario">
            <div class="comentario-header">
                <strong>👤 ${com.usuario ? com.usuario.split('@')[0] : 'Usuario'}</strong>
                <span>${fecha}</span>
            </div>
            <div>${com.texto}</div>
        </div>`;
    });
    
    container.innerHTML = html;
};

// ============================================
// GRÁFICO DE TORTA
// ============================================
window.actualizarGrafico = function(contadores) {
    console.log('📊 actualizarGrafico', contadores);
    
    const canvas = document.getElementById('graficoEstados');
    if (!canvas) {
        console.error('❌ Canvas no encontrado');
        return;
    }
    
    if (!window.Chart) {
        console.error('❌ Chart.js no está cargado');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    
    // Destruir gráfico anterior
    if (window.miChart) window.miChart.destroy();
    
    // Crear nuevo gráfico
    window.miChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Pendiente', 'En curso', 'En espera', 'Completado', 'Cancelado'],
            datasets: [{
                data: [
                    contadores.PENDIENTE || 0,
                    contadores['EN CURSO'] || 0,
                    contadores['EN ESPERA'] || 0,
                    contadores.COMPLETADO || 0,
                    contadores.CANCELADO || 0
                ],
                backgroundColor: ['#ffd33d', '#0366d6', '#e36209', '#2ea44f', '#cb2431']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
};

// ============================================
// INICIALIZAR
// ============================================
(function() {
    console.log('🔥 Inicializando UI...');
    
    function init() {
        console.log('📌 DOM listo, conectando eventos...');
        
        // 1. FORMULARIO
        const form = document.getElementById('formTarea');
        if (form) {
            form.removeEventListener('submit', window.guardarTarea);
            form.addEventListener('submit', window.guardarTarea);
            console.log('✅ Evento submit conectado');
        }
        
        // 2. BOTÓN AGREGAR
        const btnAgregar = document.getElementById('btnAgregarTarea');
        if (btnAgregar) {
            btnAgregar.removeEventListener('click', window.abrirModal);
            btnAgregar.addEventListener('click', function(e) {
                e.preventDefault();
                if (!window.usuarioActual) {
                    mostrarNotificacion('Debes iniciar sesión', 'warning');
                    return;
                }
                window.abrirModal();
            });
            console.log('✅ Botón Agregar conectado');
        }
        
        // 3. BOTÓN CANCELAR
        const btnCancelar = document.querySelector('.btn-cancelar');
        if (btnCancelar) {
            btnCancelar.removeEventListener('click', window.cerrarModal);
            btnCancelar.addEventListener('click', window.cerrarModal);
            console.log('✅ Botón Cancelar conectado');
        }
        
        // 4. MODAL - CLICK FUERA
        const modal = document.getElementById('modalTarea');
        if (modal) {
            modal.removeEventListener('click', function(e) {
                if (e.target === modal) window.cerrarModal();
            });
            modal.addEventListener('click', function(e) {
                if (e.target === modal) window.cerrarModal();
            });
        }
        
        // 5. RESTAURAR VISTA GUARDADA
        const vistaGuardada = localStorage.getItem('vistaActual');
        if (vistaGuardada && (vistaGuardada === 'tabla' || vistaGuardada === 'kanban' || vistaGuardada === 'calendario')) {
            setTimeout(() => {
                const tab = document.querySelector(`.vista-tab[onclick*="${vistaGuardada}"]`);
                window.cambiarVista(vistaGuardada, { target: tab });
            }, 500);
        }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

console.log('✅ ui.js cargado completamente');