// ── Room 6 Secure Checkout JavaScript ──────────────────────────────

const state = {
  currentUser: null,
  cart: {}, // { productId: qty }
  cartShopId: null,
  currentShop: null,
  rawTotal: 0,
  gst: 0,
  additionalDeliveryFee: 0,
  grandTotal: 0,
  
  // Mapping State
  map: null,
  marker: null,
  googleMap: null,
  googleMarker: null,
  initialCoords: { lat: 28.6139, lon: 77.2090 }, // New Delhi
  deliveryCoords: { lat: 28.6139, lon: 77.2090 },
  
  // Delivery Context
  recipientType: 'self', // 'self' or 'other'
  activeMethod: 'upi-qr' // 'upi-qr', 'upi-apps', 'card', 'netbanking'
};

// ── Initialize Page ────────────────────────────────────────────────
function initPaymentPage() {
  // Load User Profile
  loadUserProfile();

  // Load Cart details
  loadCartState();

  // If cart is empty, redirect
  if (Object.keys(state.cart).length === 0 || !state.cartShopId) {
    alert('🛒 Your cart is empty. Redirecting to Discover.');
    window.location.href = '../discover/discover.html';
    return;
  }

  // Calculate pricing breakdown & distances
  populateBillSummary();

  // Update footer messaging based on payment integration readiness
  updatePaymentIntegrationIndicator();

  // Load Map (Leaflet.js integration)
  initDeliveryMap();
}

// ── Load state from storage ────────────────────────────────────────
function loadCartState() {
  try {
    const savedCart = localStorage.getItem('quickdash_cart');
    const savedShop = localStorage.getItem('quickdash_cart_shop');

    if (savedCart && savedShop) {
      state.cart = JSON.parse(savedCart);
      state.cartShopId = savedShop;
      
      // Load current shop details from Master DB
      if (state.cartShopId) {
        state.currentShop = getShopById(state.cartShopId);
      }
    }
  } catch (e) {
    console.error('Failed to load cart state in payment:', e);
  }
}

// ── Populate pricing totals ────────────────────────────────────────
function populateBillSummary() {
  const storeProducts = getProductsForShop(state.cartShopId);
  
  let rawTotal = 0;
  
  Object.entries(state.cart).forEach(([prodId, qty]) => {
    if (qty <= 0) return;
    
    const product = getProductById(state.cartShopId, prodId);
    if (product) {
      rawTotal += product.price * qty;
    }
  });

  state.rawTotal = rawTotal;

  // Calculate taxes: GST 5%
  const gst = Math.round(rawTotal * 0.05);
  state.gst = gst;

  // Calculate Delivery Partner Fees: Base delivery ₹25
  const baseDelivery = rawTotal > 0 ? 25 : 0;
  
  // Calculate distance delivery: ₹10 per km for store distance > 3km
  let distVal = 0;
  let additionalDelivery = 0;

  if (state.currentShop) {
    distVal = state.currentShop.distance || 0;
    if (distVal > 3) {
      additionalDelivery = Math.ceil(distVal - 3) * 10;
    }
  }

  state.additionalDeliveryFee = additionalDelivery;

  // Show or hide additional distance row
  const additionalRow = document.getElementById('additional-delivery-row');
  if (additionalRow) {
    if (additionalDelivery > 0) {
      additionalRow.style.display = 'flex';
      document.getElementById('distance-value').textContent = distVal.toFixed(1);
      document.getElementById('summary-delivery-additional').textContent = `₹${additionalDelivery}`;
    } else {
      additionalRow.style.display = 'none';
    }
  }

  const grandTotal = rawTotal + gst + 5 + baseDelivery + additionalDelivery;
  state.grandTotal = grandTotal;

  // Render text
  const shopName = state.currentShop ? state.currentShop.name : 'Selected Store';
  document.getElementById('summary-shop-name').textContent = shopName;
  document.getElementById('qr-store-name').textContent = shopName;

  document.getElementById('summary-subtotal').textContent = `₹${rawTotal}`;
  document.getElementById('summary-gst').textContent = `₹${gst}`;
  document.getElementById('summary-total').textContent = `₹${grandTotal}`;
  
  // Update QR code price stamp
  document.getElementById('qr-amount-stamp').textContent = `₹${grandTotal}`;

  // Update Pay Button
  document.getElementById('btn-pay-now').textContent = `Pay ₹${grandTotal} Securely`;
}

