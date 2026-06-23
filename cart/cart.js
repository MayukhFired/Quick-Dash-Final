// ── Room 5 Dedicated Cart Page Logic ────────────────────────────────

const state = {
  currentUser: null,
  cart: {}, // { productId: qty }
  cartShopId: null, // Shop ID linked to cart
  currentShop: null, // Shop details
  products: [] // Cached products in the active cart
};

// ── Initialize Page ────────────────────────────────────────────────
function initCartPage() {
  // Load user info for header profile
  loadUserProfile();

  // Load cart state
  loadCartState();

  // Render the initial UI
  renderCartContent();
}

// ── Cart State Sync & Load ─────────────────────────────────────────
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
    } else {
      state.cart = {};
      state.cartShopId = null;
      state.currentShop = null;
    }
  } catch (e) {
    console.error('Failed to load cart state:', e);
    state.cart = {};
    state.cartShopId = null;
    state.currentShop = null;
  }
}

function saveCartState() {
  try {
    // If cart is empty, clean storage completely
    if (Object.keys(state.cart).length === 0) {
      localStorage.removeItem('quickdash_cart');
      localStorage.removeItem('quickdash_cart_shop');
      state.cartShopId = null;
      state.currentShop = null;
    } else {
      localStorage.setItem('quickdash_cart', JSON.stringify(state.cart));
      localStorage.setItem('quickdash_cart_shop', state.cartShopId || '');
    }
  } catch (e) {
    console.error('Failed to save cart state:', e);
  }
}

// ── Render Cart UI Content ──────────────────────────────────────────
function renderCartContent() {
  const activeLayout = document.getElementById('cart-active-layout');
  const emptyView = document.getElementById('cart-empty-view');
  
  if (!activeLayout || !emptyView) return;

  const itemKeys = Object.keys(state.cart);

  // 1. Check if Cart is Empty
  if (itemKeys.length === 0 || !state.cartShopId) {
    activeLayout.style.display = 'none';
    emptyView.style.display = 'flex';
    return;
  }

  // Cart is active!
  activeLayout.style.display = 'grid';
  emptyView.style.display = 'none';

  // Update Store Badge in Left Column
  const storeBadge = document.getElementById('cart-store-badge');
  if (storeBadge) {
    if (state.currentShop) {
      storeBadge.innerHTML = `🏪 <strong>${escapeHTML(state.currentShop.name)}</strong> <span style="margin-left: 0.25rem;">⭐ ${state.currentShop.rating}</span>`;
    } else if (state.cartShopId === 'merchant-shop-active') {
      storeBadge.innerHTML = `🏪 <strong>My Merchant Shop</strong>`;
    } else {
      storeBadge.innerHTML = `🏪 Store Details`;
    }
  }

  // 2. Fetch all cart products and calculate price totals
  const itemsListContainer = document.getElementById('cart-items-list');
  if (!itemsListContainer) return;

  // Retrieve products list from store (including merchant test products if needed)
  const storeProducts = getProductsForShop(state.cartShopId);
  
  let rawTotal = 0;
  let itemsHTML = '';

  itemKeys.forEach(prodId => {
    const qty = state.cart[prodId];
    if (qty <= 0) return;

    // Retrieve product metadata from global DB or shop-specific DB (for merchant added products)
    const product = getProductById(state.cartShopId, prodId);

    if (product) {
      const lineTotal = product.price * qty;
      rawTotal += lineTotal;

      let stockBadgeClass = product.stock;
      let stockLabel = 'In Stock';
      if (product.stock === 'high') stockLabel = 'High Stock';
      if (product.stock === 'medium') stockLabel = 'Medium Stock';
      if (product.stock === 'low') stockLabel = 'Low Stock';
      if (product.stock === 'out') stockLabel = 'Out of Stock';

      itemsHTML += `
        <div class="cart-item-card" id="cart-card-${product.id}">
          <div class="cart-item-photo-wrapper">
            <img src="${product.img}" alt="${escapeHTML(product.name)}" class="cart-item-photo" loading="lazy" />
          </div>
          <div class="cart-item-details">
            <h3 class="cart-item-name">${escapeHTML(product.name)}</h3>
            <span class="stock-indicator ${stockBadgeClass}" style="margin: 0.15rem 0 0.35rem 0; width: fit-content; display: inline-block;">${stockLabel}</span>
            <div class="cart-item-price-desc">₹${product.price} / unit</div>
          </div>
          <div class="cart-item-actions-row">
            <div class="cart-item-qty-adjuster">
              <button class="cart-item-qty-btn" onclick="updateItemQty('${product.id}', ${qty - 1})">-</button>
              <span class="cart-item-qty-val">${qty}</span>
              <button class="cart-item-qty-btn" onclick="updateItemQty('${product.id}', ${qty + 1})">+</button>
            </div>
            <div class="cart-item-total-price">₹${lineTotal}</div>
            <button class="cart-item-remove-btn" onclick="removeItem('${product.id}')" aria-label="Remove item">
              🗑️
            </button>
          </div>
        </div>
      `;
    }
  });

  itemsListContainer.innerHTML = itemsHTML || `
    <div style="text-align: center; padding: 2rem 0; color: var(--gray-400);">
      No items found in this cart.
    </div>
  `;

  // 3. Compute fees (aligned with payment page)
  const gst = rawTotal > 0 ? Math.round(rawTotal * 0.05) : 0;
  const deliveryFee = rawTotal > 0 ? 25 : 0;
  const platformFee = rawTotal > 0 ? 5 : 0;
  let additionalDelivery = 0;
  const shopDist = state.currentShop?.distance ?? 0;
  if (rawTotal > 0 && shopDist > 3) {
    additionalDelivery = Math.ceil(shopDist - 3) * 10;
  }
  const grandTotal = rawTotal + gst + deliveryFee + platformFee + additionalDelivery;

  // 4. Update Bill Card Displays
  document.getElementById('bill-raw-total').textContent = `₹${rawTotal}`;
  const gstEl = document.getElementById('bill-gst');
  if (gstEl) gstEl.textContent = `₹${gst}`;
  document.getElementById('bill-delivery-fee').textContent = `₹${deliveryFee}`;
  const additionalRow = document.getElementById('bill-additional-delivery-row');
  if (additionalRow) {
    if (additionalDelivery > 0) {
      additionalRow.style.display = 'flex';
      document.getElementById('bill-additional-delivery').textContent = `₹${additionalDelivery}`;
    } else {
      additionalRow.style.display = 'none';
    }
  }
  document.getElementById('bill-grand-total').textContent = `₹${grandTotal}`;
}

// ── Cart Modification Actions ─────────────────────────────────────
function updateItemQty(productId, newQty) {
  if (newQty <= 0) {
    delete state.cart[productId];
  } else {
    state.cart[productId] = newQty;
  }

  // Update storage & Redraw UI
  saveCartState();
  renderCartContent();
}

function removeItem(productId) {
  if (confirm('Remove this product from your cart?')) {
    updateItemQty(productId, 0);
  }
}

// ── Check Routing & Checkout Action ───────────────────────────────
function handleProceedToPay() {
  const itemKeys = Object.keys(state.cart);
  if (itemKeys.length === 0) {
    alert('Your cart is empty. Sift through nearby stores first.');
    return;
  }

  // Go to Payment Page (will create a premium placeholder payment page next to avoid 404s!)
  window.location.href = '../payment/payment.html';
}

// ── Profile Drawer & Session Support ─────────────────────────────────
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

// Re-expose profile helper closures on window so inline onclick bindings function
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

// Initialize on Document Load
document.addEventListener('DOMContentLoaded', initCartPage);
