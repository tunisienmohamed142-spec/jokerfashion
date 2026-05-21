import { getAdminSession, loginAdmin } from '../state/store.js';

function getSafeNextPath() {
  const params = new URLSearchParams(window.location.search);
  const requestedNext = String(params.get('next') || '').trim();

  if (!requestedNext) {
    return 'admin.html';
  }

  const normalized = requestedNext.replace(/^\//, '');
  if (normalized === 'admin.html') {
    return normalized;
  }

  return 'admin.html';
}

function setFeedback(message, isError = false) {
  const feedback = document.querySelector('[data-admin-login-feedback]');
  if (!feedback) {
    return;
  }

  feedback.textContent = message;
  feedback.className = isError ? 'notice notice-error' : 'notice';
}

export async function initAdminLoginPage() {
  const form = document.querySelector('[data-admin-login-form]');
  const submitButton = form?.querySelector('button[type="submit"]');
  const nextPath = getSafeNextPath();

  if (!form) {
    return;
  }

  try {
    await getAdminSession();
    window.location.replace(nextPath);
    return;
  } catch {
    // expected when not authenticated
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const username = String(data.get('username') || '').trim();
    const password = String(data.get('password') || '');

    if (!username || !password) {
      setFeedback('Ange användarnamn och lösenord.', true);
      return;
    }

    submitButton?.setAttribute('disabled', 'disabled');
    setFeedback('Loggar in…');

    try {
      await loginAdmin({ username, password });
      window.location.replace(nextPath);
    } catch (err) {
      setFeedback(err.message || 'Kunde inte logga in.', true);
    } finally {
      submitButton?.removeAttribute('disabled');
    }
  });
}
