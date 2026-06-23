// ── Room 9: Store Owner Dashboard Controller ─────────────────────

const state = {
  currentUser: null,
  activeTab: 'terminal',      // 'terminal' | 'inventory' | 'history'
  customShop: null,           // parsed shop object synced to Master DB
  inventory: [],              // unified products registered under this shop
  incomingOrder: null,        // active customer order polled from storage
  selectedHistoryOrder: null, // selected receipt card in History tab
  historyFilter: 'all',       // 'all' | 'Accepted' | 'Denied'
  terminalPollInterval: null  // interval handle
};

// ── Master Categories mapping ─────────────────────────────────────
const CATEGORY_MAP = {
  'grocery': '🛒 Grocery / Kirana',
  'pharmacy': '💊 Pharmacy / Medical',
  'bakery': '🍞 Bakery & Confectionery',
  'fruits': '🍎 Fruits & Vegetables',
  'electronics': '💡 Electronics & Repair',
  'clothing': '👕 Clothing & Textiles',
  'restaurant': '🍛 Restaurant / Tiffin',
  'hardware': '🔧 Hardware & Tools',
  'stationery': '✏️ Stationery & Books',
  'other': '🏪 Other'
};

// ── Master Coordinate Center default ──────────────────────────────
const MERCHANT_LOCATION = { lat: 28.6150, lon: 77.2120 };

// ── Initialize Page ────────────────────────────────────────────────
function initMerchantPage() {
  loadUserProfile();

  // Route security: only merchants can access this room!
  if (!state.currentUser || state.currentUser.role !== 'merchant') {
    alert('🔒 Access Denied. This dashboard is reserved for verified Store Owners.');
    window.location.href = '../discover/discover.html';
    return;
  }

  // Check Approval State
  if (state.currentUser.isApproved === false) {
    showOnboardingScreen();
    return;
  }

  // Active Approved Store setup
  document.getElementById('onboarding-overlay').style.display = 'none';
  document.getElementById('merchant-main-view').style.display = 'block';

  syncStoreDatabase();
  loadStoreCatalog();
  renderStoreOverview();
  renderProductsGrid();
  renderHistoryList();

  // Start polling incoming active orders
  startTerminalPolling();
}

// ── Profile and Drawer ─────────────────────────────────────────────
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
  }
}

function openProfileDrawer() {
  if (!state.currentUser) return;
  const body    = document.getElementById('drawer-body');
  const initial = (state.currentUser.name || 'U').charAt(0).toUpperCase();
  const role    = '🏪 Merchant';

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
    window.location.href = '../discover/discover.html';
  }
}

window.logoutUser = logoutUser;

// ── Onboarding / Verification Simulator ────────────────────────────
function showOnboardingScreen() {
  document.getElementById('onboarding-overlay').style.display = 'block';
  document.getElementById('merchant-main-view').style.display = 'none';

  const user = state.currentUser;
  setText('onboard-shop-name', user.shopName || 'Sharma Kirana Store');
  setText('onboard-owner-photo', `✅ ${user.ownerPhoto || 'owner_photo.jpg'}`);
  setText('onboard-store-photo', `✅ ${user.shopPhoto || 'store_photo.jpg'}`);
  setText('onboard-aadhaar', `✅ ${user.aadhaarFile || 'aadhaar_card.pdf'}`);
  setText('onboard-upi', user.upiId || 'sharmastore@okaxis');
}

function simulateAdminApproval(approve) {
  if (approve) {
    state.currentUser.isApproved = true;
    localStorage.setItem('quickdash_user', JSON.stringify(state.currentUser));
    alert('🎉 Congratulations! Your store has been verified and approved by the admin team. Loading dashboard...');
    window.location.reload();
  } else {
    const reason = prompt('Specify rejection reason:', 'Document scan blurred');
    if (reason) {
      alert(`❌ Store registration rejected. Reason: ${reason}. Please sign up again with clear files.`);
      localStorage.removeItem('quickdash_user');
      window.location.href = '../signup/signup.html';
    }
  }
}

window.simulateAdminApproval = simulateAdminApproval;

