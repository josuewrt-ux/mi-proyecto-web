// ============================================
// VISTAS PERSONALIZADAS
// ============================================

// Guardar vista actual
function guardarVistaPersonalizada() {
    const nombre = prompt('Nombre para esta vista:');
    if (!nombre) return;
    
    const vista = {
        nombre: nombre,
        filtros: {
            estado: filtros.estado,
            proyecto: filtros.proyecto,
            equipo: filtros.equipo,
            asignado: filtros.asignado
        },
        busqueda: textoBusqueda,
        orden: ordenActual,
        fechaCreacion: new Date().toISOString()
    };
    
    const vistasGuardadas = JSON.parse(localStorage.getItem('vistasPersonalizadas') || '[]');
    vistasGuardadas.push(vista);
    localStorage.setItem('vistasPersonalizadas', JSON.stringify(vistasGuardadas));
    
    mostrarNotificacion('✅ Vista guardada', 'success');
    renderizarVistasGuardadas();
}

// Aplicar vista guardada
function aplicarVistaPersonalizada(vista) {
    // Aplicar filtros
    const filtroEstado = document.getElementById('filtroEstado');
    const filtroProyecto = document.getElementById('filtroProyecto');
    const filtroEquipo = document.getElementById('filtroEquipo');
    const filtroAsignado = document.getElementById('filtroAsignado');
    const buscador = document.getElementById('buscador');
    
    if (filtroEstado) filtroEstado.value = vista.filtros.estado || 'todos';
    if (filtroProyecto) filtroProyecto.value = vista.filtros.proyecto || 'todos';
    if (filtroEquipo) filtroEquipo.value = vista.filtros.equipo || 'todos';
    if (filtroAsignado) filtroAsignado.value = vista.filtros.asignado || 'todos';
    if (buscador) buscador.value = vista.busqueda || '';
    
    // Aplicar ordenamiento
    if (vista.orden && vista.orden.columna) {
        ordenActual = vista.orden;
    }
    
    aplicarFiltros();
    mostrarNotificacion(`👁️ Vista: ${vista.nombre}`, 'success');
}

// Eliminar vista guardada
function eliminarVistaPersonalizada(index) {
    const vistasGuardadas = JSON.parse(localStorage.getItem('vistasPersonalizadas') || '[]');
    vistasGuardadas.splice(index, 1);
    localStorage.setItem('vistasPersonalizadas', JSON.stringify(vistasGuardadas));
    renderizarVistasGuardadas();
    mostrarNotificacion('🗑️ Vista eliminada', 'success');
}

// Renderizar vistas guardadas en sidebar
function renderizarVistasGuardadas() {
    const container = document.getElementById('vistas-guardadas-container');
    if (!container) return;
    
    const vistasGuardadas = JSON.parse(localStorage.getItem('vistasPersonalizadas') || '[]');
    
    if (vistasGuardadas.length === 0) {
        container.innerHTML = '';
        return;
    }
    
    let html = '';
    
    vistasGuardadas.forEach((vista, index) => {
        const vistaJSON = JSON.stringify(vista).replace(/"/g, '&quot;');
        
        html += `
            <div class="vista-card" onclick="aplicarVistaPersonalizada(${vistaJSON})">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${vista.nombre}</strong>
                        <div style="font-size: 11px; color: #586069; margin-top: 4px;">
                            📅 ${new Date(vista.fechaCreacion).toLocaleDateString()}
                        </div>
                    </div>
                    <button onclick="event.stopPropagation(); eliminarVistaPersonalizada(${index})"
                            style="background: none; border: none; cursor: pointer; font-size: 16px; padding: 4px; border-radius: 4px;"
                            onmouseover="this.style.background='#ff000020'"
                            onmouseout="this.style.background='none'"
                            title="Eliminar vista">
                        🗑️
                    </button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Hacer funciones globales
window.guardarVistaPersonalizada = guardarVistaPersonalizada;
window.aplicarVistaPersonalizada = aplicarVistaPersonalizada;
window.eliminarVistaPersonalizada = eliminarVistaPersonalizada;
window.renderizarVistasGuardadas = renderizarVistasGuardadas;