// ── Room 7: Track My Order JavaScript ─────────────────────────────
// Time-machine state machine: stages computed from order timestamp
// so the page resumes correctly even after a browser restart.

// ── Timing config (seconds from order placement) ──────────────────
const STAGE_TIMINGS = {
  1: 8,   // Store Accepts:          8s  after order
  2: 20,  // Partner Picks Up:       20s after order
  3: 45   // Delivery Complete:      45s after order
};

// ── State ─────────────────────────────────────────────────────────
const state = {
  order: null,       // full order object from localStorage
  currentUser: null,
  map: null,
  shopMarker: null,
  customerMarker: null,
  partnerMarker: null,
  currentStage: 0,
  stageTimes: {},    // { 1: Date, 2: Date, 3: Date }
  ratings: { store: 0, partner: 0, app: 0 },
  animFrame: null,   // requestAnimationFrame handle for partner glide
  tickInterval: null // setInterval handle for stage polling
};

// ── Customer pin (New Delhi default) ──────────────────────────────
const CUSTOMER_COORDS = { lat: 28.6139, lon: 77.2090 };

// ── Entry Point ────────────────────────────────────────────────────
function initTrackPage() {
  loadUserProfile();

  // Load active order from localStorage
  try {
    const raw = localStorage.getItem('quickdash_active_order');
    if (!raw) {
      // No active order — send back to Discover
      window.location.href = '../discover/discover.html';
      return;
    }
    state.order = JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse active order:', e);
    window.location.href = '../discover/discover.html';
    return;
  }

  // Populate static UI sections
  populateOrderDetails();
  populateInvoice();
  populateAddress();
  buildStarWidgets();

  // Boot Leaflet map
  initTrackMap();

  // Start the state machine ticker
  startStageMachine();
}

// ── Populate store / partner info ──────────────────────────────────
function populateOrderDetails() {
  const order = state.order;

  // Order ID suffix (last 4 digits of timestamp)
  const suffix = String(order.timestamp).slice(-4);
  setText('order-id-suffix', suffix);

  // Store name
  setText('track-store-name', order.shopName || 'Local Store');
  setText('track-store-address', `Store ID: ${order.shopId || '—'}`);
}

function populateInvoice() {
  const order = state.order;
  const container = document.getElementById('invoice-rows');
  if (!container) return;

  const rows = [
    { label: 'Items Subtotal', value: `₹${order.subtotal || 0}` },
    { label: 'GST (5%)',       value: `₹${order.gst || 0}` },
    { label: 'Platform Fee',   value: `₹${order.platformFee || 5}` },
    { label: 'Base Delivery',  value: `₹${order.baseDelivery || 25}` }
  ];

  if (order.additionalDelivery && order.additionalDelivery > 0) {
    rows.push({ label: 'Distance Fee', value: `₹${order.additionalDelivery}` });
  }

  let html = rows.map(r => `
    <div class="invoice-row">
      <span class="inv-label">${escapeHTML(r.label)}</span>
      <span class="inv-value">${r.value}</span>
    </div>
  `).join('');

  html += `<div class="invoice-divider"></div>`;
  html += `
    <div class="invoice-row total-row">
      <span class="inv-label">Total Paid</span>
      <span class="inv-value">₹${order.grandTotal || 0}</span>
    </div>
  `;

  container.innerHTML = html;
}

function populateAddress() {
  const order = state.order;
  setText('track-delivery-address', order.deliveryAddress || 'Address not provided');

  const recipientLabel = document.getElementById('track-recipient-label');
  if (recipientLabel) {
    if (order.recipientType === 'other' && order.recipientName) {
      recipientLabel.textContent = `🎁 Gift for: ${order.recipientName} · 📞 ${order.recipientPhone}`;
      recipientLabel.style.display = 'inline-block';
    } else {
      recipientLabel.style.display = 'none';
    }
  }
}