// ── Store database alignment ──────────────────────────────────────
function syncStoreDatabase() {
  const user = state.currentUser;
  const shopId = `custom-merchant-store`; // unique merchant ID mapping
  
  try {
    let customShops = JSON.parse(localStorage.getItem('quickdash_custom_shops') || '[]');
    let current = customShops.find(s => s.id === shopId);

    if (!current) {
      current = {
        id: shopId,
        name: user.shopName,
        category: user.category || 'grocery',
        photo: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500',
        lat: MERCHANT_LOCATION.lat,
        lon: MERCHANT_LOCATION.lon,
        rating: 4.8,
        reviewsCount: 12,
        avgProductValue: 120,
        isOpen: true // default status is OPEN
      };
      customShops.push(current);
      localStorage.setItem('quickdash_custom_shops', JSON.stringify(customShops));
    }
    
    state.customShop = current;
  } catch (e) {
    console.error('Failed to sync custom shop db:', e);
  }
}

function renderStoreOverview() {
  const shop = state.customShop;
  const user = state.currentUser;

  setText('merchant-shop-name', shop.name);
  setText('merchant-shop-category', CATEGORY_MAP[shop.category] || '🏪 Store');
  setText('merchant-upi-label', user.upiId || 'sharmastore@okaxis');

  // Facade image
  const img = document.getElementById('merchant-facade');
  if (img && shop.photo) {
    img.src = shop.photo;
  }

  // Open/Close toggle checkbox state
  const cb = document.getElementById('store-isOpen-checkbox');
  if (cb) {
    cb.checked = shop.isOpen;
    updateToggleLabel(shop.isOpen);
  }
}

// ── Toggle Open / Close status ─────────────────────────────────────
function toggleStoreOpenClose(isOpen) {
  state.customShop.isOpen = isOpen;
  updateToggleLabel(isOpen);

  try {
    let customShops = JSON.parse(localStorage.getItem('quickdash_custom_shops') || '[]');
    const idx = customShops.findIndex(s => s.id === state.customShop.id);
    if (idx !== -1) {
      customShops[idx].isOpen = isOpen;
      localStorage.setItem('quickdash_custom_shops', JSON.stringify(customShops));
    }
  } catch (e) {
    console.error('Failed to update shop isOpen status:', e);
  }
}

window.toggleStoreOpenClose = toggleStoreOpenClose;

function updateToggleLabel(isOpen) {
  const text = document.getElementById('toggle-status-text');
  if (text) {
    text.textContent = isOpen ? 'STORE OPEN' : 'STORE CLOSED';
    text.className = isOpen ? 'status-indicator-text open' : 'status-indicator-text closed';
  }
}

// ── Edit Profile Form ──────────────────────────────────────────────
function openEditShopModal() {
  const modal = document.getElementById('edit-profile-modal');
  if (modal) {
    modal.classList.add('open');
    document.getElementById('edit-name').value = state.customShop.name;
    document.getElementById('edit-category').value = state.customShop.category;
    document.getElementById('edit-upi').value = state.currentUser.upiId || '';
  }
}

window.openEditShopModal = openEditShopModal;

function closeEditShopModal() {
  const modal = document.getElementById('edit-profile-modal');
  if (modal) modal.classList.remove('open');
}

window.closeEditShopModal = closeEditShopModal;

function submitStoreEdits(e) {
  e.preventDefault();
  
  const newName = document.getElementById('edit-name').value.trim();
  const newCategory = document.getElementById('edit-category').value;
  const newUpi = document.getElementById('edit-upi').value.trim();

  if (!newName || !newUpi) return;

  // Trigger admin re-review banner
  alert('⚠️ Profile changes submitted! Your shop details are currently in review by the admin team. Your store will temporarily remain unapproved.');
  
  // Save details and set Approved to false
  state.currentUser.shopName = newName;
  state.currentUser.category = newCategory;
  state.currentUser.upiId = newUpi;
  state.currentUser.isApproved = false;

  try {
    localStorage.setItem('quickdash_user', JSON.stringify(state.currentUser));
    
    // Update shop db details
    let customShops = JSON.parse(localStorage.getItem('quickdash_custom_shops') || '[]');
    const idx = customShops.findIndex(s => s.id === state.customShop.id);
    if (idx !== -1) {
      customShops[idx].name = newName;
      customShops[idx].category = newCategory;
      localStorage.setItem('quickdash_custom_shops', JSON.stringify(customShops));
    }
  } catch (err) {
    console.error(err);
  }

  closeEditShopModal();
  window.location.reload();
}

window.submitStoreEdits = submitStoreEdits;

