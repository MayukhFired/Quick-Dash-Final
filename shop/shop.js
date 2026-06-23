// ── Room 4 Details Page Interactivity ──────────────────────────────

// Page State Management
const state = {
  currentShop: null,
  products: [],
  cart: {}, // { productId: qty }
  cartShopId: null, // Shop ID currently linked to cart
  activeSort: 'default', // 'default' (popularity), 'price-low', 'price-high', 'top-rated'
  currentUser: null
};

// Category Metadata Matching discover.js and database.js
const CATEGORY_NAMES = {
  'fruits-veg': 'Fruits & Vegetables',
  'dairy-bread': 'Dairy, Bread & Eggs',
  'snacks': 'Munchies & Snacks',
  'drinks': 'Cold Drinks & Juices',
  'meat-fish': 'Meat, Fish & Eggs',
  'kitchen': 'Kitchen & Staples',
  'bakery': 'Bakery & Sweets',
  'instant-food': 'Instant & Frozen Food',
  'personal-care': 'Personal Care & Wellness',
  'cleaning': 'Cleaning & Household',
  'baby-care': 'Baby Care',
  'home-lifestyle': 'Home & Lifestyle',
  'cafe': 'Cafe & Bistro',
  'grocery': 'Grocery & Kirana'
};

// ── Read URL Query & Initialize ───────────────────────────────────
function initShopPage() {
  const params = new URLSearchParams(window.location.search);
  const shopId = params.get('store');

  if (!shopId) {
    alert('Invalid Store selection. Returning to Discover.');
    window.location.href = '../discover/discover.html';
    return;
  }

  // Load user profile
  loadUserProfile();

  // Fetch shop metadata
  state.currentShop = getShopById(shopId);
  if (!state.currentShop) {
    alert('Selected shop not found. Returning to Discover.');
    window.location.href = '../discover/discover.html';
    return;
  }

  // Load cart state from localStorage
  loadCartState();

  // Load shop products
  state.products = getProductsForShop(shopId);

  // Set page titles
  document.title = `${state.currentShop.name} — QuickDash`;
  document.getElementById('header-shop-name').textContent = state.currentShop.name;
  document.getElementById('header-shop-rating').textContent = `⭐ ${state.currentShop.rating}`;

  // Render hero banner & product sections
  renderShopHero();
  renderProductsGrid();
  updateCartBarUI();
}

// ── Render Hero Details ──────────────────────────────────────────
function renderShopHero() {
  const heroContainer = document.getElementById('shop-info-hero');
  if (!heroContainer) return;

  const shop = state.currentShop;
  const statusLabel = shop.isOpen ? '🟢 OPEN NOW' : '🔴 CLOSED';

  heroContainer.innerHTML = `
    <span class="shop-hero-category">${shop.category}</span>
    <h1 class="shop-hero-name">${escapeHTML(shop.name)}</h1>
    <div class="shop-hero-details-row">
      <span>⭐ ${shop.rating} (${shop.reviewsCount} reviews)</span>
      <span class="shop-hero-divider">|</span>
      <span>📍 ${shop.distance.toFixed(1)} km away</span>
      <span class="shop-hero-divider">|</span>
      <span>${statusLabel}</span>
      <span class="shop-hero-divider">|</span>
      <span>⚡ Delivery in 10-30 mins</span>
    </div>
  `;
}

