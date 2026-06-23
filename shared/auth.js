// ── QuickDash client-side auth (localStorage demo) ─────────────────

const ACCOUNTS_KEY = 'quickdash_accounts';
const SESSION_KEY = 'quickdash_user';

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function normalizePhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length === 10) return '+91' + digits;
  if (digits.length === 12 && digits.startsWith('91')) return '+' + digits;
  return String(phone || '').trim();
}

function getAccounts() {
  try {
    const list = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '[]');
    return Array.isArray(list) ? list : [];
  } catch (e) {
    return [];
  }
}

function saveAccounts(list) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(list));
}

function findAccountByEmail(email) {
  const key = normalizeEmail(email);
  return getAccounts().find(a => a.email === key) || null;
}

function userWithoutPassword(user) {
  if (!user || typeof user !== 'object') return user;
  const { password, ...rest } = user;
  return rest;
}

function setSessionUser(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(userWithoutPassword(user)));
}

function getSessionUser() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function isCredentialBanned(email, phone) {
  try {
    const blacklist = JSON.parse(localStorage.getItem('quickdash_blacklist') || '[]');
    const emailKey = normalizeEmail(email);
    const phoneNorm = normalizePhone(phone);
    const phoneDigits = phoneNorm.replace(/\D/g, '');

    return blacklist.some(entry => {
      if (entry.email && normalizeEmail(entry.email) === emailKey) return true;
      if (!entry.phone) return false;
      const bannedDigits = String(entry.phone).replace(/\D/g, '');
      return bannedDigits === phoneDigits ||
        bannedDigits === phoneDigits.slice(-10) ||
        normalizePhone(entry.phone) === phoneNorm;
    });
  } catch (e) {
    return false;
  }
}

function registerAccount(userData) {
  const email = normalizeEmail(userData.email);
  const password = userData.password;

  if (!email || !password) {
    return { ok: false, error: 'Email and password are required.' };
  }

  if (findAccountByEmail(email)) {
    return { ok: false, error: 'An account with this email already exists. Please sign in instead.' };
  }

  if (isCredentialBanned(email, userData.phone)) {
    return {
      ok: false,
      error: 'This email or phone number has been banned and cannot be used.'
    };
  }

  const accounts = getAccounts();
  accounts.push({
    email,
    password,
    user: userWithoutPassword({ ...userData, email: userData.email.trim() }),
    createdAt: Date.now()
  });
  saveAccounts(accounts);
  return { ok: true };
}

function signInWithCredentials(email, password) {
  const emailKey = normalizeEmail(email);
  const pwd = String(password || '');

  if (!emailKey || !pwd) {
    return { ok: false, error: 'Please enter your email and password.' };
  }

  const account = findAccountByEmail(emailKey);
  if (!account) {
    return { ok: false, error: 'No account found with this email. Please sign up first.' };
  }

  if (account.password !== pwd) {
    return { ok: false, error: 'Incorrect password. Please try again.' };
  }

  if (isCredentialBanned(account.user.email, account.user.phone)) {
    return {
      ok: false,
      error: 'This account has been banned. Contact support if you believe this is a mistake.'
    };
  }

  setSessionUser(account.user);
  return { ok: true, user: account.user };
}

/** If user signed up before accounts registry existed, add them once. */
function migrateLegacySessionToAccounts() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return;
    const user = JSON.parse(raw);
    if (!user.email || !user.password) return;
    if (findAccountByEmail(user.email)) return;
    registerAccount({ ...user, password: user.password });
  } catch (e) {
    console.warn('Legacy account migration skipped:', e);
  }
}

function getPostLoginRedirect(user, fallback) {
  const params = new URLSearchParams(window.location.search);
  const requested = params.get('redirect');
  if (requested && !requested.includes('signup') && !requested.includes('signin')) {
    return requested;
  }
  if (fallback) return fallback;
  if (user.role === 'merchant') return '../yourstore/yourstore.html';
  return '../discover/discover.html';
}

function redirectIfAlreadySignedIn() {
  const user = getSessionUser();
  if (!user) return false;
  window.location.href = getPostLoginRedirect(user);
  return true;
}
