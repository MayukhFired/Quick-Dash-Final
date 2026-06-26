// ── Category Data ─────────────────────────────────────────────
const CATEGORIES = [
  {
    id: 'fruits-veg',
    emoji: '🥦',
    name: 'Fruits & Vegetables',
    desc: 'Fresh produce and organic picks'
  },
  {
    id: 'dairy-bread',
    emoji: '🥛',
    name: 'Dairy, Bread & Eggs',
    desc: 'Milk, curd, butter, and breakfast staples'
  },
  {
    id: 'snacks',
    emoji: '🍟',
    name: 'Munchies & Snacks',
    desc: 'Chips, biscuits, popcorn, and namkeen'
  },
  {
    id: 'drinks',
    emoji: '🥤',
    name: 'Cold Drinks & Juices',
    desc: 'Sodas, energy drinks, and water'
  },
  {
    id: 'meat-fish',
    emoji: '🍗',
    name: 'Meat, Fish & Eggs',
    desc: 'Fresh meats, seafood, and frozen items'
  },
  {
    id: 'kitchen',
    emoji: '🌾',
    name: 'Kitchen & Staples',
    desc: 'Atta, rice, oil, dals, and spices'
  },
  {
    id: 'bakery',
    emoji: '🎂',
    name: 'Bakery & Sweet Tooth',
    desc: 'Chocolates, cakes, ice creams, and desserts'
  },
  {
    id: 'instant-food',
    emoji: '🍜',
    name: 'Instant & Frozen Food',
    desc: 'Maggi, ready-to-eat meals, and frozen snacks'
  },
  {
    id: 'personal-care',
    emoji: '🧴',
    name: 'Personal Care & Wellness',
    desc: 'Makeup, hygiene, and wellness products'
  },
  {
    id: 'cleaning',
    emoji: '🧹',
    name: 'Cleaning & Household',
    desc: 'Detergents, garbage bags, and bathroom cleaners'
  },
  {
    id: 'baby-care',
    emoji: '🍼',
    name: 'Baby Care',
    desc: 'Diapers, wipes, and baby food'
  },
  {
    id: 'home-lifestyle',
    emoji: '🏠',
    name: 'Home & Lifestyle',
    desc: 'Electricals, toys, kitchen tools, and stationery'
  },
  {
    id: 'cafe',
    emoji: '☕',
    name: 'Cafe / Bistro',
    desc: 'Ready-to-eat hot snacks and tea/coffee'
  }
];

// ── Auth State ─────────────────────────────────────────────────
let currentUser = null;

function loadUser() {
  try {
    const saved = localStorage.getItem('quickdash_user');
    if (saved) currentUser = JSON.parse(saved);
  } catch (e) {
    currentUser = null;
  }
}

// ── Category Cards ─────────────────────────────────────────────
function renderCategories() {
  const grid = document.getElementById('categories-grid');
  if (!grid) return;

  grid.innerHTML = CATEGORIES.map(cat => `
    <div class="category-card" id="cat-${cat.id}" onclick="handleCategoryClick('${cat.id}')" role="button" tabindex="0" aria-label="${cat.name}">
      <span class="cat-emoji">${cat.emoji}</span>
      <div class="cat-name">${cat.name}</div>
      <div class="cat-desc">${cat.desc}</div>
      <div class="cat-arrow">Shop now →</div>
    </div>
  `).join('');

  // Keyboard accessibility
  grid.querySelectorAll('.category-card').forEach(card => {
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') card.click();
    });
  });
}

function handleCategoryClick(categoryId) {
  const card = document.getElementById(`cat-${categoryId}`);
  if (card) {
    card.style.transform = 'scale(.97)';
    setTimeout(() => {
      card.style.transform = '';
      window.location.href = `../shops/shops.html?category=${categoryId}`;
    }, 180);
  } else {
    window.location.href = `../shops/shops.html?category=${categoryId}`;
  }
}

// ── Search ─────────────────────────────────────────────────────
const searchInput = document.getElementById('search-input');
const searchClear = document.getElementById('search-clear');
const searchDropdown = document.getElementById('search-dropdown');

let searchTimer = null;

