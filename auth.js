// Базовый URL API (если фронт открыт с того же сервера — пустая строка)
const API_BASE = '';

function getUsers() {
  try {
    const raw = localStorage.getItem('users');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function getCurrentUser() {
  try {
    const raw = localStorage.getItem('currentUser');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setCurrentUser(user) {
  localStorage.setItem('currentUser', JSON.stringify(user));
}

function getAuthHeader() {
  const user = getCurrentUser();
  if (!user) return {};
  const token = btoa(unescape(encodeURIComponent(JSON.stringify({ login: user.login, role: user.role }))));
  return { Authorization: `Bearer ${token}` };
}

function logout() {
  try {
    localStorage.removeItem('currentUser');
  } catch {}
  window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', () => {
  initRegisterForm();
  initLoginForm();
  initIndexNav();
  initTeacherLogout();
  initStudentLogout();
});

function initRegisterForm() {
  const form = document.getElementById('registerForm');
  if (!form) return;

  const message = document.getElementById('message');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const loginInput = document.getElementById('login');
    const passwordInput = document.getElementById('password');
    const confirmInput = document.getElementById('confirmPassword');
    const roleInput = form.querySelector('input[name="role"]:checked');

    const login = loginInput.value.trim();
    const password = passwordInput.value;
    const confirm = confirmInput.value;
    const role = roleInput ? roleInput.value : null;

    if (!login || !password || !confirm || !role) {
      if (message) message.textContent = 'Заполните все поля и выберите роль.';
      return;
    }

    if (password !== confirm) {
      if (message) message.textContent = 'Пароли не совпадают.';
      return;
    }

    try {
      const res = await fetch(API_BASE + '/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, password, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (message) message.textContent = data.error || 'Ошибка регистрации';
        return;
      }
      setCurrentUser(data.user);
      if (message) message.textContent = '';
      window.location.href = 'index.html';
    } catch (err) {
      if (message) message.textContent = 'Ошибка сети. Запустите сервер (npm start).';
    }
  });
}

function initLoginForm() {
  const form = document.getElementById('loginForm');
  if (!form) return;

  const message = document.getElementById('message');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const loginInput = document.getElementById('login');
    const passwordInput = document.getElementById('password');

    const login = loginInput.value.trim();
    const password = passwordInput.value;

    if (!login || !password) {
      if (message) message.textContent = 'Введите логин и пароль.';
      return;
    }

    try {
      const res = await fetch(API_BASE + '/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (message) message.textContent = data.error || 'Неверный логин или пароль';
        return;
      }
      setCurrentUser(data.user);
      if (message) message.textContent = '';
      window.location.href = 'index.html';
    } catch (err) {
      if (message) message.textContent = 'Ошибка сети. Запустите сервер (npm start).';
    }
  });
}

function initIndexNav() {
  const navRight = document.querySelector('.nav-right');
  if (!navRight) return;

  const user = getCurrentUser();
  if (!user) {
    return;
  }

  navRight.innerHTML = '';

  const roleLabels = { teacher: 'Учитель', student: 'Ученик' };
  const roleLabel = roleLabels[user.role] || user.role;

  // avatar with initial letter (circle)
  const avatar = document.createElement('div');
  avatar.className = `nav-avatar ${user.role}`;
  const initial = (user.login && user.login.length) ? user.login[0].toUpperCase() : '?';
  avatar.textContent = initial;
  avatar.title = user.login;
  avatar.style.cursor = 'pointer';
  avatar.addEventListener('click', () => openProfileModal(user));

  // For teachers show two links: create test and dashboard
  if (user.role === 'teacher') {
    const aCreate = document.createElement('a');
    aCreate.href = 'teacher.html';
    aCreate.textContent = 'Создать задание';
    aCreate.className = 'nav-link';

    const aDash = document.createElement('a');
    aDash.href = 'teacher_dashboard.html';
    aDash.textContent = 'Кабинет';
    aDash.className = 'nav-link';

    const logoutBtn = document.createElement('button');
    logoutBtn.className = 'nav-logout';
    logoutBtn.textContent = 'Выйти';
    logoutBtn.addEventListener('click', logout);

    navRight.appendChild(aCreate);
    navRight.appendChild(aDash);
    navRight.appendChild(logoutBtn);
    navRight.appendChild(avatar);
    return;
  }

  // For students show single action button
  const actionBtn = document.createElement('button');
  actionBtn.className = 'nav-action';
  actionBtn.textContent = 'Перейти к заданиям';
  actionBtn.addEventListener('click', () => { window.location.href = 'student.html'; });

  const logoutBtn = document.createElement('button');
  logoutBtn.className = 'nav-logout';
  logoutBtn.textContent = 'Выйти';
  logoutBtn.addEventListener('click', logout);

  navRight.appendChild(actionBtn);
  navRight.appendChild(logoutBtn);
  navRight.appendChild(avatar);
}