// ── Leaflet Map Initialisation ─────────────────────────────────────
function initTrackMap() {
  if (typeof L === 'undefined') {
    console.warn('Leaflet not available');
    return;
  }

  const order = state.order;
  const shopLat = order.shopLat || 28.6150;
  const shopLon = order.shopLon || 77.2120;
  const custLat = CUSTOMER_COORDS.lat;
  const custLon = CUSTOMER_COORDS.lon;

  // Centre between shop & customer
  const midLat = (shopLat + custLat) / 2;
  const midLon = (shopLon + custLon) / 2;

  state.map = L.map('track-map', {
    zoomControl: true,
    scrollWheelZoom: false
  }).setView([midLat, midLon], 14);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
  }).addTo(state.map);

  // Helper: create a div icon with an emoji
  function emojiIcon(emoji, size = 36) {
    return L.divIcon({
      html: `<div style="font-size:${size}px;line-height:1;filter:drop-shadow(0 3px 6px rgba(0,0,0,0.3))">${emoji}</div>`,
      className: '',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2]
    });
  }

  // Shop marker
  state.shopMarker = L.marker([shopLat, shopLon], { icon: emojiIcon('🏪', 36) })
    .addTo(state.map)
    .bindPopup(`<b>${escapeHTML(order.shopName || 'Store')}</b><br>Order pickup location`);

  // Customer / home marker
  state.customerMarker = L.marker([custLat, custLon], { icon: emojiIcon('🏠', 36) })
    .addTo(state.map)
    .bindPopup('<b>Your Delivery Location</b>');

  // Delivery partner marker (starts at shop)
  state.partnerMarker = L.marker([shopLat, shopLon], { icon: emojiIcon('🛵', 40) })
    .addTo(state.map)
    .bindPopup('<b>Ravi Kumar</b><br>Your delivery partner');

  // Draw a dashed route line between shop & customer
  L.polyline(
    [[shopLat, shopLon], [custLat, custLon]],
    { color: '#52b788', weight: 3, dashArray: '8 6', opacity: 0.7 }
  ).addTo(state.map);

  // Fit map to show both markers
  const bounds = L.latLngBounds(
    [shopLat, shopLon],
    [custLat, custLon]
  );
  state.map.fitBounds(bounds, { padding: [50, 50] });
}

// ── Stage State Machine ─────────────────────────────────────────────
function startStageMachine() {
  // Determine current stage from elapsed time since order was placed
  const orderTime = state.order.timestamp || Date.now();

  function tick() {
    const elapsed = (Date.now() - orderTime) / 1000; // seconds elapsed

    let newStage = 0;
    if (elapsed >= STAGE_TIMINGS[1]) newStage = 1;
    if (elapsed >= STAGE_TIMINGS[2]) newStage = 2;
    if (elapsed >= STAGE_TIMINGS[3]) newStage = 3;

    if (newStage !== state.currentStage) {
      // Record the moment each stage was reached (for display)
      for (let s = state.currentStage + 1; s <= newStage; s++) {
        if (!state.stageTimes[s]) {
          state.stageTimes[s] = new Date();
        }
      }
      state.currentStage = newStage;
      updateStepperUI(newStage);
      updateMapStatus(newStage);
    }

    // Animate partner marker movement during stage 2
    if (newStage === 2 || (newStage < 3 && elapsed >= STAGE_TIMINGS[2])) {
      const pickupTime = orderTime + STAGE_TIMINGS[2] * 1000;
      const deliveryTime = orderTime + STAGE_TIMINGS[3] * 1000;
      const progress = Math.min((Date.now() - pickupTime) / (deliveryTime - pickupTime), 1);
      animatePartnerMarker(progress);
    } else if (newStage === 3) {
      // Snap partner to customer location
      animatePartnerMarker(1);
    }

    // Stop polling after delivery is complete
    if (newStage >= 3) {
      clearInterval(state.tickInterval);
      showRatingsCard();
      return;
    }
  }

  // Run immediately then every 1s
  tick();
  state.tickInterval = setInterval(tick, 1000);
}