if (searchInput) {
  searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim();
    searchClear.style.display = query ? 'flex' : 'none';

    clearTimeout(searchTimer);
    if (query.length < 1) {
      closeSearch();
      return;
    }
    searchTimer = setTimeout(() => performSearch(query), 200);
  });

  // Close dropdown on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#search-wrapper')) closeSearch();
  });
}

function performSearch(query) {
  const lower = query.toLowerCase();
  const results = [];

  // Match categories
  CATEGORIES.forEach(cat => {
    if (cat.name.toLowerCase().includes(lower) || cat.desc.toLowerCase().includes(lower)) {
      results.push({ icon: cat.emoji, label: cat.name, type: 'Category', id: cat.id });
    }
  });

  // Placeholder store/product results (in production: fetch from API)
  const sampleItems = [
    { icon: '🏪', label: 'Sharma General Store', type: 'Shop' },
    { icon: '🛒', label: 'Fresh Milk 1L', type: 'Product' },
    { icon: '🥦', label: 'Organic Spinach', type: 'Product' },
    { icon: '💊', label: 'City Pharmacy', type: 'Shop' },
    { icon: '☕', label: 'Morning Brew Cafe', type: 'Shop' }
  ];
  sampleItems.forEach(item => {
    if (item.label.toLowerCase().includes(lower)) results.push(item);
  });

  if (results.length === 0) {
    searchDropdown.innerHTML = `<div class="search-result-item"><span class="result-icon">🔍</span><span class="result-label" style="color:var(--gray-400);">No results for "${escapeHTML(query)}"</span></div>`;
  } else {
    searchDropdown.innerHTML = results.slice(0, 7).map(r => `
      <div class="search-result-item" onclick="handleSearchSelect('${r.id || ''}', '${escapeHTML(r.label)}')">
        <span class="result-icon">${r.icon}</span>
        <span class="result-label">${escapeHTML(r.label)}</span>
        <span class="result-type">${r.type}</span>
      </div>
    `).join('');
  }

  searchDropdown.classList.add('open');
}

function handleSearchSelect(id, label) {
  searchInput.value = label;
  searchClear.style.display = 'flex';
  closeSearch();
  if (id) {
    document.getElementById(`cat-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function clearSearch() {
  searchInput.value = '';
  searchClear.style.display = 'none';
  closeSearch();
  searchInput.focus();
}

function closeSearch() {
  searchDropdown.classList.remove('open');
  searchDropdown.innerHTML = '';
}

// ── Location ───────────────────────────────────────────────────
function detectLocation() {
  const label = document.getElementById('location-label');
  if (!navigator.geolocation) {
    label.textContent = 'Location not supported';
    return;
  }

  label.textContent = 'Detecting…';
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      const integrations = window.QuickDashIntegrations;
      const canUseGoogle = !!(
        integrations &&
        typeof integrations.getGoogleMapsApiKey === 'function' &&
        integrations.getGoogleMapsApiKey()
      );

      if (canUseGoogle && typeof integrations.reverseGeocodeGoogle === 'function') {
        integrations.reverseGeocodeGoogle(latitude, longitude)
          .then((address) => {
            label.textContent = address || `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`;
          })
          .catch(() => {
            label.textContent = `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`;
          });
        return;
      }

      fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`)
        .then(r => r.json())
        .then(data => {
          const addr = data.address;
          const short = [addr.suburb || addr.neighbourhood, addr.city || addr.town].filter(Boolean).join(', ');
          label.textContent = short || data.display_name.split(',')[0];
        })
        .catch(() => { label.textContent = `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`; });
    },
    () => { label.textContent = 'Unable to detect location'; }
  );
}

