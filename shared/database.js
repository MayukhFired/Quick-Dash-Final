// ── QuickDash Master Mock Database & Shared State ───────────────────

// 1. Master Shops Database
const DEFAULT_SHOPS = [
  {
    id: 'store-1',
    name: 'Sharma Grocery & Kirana Store',
    category: 'grocery',
    photo: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop',
    lat: 28.6150,  // ~0.3 km from center
    lon: 77.2120,
    rating: 4.6,
    reviewsCount: 128,
    avgProductValue: 140,
    isOpen: true
  },
  {
    id: 'store-2',
    name: 'Green Leaf Organic Produce',
    category: 'fruits-veg',
    photo: 'https://images.unsplash.com/photo-1573245782991-7f21f22c712e?w=500&auto=format&fit=crop',
    lat: 28.6250,  // ~2.2 km from center
    lon: 77.2220,
    rating: 4.8,
    reviewsCount: 84,
    avgProductValue: 75,
    isOpen: true
  },
  {
    id: 'store-3',
    name: 'CureAll Pharmacy & Wellness',
    category: 'personal-care',
    photo: 'https://images.unsplash.com/photo-1607619056574-7b8d304d3b24?w=500&auto=format&fit=crop',
    lat: 28.6010,  // ~1.8 km from center
    lon: 77.1950,
    rating: 4.5,
    reviewsCount: 215,
    avgProductValue: 180,
    isOpen: true
  },
  {
    id: 'store-4',
    name: 'The Golden Crust Bakery',
    category: 'bakery',
    photo: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop',
    lat: 28.6750,  // ~9.1 km from center (outside 3km)
    lon: 77.2850,
    rating: 4.4,
    reviewsCount: 92,
    avgProductValue: 160,
    isOpen: true
  },
  {
    id: 'store-5',
    name: 'Apex Home & Digital Electronics',
    category: 'home-lifestyle',
    photo: 'https://images.unsplash.com/photo-1550985616-10810253b84d?w=500&auto=format&fit=crop',
    lat: 28.7120,  // ~14.8 km from center (outside 3km)
    lon: 77.1520,
    rating: 4.1,
    reviewsCount: 38,
    avgProductValue: 350,
    isOpen: false // Closed by default
  }
];

