require('dotenv').config();
const admin = require('firebase-admin');
const TelegramBot = require('node-telegram-bot-api');
const path = require('path');

// === Carga y parsea la clave de Firebase desde el archivo JSON ===
const serviceAccountPath = path.resolve(__dirname, process.env.FIREBASE_KEY);
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

// === Configura Telegram Bot ===
const TELEGRAM_TOKEN = '7722494065:AAG_6OFaADe8YDLbYX7aIHV1G1Qegk13aZg';
const TELEGRAM_CHAT_ID = '7254169775';
const telegramBot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

// === Formatea el mensaje bonito ===
const formatPrettyMessage = (data) => {
  let message = '🧾 *Nuevo pago registrado:*\n\n';
  for (const key in data) {
    let value = data[key];
    if (value instanceof admin.firestore.Timestamp) {
      value = value.toDate().toLocaleString('es-AR', {
        dateStyle: 'long',
        timeStyle: 'medium',
        timeZone: 'America/Argentina/Buenos_Aires',
      });
    }
    message += `• *${key}*: ${value}\n`;
  }
  return message;
};

// === Escuchar colección de Firestore ===
const listenToCollection = () => {
  const collectionRef = db.collection('payments');

  collectionRef.onSnapshot(
    (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          const message = formatPrettyMessage(data);

          // Enviar a Telegram
          telegramBot
            .sendMessage(TELEGRAM_CHAT_ID, message, { parse_mode: 'Markdown' })
            .then(() => console.log('📩 Enviado a Telegram'))
            .catch((err) => console.error('❌ Error Telegram:', err));
        }
      });
    },
    (err) => {
      console.error('❌ Error escuchando Firestore:', err);
    }
  );
};

listenToCollection();

// === Opcional: ver tu chat ID de Telegram si alguien escribe ===
telegramBot.on('message', (msg) => {
  console.log(`🆔 Chat ID: ${msg.chat.id}`);
});
