// ── Application Core State ─────────────────────────────────────────
const state = {
  currentUser: null,
  activeCategoryFilter: null,
  searchQuery: '',
  simulatedCoords: { lat: 28.6139, lon: 77.2090 }, // Default: Market Center coordinates
  currentLocationLabel: 'Market Center, New Delhi'
};

// ── Render Shops Grid with Location Filter ────────────────────────
function renderShops() {
  const gridNearMe = document.getElementById('grid-near-me');
  const gridOtherStores = document.getElementById('grid-other-stores');
  const countNearMe = document.getElementById('count-near-me');
  const countOtherStores = document.getElementById('count-other-stores');
  
  if (!gridNearMe || !gridOtherStores) return;

  // Calculate distances for all shops based on current simulated coordinates
  const shopsWithDistances = getShopsList(state.simulatedCoords);

  // Filter based on active category URL/pill filter
  let filtered = shopsWithDistances;
  if (state.activeCategoryFilter) {
    filtered = filtered.filter(s => s.category.toLowerCase() === state.activeCategoryFilter.toLowerCase());
  }

  // Filter based on search bar query
  if (state.searchQuery) {
    const query = state.searchQuery.toLowerCase();
    filtered = filtered.filter(s =>
      s.name.toLowerCase().includes(query) ||
      s.category.toLowerCase().includes(query)
    );
  }

  // Split into "Near me" (<= 3.0km) and "Other stores" (> 3.0km)
  const nearMeShops = filtered.filter(s => s.distance <= 3.0);
  const otherShops = filtered.filter(s => s.distance > 3.0);

  // Helper sorting function: active/open first, then by distance
  const sortShops = (a, b) => {
    if (a.isOpen && !b.isOpen) return -1;
    if (!a.isOpen && b.isOpen) return 1;
    return a.distance - b.distance;
  };

  nearMeShops.sort(sortShops);
  otherShops.sort(sortShops);

  // Helper render card function
  const renderCardHTML = (store) => {
    const statusText = store.isOpen ? '🟢 Open' : '🔴 Closed by Owner';
    const cardClass = store.isOpen ? '' : 'closed';
    const closedOverlay = store.isOpen ? '' : `<div class="closed-cover-overlay"><span class="closed-banner-tag">Closed by Owner</span></div>`;
    
    // Redirect url: shop.html?store=store.id
    const redirectUrl = `../shop/shop.html?store=${store.id}`;

    return `
      <div class="shop-card ${cardClass}" onclick="window.location.href='${redirectUrl}'" role="button" tabindex="0" aria-label="${store.name}">
        ${closedOverlay}
        <div class="shop-photo-wrapper">
          <img src="${store.photo}" alt="${store.name}" class="shop-photo" loading="lazy" />
          <span class="shop-distance-badge">📍 ${store.distance.toFixed(1)} km</span>
          <span class="shop-status-badge">${statusText}</span>
        </div>
        <div class="shop-details">
          <span class="shop-category-tag">${store.category}</span>
          <h3 class="shop-name">${escapeHTML(store.name)}</h3>
          <div class="shop-avg-value">Avg. Product: ₹${store.avgProductValue}</div>
          <div class="shop-rating-section">
            <span class="shop-rating">⭐ ${store.rating} <span style="color:var(--gray-400); font-weight:500;">(${store.reviewsCount} reviews)</span></span>
            <span style="color:var(--g600); font-size:0.75rem; font-weight:700;">Shop Now →</span>
          </div>
        </div>
      </div>
    `;
  };

  // Render "Near me" section
  if (countNearMe) countNearMe.textContent = nearMeShops.length;
  if (nearMeShops.length === 0) {
    gridNearMe.innerHTML = `
      <div class="no-stores-placeholder">
        <span class="placeholder-icon">📍</span>
        <h3 class="placeholder-text">No shops within 3km of your location</h3>
        <p class="placeholder-subtext">There are no shops registered near you at the moment. Try checking the stores listed below!</p>
      </div>
    `;
  } else {
    gridNearMe.innerHTML = nearMeShops.map(renderCardHTML).join('');
  }

  // Render "Other stores" section
  if (countOtherStores) countOtherStores.textContent = otherShops.length;
  if (otherShops.length === 0) {
    gridOtherStores.innerHTML = `
      <div class="no-stores-placeholder">
        <span class="placeholder-icon">🏪</span>
        <h3 class="placeholder-text">No other shops available</h3>
        <p class="placeholder-subtext">All active shops are currently showing in the "Near me" section above.</p>
      </div>
    `;
  } else {
    gridOtherStores.innerHTML = otherShops.map(renderCardHTML).join('');
  }
}

