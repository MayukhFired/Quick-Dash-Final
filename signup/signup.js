// ── App State ─────────────────────────────────────────────────
const state = {
  selectedRole: null,
  locationDetected: false,
  locationData: null,
  personalData: {},
  merchantData: {}
};

// ── Utility: Show/Hide Steps ───────────────────────────────────
function goToStep(stepId) {
  document.querySelectorAll('.form-step').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(stepId);
  if (target) target.classList.add('active');

  // Adjust form for merchant multi-step
  if (stepId === 'step-personal') {
    const isMerchant = state.selectedRole === 'merchant';
    document.getElementById('personal-btn-label').textContent = isMerchant ? 'Next: Shop Details →' : 'Create Account →';
    document.getElementById('merchant-step-note').style.display = isMerchant ? 'block' : 'none';
    document.getElementById('step-counter').textContent = isMerchant ? 'Step 1 of 2' : 'Step 1 of 1';
    document.getElementById('progress-fill').style.width = isMerchant ? '50%' : '100%';
    document.getElementById('personal-form-title').textContent = isMerchant ? 'Your Details' : 'Create Your Account';
    document.getElementById('personal-form-sub').textContent = isMerchant ? 'Owner\'s personal information' : 'Tell us a bit about yourself';
  }
}

// ── Role Selection ─────────────────────────────────────────────
function selectRole(role) {
  state.selectedRole = role;

  // Update visual state
  ['customer', 'merchant'].forEach(r => {
    const card = document.getElementById(`role-${r}`);
    card.classList.toggle('selected', r === role);
  });

  // Enable Continue button
  document.getElementById('btn-continue-role').disabled = false;
}

// ── Skip Signup ────────────────────────────────────────────────
function skipSignup() {
  // In production: navigate to home or dismiss modal
  alert('You can browse, but you\'ll need an account to place orders or manage your shop.');
  // window.location.href = '../index.html';
}

// ── Init (legacy account migration) ─────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  migrateLegacySessionToAccounts();
});

// ── Password Strength ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const passwordInput = document.getElementById('password');
  if (passwordInput) {
    passwordInput.addEventListener('input', updatePasswordStrength);
  }
});

function updatePasswordStrength() {
  const password = document.getElementById('password').value;
  const fill = document.getElementById('strength-fill');
  const label = document.getElementById('strength-label');

  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const configs = [
    { width: '0%',   bg: 'transparent',        text: 'Password strength' },
    { width: '25%',  bg: '#d90429',             text: 'Weak' },
    { width: '50%',  bg: '#f4a261',             text: 'Fair' },
    { width: '75%',  bg: '#52b788',             text: 'Good' },
    { width: '100%', bg: 'var(--green-800)',    text: 'Strong 💪' }
  ];

  const cfg = configs[score];
  fill.style.width = cfg.width;
  fill.style.background = cfg.bg;
  label.textContent = cfg.text;
  label.style.color = score < 2 && score > 0 ? '#d90429' : score === 2 ? '#f4a261' : 'var(--green-600)';
}

// ── Toggle Password Visibility ────────────────────────────────
function togglePassword(inputId, btn) {
  const input = document.getElementById(inputId);
  const isHidden = input.type === 'password';
  input.type = isHidden ? 'text' : 'password';
  btn.textContent = isHidden ? '🙈' : '👁️';
}

