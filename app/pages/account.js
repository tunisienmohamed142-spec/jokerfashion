import { clearMockSession, getMockSession, setMockSession } from '../state/store.js';

function renderSessionStatus() {
  const status = document.querySelector('[data-account-status]');
  const session = getMockSession();

  if (!status) {
    return;
  }

  if (!session) {
    status.textContent = 'Ingen aktiv session. Auth-provider kopplas in i nästa fas.';
    return;
  }

  status.textContent = `Mock-session aktiv (${session.role}) sedan ${new Date(session.createdAt).toLocaleString('sv-SE')}.`;
}

export function initAccountPage() {
  const userButton = document.querySelector('[data-account-login-user]');
  const adminButton = document.querySelector('[data-account-login-admin]');
  const logoutButton = document.querySelector('[data-account-logout]');

  userButton?.addEventListener('click', () => {
    setMockSession('customer');
    renderSessionStatus();
  });

  adminButton?.addEventListener('click', () => {
    setMockSession('admin');
    renderSessionStatus();
  });

  logoutButton?.addEventListener('click', () => {
    clearMockSession();
    renderSessionStatus();
  });

  renderSessionStatus();
}