// ── Inside-Store Product Search ────────────────────────────────────
function handleStoreSearch() {
  const searchInput = document.getElementById('search-input');
  const searchClear = document.getElementById('search-clear');
  
  if (!searchInput) return;

  const query = searchInput.value.trim();
  state.searchQuery = query;
  
  if (searchClear) {
    searchClear.style.display = query ? 'flex' : 'none';
  }

  renderShops();
}

function clearStoreSearch() {
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.value = '';
    handleStoreSearch();
    searchInput.focus();
  }
}

// ── URL Query Category Handler ─────────────────────────────────────
function checkURLParameters() {
  const params = new URLSearchParams(window.location.search);
  const cat = params.get('category');
  if (cat) {
    state.activeCategoryFilter = cat;
    
    // Show Category pill
    const pill = document.getElementById('active-category-pill');
    const pillText = document.getElementById('category-pill-text');
    if (pill && pillText) {
      pillText.textContent = getCategoryCleanName(cat);
      pill.style.display = 'inline-flex';
    }
  }
}

function getCategoryCleanName(catId) {
  const map = {
    'fruits-veg': 'Fruits & Vegetables',
    'fruits': 'Fruits & Vegetables',
    'dairy-bread': 'Dairy, Bread & Eggs',
    'grocery': 'Grocery & Kirana',
    'snacks': 'Munchies & Snacks',
    'drinks': 'Cold Drinks & Juices',
    'meat-fish': 'Meat, Fish & Eggs',
    'kitchen': 'Kitchen & Staples',
    'bakery': 'Bakery & Sweets',
    'pharmacy': 'Pharmacy & Wellness',
    'electronics': 'Electronics',
    'other': 'General Store'
  };
  return map[catId] || catId;
}

function clearCategoryFilter() {
  state.activeCategoryFilter = null;
  document.getElementById('active-category-pill').style.display = 'none';
  
  // Clean URL parameter without reloading
  const url = new URL(window.location);
  url.searchParams.delete('category');
  window.history.pushState({}, '', url);

  renderShops();
}

// ── Profile Drawer Support ─────────────────────────────────────────
let currentUser = null;

function loadUser() {
  try {
    const saved = localStorage.getItem('quickdash_user');
    if (saved) currentUser = JSON.parse(saved);
  } catch (e) {
    currentUser = null;
  }
}

// ── GPS Geolocation Support ────────────────────────────────────────
function detectLocation() {
  const label = document.getElementById('location-label');
  if (!navigator.geolocation) {
    alert('Location detection not supported by your browser.');
    return;
  }

  label.textContent = 'Detecting GPS…';
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`)
        .then(r => r.json())
        .then(data => {
          const addr = data.address;
          const short = [addr.suburb || addr.neighbourhood, addr.city || addr.town].filter(Boolean).join(', ');
          const labelText = short || data.display_name.split(',')[0];
          label.textContent = labelText;

          // Trigger location override
          state.simulatedCoords = { lat: latitude, lon: longitude };
          renderShops();
        })
        .catch(() => {
          label.textContent = `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`;
          state.simulatedCoords = { lat: latitude, lon: longitude };
          renderShops();
        });
    },
    () => {
      alert('Unable to detect GPS. Resetting to Market Center.');
      state.simulatedCoords = { lat: 28.6139, lon: 77.2090 };
      state.currentLocationLabel = 'Market Center, New Delhi';
      document.getElementById('location-label').textContent = state.currentLocationLabel;
      renderShops();
    }
  );
}

// ── Header Quick-Cart Count Support ────────────────────────────
function updateHeaderCartCount() {
  const badge = document.getElementById('header-cart-count');
  if (!badge) return;

  let count = 0;
  try {
    const savedCart = localStorage.getItem('quickdash_cart');
    if (savedCart) {
      const cart = JSON.parse(savedCart);
      Object.values(cart).forEach(qty => {
        count += (Number(qty) || 0);
      });
    }
  } catch (e) {
    console.error('Failed to parse cart count in header:', e);
  }

  badge.textContent = count;
  if (count > 0) {
    badge.classList.add('active');
  } else {
    badge.classList.remove('active');
  }
}

// ── Utility ────────────────────────────────────────────────────────
function escapeHTML(str = '') {
  return String(str).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}

// ── Document Loaded Init ───────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadUser();
  renderAuthButton();
  adjustFloatingDockForMerchant();
  checkURLParameters();
  renderShops();
  updateHeaderCartCount();
});
