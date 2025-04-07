const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // Ruta a tu archivo de credenciales

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const storage = admin.storage().bucket(); 

module.exports = { db, storage };