// ── GPS Location ───────────────────────────────────────────────
function useCurrentLocation() {
  const btn = document.getElementById('btn-use-location');
  if (!navigator.geolocation) {
    alert('Geolocation is not supported by your browser.');
    return;
  }

  btn.classList.add('loading');
  btn.innerHTML = '<span class="loc-icon">⏳</span> Detecting...';

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      state.locationDetected = true;
      state.locationData = { latitude, longitude };

      // Reverse geocode with a free API (OpenStreetMap Nominatim)
      fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`)
        .then(res => res.json())
        .then(data => {
          const addr = data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          showLocationDetected(addr);
        })
        .catch(() => {
          showLocationDetected(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        });

      btn.classList.remove('loading');
      btn.innerHTML = '<span class="loc-icon">📍</span> Use Current Location';
    },
    (error) => {
      btn.classList.remove('loading');
      btn.innerHTML = '<span class="loc-icon">📍</span> Use Current Location';
      const messages = {
        1: 'Location access was denied. Please allow it in your browser settings.',
        2: 'Could not detect your location. Please try again.',
        3: 'Location request timed out.'
      };
      alert(messages[error.code] || 'An unknown error occurred.');
    },
    { timeout: 10000 }
  );
}

function showLocationDetected(displayText) {
  document.getElementById('location-text').textContent = displayText;
  document.getElementById('location-detected').style.display = 'flex';
  // Hide manual fields if location is detected
  document.getElementById('address-manual-fields').style.display = 'none';
}

function clearLocation() {
  state.locationDetected = false;
  state.locationData = null;
  document.getElementById('location-detected').style.display = 'none';
  document.getElementById('address-manual-fields').style.display = 'flex';
}

// ── Personal Form Validation & Submit ─────────────────────────
function handlePersonalSubmit(e) {
  e.preventDefault();
  if (!validatePersonalForm()) return;

  // Collect data
  state.personalData = {
    name: document.getElementById('full-name').value.trim(),
    phone: '+91' + document.getElementById('phone').value.trim(),
    email: document.getElementById('email').value.trim(),
    password: document.getElementById('password').value,
    address: state.locationDetected ? state.locationData : {
      line: document.getElementById('address-line').value.trim(),
      city: document.getElementById('city').value.trim(),
      pincode: document.getElementById('pincode').value.trim()
    }
  };

  if (state.selectedRole === 'merchant') {
    goToStep('step-merchant');
  } else {
    // Customer account creation complete
    showSuccessScreen('customer');
  }
}

function validatePersonalForm() {
  clearErrors();
  let valid = true;

  const name = document.getElementById('full-name').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  // ── Blacklist Enforcement Check (Admin Ban Logic) ──────────────
  try {
    const blacklist = JSON.parse(localStorage.getItem('quickdash_blacklist') || '[]');
    const fullPhone = '+91' + phone;
    const isBanned = blacklist.some(entry =>
      (entry.email && entry.email.toLowerCase() === email.toLowerCase()) ||
      (entry.phone && (entry.phone === fullPhone || entry.phone === phone || entry.phone === '+91 ' + phone))
    );
    if (isBanned) {
      alert('⛔ ACCESS DENIED: This email or phone number has been permanently banned by the administrator. You cannot create a new account with these credentials.');
      return false;
    }
  } catch (e) { /* blacklist parse error, continue */ }

  if (!name) { showError('err-name', 'Full name is required.'); valid = false; }
  if (!/^[6-9]\d{9}$/.test(phone)) { showError('err-phone', 'Enter a valid 10-digit Indian mobile number.'); valid = false; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showError('err-email', 'Enter a valid email address.'); valid = false; }
  if (findAccountByEmail(email)) {
    showError('err-email', 'This email is already registered. Sign in instead.');
    valid = false;
  }
  if (password.length < 8) { showError('err-password', 'Password must be at least 8 characters.'); valid = false; }

  // Address validation
  if (!state.locationDetected) {
    const line = document.getElementById('address-line').value.trim();
    const city = document.getElementById('city').value.trim();
    const pincode = document.getElementById('pincode').value.trim();
    if (!line || !city || !/^\d{6}$/.test(pincode)) {
      showError('err-address', 'Please fill in a complete address or use current location.');
      valid = false;
    }
  }

  return valid;
}

// ── Merchant Form Submit ───────────────────────────────────────
function handleMerchantSubmit(e) {
  e.preventDefault();
  if (!validateMerchantForm()) return;

  state.merchantData = {
    shopName: document.getElementById('shop-name').value.trim(),
    category: document.getElementById('shop-category').value,
    upiId: document.getElementById('shop-upi').value.trim(),
    ownerPhoto: state.uploadedFiles ? state.uploadedFiles['file-owner-photo'] : '',
    shopPhoto: state.uploadedFiles ? state.uploadedFiles['file-store-photo'] : '',
    aadhaarFile: state.uploadedFiles ? state.uploadedFiles['file-aadhaar'] : '',
    licenseFile: state.uploadedFiles ? state.uploadedFiles['file-license'] : '',
    otherFile: state.uploadedFiles ? state.uploadedFiles['file-other'] : '',
    isApproved: false // Newly registered merchant starts as unapproved
  };

  showSuccessScreen('merchant');
}

function validateMerchantForm() {
  clearErrors();
  let valid = true;
  const shopName = document.getElementById('shop-name').value.trim();
  const category = document.getElementById('shop-category').value;
  const upiId = document.getElementById('shop-upi').value.trim();

  if (!shopName) { showError('err-shop-name', 'Shop name is required.'); valid = false; }
  if (!category) { valid = false; } // Category selector will highlight naturally
  
  if (!upiId) {
    showError('err-shop-upi', 'UPI ID is required for settlements.');
    valid = false;
  } else if (!upiId.includes('@')) {
    showError('err-shop-upi', 'Invalid UPI ID format (must contain @).');
    valid = false;
  }

  // File Upload validations
  const uploaded = state.uploadedFiles || {};
  if (!uploaded['file-owner-photo']) {
    alert('👤 Uploading your own photo is mandatory.');
    valid = false;
  } else if (!uploaded['file-store-photo']) {
    alert('📸 Uploading a store front photo is mandatory.');
    valid = false;
  } else if (!uploaded['file-aadhaar']) {
    alert('🪪 Uploading your Aadhaar card is mandatory.');
    valid = false;
  }

  return valid;
}

// ── Success Screen ────────────────────────────────────────────
function showSuccessScreen(role) {
  goToStep('step-success');

  if (role === 'merchant') {
    document.getElementById('success-title').textContent = 'Shop Submitted!';
    document.getElementById('success-message').textContent = 'Your registration is in review. Our team will verify your documents.';
    document.getElementById('merchant-pending').style.display = 'flex';
  } else {
    document.getElementById('success-title').textContent = 'Welcome Aboard! 🎉';
    document.getElementById('success-message').textContent = 'Your account is ready. Start discovering local shops near you!';
    document.getElementById('merchant-pending').style.display = 'none';
  }

  const userData = {
    role: state.selectedRole,
    isApproved: role === 'merchant' ? false : true,
    ...state.personalData,
    ...(role === 'merchant' ? state.merchantData : {})
  };

  const registered = registerAccount(userData);
  if (!registered.ok) {
    alert(registered.error);
    goToStep('step-personal');
    return;
  }

  setSessionUser(userData);
}

function goToDashboard() {
  // If merchant, redirect directly to Your Store onboarding page
  if (state.selectedRole === 'merchant') {
    window.location.href = '../yourstore/yourstore.html';
  } else {
    window.location.href = '../discover/discover.html';
  }
}

// ── File Upload Handler ────────────────────────────────────────
function triggerUpload(inputId) {
  document.getElementById(inputId).click();
}

function handleFileUpload(input, statusId, cardId) {
  const file = input.files[0];
  if (!file) return;

  const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  if (!validTypes.includes(file.type)) {
    alert('Invalid file type. Please upload a JPG, PNG, or PDF.');
    input.value = '';
    return;
  }

  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    alert('File is too large. Maximum size is 5MB.');
    input.value = '';
    return;
  }

  // Track uploaded file name in state
  if (!state.uploadedFiles) {
    state.uploadedFiles = {};
  }
  state.uploadedFiles[input.id] = file.name;

  // Update the UI to show uploaded state
  const statusEl = document.getElementById(statusId);
  statusEl.innerHTML = `<span style="color:var(--green-600);font-size:.8rem;font-weight:700;">✅ ${truncateFilename(file.name)}</span>`;

  const card = document.getElementById(cardId);
  card.classList.add('uploaded');
}

// ── Error Helpers ──────────────────────────────────────────────
function showError(id, message) {
  const el = document.getElementById(id);
  if (el) el.textContent = message;
}

function clearErrors() {
  document.querySelectorAll('.field-error').forEach(el => el.textContent = '');
}

// ── Utility ───────────────────────────────────────────────────
function truncateFilename(name, maxLen = 20) {
  if (name.length <= maxLen) return name;
  const ext = name.split('.').pop();
  return name.substring(0, maxLen - ext.length - 3) + '….' + ext;
}
