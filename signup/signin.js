// ── Sign In Page ───────────────────────────────────────────────────

function togglePassword(inputId, btn) {
  const input = document.getElementById(inputId);
  const isHidden = input.type === 'password';
  input.type = isHidden ? 'text' : 'password';
  btn.textContent = isHidden ? '🙈' : '👁️';
}

function clearSignInErrors() {
  document.querySelectorAll('.field-error').forEach(el => { el.textContent = ''; });
  const banner = document.getElementById('signin-error-banner');
  if (banner) {
    banner.style.display = 'none';
    banner.textContent = '';
  }
}

function showSignInError(message) {
  const banner = document.getElementById('signin-error-banner');
  if (banner) {
    banner.textContent = message;
    banner.style.display = 'flex';
  }
}

function handleSignInSubmit(e) {
  e.preventDefault();
  clearSignInErrors();

  const email = document.getElementById('signin-email').value.trim();
  const password = document.getElementById('signin-password').value;

  if (!email) {
    document.getElementById('err-signin-email').textContent = 'Email is required.';
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    document.getElementById('err-signin-email').textContent = 'Enter a valid email address.';
    return;
  }
  if (!password) {
    document.getElementById('err-signin-password').textContent = 'Password is required.';
    return;
  }

  const btn = document.getElementById('btn-signin-submit');
  btn.disabled = true;
  btn.textContent = 'Signing in…';

  const result = signInWithCredentials(email, password);

  if (!result.ok) {
    showSignInError(result.error);
    btn.disabled = false;
    btn.textContent = 'Sign In →';
    return;
  }

  window.location.href = getPostLoginRedirect(result.user);
}

document.addEventListener('DOMContentLoaded', () => {
  migrateLegacySessionToAccounts();
  if (redirectIfAlreadySignedIn()) return;

  const params = new URLSearchParams(window.location.search);
  const emailHint = params.get('email');
  if (emailHint) {
    document.getElementById('signin-email').value = emailHint;
  }
});