// 2. Master Unified Products Database
// Products are linked to specific stores by shopId and classified into categories matching discover.js
const PRODUCTS_DATABASE = [
  // Sharma Grocery & Kirana Store (store-1)
  {
    id: 'p-1-1',
    shopId: 'store-1',
    name: 'Fresh Premium Milk 1L',
    desc: 'Pasteurized tone milk, daily fresh supply.',
    price: 66,
    category: 'dairy-bread',
    stock: 'high',
    img: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=200&auto=format&fit=crop'
  },
  {
    id: 'p-1-2',
    shopId: 'store-1',
    name: 'Organic Chakki Atta 5kg',
    desc: '100% stone-ground whole wheat flour for soft rotis.',
    price: 290,
    category: 'kitchen',
    stock: 'medium',
    img: 'https://images.unsplash.com/photo-1574316071802-0d684efa7bf5?w=200&auto=format&fit=crop'
  },
  {
    id: 'p-1-3',
    shopId: 'store-1',
    name: 'Classic Potato Salted Chips',
    desc: 'Thin, crispy, and perfectly salted potato chips.',
    price: 30,
    category: 'snacks',
    stock: 'high',
    img: 'https://images.unsplash.com/photo-1566478989037-eec170784d47?w=200&auto=format&fit=crop'
  },
  {
    id: 'p-1-4',
    shopId: 'store-1',
    name: 'Pure Mustard Oil 1L',
    desc: 'Cold pressed mustard oil, rich in aroma and taste.',
    price: 175,
    category: 'kitchen',
    stock: 'low',
    img: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=200&auto=format&fit=crop'
  },
  {
    id: 'p-1-5',
    shopId: 'store-1',
    name: 'Spicy Masala Namkeen Mix 200g',
    desc: 'Traditional spicy namkeen blend with peanuts and cashews.',
    price: 65,
    category: 'snacks',
    stock: 'out', // Out of Stock test case
    img: 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=200&auto=format&fit=crop'
  },
  {
    id: 'p-1-6',
    shopId: 'store-1',
    name: 'Energy Orange Juice 1L',
    desc: '100% natural orange juice, rich in Vitamin C.',
    price: 99,
    category: 'drinks',
    stock: 'high',
    img: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=200&auto=format&fit=crop'
  },

  // Green Leaf Organic Produce (store-2)
  {
    id: 'p-2-1',
    shopId: 'store-2',
    name: 'Organic Red Apples (4 pcs)',
    desc: 'Sweet, crispy royal delicious organic apples.',
    price: 180,
    category: 'fruits-veg',
    stock: 'high',
    img: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=200&auto=format&fit=crop'
  },
  {
    id: 'p-2-2',
    shopId: 'store-2',
    name: 'Farm Fresh Spinach Bunch',
    desc: 'Leafy green iron-rich fresh spinach, washed and pre-cut.',
    price: 35,
    category: 'fruits-veg',
    stock: 'medium',
    img: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=200&auto=format&fit=crop'
  },
  {
    id: 'p-2-3',
    shopId: 'store-2',
    name: 'Premium Banana Pack (6 pcs)',
    desc: 'Rich, energy-packed yellow sweet bananas.',
    price: 45,
    category: 'fruits-veg',
    stock: 'low',
    img: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=200&auto=format&fit=crop'
  },
  {
    id: 'p-2-4',
    shopId: 'store-2',
    name: 'Gourmet Organic Honey 250g',
    desc: 'Unprocessed raw forest honey with natural nutrients.',
    price: 240,
    category: 'grocery',
    stock: 'high',
    img: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=200&auto=format&fit=crop'
  },
  {
    id: 'p-2-5',
    shopId: 'store-2',
    name: 'Classic Potato Salted Chips',
    desc: 'Super thin organic salted potato chips.',
    price: 35,
    category: 'snacks',
    stock: 'medium',
    img: 'https://images.unsplash.com/photo-1566478989037-eec170784d47?w=200&auto=format&fit=crop'
  },

  // CureAll Pharmacy & Wellness (store-3)
  {
    id: 'p-3-1',
    shopId: 'store-3',
    name: 'Paracetamol 650mg (15 tabs)',
    desc: 'Effective rapid relief from fever and severe body aches.',
    price: 32,
    category: 'personal-care',
    stock: 'high',
    img: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=200&auto=format&fit=crop'
  },
  {
    id: 'p-3-2',
    shopId: 'store-3',
    name: 'Vitamin C + Zinc (20 chewable)',
    desc: 'Tasty orange-flavored immunity boosting daily tablets.',
    price: 110,
    category: 'personal-care',
    stock: 'medium',
    img: 'https://images.unsplash.com/photo-1616679911721-eff6eec18fcd?w=200&auto=format&fit=crop'
  },
  {
    id: 'p-3-3',
    shopId: 'store-3',
    name: 'Antiseptic Liquid Disinfectant 500ml',
    desc: 'Medical-grade first-aid cleaning and family hygiene liquid.',
    price: 198,
    category: 'personal-care',
    stock: 'low',
    img: 'https://images.unsplash.com/photo-1607619056574-7b8d304d3b24?w=200&auto=format&fit=crop'
  },
  {
    id: 'p-3-4',
    shopId: 'store-3',
    name: 'Instant Hand Sanitizer Gel 100ml',
    desc: 'Kills 99.9% germs quickly without water. Travel friendly.',
    price: 50,
    category: 'personal-care',
    stock: 'out',
    img: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=200&auto=format&fit=crop'
  },

  // The Golden Crust Bakery (store-4)
  {
    id: 'p-4-1',
    shopId: 'store-4',
    name: 'Chocolate Fudge Cake 500g',
    desc: 'Rich eggless multi-layer dark chocolate sponge cake.',
    price: 380,
    category: 'bakery',
    stock: 'medium',
    img: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=200&auto=format&fit=crop'
  },
  {
    id: 'p-4-2',
    shopId: 'store-4',
    name: 'Fresh Whole Wheat Bread 400g',
    desc: 'Freshly baked every morning, high fiber sliced loaf bread.',
    price: 50,
    category: 'dairy-bread',
    stock: 'high',
    img: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&auto=format&fit=crop'
  },
  {
    id: 'p-4-3',
    shopId: 'store-4',
    name: 'Butter Croissants Pack (2 pcs)',
    desc: 'Extra flaky, buttery golden-baked French breakfast croissants.',
    price: 120,
    category: 'bakery',
    stock: 'low',
    img: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=200&auto=format&fit=crop'
  },
  {
    id: 'p-4-4',
    shopId: 'store-4',
    name: 'Choco Chip Cookies Box (6 pcs)',
    desc: 'Freshly baked soft cookies overflowing with chocolate chips.',
    price: 90,
    category: 'snacks',
    stock: 'high',
    img: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=200&auto=format&fit=crop'
  },

  // Apex Home & Digital Electronics (store-5)
  {
    id: 'p-5-1',
    shopId: 'store-5',
    name: 'Smart Multicolor LED Bulb 9W',
    desc: 'Wi-Fi enabled bulb with millions of colors. Alexa compatible.',
    price: 399,
    category: 'home-lifestyle',
    stock: 'high',
    img: 'https://images.unsplash.com/photo-1550985616-10810253b84d?w=200&auto=format&fit=crop'
  },
  {
    id: 'p-5-2',
    shopId: 'store-5',
    name: 'Fast Charging USB-C Cable 1.5m',
    desc: 'Braided premium nylon cable, extra durable and fast charging.',
    price: 199,
    category: 'home-lifestyle',
    stock: 'medium',
    img: 'https://images.unsplash.com/photo-1541667590214-e58f03c0384a?w=200&auto=format&fit=crop'
  },
  {
    id: 'p-5-3',
    shopId: 'store-5',
    name: 'Wireless Optical Silent Mouse',
    desc: 'Ergonomic 2.4GHz connection with comfortable nano receiver.',
    price: 450,
    category: 'home-lifestyle',
    stock: 'low',
    img: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=200&auto=format&fit=crop'
  }
];