// ── Render Products Showcase (Room 4 Transition) ──────────────────
function renderProductsShowcase() {
  const showcaseGrid = document.getElementById('discover-products-grid');
  if (!showcaseGrid) return;

  // Fetch shops and map them by ID for quick details extraction
  const shops = getShopsList();
  const shopMap = {};
  shops.forEach(s => {
    shopMap[s.id] = s;
  });

  // Filter out products from active open stores that are in-stock
  const showcaseProducts = PRODUCTS_DATABASE.filter(p => {
    const shop = shopMap[p.shopId];
    return shop && shop.isOpen && p.stock !== 'out';
  });

  if (showcaseProducts.length === 0) {
    showcaseGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--gray-400);">No products are currently available near you.</p>`;
    return;
  }

  showcaseGrid.innerHTML = showcaseProducts.map(p => {
    const shop = shopMap[p.shopId] || { name: 'Local Store', rating: 4.5 };
    const cleanCat = p.category.charAt(0).toUpperCase() + p.category.slice(1).replace('-', ' ');

    return `
      <div class="discover-product-card" onclick="window.location.href='../shop/shop.html?store=${p.shopId}'" role="button" tabindex="0" aria-label="${p.name} from ${shop.name}">
        <div class="discover-product-img-wrapper">
          <img src="${p.img}" alt="${p.name}" class="discover-product-img" loading="lazy" />
        </div>
        <div class="discover-product-details">
          <span class="discover-product-category">${cleanCat}</span>
          <h3 class="discover-product-name">${escapeHTML(p.name)}</h3>
          <span class="discover-product-shop-name">${escapeHTML(shop.name)}</span>
          <div class="discover-product-pricing-row">
            <span class="discover-product-price">₹${p.price}</span>
            <span class="discover-product-shop-rating">⭐ ${shop.rating.toFixed(1)}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
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

// ── Active Order Persistent Tracking CTA ───────────────────────
function checkActiveOrder() {
  try {
    const raw = localStorage.getItem('quickdash_active_order');
    if (!raw) return;

    const order = JSON.parse(raw);
    if (!order || !order.timestamp) return;

    // Only show if order is less than 10 minutes old
    const age = (Date.now() - order.timestamp) / 1000;
    if (age > 600) {
      localStorage.removeItem('quickdash_active_order');
      return;
    }

    // Build the floating banner element
    const banner = document.createElement('div');
    banner.id = 'active-order-banner';
    banner.innerHTML = `
      <div style="
        position:fixed;bottom:96px;left:50%;transform:translateX(-50%);
        z-index:300;display:flex;align-items:center;gap:1rem;
        background:linear-gradient(135deg,#1b4332,#2d6a4f);
        color:#fff;padding:0.9rem 1.5rem;border-radius:999px;
        box-shadow:0 8px 28px rgba(27,67,50,.4);
        font-family:'Space Grotesk',sans-serif;font-weight:700;
        font-size:0.92rem;white-space:nowrap;
        animation:bannerSlideUp 0.5s cubic-bezier(0.19,1,0.22,1);
      ">
        <span style="font-size:1.4rem">🛵</span>
        <span>Order from <strong>${escapeHTML(order.shopName || 'Store')}</strong> is on its way!</span>
        <a href="../track/track.html" style="
          background:#52b788;color:#1b4332;padding:0.4rem 1rem;
          border-radius:999px;font-weight:800;font-size:0.82rem;
          text-decoration:none;transition:all .2s;white-space:nowrap;
        ">Track Now →</a>
        <button onclick="document.getElementById('active-order-banner').remove()" style="
          background:rgba(255,255,255,.15);border:none;color:#fff;
          width:28px;height:28px;border-radius:50%;cursor:pointer;
          font-size:0.9rem;display:flex;align-items:center;justify-content:center;
        ">✕</button>
      </div>
    `;

    // Inject keyframe animation once
    if (!document.getElementById('banner-anim-style')) {
      const style = document.createElement('style');
      style.id = 'banner-anim-style';
      style.textContent = `
        @keyframes bannerSlideUp {
          from { opacity:0; transform:translateX(-50%) translateY(126px); }
          to   { opacity:1; transform:translateX(-50%) translateY(96px); }
        }`;
      document.head.appendChild(style);
    }

    document.body.appendChild(banner);
  } catch (e) {
    console.error('Active order banner error:', e);
  }
}

// ── Utility ────────────────────────────────────────────────────
function escapeHTML(str = '') {
  return String(str).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}

// ── Init ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadUser();
  renderAuthButton();
  adjustFloatingDockForMerchant();
  renderCategories();
  renderProductsShowcase();
  detectLocation();
  updateHeaderCartCount();
  checkActiveOrder();
});
