// ============================================
// VISTA CALENDARIO
// ============================================
let calendario = null;

// ============================================
// INICIALIZAR CALENDARIO
// ============================================
function initCalendario() {
    const calendarEl = document.getElementById('calendario');
    if (!calendarEl) return;
    
    // Verificar que FullCalendar está disponible
    if (typeof FullCalendar === 'undefined') {
        console.error('❌ FullCalendar no está cargado');
        return;
    }
    
    // Verificar que hay tareas
    if (!window.todasLasTareas || window.todasLasTareas.length === 0) {
        console.log('⏳ No hay tareas para mostrar en calendario');
        calendarEl.innerHTML = '<div style="text-align: center; padding: 40px;">📅 No hay tareas con fechas límite</div>';
        return;
    }
    
    calendario = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'es',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        buttonText: {
            today: 'Hoy',
            month: 'Mes',
            week: 'Semana',
            day: 'Día'
        },
        events: obtenerEventosCalendario(),
        eventClick: function(info) {
            // Abrir tarea al hacer click
            if (typeof editarTarea === 'function') {
                editarTarea(info.event.id);
            }
        },
        eventDrop: function(info) {
            // Arrastrar para cambiar fecha
            const tareaId = info.event.id;
            const nuevaFecha = info.event.startStr;
            
            db.collection('tareas').doc(tareaId).update({
                fechaLimite: nuevaFecha,
                ultimaModificacion: new Date().toISOString()
            }).then(() => {
                mostrarNotificacion('📅 Fecha actualizada', 'success');
            }).catch(error => {
                console.error('Error:', error);
                mostrarNotificacion('❌ Error al actualizar fecha', 'error');
                info.revert();
            });
        },
        dateClick: function(info) {
            // Click en día vacío para crear tarea
            if (window.usuarioActual && typeof abrirModal === 'function') {
                abrirModal(null, info.dateStr);
            } else if (!window.usuarioActual) {
                mostrarNotificacion('Debes iniciar sesión', 'warning');
            }
        },
        loading: function(isLoading) {
            if (!isLoading) {
                console.log('✅ Calendario cargado');
            }
        }
    });
    
    calendario.render();
}

// ============================================
// OBTENER EVENTOS PARA CALENDARIO
// ============================================
function obtenerEventosCalendario() {
    // Usar todas las tareas globales
    return (window.todasLasTareas || [])
        .filter(t => t.fechaLimite) // Solo tareas con fecha
        .map(t => ({
            id: t.id,
            title: t.nombre || 'Sin nombre',
            start: t.fechaLimite,
            backgroundColor: getColorByEstado(t.estado),
            borderColor: getColorByEstado(t.estado),
            textColor: '#ffffff',
            extendedProps: {
                estado: t.estado,
                avance: t.avance,
                equipo: t.equipo,
                asignado: t.asignado
            }
        }));
}

// ============================================
// COLOR SEGÚN ESTADO
// ============================================
function getColorByEstado(estado) {
    const colores = {
        'PENDIENTE': '#ffd33d',
        'EN CURSO': '#0366d6',
        'EN ESPERA': '#e36209',
        'COMPLETADO': '#2ea44f',
        'CANCELADO': '#cb2431'
    };
    return colores[estado] || '#6f42c1';
}

// ============================================
// ACTUALIZAR CALENDARIO
// ============================================
function actualizarCalendario() {
    if (calendario) {
        calendario.removeAllEvents();
        calendario.addEventSource(obtenerEventosCalendario());
    }
}

// Hacer funciones globales
window.initCalendario = initCalendario;
window.actualizarCalendario = actualizarCalendario;