function initTeacherLogout() {
  const btn = document.getElementById('logoutTeacher');
  if (!btn) return;
  btn.addEventListener('click', logout);
}

function initStudentLogout() {
  const btn = document.getElementById('logoutStudent');
  if (!btn) return;
  btn.addEventListener('click', logout);
}
async function openProfileModal(user) {
  // Create or get modal container
  let modal = document.getElementById('profileModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'profileModal';
    modal.className = 'profile-modal hidden';
    document.body.appendChild(modal);

    // Close on click outside
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.add('hidden');
      }
    });

    // Close on ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        modal.classList.add('hidden');
      }
    });
  }

  // Show loading state
  modal.innerHTML = '<div class="profile-modal-content"><p>Загрузка...</p></div>';
  modal.classList.remove('hidden');

  // Load profile data
  const initial = (user.login && user.login.length) ? user.login[0].toUpperCase() : '?';
  const bgColor = user.role === 'teacher' ? '#DB5C5C' : '#64D258';

  let avgPercentage = null;

  // If student, fetch average percentage
  if (user.role === 'student') {
    try {
      const res = await fetch(`/api/assigned-tests/${user.id}`);
      const data = await res.json();
      const tests = data.tests || [];
      const completedTests = tests.filter(t => t.percentage !== null && t.percentage !== undefined);
      
      if (completedTests.length > 0) {
        const total = completedTests.reduce((sum, t) => sum + (t.percentage || 0), 0);
        avgPercentage = Math.round(total / completedTests.length);
      }
    } catch (e) {
      console.error('Ошибка загрузки результатов:', e);
    }
  }

  // Determine progress circle color
  let circleColor = '#dc3545'; // red < 30%
  if (avgPercentage !== null && avgPercentage > 60) {
    circleColor = '#28a745'; // green > 60%
  } else if (avgPercentage !== null && avgPercentage > 30) {
    circleColor = '#ff9500'; // orange > 30%
  }

  // Build modal content
  const profileContent = `
    <div class="profile-modal-overlay"></div>
    <div class="profile-modal-content">
      <button class="profile-modal-close">&times;</button>
      <div class="profile-header">
        <div class="profile-avatar" style="background-color: ${bgColor};">${initial}</div>
        <div class="profile-info">
          <h2>${user.login}</h2>
          <p>${user.role === 'teacher' ? 'Преподаватель' : 'Ученик'}</p>
        </div>
      </div>
      ${user.role === 'student' && avgPercentage !== null ? `
        <div class="profile-stats">
          <div class="progress-circle" style="--progress: ${avgPercentage}%; --color: ${circleColor};">
            <div class="progress-text">${avgPercentage}%</div>
          </div>
          <p class="progress-label">Средний процент</p>
        </div>
      ` : user.role === 'student' ? `
        <div class="profile-stats">
          <p class="progress-label">Нет пройденных тестов</p>
        </div>
      ` : ''}
    </div>
  `;

  modal.innerHTML = profileContent;

  // Add close handler
  const closeBtn = modal.querySelector('.profile-modal-close');
  closeBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
  });
}