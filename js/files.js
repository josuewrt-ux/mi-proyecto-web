// ============================================
// DROPZONE - HANDLERS
// ============================================

// Drag Over
function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
}

// Drag Enter
function handleDragEnter(e) {
    e.preventDefault();
    e.stopPropagation();
    const dropzone = document.getElementById('dropZone');
    if (dropzone) dropzone.classList.add('dragover');
}

// Drag Leave
function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    const dropzone = document.getElementById('dropZone');
    if (dropzone) dropzone.classList.remove('dragover');
}

// Drop
function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const dropzone = document.getElementById('dropZone');
    if (dropzone) dropzone.classList.remove('dragover');
    
    if (!tareaEditando) {
        mostrarNotificacion('Guarda la tarea primero', 'warning');
        return;
    }
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        // Simular click en input file y asignar archivos
        const fileInput = document.getElementById('archivoAdjunto');
        if (fileInput) {
            // Asignar archivos al input (solo el primero por ahora)
            fileInput.files = files;
            // Llamar a subir archivo
            subirArchivo({ target: document.querySelector('.btn-subir') });
        }
    }
}

// ============================================
// SUBIR ARCHIVO CON PROGRESO
// ============================================
function subirArchivo(event) {
    const fileInput = document.getElementById('archivoAdjunto');
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        mostrarNotificacion('Selecciona un archivo', 'warning');
        return;
    }
    
    const file = fileInput.files[0];
    
    if (!tareaEditando) {
        mostrarNotificacion('Guarda la tarea primero', 'warning');
        return;
    }
    
    const btn = event.target;
    const textoOriginal = btn.textContent || btn.innerText;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Subiendo...';
    
    const progressDiv = document.getElementById('progresoSubida');
    const progressBar = document.getElementById('barraProgreso');
    const progressText = document.getElementById('textoProgreso');
    
    if (progressDiv) progressDiv.style.display = 'block';
    if (progressBar) progressBar.style.width = '0%';
    if (progressText) progressText.textContent = '0%';
    
    // Verificar tamaño máximo (50MB)
    if (file.size > 50 * 1024 * 1024) {
        mostrarNotificacion('❌ Archivo muy grande (máx 50MB)', 'error');
        btn.disabled = false;
        btn.innerHTML = textoOriginal;
        if (progressDiv) progressDiv.style.display = 'none';
        return;
    }
    
    const storageRef = storage.ref(`tareas/${tareaEditando.id}/${file.name}`);
    const uploadTask = storageRef.put(file);
    
    uploadTask.on('state_changed',
        (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            if (progressBar) progressBar.style.width = progress + '%';
            if (progressText) progressText.textContent = Math.round(progress) + '%';
        },
        (error) => {
            console.error('Error al subir:', error);
            mostrarNotificacion('❌ Error al subir archivo: ' + (error.message || 'Error desconocido'), 'error');
            btn.disabled = false;
            btn.innerHTML = textoOriginal;
            if (progressDiv) progressDiv.style.display = 'none';
        },
        () => {
            uploadTask.snapshot.ref.getDownloadURL().then(url => {
                const archivo = {
                    nombre: file.name,
                    url: url,
                    subidoPor: usuarioActual ? usuarioActual.email : 'desconocido',
                    fecha: new Date().toISOString(),
                    tamaño: file.size,
                    tipo: file.type
                };
                
                return db.collection('tareas').doc(tareaEditando.id).update({
                    archivos: firebase.firestore.FieldValue.arrayUnion(archivo)
                });
            }).then(() => {
                mostrarNotificacion('✅ Archivo subido', 'success');
                return db.collection('tareas').doc(tareaEditando.id).get();
            }).then(doc => {
                if (doc.exists) {
                    const tarea = doc.data();
                    tarea.id = doc.id;
                    mostrarArchivosModal(tarea.archivos || []);
                    
                    // Actualizar tareaEditando
                    tareaEditando = { ...tareaEditando, archivos: tarea.archivos };
                    window.tareaEditando = tareaEditando;
                }
                fileInput.value = '';
                btn.disabled = false;
                btn.innerHTML = textoOriginal;
                if (progressDiv) progressDiv.style.display = 'none';
            }).catch(error => {
                console.error('Error:', error);
                mostrarNotificacion('❌ Error: ' + (error.message || 'Error desconocido'), 'error');
                btn.disabled = false;
                btn.innerHTML = textoOriginal;
                if (progressDiv) progressDiv.style.display = 'none';
            });
        }
    );
}