// ── Update stepper visual state ────────────────────────────────────
function updateStepperUI(stage) {
  for (let s = 1; s <= 3; s++) {
    const el = document.getElementById(`step-${s}`);
    if (!el) continue;

    el.classList.remove('active', 'completed');

    if (s < stage + 1) {
      // All steps before current are "completed"
      el.classList.add('completed');
    } else if (s === stage + 1) {
      // The very next step is "active" (pulsing)
      el.classList.add('active');
    }

    // If stage 3 reached, mark step 3 as completed too
    if (stage >= 3 && s === 3) {
      el.classList.remove('active');
      el.classList.add('completed');
    }

    // Fill in timestamp
    const timeEl = document.getElementById(`step-${s}-time`);
    if (timeEl && state.stageTimes[s]) {
      timeEl.textContent = formatTime(state.stageTimes[s]);
    }
  }
}

// ── Update map status pill text ────────────────────────────────────
function updateMapStatus(stage) {
  const textEl = document.getElementById('map-status-text');
  const etaEl  = document.getElementById('eta-tag');
  const pill   = document.getElementById('map-status-pill');

  const messages = [
    'Waiting for store confirmation...',
    'Store confirmed — preparing order',
    'Partner on the way to you! 🛵',
    'Delivered! 🎉'
  ];

  const etas = [
    '⏳ Awaiting store',
    '⚡ Delivery in ~30s',
    '⚡ Almost there!',
    '✅ Order delivered'
  ];

  if (textEl) textEl.textContent = messages[stage] || '';
  if (etaEl)  etaEl.textContent  = etas[stage] || '';

  // Turn pill green once partner is moving
  if (pill) {
    if (stage >= 2) {
      pill.style.borderColor = 'var(--g500)';
      pill.style.background  = 'var(--g50)';
    }
    if (stage >= 3) {
      pill.style.background  = 'var(--g100)';
    }
  }
}

// ── Animate the 🛵 marker between shop and customer ─────────────────
function animatePartnerMarker(progress) {
  if (!state.partnerMarker || !state.order) return;

  const order = state.order;
  const shopLat = order.shopLat || 28.6150;
  const shopLon = order.shopLon || 77.2120;
  const custLat = CUSTOMER_COORDS.lat;
  const custLon = CUSTOMER_COORDS.lon;

  // Linear interpolation
  const lat = shopLat + (custLat - shopLat) * progress;
  const lon = shopLon + (custLon - shopLon) * progress;

  state.partnerMarker.setLatLng([lat, lon]);
}

// ── Show ratings widget ────────────────────────────────────────────
function showRatingsCard() {
  const card = document.getElementById('ratings-card');
  if (card) card.style.display = 'block';
}

// ── Build interactive 5-star widgets ──────────────────────────────
function buildStarWidgets() {
  const keys = ['store', 'partner', 'app'];
  keys.forEach(key => {
    const group = document.getElementById(`stars-${key}`);
    if (!group) return;

    let html = '';
    for (let i = 1; i <= 5; i++) {
      html += `<button class="star-btn" data-key="${key}" data-val="${i}" 
                 onclick="handleStarClick('${key}', ${i})" aria-label="${i} star">⭐</button>`;
    }
    group.innerHTML = html;
  });
}

function handleStarClick(key, val) {
  state.ratings[key] = val;

  const group = document.getElementById(`stars-${key}`);
  if (!group) return;

  group.querySelectorAll('.star-btn').forEach(btn => {
    const btnVal = parseInt(btn.getAttribute('data-val'));
    btn.classList.toggle('selected', btnVal <= val);
  });
}

window.handleStarClick = handleStarClick;

// ── Submit feedback & clear order ─────────────────────────────────
function submitRatings() {
  // Save ratings snapshot (would go to backend later)
  const feedback = {
    orderId: state.order.timestamp,
    shopId: state.order.shopId,
    ratings: state.ratings,
    review: document.getElementById('review-text').value.trim(),
    submittedAt: Date.now()
  };

  try {
    localStorage.setItem('quickdash_last_feedback', JSON.stringify(feedback));
    
    // Save completed order with ratings to order history
    const completedOrder = {
      ...state.order,
      feedback: feedback,
      completedAt: Date.now()
    };
    
    const rawHistory = localStorage.getItem('quickdash_orders_history');
    let history = [];
    if (rawHistory) {
      history = JSON.parse(rawHistory);
    }
    // Prepend to show newest first
    history.unshift(completedOrder);
    localStorage.setItem('quickdash_orders_history', JSON.stringify(history));

    // Clear active order so discover page doesn't show tracking CTA
    localStorage.removeItem('quickdash_active_order');
  } catch (e) {
    console.error('Failed to save feedback or order history:', e);
  }

  // Thank-you flash then redirect to Orders Page
  const btn = document.getElementById('btn-submit-rating');
  if (btn) {
    btn.textContent = '✅ Thank you! Opening Orders History...';
    btn.disabled = true;
    btn.style.opacity = '0.7';
  }

  setTimeout(() => {
    window.location.href = '../orders/orders.html';
  }, 1800);
}