// ── Initialize Map (Leaflet.js) ───────────────────────────────────
function initDeliveryMap() {
  const hasGoogleMaps = window.QuickDashIntegrations &&
    typeof window.QuickDashIntegrations.getGoogleMapsApiKey === 'function' &&
    window.QuickDashIntegrations.getGoogleMapsApiKey();

  if (hasGoogleMaps) {
    initGoogleDeliveryMap();
    return;
  }

  initLeafletDeliveryMap();
}

function initGoogleDeliveryMap() {
  const integrations = window.QuickDashIntegrations;
  if (!integrations || typeof integrations.loadGoogleMaps !== 'function') {
    initLeafletDeliveryMap();
    return;
  }

  integrations.loadGoogleMaps()
    .then(() => {
      const mapNode = document.getElementById('delivery-map');
      if (!mapNode) return;

      state.googleMap = new google.maps.Map(mapNode, {
        center: { lat: state.initialCoords.lat, lng: state.initialCoords.lon },
        zoom: 15,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false
      });

      state.googleMarker = new google.maps.Marker({
        position: { lat: state.initialCoords.lat, lng: state.initialCoords.lon },
        map: state.googleMap,
        draggable: true,
        title: 'Drag to your exact delivery location'
      });

      state.googleMarker.addListener('dragend', () => {
        const pos = state.googleMarker.getPosition();
        if (!pos) return;
        const lat = pos.lat();
        const lon = pos.lng();
        state.deliveryCoords = { lat, lon };

        integrations.reverseGeocodeGoogle(lat, lon)
          .then((address) => {
            const input = document.getElementById('delivery-address-input');
            if (input && address) input.value = address;
          })
          .catch(() => {
            // Fallback to prior Nominatim behavior if Google geocode fails.
            fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`)
              .then(r => r.json())
              .then(data => {
                if (!data) return;
                const text = data.display_name || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
                const input = document.getElementById('delivery-address-input');
                if (input) input.value = text;
              })
              .catch(err => console.error('Nominatim address fetch error:', err));
          });

        const distanceMoved = calculateDistance(state.initialCoords.lat, state.initialCoords.lon, lat, lon);
        if (distanceMoved > 0.08) {
          document.getElementById('recipient-question-modal').classList.add('open');
        }
      });
    })
    .catch((err) => {
      console.warn('Google Maps unavailable, falling back to Leaflet map:', err);
      initLeafletDeliveryMap();
    });
}

function initLeafletDeliveryMap() {
  try {
    // Check if Leaflet L namespace is available
    if (typeof L === 'undefined') {
      console.warn('Leaflet map library is currently unavailable.');
      return;
    }

    // Centered at Delhi coordinate center
    state.map = L.map('delivery-map', {
      zoomControl: true,
      scrollWheelZoom: false
    }).setView([state.initialCoords.lat, state.initialCoords.lon], 15);

    // Add OpenStreetMap tile layers
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(state.map);

    // Create a customizable, draggable marker
    state.marker = L.marker([state.initialCoords.lat, state.initialCoords.lon], {
      draggable: true
    }).addTo(state.map);

    // Bind popup label
    state.marker.bindPopup('<b>Your Delivery Entrance Pin</b><br>Drag me precisely to your gate.').openPopup();

    // Map dragend event handler
    state.marker.on('dragend', function (e) {
      const pos = state.marker.getLatLng();
      state.deliveryCoords = { lat: pos.lat, lon: pos.lng };
      
      // Perform geocoding to retrieve short display address
      fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.lat}&lon=${pos.lng}&format=json`)
        .then(r => r.json())
        .then(data => {
          if (data && data.address) {
            const addr = data.address;
            const short = [addr.house_number || addr.road, addr.suburb || addr.neighbourhood, addr.city || addr.town].filter(Boolean).join(', ');
            document.getElementById('delivery-address-input').value = short || data.display_name.split(',')[0];
          }
        })
        .catch(err => console.error('Nominatim address fetch error:', err));

      // Trigger "Is order for someone else?" modal if dragged > 80 meters (0.08km) from starting pin
      const distanceMoved = calculateDistance(state.initialCoords.lat, state.initialCoords.lon, pos.lat, pos.lng);
      if (distanceMoved > 0.08) {
        document.getElementById('recipient-question-modal').classList.add('open');
      }
    });

  } catch (err) {
    console.error('Failed to load Leaflet map:', err);
  }
}

function updatePaymentIntegrationIndicator() {
  const holder = document.querySelector('.razorpay-creds-indicator p');
  if (!holder) return;

  const hasRazorpay = !!(
    window.QuickDashIntegrations &&
    typeof window.QuickDashIntegrations.getRazorpayKeyId === 'function' &&
    window.QuickDashIntegrations.getRazorpayKeyId()
  );

  if (hasRazorpay) {
    holder.innerHTML = 'Razorpay Checkout is <strong>connected</strong>. Payment opens in a secure popup.';
  } else {
    holder.innerHTML = 'Razorpay key not configured. Using <strong>mock checkout fallback</strong>.';
  }
}

// ── Gifting / Recipient triggers ──────────────────────────────────
function toggleGiftOrderFields(isChecked) {
  state.recipientType = isChecked ? 'other' : 'self';
  
  const formBlock = document.getElementById('gift-details-form');
  const checkbox = document.getElementById('gift-order-toggle');
  
  if (formBlock && checkbox) {
    checkbox.checked = isChecked;
    formBlock.style.display = isChecked ? 'block' : 'none';
    
    // Auto-focus name field if checked
    if (isChecked) {
      document.getElementById('recipient-name').focus();
    }
  }
}

window.toggleGiftOrderFields = toggleGiftOrderFields;

function setRecipientType(type) {
  state.recipientType = type;
  
  // Dismiss modal
  document.getElementById('recipient-question-modal').classList.remove('open');
  
  if (type === 'other') {
    toggleGiftOrderFields(true);
  } else {
    toggleGiftOrderFields(false);
  }
}

window.setRecipientType = setRecipientType;

// ── Payment method selectors ──────────────────────────────────────
function selectPayMethod(method, cardElement) {
  state.activeMethod = method;

  // Toggle active class on cards
  document.querySelectorAll('.pay-method-card').forEach(card => card.classList.remove('active'));
  cardElement.classList.add('active');

  // Toggle Radio bullet status
  document.querySelectorAll('.pay-radio').forEach(r => r.classList.remove('checked'));
  const radio = cardElement.querySelector('.pay-radio');
  if (radio) radio.classList.add('checked');

  // Hide/Show body containers
  document.getElementById('body-upi-qr').style.display = method === 'upi-qr' ? 'block' : 'none';
  document.getElementById('body-upi-apps').style.display = method === 'upi-apps' ? 'block' : 'none';
  document.getElementById('body-card').style.display = method === 'card' ? 'block' : 'none';
  document.getElementById('body-netbanking').style.display = method === 'netbanking' ? 'block' : 'none';
}

window.selectPayMethod = selectPayMethod;

// ── UPI Verification Simulation ───────────────────────────────────
let isUpiVerified = false;

function verifyUPIId() {
  const input = document.getElementById('upi-id-input');
  const statusLabel = document.getElementById('upi-verify-status');
  
  if (!input || !statusLabel) return;
  
  const val = input.value.trim();
  if (!val) {
    statusLabel.textContent = '❌ Please enter a UPI ID.';
    statusLabel.className = 'upi-status-label error';
    isUpiVerified = false;
    return;
  }

  statusLabel.textContent = '⏳ Verifying UPI ID...';
  statusLabel.className = 'upi-status-label';

  setTimeout(() => {
    if (val.includes('@')) {
      statusLabel.textContent = '✅ UPI ID Verified: Mayukh Ghosh (verified)';
      statusLabel.className = 'upi-status-label success';
      isUpiVerified = true;
    } else {
      statusLabel.textContent = '❌ Invalid UPI ID. Missing @ handle suffix.';
      statusLabel.className = 'upi-status-label error';
      isUpiVerified = false;
    }
  }, 600);
}

window.verifyUPIId = verifyUPIId;

// ── Quick Pay app triggers ────────────────────────────────────────
function triggerDirectAppPay(appName) {
  // Simulates launching mobile GPay/Paytm application modal
  document.querySelectorAll('.btn-direct-app').forEach(btn => btn.style.borderColor = '');
  
  // Highlight clicked app
  event.currentTarget.style.borderColor = 'var(--g500)';
  
  // Auto pay after short delay
  setTimeout(() => {
    if (confirm(`⚡ Redirecting securely to ${appName} payment terminal...`)) {
      triggerCheckoutPlacedOverlay();
    }
  }, 400);
}

window.triggerDirectAppPay = triggerDirectAppPay;

// ── Popular Net Bank Quick Selects ────────────────────────────────
let selectedBankName = '';

function selectNetbank(bankName) {
  if (!bankName) return;
  selectedBankName = bankName;

  document.querySelectorAll('.btn-popular-bank').forEach(btn => btn.style.borderColor = '');
  
  // If clicked a button, highlight it
  if (event && event.currentTarget && event.currentTarget.className.includes('btn-popular-bank')) {
    event.currentTarget.style.borderColor = 'var(--g500)';
  } else {
    // Selected from dropdown, update select value
    document.getElementById('other-banks-select').value = bankName;
  }

  // Auto trigger after select
  setTimeout(() => {
    if (confirm(`🏦 Redirecting to secure ${bankName} netbanking login page...`)) {
      triggerCheckoutPlacedOverlay();
    }
  }, 400);
}

window.selectNetbank = selectNetbank;

// ── Card Inputs Text Formatters ────────────────────────────────────
function formatCardNumber(input) {
  let val = input.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
  let formatted = '';
  for (let i = 0; i < val.length; i++) {
    if (i > 0 && i % 4 === 0) formatted += ' ';
    formatted += val[i];
  }
  input.value = formatted;
}

window.formatCardNumber = formatCardNumber;

function formatExpiry(input) {
  let val = input.value.replace(/\//g, '').replace(/[^0-9]/gi, '');
  if (val.length >= 2) {
    input.value = val.substring(0, 2) + '/' + val.substring(2, 4);
  } else {
    input.value = val;
  }
}

window.formatExpiry = formatExpiry;

// ── Trigger Mock Payment Submit ───────────────────────────────────
function triggerMockPayment() {
  const address = document.getElementById('delivery-address-input').value.trim();
  if (!address) {
    alert('📍 Please enter a valid delivery address details.');
    return;
  }

  // Validate fields based on checkout type
  if (state.activeMethod === 'upi-qr') {
    const upiId = document.getElementById('upi-id-input').value.trim();
    if (upiId && !isUpiVerified) {
      alert('📱 Please verify your UPI ID first or scan the QR Code directly.');
      return;
    }
  } else if (state.activeMethod === 'card') {
    const cardNum = document.getElementById('card-num').value.trim();
    const exp = document.getElementById('card-exp').value.trim();
    const cvv = document.getElementById('card-cvv').value.trim();
    const name = document.getElementById('card-name').value.trim();

    if (!cardNum || !exp || !cvv || !name) {
      alert('💳 Please fill in all credit card inputs.');
      return;
    }
    if (cardNum.length < 15) {
      alert('🔒 Card number appears too short.');
      return;
    }
    if (cvv.length < 3) {
      alert('🔒 Security code (CVV) should be 3 digits.');
      return;
    }
  }

  // Verification passed — prefer real Razorpay checkout if configured.
  if (launchRazorpayCheckout()) return;
  triggerCheckoutPlacedOverlay();
}

window.triggerMockPayment = triggerMockPayment;

function launchRazorpayCheckout() {
  const integrations = window.QuickDashIntegrations;
  if (!integrations || typeof integrations.openRazorpayCheckout !== 'function') {
    return false;
  }

  const keyId = integrations.getRazorpayKeyId();
  if (!keyId) return false;

  const orderRef = `qd_${Date.now()}`;
  try {
    integrations.openRazorpayCheckout({
      amountPaise: state.grandTotal * 100,
      orderRef,
      description: state.currentShop ? `Order from ${state.currentShop.name}` : 'QuickDash order',
      prefill: {
        name: state.currentUser?.name || '',
        email: state.currentUser?.email || '',
        contact: state.currentUser?.phone || ''
      },
      onSuccess: function () {
        triggerCheckoutPlacedOverlay();
      },
      onDismiss: function () {
        console.log('Razorpay checkout dismissed by user.');
      }
    });
    return true;
  } catch (e) {
    console.error('Razorpay launch failed. Falling back to mock flow.', e);
    return false;
  }
}

// ── Overlay Tick Animation & Order state writing ────────────────
function triggerCheckoutPlacedOverlay() {
  const address = document.getElementById('delivery-address-input').value.trim();
  const landmark = document.getElementById('delivery-landmark-input').value.trim();

  // Recipient check logic
  let finalName = state.currentUser ? state.currentUser.name : 'Customer';
  let finalPhone = state.currentUser ? state.currentUser.phone || '9876543210' : '9876543210';

  if (state.recipientType === 'other') {
    const rName = document.getElementById('recipient-name').value.trim();
    const rPhone = document.getElementById('recipient-phone').value.trim();
    
    if (!rName || !rPhone) {
      alert('🎁 Gifting details missing. Please enter recipient name and phone number.');
      return;
    }
    if (rPhone.length < 10) {
      alert('📞 Recipient phone number should be a valid 10-digit mobile number.');
      return;
    }
    
    finalName = rName;
    finalPhone = rPhone;
  }

  // Map the actual cart items
  const storeProducts = typeof getProductsForShop === 'function' ? getProductsForShop(state.cartShopId) : [];
  const items = [];
  Object.entries(state.cart).forEach(([prodId, qty]) => {
    if (qty <= 0) return;
    const product = getProductById(state.cartShopId, prodId);
    if (product) {
      items.push({
        id: product.id,
        name: product.name,
        price: product.price,
        qty: qty,
        img: product.img || ''
      });
    }
  });

  // Create persistent tracking state inside localStorage
  const activeOrder = {
    shopId: state.cartShopId,
    shopName: state.currentShop ? state.currentShop.name : 'Selected Store',
    shopPhoto: state.currentShop ? state.currentShop.photo : '',
    shopLat: state.currentShop ? state.currentShop.lat : 28.6150,
    shopLon: state.currentShop ? state.currentShop.lon : 77.2120,
    subtotal: state.rawTotal,
    gst: state.gst,
    platformFee: 5,
    baseDelivery: 25,
    additionalDelivery: state.additionalDeliveryFee,
    grandTotal: state.grandTotal,
    deliveryAddress: address,
    landmark: landmark,
    recipientName: finalName,
    recipientPhone: finalPhone,
    recipientType: state.recipientType,
    timestamp: Date.now(),
    stage: 0, // Starting stage: Store owner accepted order
    items: items
  };

  try {
    localStorage.setItem('quickdash_active_order', JSON.stringify(activeOrder));
    
    // WIPE finished cart from local storage
    localStorage.removeItem('quickdash_cart');
    localStorage.removeItem('quickdash_cart_shop');
  } catch (e) {
    console.error('Failed to update tracking / cart structures:', e);
  }

  // Display fullscreen checkmark tick and quote "order placed"
  const overlay = document.getElementById('order-placed-overlay');
  if (overlay) {
    overlay.classList.add('open');
  }

  // Smooth redirect to Track My Order (Room 7) after 2.5s
  setTimeout(() => {
    if (overlay) overlay.classList.remove('open');
    window.location.href = '../track/track.html';
  }, 2500);
}

// ── Profile Drawer Support ─────────────────────────────────────────
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
      </button>
    `;
  } else {
    container.innerHTML = `
      <button class="btn-auth" id="auth-btn" onclick="window.location.href='../signup/signin.html'">
        Sign Up / Log In
      </button>
    `;
  }
}

function openProfileDrawer() {
  if (!state.currentUser) return;

  const body = document.getElementById('drawer-body');
  const initial = (state.currentUser.name || 'U').charAt(0).toUpperCase();
  const roleLabel = state.currentUser.role === 'merchant' ? '🏪 Merchant' : '🛍️ Customer';

  body.innerHTML = `
    <div class="profile-info-row">
      <div class="profile-avatar-lg">${initial}</div>
      <div>
        <div class="profile-name">${escapeHTML(state.currentUser.name || 'User')}</div>
        <div class="profile-email">${escapeHTML(state.currentUser.email || '')}</div>
        <span class="profile-role-badge">${roleLabel}</span>
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
    </ul>
  `;

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

// Initialize on DOM Loaded
document.addEventListener('DOMContentLoaded', initPaymentPage);