// ── Switch Dashboard Tabs ──────────────────────────────────────────
function switchDashboardTab(tabName) {
  state.activeTab = tabName;

  // Toggle active tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.id === `btn-tab-${tabName}`);
  });

  // Toggle panels visibility
  document.querySelectorAll('.tab-panel').forEach(p => {
    p.classList.toggle('active', p.id === `panel-${tabName}`);
  });
}

window.switchDashboardTab = switchDashboardTab;

// ── Loading Shop Catalog Inventory ─────────────────────────────────
function loadStoreCatalog() {
  const shopId = state.customShop.id;
  
  try {
    let customProds = JSON.parse(localStorage.getItem('quickdash_custom_products') || '[]');
    
    // If empty custom list, populate with default catalog items mapped to our store for test variety
    if (customProds.length === 0) {
      customProds = [
        {
          id: 'p-custom-1',
          shopId: shopId,
          name: 'Fresh Premium Milk 1L',
          price: 66,
          category: 'dairy-bread',
          stock: 'high',
          img: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=200'
        },
        {
          id: 'p-custom-2',
          shopId: shopId,
          name: 'Organic Chakki Atta 5kg',
          price: 290,
          category: 'kitchen',
          stock: 'medium',
          img: 'https://images.unsplash.com/photo-1574316071802-0d684efa7bf5?w=200'
        },
        {
          id: 'p-custom-3',
          shopId: shopId,
          name: 'Classic Potato Salted Chips',
          price: 30,
          category: 'snacks',
          stock: 'low',
          img: 'https://images.unsplash.com/photo-1566478989037-eec170784d47?w=200'
        }
      ];
      localStorage.setItem('quickdash_custom_products', JSON.stringify(customProds));
    }

    // Filter items owned by this shop
    state.inventory = customProds.filter(p => p.shopId === shopId);
  } catch (e) {
    console.error('Failed to load store catalog:', e);
    state.inventory = [];
  }
}

// ── Add New Product Form ───────────────────────────────────────────
function openAddProductModal() {
  const modal = document.getElementById('add-product-modal');
  if (modal) modal.classList.add('open');
}

window.openAddProductModal = openAddProductModal;

function closeAddProductModal() {
  const modal = document.getElementById('add-product-modal');
  if (modal) modal.classList.remove('open');
}

window.closeAddProductModal = closeAddProductModal;

function submitNewProduct(e) {
  e.preventDefault();

  const name = document.getElementById('prod-name').value.trim();
  const price = parseInt(document.getElementById('prod-price').value);
  const category = document.getElementById('prod-category').value;
  const photo = document.getElementById('prod-photo').value.trim();

  if (!name || !price || !category || !photo) return;

  const newProd = {
    id: `p-custom-${Date.now()}`,
    shopId: state.customShop.id,
    name: name,
    price: price,
    category: category,
    img: photo,
    stock: 'high' // Default stock level is High
  };

  try {
    let customProds = JSON.parse(localStorage.getItem('quickdash_custom_products') || '[]');
    customProds.push(newProd);
    localStorage.setItem('quickdash_custom_products', JSON.stringify(customProds));

    // Refresh catalog state
    loadStoreCatalog();
    renderProductsGrid();
    alert(`🌾 Product "${name}" successfully added to catalog!`);
    
    // Clear form and close modal
    document.getElementById('add-product-form').reset();
    closeAddProductModal();
  } catch (err) {
    console.error('Failed to add product:', err);
  }
}

window.submitNewProduct = submitNewProduct;

// ── Edit/Delete/Stock Catalog operations ──────────────────────────
let activeEditingProdId = null;

function openEditProductModal(id) {
  const product = state.inventory.find(p => p.id === id);
  if (!product) return;

  activeEditingProdId = id;
  const modal = document.getElementById('edit-product-modal');
  if (modal) {
    modal.classList.add('open');
    document.getElementById('edit-prod-name').value = product.name;
    document.getElementById('edit-prod-price').value = product.price;
    document.getElementById('edit-prod-category').value = product.category;
    document.getElementById('edit-prod-photo').value = product.img || '';
  }
}

window.openEditProductModal = openEditProductModal;

function closeEditProductModal() {
  const modal = document.getElementById('edit-product-modal');
  if (modal) modal.classList.remove('open');
}

window.closeEditProductModal = closeEditProductModal;

