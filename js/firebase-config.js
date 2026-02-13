// ============================================
// CONFIGURACIÓN DE FIREBASE - VERSIÓN COMPAT
// ============================================
const firebaseConfig = {
    apiKey: "AIzaSyBLZBwKIA39xJVpzYuuEPyXrBeNk2d0eh8",
    authDomain: "gestion-de-tareas-baa6b.firebaseapp.com",
    projectId: "gestion-de-tareas-baa6b",
    storageBucket: "gestion-de-tareas-baa6b.firebasestorage.app",
    messagingSenderId: "400509116983",
    appId: "1:400509116983:web:e979f3e4ff6cd95f38d5b2",
    measurementId: "G-4XGMDE1QW3"
};

// Inicializar Firebase solo si no está inicializado
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Instancias globales
const db = firebase.firestore();
const auth = firebase.auth();
const storage = firebase.storage();
const googleProvider = new firebase.auth.GoogleAuthProvider();

// Habilitar persistencia offline
db.enablePersistence()
    .catch(err => {
        if (err.code === 'failed-precondition') {
            console.warn('Múltiples pestañas abiertas, persistencia limitada');
        } else if (err.code === 'unimplemented') {
            console.warn('Navegador no soporta persistencia offline');
        }
    });

console.log('🔥 Firebase inicializado correctamente');