// ============================================
// MOSTRAR ARCHIVOS EN MODAL
// ============================================
function mostrarArchivosModal(archivos) {
    const container = document.getElementById('lista-archivos-modal');
    if (!container) return;
    
    let html = '';
    
    if (archivos && archivos.length > 0) {
        html += `<div style="display: flex; justify-content: flex-end; margin-bottom: 12px;">
            <button onclick="eliminarTodosArchivos('${tareaEditando?.id}')" 
                    class="btn-eliminar-todos">
                🗑️ Eliminar todos (${archivos.length})
            </button>
        </div>`;
        
        archivos.forEach((archivo) => {
            const archivoJSON = JSON.stringify(archivo).replace(/"/g, '&quot;');
            const fecha = archivo.fecha ? new Date(archivo.fecha).toLocaleDateString() : '';
            const usuario = archivo.subidoPor ? archivo.subidoPor.split('@')[0] : '';
            
            html += `<div class="archivo">
                <div class="archivo-info">
                    <span>📎</span>
                    <a href="${corregirURLStorage(archivo.url)}" target="_blank" rel="noopener noreferrer">${archivo.nombre}</a>
                    <small>
                        ${fecha}
                        ${usuario ? `· ${usuario}` : ''}
                        ${archivo.tamaño ? `· ${formatearTamaño(archivo.tamaño)}` : ''}
                    </small>
                </div>
                <button onclick="eliminarArchivo('${tareaEditando?.id}', ${archivoJSON})" 
                        class="btn-eliminar-archivo"
                        title="Eliminar archivo">
                    🗑️
                </button>
            </div>`;
        });
    } else {
        html = '<div class="no-archivos">📭 No hay archivos adjuntos</div>';
    }
    
    container.innerHTML = html;
}

// ============================================
// FORMATEAR TAMAÑO DE ARCHIVO
// ============================================
function formatearTamaño(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ============================================
// ELIMINAR ARCHIVO
// ============================================
function eliminarArchivo(tareaId, archivo) {
    if (!tareaId || !archivo) return;
    
    if (!confirm(`¿Eliminar el archivo "${archivo.nombre}"?`)) return;
    
    // Intentar eliminar de Storage
    try {
        const storageRef = storage.refFromURL(archivo.url);
        storageRef.delete().catch(e => {
            console.warn('No se pudo eliminar de Storage:', e);
        });
    } catch (e) {
        console.warn('URL inválida:', e);
    }
    
    // Eliminar de Firestore
    const tareaRef = db.collection('tareas').doc(tareaId);
    tareaRef.update({
        archivos: firebase.firestore.FieldValue.arrayRemove(archivo)
    }).then(() => {
        mostrarNotificacion('✅ Archivo eliminado', 'success');
        return tareaRef.get();
    }).then(doc => {
        if (doc.exists) {
            const tarea = { id: doc.id, ...doc.data() };
            mostrarArchivosModal(tarea.archivos || []);
            
            // Actualizar tareaEditando
            if (tareaEditando && tareaEditando.id === tareaId) {
                tareaEditando.archivos = tarea.archivos;
                window.tareaEditando = tareaEditando;
            }
        }
    }).catch(error => {
        console.error('Error:', error);
        mostrarNotificacion('❌ Error al eliminar archivo', 'error');
    });
}

// ============================================
// ELIMINAR TODOS LOS ARCHIVOS
// ============================================
function eliminarTodosArchivos(tareaId) {
    if (!tareaId) return;
    
    db.collection('tareas').doc(tareaId).get().then(doc => {
        if (!doc.exists) return;
        
        const tarea = doc.data();
        const archivos = tarea.archivos || [];
        
        if (archivos.length === 0) {
            mostrarNotificacion('No hay archivos para eliminar', 'info');
            return;
        }
        
        if (!confirm(`¿Eliminar TODOS los ${archivos.length} archivo(s) adjuntos?`)) return;
        
        // Intentar eliminar de Storage
        archivos.forEach(archivo => {
            try {
                const storageRef = storage.refFromURL(archivo.url);
                storageRef.delete().catch(e => console.warn(`No se pudo eliminar ${archivo.nombre}:`, e));
            } catch (e) {
                console.warn(`URL inválida para ${archivo.nombre}:`, e);
            }
        });
        
        // Eliminar de Firestore
        db.collection('tareas').doc(tareaId).update({
            archivos: []
        }).then(() => {
            mostrarNotificacion(`✅ Se eliminaron ${archivos.length} archivo(s)`, 'success');
            mostrarArchivosModal([]);
            
            // Actualizar tareaEditando
            if (tareaEditando && tareaEditando.id === tareaId) {
                tareaEditando.archivos = [];
                window.tareaEditando = tareaEditando;
            }
        }).catch(error => {
            console.error('Error:', error);
            mostrarNotificacion('❌ Error al eliminar archivos', 'error');
        });
    });
}

// Hacer funciones globales
window.subirArchivo = subirArchivo;
window.eliminarArchivo = eliminarArchivo;
window.eliminarTodosArchivos = eliminarTodosArchivos;
window.mostrarArchivosModal = mostrarArchivosModal;
window.handleDragOver = handleDragOver;
window.handleDragEnter = handleDragEnter;
window.handleDragLeave = handleDragLeave;
window.handleDrop = handleDrop;