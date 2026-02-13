// ============================================
// VARIABLES GLOBALES
// ============================================
window.usuarioActual = null;
window.tareaEditando = null;
window.vistaActual = localStorage.getItem('vistaActual') || 'tabla';
window.filtros = {
    estado: 'todos',
    proyecto: 'todos',
    equipo: 'todos',
    asignado: 'todos'
};
window.todasLasTareas = [];
window.tareasFiltradasActuales = [];
window.miChart = null;
window.cacheUsuarios = [];
window.textoBusqueda = '';
window.ordenActual = { columna: null, direccion: 'asc' };

// ============================================
// NOTIFICACIONES TOAST
// ============================================
function mostrarNotificacion(mensaje, tipo = 'success', duracion = 3000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    toast.setAttribute('role', 'alert');
    
    let icono = '✅';
    if (tipo === 'error') icono = '❌';
    if (tipo === 'warning') icono = '⚠️';
    if (tipo === 'info') icono = 'ℹ️';
    
    toast.innerHTML = `${icono} ${mensaje}`;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, duracion);
}

// ============================================
// MODO OSCURO
// ============================================
function initDarkMode() {
    const darkModePreferido = localStorage.getItem('darkMode') === 'true';
    if (darkModePreferido) {
        document.body.classList.add('dark-mode');
        const btn = document.getElementById('btnDarkMode');
        if (btn) btn.textContent = '☀️';
    }
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDark);
    const btn = document.getElementById('btnDarkMode');
    if (btn) btn.textContent = isDark ? '☀️' : '🌙';
    
    // Actualizar gráfico si existe
    if (window.miChart) {
        window.miChart.destroy();
        window.miChart = null;
        if (typeof actualizarGrafico === 'function' && window.todasLasTareas) {
            // Recalcular contadores
            const contadores = {
                COMPLETADO: 0, 'EN ESPERA': 0, CANCELADO: 0, 'EN CURSO': 0, PENDIENTE: 0
            };
            window.todasLasTareas.forEach(t => {
                if (contadores[t.estado] !== undefined) contadores[t.estado]++;
            });
            actualizarGrafico(contadores);
        }
    }
}

// ============================================
// UTILIDADES
// ============================================
function corregirURLStorage(url) {
    if (url && typeof url === 'string') {
        return url.replace('.appspot.com', '.firebasestorage.app');
    }
    return url;
}

function generarId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ============================================
// CONFIRMACIÓN CON UNDO
// ============================================
function mostrarConfirmacionConUndo(mensaje, callback) {
    if (confirm(mensaje)) {
        callback();
    }
}

// ============================================
// EXPORTAR A PDF
// ============================================
function exportarAPDF() {
    if (!window.todasLasTareas || window.todasLasTareas.length === 0) {
        mostrarNotificacion('No hay tareas para exportar', 'warning');
        return;
    }
    
    try {
        if (!window.jspdf) {
            mostrarNotificacion('❌ Librería PDF no cargada', 'error');
            return;
        }
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Título
        doc.setFontSize(20);
        doc.text('Reporte de Tareas', 20, 20);
        
        // Fecha
        doc.setFontSize(12);
        doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, 20, 30);
        
        // Tabla
        const headers = [['Nombre', 'Estado', 'Avance', 'Asignado', 'Fecha Límite', 'Proyecto']];
        const data = window.todasLasTareas.map(t => [
            t.nombre || '',
            t.estado || '',
            `${t.avance || 0}%`,
            t.asignado ? t.asignado.split('@')[0] : 'No asignado',
            t.fechaLimite ? new Date(t.fechaLimite).toLocaleDateString('es-ES') : '',
            t.proyecto || ''
        ]);
        
        if (doc.autoTable) {
            doc.autoTable({
                head: headers,
                body: data,
                startY: 40,
                styles: { fontSize: 10 },
                headStyles: { fillColor: [3, 102, 214] }
            });
        }
        
        // Descargar
        const fecha = new Date().toISOString().split('T')[0];
        doc.save(`tareas_${fecha}.pdf`);
        
        mostrarNotificacion('📄 PDF generado', 'success');
    } catch (error) {
        console.error('Error al generar PDF:', error);
        mostrarNotificacion('❌ Error al generar PDF', 'error');
    }
}

// ============================================
// EXPORTAR A CSV
// ============================================
function exportarACSV() {
    if (!window.todasLasTareas || window.todasLasTareas.length === 0) {
        mostrarNotificacion('No hay tareas para exportar', 'warning');
        return;
    }
    
    try {
        // Crear contenido CSV
        let csv = 'Nombre,Estado,Avance,Equipo,Asignado,Fecha Límite,Etapa,Proyecto\n';
        
        window.todasLasTareas.forEach(t => {
            csv += `"${(t.nombre || '').replace(/"/g, '""')}",`;
            csv += `"${t.estado || ''}",`;
            csv += `${t.avance || 0},`;
            csv += `"${(t.equipo || '').replace(/"/g, '""')}",`;
            csv += `"${t.asignado || ''}",`;
            csv += `"${t.fechaLimite || ''}",`;
            csv += `"${t.etapa || ''}",`;
            csv += `"${t.proyecto || ''}"\n`;
        });
        
        // Descargar
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' }); // \ufeff para UTF-8 con BOM
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.setAttribute('download', `tareas_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        mostrarNotificacion('📥 CSV exportado', 'success');
    } catch (error) {
        console.error('Error al exportar CSV:', error);
        mostrarNotificacion('❌ Error al exportar CSV', 'error');
    }
}

// Hacer funciones globales
window.mostrarNotificacion = mostrarNotificacion;
window.initDarkMode = initDarkMode;
window.toggleDarkMode = toggleDarkMode;
window.corregirURLStorage = corregirURLStorage;
window.generarId = generarId;
window.mostrarConfirmacionConUndo = mostrarConfirmacionConUndo;
window.exportarAPDF = exportarAPDF;
window.exportarACSV = exportarACSV;

// Inicializar modo oscuro
document.addEventListener('DOMContentLoaded', function() {
    initDarkMode();
    
    // Conectar botón de modo oscuro
    const btnDarkMode = document.getElementById('btnDarkMode');
    if (btnDarkMode) {
        btnDarkMode.addEventListener('click', toggleDarkMode);
    }
});