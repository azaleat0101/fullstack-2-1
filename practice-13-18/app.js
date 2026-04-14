const contentDiv = document.getElementById('app-content');
const homeBtn = document.getElementById('home-btn');
const aboutBtn = document.getElementById('about-btn');
const socket = io('https://localhost:3001');

function setActiveButton(activeId) {
  [homeBtn, aboutBtn].forEach(btn => btn.classList.remove('active'));
  document.getElementById(activeId).classList.add('active');
}

async function loadContent(page) {
  try {
    const response = await fetch(`/content/${page}.html`);
    const html = await response.text();
    contentDiv.innerHTML = html;

    if (page === 'home') {
      initNotes();
    }
  } catch (err) {
    contentDiv.innerHTML = `<p style="color:red;">Ошибка загрузки страницы.</p>`;
    console.error(err);
  }
}

homeBtn.addEventListener('click', (e) => {
  e.preventDefault();
  setActiveButton('home-btn');
  loadContent('home');
});

aboutBtn.addEventListener('click', (e) => {
  e.preventDefault();
  setActiveButton('about-btn');
  loadContent('about');
});

loadContent('home');

function initNotes() {
  const form = document.getElementById('note-form');
  const input = document.getElementById('note-input');
  const hasReminder = document.getElementById('has-reminder');
  const reminderFields = document.getElementById('reminder-fields');
  const reminderTime = document.getElementById('reminder-time');
  const list = document.getElementById('notes-list');

  if (!form || !input || !hasReminder || !reminderFields || !reminderTime || !list) {
    return;
  }

  hasReminder.addEventListener('change', () => {
    reminderFields.style.display = hasReminder.checked ? 'block' : 'none';

    if (!hasReminder.checked) {
      reminderTime.value = '';
    }
  });

  function loadNotes() {
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');

    list.innerHTML = notes.map(note => {
      let reminderInfo = '';

      if (note.reminder) {
        const date = new Date(note.reminder);
        reminderInfo = `<small class="note-reminder">Напоминание: ${date.toLocaleString()}</small>`;
      }

      return `
        <li>
          <div>${note.text}</div>
          ${reminderInfo}
        </li>
      `;
    }).join('');
  }

  function addNote(text, reminderTimestamp = null) {
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');

    const newNote = {
      id: Date.now(),
      text,
      reminder: reminderTimestamp
    };

    notes.push(newNote);
    localStorage.setItem('notes', JSON.stringify(notes));
    loadNotes();

    if (reminderTimestamp) {
      socket.emit('newReminder', {
        id: newNote.id,
        text: text,
        reminderTime: reminderTimestamp
      });
    } else {
      socket.emit('newNote', {
        text,
        timestamp: Date.now()
      });
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const text = input.value.trim();

    if (!text) return;

    let reminderTimestamp = null;

    if (hasReminder.checked) {
      if (!reminderTime.value) {
        alert('Выберите дату и время напоминания');
        return;
      }

      reminderTimestamp = new Date(reminderTime.value).getTime();

      if (reminderTimestamp <= Date.now()) {
        alert('Дата напоминания должна быть в будущем');
        return;
      }
    }

    addNote(text, reminderTimestamp);

    input.value = '';
    hasReminder.checked = false;
    reminderTime.value = '';
    reminderFields.style.display = 'none';
  });

  loadNotes();
}

function showToast(message) {
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: #8b8b8b;
    color: white;
    padding: 1rem;
    border-radius: 8px;
    z-index: 1000;
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}

socket.on('noteAdded', (note) => {
  showToast(`Новая заметка: ${note.text}`);
});

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

async function syncPushButtons(registration) {
  const enableBtn = document.getElementById('enable-push');
  const disableBtn = document.getElementById('disable-push');

  if (!enableBtn || !disableBtn) return;

  const subscription = await registration.pushManager.getSubscription();

  if (subscription) {
    enableBtn.style.display = 'none';
    disableBtn.style.display = 'inline-block';
  } else {
    enableBtn.style.display = 'inline-block';
    disableBtn.style.display = 'none';
  }
}

async function subscribeToPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const existingSubscription = await registration.pushManager.getSubscription();

    if (existingSubscription) {
      await syncPushButtons(registration);
      return true;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array('public')
    });

    await fetch('https://localhost:3001/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription)
    });

    await syncPushButtons(registration);
    return true;
  } catch (err) {
    console.error('Ошибка подписки на push:', err);
    return false;
  }
}

async function unsubscribeFromPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      await syncPushButtons(registration);
      return true;
    }

    await fetch('https://localhost:3001/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: subscription.endpoint })
    });

    await subscription.unsubscribe();
    await syncPushButtons(registration);
    return true;
  } catch (err) {
    console.error('Ошибка отписки от push:', err);
    return false;
  }
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      await syncPushButtons(reg);

      const enableBtn = document.getElementById('enable-push');
      const disableBtn = document.getElementById('disable-push');

      if (enableBtn && disableBtn) {
        enableBtn.addEventListener('click', async () => {
          if (Notification.permission === 'denied') {
            alert('Уведомления запрещены. Разрешите их в настройках браузера.');
            return;
          }

          if (Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
              alert('Необходимо разрешить уведомления.');
              return;
            }
          }

          const ok = await subscribeToPush();
          if (ok) {
            showToast('Push-уведомления включены');
          }
        });

        disableBtn.addEventListener('click', async () => {
          const ok = await unsubscribeFromPush();
          if (ok) {
            showToast('Push-уведомления отключены');
          }
        });
      }
    } catch (err) {
      console.log('SW registration failed:', err);
    }
  });
}