// ── Render Products & Sorting ──────────────────────────────────────
function renderProductsGrid() {
  const catalogContainer = document.getElementById('shop-catalog-sections');
  if (!catalogContainer) return;

  if (state.products.length === 0) {
    catalogContainer.innerHTML = `
      <div style="text-align: center; padding: 4rem 1rem; color: var(--gray-400);">
        <div style="font-size: 3rem; margin-bottom: 1rem;">🏪</div>
        <h3 style="font-family: var(--font-h); font-weight: 700; color: var(--g900);">No products found in this store</h3>
        <p style="font-size: 0.85rem; margin-top: 0.25rem;">This store hasn't listed any items yet.</p>
      </div>
    `;
    return;
  }

  // Copy products array to avoid mutating database source
  let displayList = [...state.products];

  // Apply sorting algorithms
  if (state.activeSort === 'price-low') {
    displayList.sort((a, b) => a.price - b.price);
  } else if (state.activeSort === 'price-high') {
    displayList.sort((a, b) => b.price - a.price);
  } else if (state.activeSort === 'top-rated') {
    // Top-rated sorts by shop average rating or stock level high first
    displayList.sort((a, b) => (b.stock === 'high' ? 1 : 0) - (a.stock === 'high' ? 1 : 0));
  } else {
    // Default popularity sorting: in-stock first, then out of stock last
    displayList.sort((a, b) => (a.stock === 'out' ? 1 : 0) - (b.stock === 'out' ? 1 : 0));
  }

  // Group products by category keys
  const grouped = {};
  displayList.forEach(prod => {
    const catKey = prod.category || 'other';
    if (!grouped[catKey]) grouped[catKey] = [];
    grouped[catKey].push(prod);
  });

  // Build grid HTML
  catalogContainer.innerHTML = Object.entries(grouped).map(([catKey, items]) => {
    const cleanSectionTitle = CATEGORY_NAMES[catKey] || catKey.charAt(0).toUpperCase() + catKey.slice(1);

    const itemsHTML = items.map(p => {
      const qty = state.cart[p.id] || 0;
      const isOut = p.stock === 'out';
      const cardClass = isOut ? 'disabled' : '';
      const overlayHTML = isOut ? `<div class="product-card-out-overlay"><span class="product-out-stamp">Out of Stock</span></div>` : '';

      // Stock Label
      let stockClass = p.stock;
      let stockLabelText = `${p.stock} stock`;
      if (p.stock === 'high') stockLabelText = 'High stock';
      if (p.stock === 'medium') stockLabelText = 'Medium stock';
      if (p.stock === 'low') stockLabelText = 'Low stock';
      if (p.stock === 'out') stockLabelText = 'Out of Stock';

      // Action Area Add or Quantity Selector
      const actionHTML = qty > 0 ? `
        <div class="product-qty-adjuster">
          <button class="product-qty-btn" onclick="updateItemQuantity('${p.id}', ${qty - 1})">-</button>
          <span class="product-qty-val">${qty}</span>
          <button class="product-qty-btn" onclick="updateItemQuantity('${p.id}', ${qty + 1})">+</button>
        </div>
      ` : `
        <button class="btn-product-add" onclick="handleAddToCartClick('${p.id}')">ADD</button>
      `;

      return `
        <div class="product-card ${cardClass}" id="card-${p.id}">
          ${overlayHTML}
          <div class="product-card-photo-wrapper">
            <img src="${p.img}" alt="${p.name}" class="product-card-photo" loading="lazy" />
          </div>
          <div class="product-card-details">
            <span class="stock-indicator ${stockClass}">${stockLabelText}</span>
            <h3 class="product-card-name">${escapeHTML(p.name)}</h3>
            <p class="product-card-desc">${escapeHTML(p.desc)}</p>
            <div class="product-card-pricing-row">
              <span class="product-card-price">₹${p.price}</span>
              <div class="product-action-wrapper" id="action-${p.id}">
                ${actionHTML}
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    return `
      <section class="category-section-block">
        <h2 class="category-section-title">${cleanSectionTitle}</h2>
        <div class="products-grid">
          ${itemsHTML}
        </div>
      </section>
    `;
  }).join('');
}

// ── Sorting Button Handlers ────────────────────────────────────────
function handleSortChange(sortType, btnElement) {
  state.activeSort = sortType;

  // Toggle active styling
  document.querySelectorAll('.sort-btn').forEach(btn => btn.classList.remove('active'));
  btnElement.classList.add('active');

  // Re-render items
  renderProductsGrid();
}

// ── Cart Interactivity (Single Store Constraint) ────────────────────
let pendingProductId = null; // Store temp id for warning swaps

function handleAddToCartClick(productId) {
  const targetProduct = getProductById(state.currentShop?.id, productId);
  if (!targetProduct) return;

  if (!state.currentShop?.isOpen) {
    alert('This store is currently closed. You cannot add items right now.');
    return;
  }

  if (targetProduct.stock === 'out') {
    alert('This item is out of stock.');
    return;
  }

  // Enforce single shop ordering constraint!
  if (state.cartShopId && state.cartShopId !== targetProduct.shopId && Object.keys(state.cart).length > 0) {
    // Open single shop alert warning modal
    pendingProductId = productId;
    
    const prevShop = getShopById(state.cartShopId);
    document.getElementById('warning-prev-shop').textContent = prevShop ? prevShop.name : 'another store';
    
    document.getElementById('warning-modal').classList.add('open');
    return;
  }

  // Safe to add!
  state.cartShopId = targetProduct.shopId;
  updateItemQuantity(productId, 1);
}

function updateItemQuantity(productId, newQty) {
  if (newQty > 0) {
    const product = getProductById(state.currentShop?.id, productId);
    if (!product || product.stock === 'out') {
      alert('This item is out of stock.');
      return;
    }
  }

  if (newQty <= 0) {
    delete state.cart[productId];
  } else {
    state.cart[productId] = newQty;
  }

  // Sync to localStorage
  saveCartState();

  // Re-render this specific action container instead of complete redraw to preserve scrolling
  const actionWrapper = document.getElementById(`action-${productId}`);
  if (actionWrapper) {
    if (newQty > 0) {
      actionWrapper.innerHTML = `
        <div class="product-qty-adjuster">
          <button class="product-qty-btn" onclick="updateItemQuantity('${productId}', ${newQty - 1})">-</button>
          <span class="product-qty-val">${newQty}</span>
          <button class="product-qty-btn" onclick="updateItemQuantity('${productId}', ${newQty + 1})">+</button>
        </div>
      `;
    } else {
      actionWrapper.innerHTML = `<button class="btn-product-add" onclick="handleAddToCartClick('${productId}')">ADD</button>`;
    }
  }

  // Update complete bottom cart bar
  updateCartBarUI();
}

function updateCartBarUI() {
  const bar = document.getElementById('floating-cart-bar');
  const qtyText = document.getElementById('cart-bar-qty');
  const totalText = document.getElementById('cart-bar-total');
  if (!bar || !qtyText || !totalText) return;

  let totalItems = 0;
  let totalPrice = 0;

  for (const [id, qty] of Object.entries(state.cart)) {
    const prod = getProductById(state.currentShop?.id, id);
    if (prod) {
      totalItems += qty;
      totalPrice += prod.price * qty;
    }
  }

  if (totalItems > 0 && state.cartShopId === state.currentShop.id) {
    qtyText.textContent = `${totalItems} item${totalItems !== 1 ? 's' : ''} added`;
    totalText.textContent = `₹${totalPrice}`;
    bar.classList.add('active');
  } else {
    // Hide bar if cart is empty or belongs to another store
    bar.classList.remove('active');
  }
}

// ── Warn Overrides ─────────────────────────────────────────────────
function closeWarningModal() {
  document.getElementById('warning-modal').classList.remove('open');
  pendingProductId = null;
}

function confirmCartClearAndSwap() {
  // Clear cart entirely
  state.cart = {};
  state.cartShopId = null;

  const targetProduct = getProductById(state.currentShop?.id, pendingProductId);
  if (targetProduct) {
    state.cartShopId = targetProduct.shopId;
    state.cart[pendingProductId] = 1;
  }

  saveCartState();
  closeWarningModal();
  
  // Re-render complete page to synchronize correct item layouts
  renderProductsGrid();
  updateCartBarUI();
}

// ── State Sync ─────────────────────────────────────────────────────
function loadCartState() {
  try {
    const savedCart = localStorage.getItem('quickdash_cart');
    const savedShop = localStorage.getItem('quickdash_cart_shop');
    
    if (savedCart && savedShop) {
      state.cart = JSON.parse(savedCart);
      state.cartShopId = savedShop;
    }
  } catch (e) {
    console.error('Failed to load cart state:', e);
  }
}

function saveCartState() {
  try {
    if (Object.keys(state.cart).length === 0) {
      localStorage.removeItem('quickdash_cart');
      localStorage.removeItem('quickdash_cart_shop');
      state.cartShopId = null;
    } else {
      localStorage.setItem('quickdash_cart', JSON.stringify(state.cart));
      localStorage.setItem('quickdash_cart_shop', state.cartShopId || '');
    }
  } catch (e) {
    console.error('Failed to save cart state:', e);
  }
}

function handleCheckout() {
  let totalItems = 0;

  for (const [id, qty] of Object.entries(state.cart)) {
    const prod = getProductById(state.currentShop?.id, id);
    if (prod) totalItems += qty;
  }

  if (totalItems === 0) return;

  // Redirect to the newly created Cart Page (Room 5)
  window.location.href = '../cart/cart.html';
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

function closeProfileDrawer() {
  document.getElementById('drawer-overlay').classList.remove('open');
  document.getElementById('profile-drawer').classList.remove('open');
  document.body.style.overflow = '';
}

function logoutUser() {
  if (confirm('Are you sure you want to log out?')) {
    localStorage.removeItem('quickdash_user');
    state.currentUser = null;
    closeProfileDrawer();
    renderAuthButton();
  }
}

// Initialize on DOM Loaded
document.addEventListener('DOMContentLoaded', initShopPage);