// 3. Coordinate State & Geo Functions
const DEFAULT_COORDS = { lat: 28.6139, lon: 77.2090 }; // Market Center, New Delhi

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // In km
}

// 4. Database Helper Functions
function getShopsList(userCoords = DEFAULT_COORDS) {
  const list = [...DEFAULT_SHOPS];

  // Try to load any registered merchant from localStorage
  try {
    const savedUser = localStorage.getItem('quickdash_user');
    if (savedUser) {
      const userObj = JSON.parse(savedUser);
      if (userObj && userObj.role === 'merchant' && userObj.shopName) {
        const merchantStoreId = 'merchant-shop-active';
        if (!list.some(s => s.id === merchantStoreId)) {
          list.push({
            id: merchantStoreId,
            name: userObj.shopName,
            category: userObj.category || 'grocery',
            photo: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=500&auto=format&fit=crop',
            lat: 28.6210, // Close to center (1.5km)
            lon: 77.2150,
            rating: 5.0,
            reviewsCount: 1,
            avgProductValue: 120,
            isOpen: true
          });
        }
      }
    }
  } catch (e) {
    console.error('Error loading merchant shop from localStorage:', e);
  }

  // ── Admin Disable/Ban Filter (Aegis Command Center Integration) ──
  // Load custom shops overrides to check for isDisabled flag
  let disabledShopIds = [];
  try {
    const customShops = JSON.parse(localStorage.getItem('quickdash_custom_shops') || '[]');
    disabledShopIds = customShops
      .filter(s => s.isDisabled === true)
      .map(s => s.id);
  } catch (e) {}

  // Calculate distances and filter out disabled shops
  return list
    .filter(shop => !disabledShopIds.includes(shop.id))
    .map(shop => {
      const dist = calculateDistance(userCoords.lat, userCoords.lon, shop.lat, shop.lon);
      return { ...shop, distance: dist };
    });
}

function getShopById(shopId, userCoords = DEFAULT_COORDS) {
  const shops = getShopsList(userCoords);
  return shops.find(s => s.id === shopId) || null;
}

function getProductById(shopId, productId) {
  if (!productId) return null;
  const fromDb = PRODUCTS_DATABASE.find(p => p.id === productId);
  if (fromDb) return fromDb;
  return getProductsForShop(shopId).find(p => p.id === productId) || null;
}

function getProductsForShop(shopId) {
  let products = PRODUCTS_DATABASE.filter(p => p.shopId === shopId);
  
  // If merchant shop is selected and has no products yet, inject default products for testing
  if (shopId === 'merchant-shop-active' && products.length === 0) {
    const category = getShopById(shopId)?.category || 'grocery';
    products = [
      {
        id: 'pm-1',
        shopId: 'merchant-shop-active',
        name: 'My Store Premium Milk 1L',
        desc: 'Farm fresh tone milk, daily fresh supply.',
        price: 64,
        category: 'dairy-bread',
        stock: 'high',
        img: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=200&auto=format&fit=crop'
      },
      {
        id: 'pm-2',
        shopId: 'merchant-shop-active',
        name: 'Whole Grain Atta 5kg',
        desc: '100% stone-ground flour, organic standard.',
        price: 285,
        category: 'kitchen',
        stock: 'medium',
        img: 'https://images.unsplash.com/photo-1574316071802-0d684efa7bf5?w=200&auto=format&fit=crop'
      },
      {
        id: 'pm-3',
        shopId: 'merchant-shop-active',
        name: 'Choco Chips Sweet Munchies',
        desc: 'Sweet cookies, perfect tea time snack.',
        price: 40,
        category: 'snacks',
        stock: 'low',
        img: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=200&auto=format&fit=crop'
      },
      {
        id: 'pm-4',
        shopId: 'merchant-shop-active',
        name: 'Organic Sweet Bananas',
        desc: 'Ripe yellow bananas, rich flavor.',
        price: 50,
        category: 'fruits-veg',
        stock: 'out',
        img: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=200&auto=format&fit=crop'
      }
    ];
  }
  return products;
}

function getProductsByCategory(category) {
  return PRODUCTS_DATABASE.filter(p => p.category.toLowerCase() === category.toLowerCase());
}

function escapeHTML(str = '') {
  return String(str).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}
