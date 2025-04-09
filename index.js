const admin = require('firebase-admin');
const TelegramBot = require('node-telegram-bot-api');

// === Configura Firebase ===
const serviceAccount = require('./firebase-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// === Configura Telegram Bot ===
const TELEGRAM_TOKEN = '7722494065:AAG_6OFaADe8YDLbYX7aIHV1G1Qegk13aZg';
const CHAT_ID = '7254169775'; // Tu chat ID real
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true }); // Habilita polling para recibir mensajes

// === Obtener el chat ID cuando alguien escriba ===
bot.on('message', (msg) => {
  console.log(`➡️  Mensaje recibido de ${msg.from.username || 'usuario'}:`);
  console.log(`🆔 Tu chat ID es: ${msg.chat.id}`);
});

// === Escucha documentos nuevos en una colección ===
const listenToCollection = () => {
  const collectionRef = db.collection('payments'); // Cambia por el nombre real de tu colección

  collectionRef.onSnapshot(snapshot => {
    snapshot.docChanges().forEach(change => {
      if (change.type === 'added') {
        const data = change.doc.data();
        const message = formatPrettyMessage(data);
        bot.sendMessage(CHAT_ID, message, { parse_mode: 'Markdown' });
      }
    });
  }, err => {
    console.error('Error escuchando la colección:', err);
  });
};

// === Formatea el mensaje de manera bonita ===
const formatPrettyMessage = (data) => {
    let message = `🧾 *Nuevo pago registrado:*\n\n`;
    for (const key in data) {
      let value = data[key];
  
      // Si el valor es un Timestamp de Firestore, formatearlo
      if (value instanceof admin.firestore.Timestamp) {
        value = value.toDate().toLocaleString('es-AR', {
          dateStyle: 'long',
          timeStyle: 'medium',
          timeZone: 'America/Argentina/Buenos_Aires'
        });
      }
  
      message += `• *${key}*: \`${value}\`\n`;
    }
    return message;
  };
  

listenToCollection();

console.log('🤖 Bot de Telegram escuchando Firestore y esperando mensajes para mostrar chat ID...');
