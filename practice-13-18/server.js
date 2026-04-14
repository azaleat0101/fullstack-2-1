const express = require('express');
const https = require('https');
const fs = require('fs');
const socketIo = require('socket.io');
const webpush = require('web-push');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const vapidKeys = {
  publicKey: 'public',
  privateKey: 'private'
};

webpush.setVapidDetails(
  'mailto:my-email@example.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, './')));

const reminders = new Map();
let subscriptions = [];

const httpsOptions = {
  key: fs.readFileSync(path.join(__dirname, 'localhost+2-key.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'localhost+2.pem')),
};

const server = https.createServer(httpsOptions, app);

const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

async function sendPushToAll(payload) {
  const invalidEndpoints = [];

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(sub, payload);
      } catch (err) {
        console.error('Push error:', err.statusCode || err);

        if (err.statusCode === 404 || err.statusCode === 410) {
          invalidEndpoints.push(sub.endpoint);
        }
      }
    })
  );

  if (invalidEndpoints.length) {
    subscriptions = subscriptions.filter(
      (sub) => !invalidEndpoints.includes(sub.endpoint)
    );
  }
}

io.on('connection', (socket) => {
  socket.on('newReminder', ({ id, text, reminderTime }) => {
    console.log('Получено напоминание:', { id, text, reminderTime });

    const delay = reminderTime - Date.now();
    console.log('Задержка (мс):', delay, '| Подписок:', subscriptions.length);

    if (delay <= 0) return;

    const timeoutId = setTimeout(() => {
        console.log('Таймер сработал! Отправляю push для:', text, '| Подписок:', subscriptions.length);

        const payload = JSON.stringify({
        title: '!!! Напоминание',
        body: text,
        reminderId: id
        });

        subscriptions.forEach(sub => {
        webpush.sendNotification(sub, payload).catch(err =>
            console.error('Push error:', err)
        );
        });

        reminders.delete(id);
    }, delay);

    reminders.set(id, { timeoutId, text, reminderTime });
    });


  socket.on('disconnect', () => {
    console.log('Клиент отключён:', socket.id);
  });
});

app.post('/subscribe', (req, res) => {
  const exists = subscriptions.some(
    (sub) => sub.endpoint === req.body.endpoint
  );

  if (!exists) {
    subscriptions.push(req.body);
  }

  res.status(201).json({ message: 'Подписка сохранена' });
});

app.post('/unsubscribe', (req, res) => {
  const { endpoint } = req.body;
  subscriptions = subscriptions.filter((sub) => sub.endpoint !== endpoint);
  res.status(200).json({ message: 'Подписка удалена' });
});

app.post('/snooze', (req, res) => {
  const reminderId = parseInt(req.query.reminderId, 10);

  if (!reminderId || !reminders.has(reminderId)) {
    return res.status(404).json({ message: 'Напоминание не найдено' });
  }

  const reminder = reminders.get(reminderId);
  clearTimeout(reminder.timeoutId);

  const newDelay = 10 * 1000;

  const newTimeoutId = setTimeout(async () => {
    const payload = JSON.stringify({
      title: 'Напоминание отложено',
      body: reminder.text,
      reminderId: reminderId
    });

    await sendPushToAll(payload);
    reminders.delete(reminderId);
  }, newDelay);

  reminders.set(reminderId, {
    timeoutId: newTimeoutId,
    text: reminder.text,
    reminderTime: Date.now() + newDelay
  });

  res.status(200).json({ message: 'Напоминание отложено' });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Сервер запущен на https://localhost:${PORT}`);
});