window.submitRatings = submitRatings;

// ── Helpers ────────────────────────────────────────────────────────
function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function formatTime(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function escapeHTML(str = '') {
  return String(str).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}

// ── Profile Drawer Support ────────────────────────────────────────
function loadUserProfile() {
  try {
    const saved = localStorage.getItem('quickdash_user');
    if (saved) state.currentUser = JSON.parse(saved);
  } catch (e) {
    state.currentUser = null;
  }
  renderAuthButton();
}

function renderAuthButton() {
  const container = document.getElementById('header-auth');
  if (!container) return;

  if (state.currentUser) {
    const initial = (state.currentUser.name || 'U').charAt(0).toUpperCase();
    container.innerHTML = `
      <button class="btn-profile" id="profile-btn" onclick="openProfileDrawer()" aria-label="Open profile">
        <div class="profile-avatar">${initial}</div>
        <span>${state.currentUser.name ? state.currentUser.name.split(' ')[0] : 'Profile'}</span>
      </button>`;
  } else {
    container.innerHTML = `
      <button class="btn-auth" id="auth-btn" onclick="window.location.href='../signup/signin.html'">
        Sign Up / Log In
      </button>`;
  }
}

function openProfileDrawer() {
  if (!state.currentUser) return;
  const body    = document.getElementById('drawer-body');
  const initial = (state.currentUser.name || 'U').charAt(0).toUpperCase();
  const role    = state.currentUser.role === 'merchant' ? '🏪 Merchant' : '🛍️ Customer';

  body.innerHTML = `
    <div class="profile-info-row">
      <div class="profile-avatar-lg">${initial}</div>
      <div>
        <div class="profile-name">${escapeHTML(state.currentUser.name || 'User')}</div>
        <div class="profile-email">${escapeHTML(state.currentUser.email || '')}</div>
        <span class="profile-role-badge">${role}</span>
      </div>
    </div>
    <ul class="drawer-menu">
      <li><a href="../orders/orders.html"><span class="menu-icon">📦</span> My Orders</a></li>
      <li><a href="#"><span class="menu-icon">📍</span> Saved Addresses</a></li>
      <li><a href="#"><span class="menu-icon">❤️</span> Favourite Shops</a></li>
      <li><a href="#"><span class="menu-icon">🏷️</span> Coupons & Offers</a></li>
      <li><a href="#"><span class="menu-icon">⚙️</span> Account Settings</a></li>
      <li><a href="#"><span class="menu-icon">🎧</span> Help & Support</a></li>
      <li><button class="danger" onclick="logoutUser()"><span class="menu-icon">🚪</span> Log Out</button></li>
    </ul>`;

  document.getElementById('drawer-overlay').classList.add('open');
  document.getElementById('profile-drawer').classList.add('open');
  document.body.style.overflow = 'hidden';
}

window.openProfileDrawer = openProfileDrawer;

function closeProfileDrawer() {
  document.getElementById('drawer-overlay').classList.remove('open');
  document.getElementById('profile-drawer').classList.remove('open');
  document.body.style.overflow = '';
}

window.closeProfileDrawer = closeProfileDrawer;

function logoutUser() {
  if (confirm('Are you sure you want to log out?')) {
    localStorage.removeItem('quickdash_user');
    state.currentUser = null;
    closeProfileDrawer();
    renderAuthButton();
  }
}

window.logoutUser = logoutUser;

// ── Init ───────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', initTrackPage);
