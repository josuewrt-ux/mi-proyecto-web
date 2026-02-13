// ============================================
// FILTROS Y ORDENAMIENTO
// ============================================

// ============================================
// APLICAR FILTROS
// ============================================
window.aplicarFiltros = function() {
    const filtroEstado = document.getElementById('filtroEstado');
    const filtroProyecto = document.getElementById('filtroProyecto');
    const filtroEquipo = document.getElementById('filtroEquipo');
    const filtroAsignado = document.getElementById('filtroAsignado');
    const buscador = document.getElementById('buscador');
    
    if (filtroEstado) window.filtros.estado = filtroEstado.value;
    if (filtroProyecto) window.filtros.proyecto = filtroProyecto.value;
    if (filtroEquipo) window.filtros.equipo = filtroEquipo.value;
    if (filtroAsignado) window.filtros.asignado = filtroAsignado.value;
    if (buscador) window.textoBusqueda = buscador.value.toLowerCase();
    
    let tareasFiltradas = (window.todasLasTareas || []).filter(tarea => {
        // Filtro por estado
        if (window.filtros.estado !== 'todos' && tarea.estado !== window.filtros.estado) return false;
        
        // Filtro por proyecto
        if (window.filtros.proyecto !== 'todos' && tarea.proyecto !== window.filtros.proyecto) return false;
        
        // Filtro por equipo
        if (window.filtros.equipo !== 'todos' && tarea.equipo !== window.filtros.equipo) return false;
        
        // Filtro por asignado a mí
        if (window.filtros.asignado === 'yo' && tarea.asignado !== window.usuarioActual?.email) return false;
        
        // Búsqueda por texto
        if (window.textoBusqueda) {
            return (tarea.nombre?.toLowerCase().includes(window.textoBusqueda) ||
                   tarea.equipo?.toLowerCase().includes(window.textoBusqueda) ||
                   tarea.asignado?.toLowerCase().includes(window.textoBusqueda) ||
                   (tarea.tags || []).some(tag => tag.toLowerCase().includes(window.textoBusqueda)));
        }
        return true;
    });
    
    window.tareasFiltradasActuales = tareasFiltradas;
    
    // Aplicar ordenamiento actual si existe
    if (window.ordenActual && window.ordenActual.columna) {
        tareasFiltradas = ordenarTareasArray(tareasFiltradas, window.ordenActual.columna, window.ordenActual.direccion);
    }
    
    if (typeof renderizarTabla === 'function') renderizarTabla(tareasFiltradas);
    if (typeof renderizarKanban === 'function' && window.vistaActual === 'kanban') renderizarKanban(tareasFiltradas);
};

// ============================================
// ORDENAR TABLA (función pública)
// ============================================
window.ordenarTabla = function(columna) {
    if (!window.tareasFiltradasActuales) return;
    
    // Cambiar dirección
    if (window.ordenActual.columna === columna) {
        window.ordenActual.direccion = window.ordenActual.direccion === 'asc' ? 'desc' : 'asc';
    } else {
        window.ordenActual.columna = columna;
        window.ordenActual.direccion = 'asc';
    }
    
    const tareasOrdenadas = ordenarTareasArray([...window.tareasFiltradasActuales], columna, window.ordenActual.direccion);
    
    if (typeof renderizarTabla === 'function') {
        renderizarTabla(tareasOrdenadas);
    }
};

// ============================================
// ORDENAR ARRAY DE TAREAS (función interna)
// ============================================
function ordenarTareasArray(tareas, columna, direccion) {
    return [...tareas].sort((a, b) => {
        let valA = a[columna];
        let valB = b[columna];
        
        if (columna === 'fechaLimite') {
            valA = valA ? new Date(valA) : new Date(0);
            valB = valB ? new Date(valB) : new Date(0);
        } else if (columna === 'avance') {
            valA = Number(valA) || 0;
            valB = Number(valB) || 0;
        } else {
            valA = String(valA || '').toLowerCase();
            valB = String(valB || '').toLowerCase();
        }
        
        if (valA < valB) return direccion === 'asc' ? -1 : 1;
        if (valA > valB) return direccion === 'asc' ? 1 : -1;
        return 0;
    });
}

// ============================================
// BUSCAR TAREAS
// ============================================
window.buscarTareas = function() {
    aplicarFiltros();
};

// ============================================
// FILTROS RÁPIDOS
// ============================================
window.filtrarPorEstado = function(estado) {
    const filtro = document.getElementById('filtroEstado');
    if (filtro) filtro.value = estado;
    aplicarFiltros();
    mostrarNotificacion(`Filtrado: ${estado}`, 'info');
};

window.filtrarPorProyecto = function(proyecto) {
    const filtro = document.getElementById('filtroProyecto');
    if (filtro) filtro.value = proyecto;
    aplicarFiltros();
    mostrarNotificacion(`Proyecto: ${proyecto}`, 'info');
};

window.filtrarPorUsuario = function(email) {
    const filtro = document.getElementById('filtroAsignado');
    if (filtro) {
        if (email === window.usuarioActual?.email) {
            filtro.value = 'yo';
        } else {
            // No hay opción directa para otros usuarios, agregar opción temporal
            const option = document.createElement('option');
            option.value = email;
            option.textContent = email;
            filtro.appendChild(option);
            filtro.value = email;
        }
    }
    aplicarFiltros();
    mostrarNotificacion(`Usuario: ${email.split('@')[0]}`, 'info');
};

// ============================================
// ACTUALIZAR CONTADORES
// ============================================
window.actualizarContadores = function(contadores, contadoresProyectos, vencenHoy, totalTareas) {
    // Contadores de estado
    setTextContent('count-completado', contadores.COMPLETADO);
    setTextContent('count-espera', contadores['EN ESPERA']);
    setTextContent('count-cancelado', contadores.CANCELADO);
    setTextContent('count-curso', contadores['EN CURSO']);
    setTextContent('count-pendiente', contadores.PENDIENTE);
    
    // Contadores de proyectos
    setTextContent('count-osinergmin', contadoresProyectos.Osinergmin);
    setTextContent('count-chinalco', contadoresProyectos.Chinalco);
    setTextContent('count-contugas', contadoresProyectos.Contugas);
    
    // Mis tareas
    if (window.usuarioActual) {
        let misTareas = (window.todasLasTareas || []).filter(t => t.asignado === window.usuarioActual.email).length;
        setTextContent('count-mis-tareas', misTareas);
    }
    
    // Actualizar contadores de usuarios
    (window.cacheUsuarios || []).forEach(user => {
        if (user.email) {
            const count = (window.todasLasTareas || []).filter(t => t.asignado === user.email).length;
            const elementId = `count-user-${user.email.replace(/[.@]/g, '-')}`;
            setTextContent(elementId, count);
        }
    });
};

function setTextContent(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value || 0;
}

// Inicializar filtros
window.filtros = window.filtros || { estado: 'todos', proyecto: 'todos', equipo: 'todos', asignado: 'todos' };
window.textoBusqueda = '';
window.ordenActual = window.ordenActual || { columna: null, direccion: 'asc' };