function submitProductEdits(e) {
  e.preventDefault();
  if (!activeEditingProdId) return;

  const name = document.getElementById('edit-prod-name').value.trim();
  const price = parseInt(document.getElementById('edit-prod-price').value);
  const category = document.getElementById('edit-prod-category').value;
  const photo = document.getElementById('edit-prod-photo').value.trim();

  try {
    let customProds = JSON.parse(localStorage.getItem('quickdash_custom_products') || '[]');
    const idx = customProds.findIndex(p => p.id === activeEditingProdId);
    if (idx !== -1) {
      customProds[idx].name = name;
      customProds[idx].price = price;
      customProds[idx].category = category;
      customProds[idx].img = photo;
      localStorage.setItem('quickdash_custom_products', JSON.stringify(customProds));
    }

    loadStoreCatalog();
    renderProductsGrid();
    closeEditProductModal();
    alert('🌾 Product details updated successfully!');
  } catch (err) {
    console.error(err);
  }
}

window.submitProductEdits = submitProductEdits;

function deleteCatalogItem(id) {
  if (!confirm('🗑️ Are you sure you want to delete this product from your shop catalog?')) return;

  try {
    let customProds = JSON.parse(localStorage.getItem('quickdash_custom_products') || '[]');
    const filtered = customProds.filter(p => p.id !== id);
    localStorage.setItem('quickdash_custom_products', JSON.stringify(filtered));

    loadStoreCatalog();
    renderProductsGrid();
  } catch (err) {
    console.error(err);
  }
}

window.deleteCatalogItem = deleteCatalogItem;

function changeStockStatus(id, level) {
  try {
    let customProds = JSON.parse(localStorage.getItem('quickdash_custom_products') || '[]');
    const idx = customProds.findIndex(p => p.id === id);
    if (idx !== -1) {
      customProds[idx].stock = level;
      localStorage.setItem('quickdash_custom_products', JSON.stringify(customProds));
    }

    loadStoreCatalog();
    renderProductsGrid();
  } catch (err) {
    console.error(err);
  }
}

window.changeStockStatus = changeStockStatus;

