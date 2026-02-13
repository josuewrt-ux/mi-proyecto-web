// ============================================
// QR - COMPARTIR TAREAS
// ============================================

function generarQRTarea() {
    const container = document.getElementById('qr-container-modal');
    if (!container) return;
    
    if (!tareaEditando) {
        mostrarNotificacion('Guarda la tarea primero', 'warning');
        return;
    }
    
    // Limpiar contenedor
    container.innerHTML = '';
    
    // Crear URL para compartir
    const baseUrl = window.location.origin + window.location.pathname;
    const tareaUrl = `${baseUrl}?tarea=${tareaEditando.id}`;
    
    // Crear QR
    try {
        new QRCode(container, {
            text: tareaUrl,
            width: 200,
            height: 200,
            colorDark: "#0366d6",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
        
        mostrarNotificacion('✅ QR generado', 'success');
    } catch (error) {
        console.error('Error al generar QR:', error);
        container.innerHTML = '<p style="color: #cb2431;">❌ Error al generar QR</p>';
    }
}

// Hacer global
window.generarQRTarea = generarQRTarea;