// ── Render Products Catalog List ──────────────────────────────────
function renderProductsGrid() {
  const container = document.getElementById('merchant-products-grid');
  if (!container) return;

  if (state.inventory.length === 0) {
    container.innerHTML = `
      <div class="terminal-empty-state" style="grid-column: 1 / -1;">
        <div style="font-size: 3rem;">🌾</div>
        <h4>Catalog is empty</h4>
        <p>Click "Add Product Item" above to add products to your store inventory.</p>
      </div>`;
    return;
  }

  container.innerHTML = state.inventory.map(p => {
    const isOut = p.stock === 'out';
    const greyClass = isOut ? 'out-of-stock-greyscale' : '';

    return `
      <div class="merchant-prod-card ${greyClass}">
        <div class="m-prod-thumb-row">
          <img class="m-prod-thumb" src="${p.img || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200'}" alt="${escapeHTML(p.name)}" />
          <span class="m-prod-cat-badge">${escapeHTML(p.category)}</span>
          <div class="m-prod-action-capsules">
            <button class="m-action-circle-btn edit" onclick="openEditProductModal('${p.id}')" aria-label="Edit">✏️</button>
            <button class="m-action-circle-btn delete" onclick="deleteCatalogItem('${p.id}')" aria-label="Delete">✕</button>
          </div>
        </div>
        <div class="m-prod-body">
          <div>
            <h4 class="m-prod-name">${escapeHTML(p.name)}</h4>
            <div class="m-prod-price">₹${p.price}</div>
          </div>

          <!-- Stock Buttons -->
          <div class="m-prod-stock-block">
            <span>Stock Status</span>
            <div class="stock-selector-buttons">
              <button class="btn-stock-level high ${p.stock === 'high' ? 'active' : ''}" onclick="changeStockStatus('${p.id}', 'high')">High</button>
              <button class="btn-stock-level medium ${p.stock === 'medium' ? 'active' : ''}" onclick="changeStockStatus('${p.id}', 'medium')">Med</button>
              <button class="btn-stock-level low ${p.stock === 'low' ? 'active' : ''}" onclick="changeStockStatus('${p.id}', 'low')">Low</button>
              <button class="btn-stock-level out ${p.stock === 'out' ? 'active' : ''}" onclick="changeStockStatus('${p.id}', 'out')">Out</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ── Incoming active orders pipeline polling ────────────────────────
function startTerminalPolling() {
  if (state.terminalPollInterval) clearInterval(state.terminalPollInterval);

  function poll() {
    try {
      const raw = localStorage.getItem('quickdash_active_order');
      if (!raw) {
        state.incomingOrder = null;
        renderTerminalCards();
        return;
      }

      const order = JSON.parse(raw);
      // Filter orders placed for this specific shop
      if (order.shopId === state.customShop.id) {
        state.incomingOrder = order;
      } else {
        state.incomingOrder = null;
      }
      renderTerminalCards();
    } catch (e) {
      console.error('Failed to poll active order:', e);
    }
  }

  poll();
  state.terminalPollInterval = setInterval(poll, 1500);
}

// ── Simulate Customer Order Sandbox ────────────────────────────────
function simulateIncomingCustomerOrder() {
  const activeCheck = localStorage.getItem('quickdash_active_order');
  if (activeCheck) {
    alert('⏳ An active order is already processing in the terminal. Complete or deny it first.');
    return;
  }

  // Choose 3 random inventory items (or fallback)
  const items = state.inventory.slice(0, 3).map(p => ({
    id: p.id,
    name: p.name,
    price: p.price,
    qty: Math.floor(Math.random() * 2) + 1,
    img: p.img || ''
  }));

  if (items.length === 0) {
    alert('⚠️ Please add at least one product to your inventory catalog first before running the order simulator!');
    return;
  }

  const subtotal = items.reduce((acc, curr) => acc + (curr.price * curr.qty), 0);
  const gst = Math.round(subtotal * 0.05);
  const grandTotal = subtotal + gst + 5 + 25; // items + gst + platform + base delivery

  const mockOrder = {
    shopId: state.customShop.id,
    shopName: state.customShop.name,
    shopPhoto: state.customShop.photo,
    shopLat: state.customShop.lat,
    shopLon: state.customShop.lon,
    subtotal: subtotal,
    gst: gst,
    platformFee: 5,
    baseDelivery: 25,
    additionalDelivery: 0,
    grandTotal: grandTotal,
    deliveryAddress: 'Flat 402, Block C, Green Park, New Delhi',
    landmark: 'Opposite Metro Station Pillar 124',
    recipientName: 'Mayukh Ghosh',
    recipientPhone: '9876543210',
    recipientType: 'self',
    timestamp: Date.now(),
    stage: 0, // Awaiting acceptance
    items: items
  };

  localStorage.setItem('quickdash_active_order', JSON.stringify(mockOrder));
  alert('🔔 Order Simulation Activated! Check the "Orders Terminal" tab.');
}

window.simulateIncomingCustomerOrder = simulateIncomingCustomerOrder;

// ── Render Live Terminal Card ──────────────────────────────────────
function renderTerminalCards() {
  const container = document.getElementById('active-terminal-cards');
  const countBadge = document.getElementById('active-orders-count');
  if (!container) return;

  if (!state.incomingOrder) {
    container.innerHTML = `
      <div class="terminal-empty-state">
        <div style="font-size: 3rem;">🔔</div>
        <h4>Terminal is quiet</h4>
        <p>No active orders are currently in pipeline. Tap "Simulate Incoming Order" above to run test checkout!</p>
      </div>`;
    countBadge.style.display = 'none';
    return;
  }

  const order = state.incomingOrder;
  countBadge.textContent = '1';
  countBadge.style.display = 'inline-block';

  const suffix = String(order.timestamp).slice(-4);
  const totalItemsCount = order.items ? order.items.reduce((acc, curr) => acc + curr.qty, 0) : 0;

  // Itemized product breakdowns
  const itemsHtml = order.items.map(item => `
    <div class="terminal-item-line">
      <div>
        <span class="m-hist-item-name">${escapeHTML(item.name)}</span>
        <span class="qty">x${item.qty}</span>
      </div>
      <span class="val">₹${item.price * item.qty}</span>
    </div>
  `).join('');

  // Action flow based on stage
  let actionButtonsHtml = '';
  if (order.stage === 0) {
    // Awaiting Accept
    actionButtonsHtml = `
      <div class="terminal-card-actions">
        <button class="btn-terminal-accept" onclick="merchantAcceptOrder()">Accept Order ✅</button>
        <button class="btn-terminal-deny" onclick="merchantDenyOrder()">Deny</button>
      </div>`;
  } else if (order.stage === 1) {
    // Accepted, preparing packaging
    actionButtonsHtml = `
      <button class="btn-terminal-ready" onclick="merchantMarkOrderReady()">
        📦 Order is Ready for Collection
      </button>`;
  } else if (order.stage >= 2) {
    // Courier gliding, dispatch ongoing
    actionButtonsHtml = `
      <div class="info-banner" style="margin: 0; background: var(--g50); border-color: var(--g300); color: var(--g800);">
        🛵 <strong>Partner Dispatched:</strong> Delivery partner is picking up and heading to destination. Live progress synced to customer dashboard!
      </div>`;
  }

  container.innerHTML = `
    <div class="active-order-terminal-card">
      <div class="terminal-card-header">
        <span class="terminal-order-ref">Incoming Order QD-${suffix}</span>
        <span class="terminal-time-elapsed">Awaiting Prep</span>
      </div>
      <div class="terminal-card-body">
        
        <!-- Recipient -->
        <div class="terminal-client-row">
          <div>
            <span>Client:</span>
            <strong>${escapeHTML(order.recipientName)}</strong> (📞 ${escapeHTML(order.recipientPhone)})
          </div>
          <div>Address: <strong>${escapeHTML(order.deliveryAddress.substring(0, 25))}...</strong></div>
        </div>

        <!-- Items -->
        <div class="terminal-items-list">
          ${itemsHtml}
        </div>

        <!-- Billing -->
        <div class="terminal-billing-summary">
          <span>Customer Paid (Settlement Pending)</span>
          <strong>₹${order.grandTotal}</strong>
        </div>

        <!-- Stepper controllers -->
        ${actionButtonsHtml}

      </div>
    </div>`;
}

// ── Stepper terminal handlers ──────────────────────────────────────
function merchantAcceptOrder() {
  if (!state.incomingOrder) return;
  state.incomingOrder.stage = 1;

  try {
    localStorage.setItem('quickdash_active_order', JSON.stringify(state.incomingOrder));
    alert('✅ Order Accepted! Start packing items. Click "Order is Ready" once items are boxed for Ravi Kumar.');
    renderTerminalCards();
  } catch (e) {
    console.error(e);
  }
}

window.merchantAcceptOrder = merchantAcceptOrder;

function merchantDenyOrder() {
  if (!state.incomingOrder) return;
  if (!confirm('❌ Are you sure you want to deny this incoming customer order? Payment will be instantly refunded.')) return;

  try {
    // Save to history as Denied
    const deniedOrder = {
      ...state.incomingOrder,
      status: 'Denied',
      completedAt: Date.now()
    };

    let history = JSON.parse(localStorage.getItem('quickdash_merchant_orders_history') || '[]');
    history.unshift(deniedOrder);
    localStorage.setItem('quickdash_merchant_orders_history', JSON.stringify(history));

    // Clear active order
    localStorage.removeItem('quickdash_active_order');
    state.incomingOrder = null;
    alert('❌ Order successfully denied. Logs updated in History tab.');
    renderTerminalCards();
    renderHistoryList();
  } catch (e) {
    console.error(e);
  }
}

window.merchantDenyOrder = merchantDenyOrder;

function merchantMarkOrderReady() {
  if (!state.incomingOrder) return;
  
  // Set stage to 2
  state.incomingOrder.stage = 2;

  try {
    localStorage.setItem('quickdash_active_order', JSON.stringify(state.incomingOrder));
    
    // Automatically trigger delivery completing in history in 15 seconds to simulate partner completing ride
    alert('📦 Order packed! Nearby delivery partner Ravi Kumar has been notified and is picking up the parcel. Customer tracking map activated.');
    renderTerminalCards();
    
    // Simulate auto-completion after 18 seconds (saves to history)
    setTimeout(() => {
      completeLiveOrderSimulator();
    }, 18000);

  } catch (e) {
    console.error(e);
  }
}

window.merchantMarkOrderReady = merchantMarkOrderReady;

// ── Complete live simulator completed orders mapping ───────────────
function completeLiveOrderSimulator() {
  try {
    const raw = localStorage.getItem('quickdash_active_order');
    if (!raw) return;

    // Skip auto-complete if a registered, approved partner is online/active
    const partnerRaw = localStorage.getItem('quickdash_partner');
    if (partnerRaw) {
      const partner = JSON.parse(partnerRaw);
      if (partner.isApproved) {
        console.log("Delegating active delivery complete controls to Partner Dashboard!");
        return;
      }
    }

    const order = JSON.parse(raw);
    if (order.shopId !== state.customShop.id) return;

    // Append to merchant history as accepted/completed
    const completedOrder = {
      ...order,
      status: 'Accepted',
      completedAt: Date.now()
    };

    let mHistory = JSON.parse(localStorage.getItem('quickdash_merchant_orders_history') || '[]');
    mHistory.unshift(completedOrder);
    localStorage.setItem('quickdash_merchant_orders_history', JSON.stringify(mHistory));

    // Append to customer orders history
    let cHistory = JSON.parse(localStorage.getItem('quickdash_orders_history') || '[]');
    cHistory.unshift(completedOrder);
    localStorage.setItem('quickdash_orders_history', JSON.stringify(cHistory));

    // Clear active order
    localStorage.removeItem('quickdash_active_order');
    
    state.incomingOrder = null;
    alert('🎉 Order QD-' + String(order.timestamp).slice(-4) + ' successfully delivered! Ravi Kumar completed delivery and cash settlements completed.');
    renderTerminalCards();
    renderHistoryList();
  } catch (e) {
    console.error('Simulator auto-complete error:', e);
  }
}

// ── Tab 3: Received Orders History logs ────────────────────────────
function renderHistoryList() {
  const container = document.getElementById('merchant-history-list');
  if (!container) return;

  let logs = [];
  try {
    logs = JSON.parse(localStorage.getItem('quickdash_merchant_orders_history') || '[]');
  } catch (err) {
    logs = [];
  }

  // Filter based on active filter state
  if (state.historyFilter !== 'all') {
    logs = logs.filter(l => l.status === state.historyFilter);
  }

  if (logs.length === 0) {
    container.innerHTML = `
      <div class="terminal-empty-state" style="padding: 3rem 1.5rem">
        <div style="font-size: 2.2rem;">📜</div>
        <h4>No past order history</h4>
        <p>Completed accepted and denied orders will be logged right here.</p>
      </div>`;
    return;
  }

  container.innerHTML = logs.map((log, index) => {
    const suffix = String(log.timestamp).slice(-4);
    const dateStr = new Date(log.timestamp).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });

    const isAccepted = log.status === 'Accepted';
    const badgeClass = isAccepted ? 'accepted' : 'denied';
    const activeClass = state.selectedHistoryOrder && state.selectedHistoryOrder.timestamp === log.timestamp ? 'active' : '';

    return `
      <div class="m-history-card-item ${activeClass}" onclick="selectMerchantHistory(${index}, this)">
        <div class="m-hist-left">
          <h4>Order QD-${suffix}</h4>
          <p>📅 ${dateStr}</p>
        </div>
        <div class="m-hist-right">
          <div class="m-hist-price">₹${log.grandTotal}</div>
          <span class="m-hist-status-badge ${badgeClass}">${escapeHTML(log.status)}</span>
        </div>
      </div>
    `;
  }).join('');
}

function filterHistory(filterVal) {
  state.historyFilter = filterVal;
  
  // Toggle filter buttons class
  ['all', 'accepted', 'denied'].forEach(f => {
    const btn = document.getElementById(`filter-${f}`);
    if (btn) btn.classList.toggle('active', f === filterVal.toLowerCase());
  });

  renderHistoryList();
}

window.filterHistory = filterHistory;

// ── Select history item and show detailed receipt ──────────────────
function selectMerchantHistory(index, cardEl) {
  let logs = [];
  try {
    logs = JSON.parse(localStorage.getItem('quickdash_merchant_orders_history') || '[]');
    if (state.historyFilter !== 'all') {
      logs = logs.filter(l => l.status === state.historyFilter);
    }
  } catch (err) {
    logs = [];
  }

  const log = logs[index];
  if (!log) return;

  state.selectedHistoryOrder = log;

  // Toggle active card
  document.querySelectorAll('.m-history-card-item').forEach(c => c.classList.remove('active'));
  if (cardEl) cardEl.classList.add('active');

  const placeholder = document.getElementById('m-history-placeholder');
  const card = document.getElementById('m-history-card');
  const panel = document.getElementById('m-history-placeholder').parentNode;

  if (placeholder) placeholder.style.display = 'none';
  if (card) card.style.display = 'block';

  // Toggle mobile open layout modal overlay
  if (window.innerWidth <= 900) {
    panel.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  const suffix = String(log.timestamp).slice(-4);
  const dateTimeStr = new Date(log.timestamp).toLocaleString('en-IN');
  const isAccepted = log.status === 'Accepted';

  // Items breakdown list HTML
  const itemsHtml = log.items.map(item => `
    <div class="m-hist-item-line">
      <span class="m-hist-item-name">${escapeHTML(item.name)} <span class="m-hist-item-qty">x${item.qty}</span></span>
      <span class="m-hist-item-val">₹${item.price * item.qty}</span>
    </div>
  `).join('');

  // Rating review display
  let ratingHtml = '';
  if (log.feedback && log.feedback.ratings) {
    ratingHtml = `
      <div class="detail-feedback-block" style="margin-top:1rem;background:#f8fdfb;border:1px dashed var(--g300);padding:0.85rem;border-radius:var(--radius-sm)">
        <h5 style="font-family:var(--font-h);font-size:0.78rem;font-weight:800;color:var(--g900);margin-bottom:0.4rem">Customer Rating</h5>
        <div class="feedback-star-row" style="display:flex;justify-content:space-between;font-size:0.75rem;font-weight:600;color:var(--g800);">
          <span>🏪 Your Store Rating:</span>
          <span>${'⭐'.repeat(log.feedback.ratings.store)} (${log.feedback.ratings.store}/5)</span>
        </div>
        ${log.feedback.review ? `<p style="font-size:0.75rem;color:var(--gray-500);font-style:italic;margin-top:0.35rem;border-top:1px solid rgba(82,183,136,0.15);padding-top:0.35rem">"${escapeHTML(log.feedback.review)}"</p>` : ''}
      </div>`;
  }

  card.innerHTML = `
    <!-- Detail Header -->
    <div class="m-hist-det-header">
      <button class="m-hist-det-close" onclick="closeMerchantDetails()">✕</button>
      <div class="m-hist-det-header-row">
        <h4>Order QD-${suffix}</h4>
        <span class="m-hist-status-badge ${isAccepted ? 'accepted' : 'denied'}" style="background:rgba(255,255,255,0.2);color:#fff">${escapeHTML(log.status)}</span>
      </div>
      <p>📅 ${dateTimeStr}</p>
    </div>

    <!-- Detail Body -->
    <div class="m-hist-det-body">
      
      <!-- Customer Info -->
      <div class="m-hist-det-block">
        <div class="m-hist-det-row">
          <span>👤</span>
          <div>
            <h5>Customer Details</h5>
            <p><strong>${escapeHTML(log.recipientName)}</strong> (📞 ${escapeHTML(log.recipientPhone)})</p>
          </div>
        </div>

        <div class="m-hist-det-row">
          <span>📍</span>
          <div>
            <h5>Delivery Destination</h5>
            <p>${escapeHTML(log.deliveryAddress)}</p>
            ${log.landmark ? `<p style="font-size:0.72rem;color:var(--gray-400)">Landmark: ${escapeHTML(log.landmark)}</p>` : ''}
          </div>
        </div>
      </div>

      <!-- Items Ordered -->
      <div class="m-hist-det-block">
        <h5 style="font-family:var(--font-h);font-size:0.82rem;font-weight:800;color:var(--g900);margin-bottom:0.75rem">Items Details</h5>
        <div class="m-hist-items-container">
          ${itemsHtml}
        </div>
      </div>

      <!-- Earnings Box -->
      <div class="m-hist-earnings-box">
        <span>${isAccepted ? 'Total Settlement Received' : 'Cancelled / Refunded'}</span>
        <strong>₹${log.grandTotal}</strong>
      </div>

      <!-- Rating review -->
      ${ratingHtml}

      <!-- Stamp -->
      <div class="m-hist-stamp-block">
        <span class="m-hist-stamp ${isAccepted ? 'accepted' : 'denied'}">
          ${isAccepted ? 'ORDER DELIVERED' : 'ORDER REFUNDED'}
        </span>
      </div>

    </div>
  `;
}

window.selectMerchantHistory = selectMerchantHistory;

function closeMerchantDetails() {
  const panel = document.getElementById('m-history-placeholder').parentNode;
  if (panel) {
    panel.classList.remove('open');
  }
  document.body.style.overflow = '';
}

window.closeMerchantDetails = closeMerchantDetails;

// ── Utility ──────────────────────────────────────────────────────
function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function escapeHTML(str = '') {
  return String(str).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}

// ── Init ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', initMerchantPage);
