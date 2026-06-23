/**
 * QuickDash Delivery Partner Dashboard Logic
 */

const state = {
  partner: null,
  activeOrder: null,
  chartFilter: 'weekly',
  pollInterval: null,
  activeTab: 'home'
};

// Entry point
document.addEventListener('DOMContentLoaded', () => {
  initPartnerDashboard();
});

function initPartnerDashboard() {
  const partnerRaw = localStorage.getItem('quickdash_partner');
  
  if (!partnerRaw) {
    // If no partner registered, redirect to discover page and flag registration trigger
    localStorage.setItem('quickdash_trigger_partner_reg', 'true');
    window.location.href = '../discover/discover.html';
    return;
  }

  state.partner = JSON.parse(partnerRaw);

  if (!state.partner.isApproved) {
    // Show onboarding screen
    showOnboardingScreen();
    return;
  }

  // If approved, setup dashboard
  hideOnboardingScreen();
  populateProfileDetails();
  
  // Set default online state based on storage
  const availToggle = document.getElementById('avail-toggle-input');
  if (availToggle) {
    availToggle.checked = state.partner.isOnline || false;
  }
  updateOnlineUI(state.partner.isOnline || false);

  // Load history & earnings
  loadPartnerHistory();
  renderEarningsTab();
  
  // Start active order polling
  startActiveOrderPolling();
}

// Onboarding Mode Controls
function showOnboardingScreen() {
  const overlay = document.getElementById('onboarding-overlay');
  if (overlay) {
    overlay.classList.remove('hidden');
    
    // Fill credentials
    document.getElementById('onboard-name').textContent = state.partner.name || '--';
    document.getElementById('onboard-phone').textContent = state.partner.phone || '--';
    document.getElementById('onboard-address').textContent = state.partner.location || '--';
    document.getElementById('onboard-vehicle').textContent = state.partner.vehicleType || '--';
    document.getElementById('onboard-plate').textContent = state.partner.vehicleNumber || '--';
    document.getElementById('onboard-upi').textContent = state.partner.upiId || '--';
    document.getElementById('onboard-id-file').textContent = state.partner.idDocName || '--';
    document.getElementById('onboard-license-file').textContent = state.partner.licenseName || '--';
  }
}

function hideOnboardingScreen() {
  const overlay = document.getElementById('onboarding-overlay');
  if (overlay) {
    overlay.classList.add('hidden');
  }
}

// Developer Approval Simulator
function simulateAdminApproval(approve) {
  if (approve) {
    state.partner.isApproved = true;
    state.partner.status = 'approved';
    state.partner.isOnline = true; // Auto online on approval
    state.partner.earnings = 1845.00; // Gift them an initial starting balance!
    
    localStorage.setItem('quickdash_partner', JSON.stringify(state.partner));
    
    // Pre-populate mock history to showcase chart and list
    generateMockHistory();
    
    alert('🎉 Congratulations! Your QuickDash Rider account has been approved. Welcome to the network!');
    window.location.reload();
  } else {
    // Rejected - wipe partner and redirect
    localStorage.removeItem('quickdash_partner');
    localStorage.removeItem('quickdash_partner_orders_history');
    alert('❌ Application rejected and documents purged. You will be redirected to the main store.');
    window.location.href = '../discover/discover.html';
  }
}

window.simulateAdminApproval = simulateAdminApproval;

// Prepopulate history for premium visual looks
function generateMockHistory() {
  const mockHistory = [
    {
      orderId: 'QD-8912',
      shopName: 'Fresh Farms Grocery',
      customerAddress: 'Sec 14, Pocket B, New Delhi',
      timestamp: Date.now() - 4 * 24 * 60 * 60 * 1000 - 3 * 3600 * 1000, // 4 days ago
      distance: 2.1,
      basePay: 25.00,
      distanceFee: 0.00,
      tip: 20.00,
      totalPayout: 45.00
    },
    {
      orderId: 'QD-7431',
      shopName: 'Baker’s Treat',
      customerAddress: 'Pratap Nagar, Gali 2, New Delhi',
      timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000 - 1.5 * 3600 * 1000, // 3 days ago
      distance: 4.8,
      basePay: 25.00,
      distanceFee: 18.00, // 1.8km excess * 10
      tip: 50.00,
      totalPayout: 93.00
    },
    {
      orderId: 'QD-5420',
      shopName: 'Green Olive Gourmet',
      customerAddress: 'Golf Links Apt, 4th Floor, New Delhi',
      timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000 - 5 * 3600 * 1000, // 2 days ago
      distance: 5.5,
      basePay: 25.00,
      distanceFee: 25.00,
      tip: 100.00, // Big tip!
      totalPayout: 150.00
    },
    {
      orderId: 'QD-1102',
      shopName: 'Royal Pharmacy',
      customerAddress: 'Sec 9, block C-4, New Delhi',
      timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000 - 2 * 3600 * 1000, // Yesterday
      distance: 1.2,
      basePay: 25.00,
      distanceFee: 0.00,
      tip: 10.00,
      totalPayout: 35.00
    },
    {
      orderId: 'QD-9844',
      shopName: 'Fresh Farms Grocery',
      customerAddress: 'Mayur Vihar Ph-1, New Delhi',
      timestamp: Date.now() - 8 * 3600 * 1000, // Today morning
      distance: 6.2,
      basePay: 25.00,
      distanceFee: 32.00,
      tip: 30.00,
      totalPayout: 87.00
    }
  ];

  localStorage.setItem('quickdash_partner_orders_history', JSON.stringify(mockHistory));
  
  // Re-sum partner earnings to match mock history + base
  const totalMockPayout = mockHistory.reduce((sum, o) => sum + o.totalPayout, 0);
  state.partner.earnings = 1500.00 + totalMockPayout;
  localStorage.setItem('quickdash_partner', JSON.stringify(state.partner));
}

// Populate UI Bento Card Profile
function populateProfileDetails() {
  // Avatar initials
  const initials = state.partner.name ? state.partner.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'QP';
  document.getElementById('p-avatar').textContent = initials;

  // Profile cards
  document.getElementById('profile-name').textContent = state.partner.name || 'John Doe';
  document.getElementById('profile-phone').textContent = state.partner.phone || '+91 --';
  document.getElementById('profile-vehicle-type').textContent = state.partner.vehicleType || 'Scooter';
  document.getElementById('profile-plate').textContent = state.partner.vehicleNumber || 'DL 7S --';
  document.getElementById('profile-upi').textContent = state.partner.upiId || 'yourname@bank';
  
  // Vehicle Emoji mapping
  const vehicleIcons = {
    scooter: '🛵',
    bike: '🏍️',
    cycle: '🚲',
    van: '🚐'
  };
  const icon = vehicleIcons[state.partner.vehicleType] || '🛵';
  document.getElementById('profile-vehicle-icon').textContent = icon;

  // Earnings tab upi display
  document.getElementById('earnings-upi-badge').textContent = state.partner.upiId || 'yourname@bank';
}

// Online/Offline Availability Logic
function toggleAvailability() {
  const toggle = document.getElementById('avail-toggle-input');
  const isOnline = toggle.checked;

  state.partner.isOnline = isOnline;
  localStorage.setItem('quickdash_partner', JSON.stringify(state.partner));

  updateOnlineUI(isOnline);
  
  // Force active order refresh
  scanForActiveOrders();
}

function updateOnlineUI(isOnline) {
  const pulseDot = document.getElementById('header-pulse-dot');
  const statusText = document.getElementById('header-status-text');
  
  const title = document.getElementById('avail-status-title');
  const desc = document.getElementById('avail-status-desc');

  if (isOnline) {
    pulseDot.className = 'w-2.5 h-2.5 rounded-full bg-brand-500 online-glow';
    statusText.textContent = 'ONLINE';
    statusText.className = 'text-xs font-bold text-brand-600 uppercase tracking-wider';

    title.textContent = 'Ready to Take Orders';
    desc.textContent = 'You are in the delivery queue. Stand by for orders.';
  } else {
    pulseDot.className = 'w-2.5 h-2.5 rounded-full bg-slate-400';
    statusText.textContent = 'OFFLINE';
    statusText.className = 'text-xs font-bold text-slate-500 uppercase tracking-wider';

    title.textContent = 'You are Offline';
    desc.textContent = 'Toggle online to start receiving delivery requests.';
  }
}

window.toggleAvailability = toggleAvailability;

// Tabs Navigation Logic
function setActiveTab(tab) {
  state.activeTab = tab;
  
  const homeTab = document.getElementById('section-home');
  const earningsTab = document.getElementById('section-earnings');

  const homeBtn = document.getElementById('tab-home-btn');
  const earningsBtn = document.getElementById('tab-earnings-btn');

  const navHomeBtn = document.getElementById('nav-home-btn');
  const navEarningsBtn = document.getElementById('nav-earnings-btn');

  if (tab === 'home') {
    homeTab.classList.remove('hidden');
    earningsTab.classList.add('hidden');

    // Header buttons
    homeBtn.className = 'flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 bg-white text-brand-900 shadow-sm';
    earningsBtn.className = 'flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 text-slate-600 hover:text-brand-900';

    // Bottom nav
    navHomeBtn.className = 'flex flex-col items-center justify-center w-16 text-brand-800 transition-all font-bold';
    navEarningsBtn.className = 'flex flex-col items-center justify-center w-16 text-slate-400 hover:text-brand-800 transition-all font-semibold';
    
    scanForActiveOrders();
  } else {
    earningsTab.classList.remove('hidden');
    homeTab.classList.add('hidden');

    // Header buttons
    earningsBtn.className = 'flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 bg-white text-brand-900 shadow-sm';
    homeBtn.className = 'flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 text-slate-600 hover:text-brand-900';

    // Bottom nav
    navEarningsBtn.className = 'flex flex-col items-center justify-center w-16 text-brand-800 transition-all font-bold';
    navHomeBtn.className = 'flex flex-col items-center justify-center w-16 text-slate-400 hover:text-brand-800 transition-all font-semibold';
    
    renderEarningsTab();
  }
}

window.setActiveTab = setActiveTab;

// Polling for orders
function startActiveOrderPolling() {
  scanForActiveOrders();
  state.pollInterval = setInterval(scanForActiveOrders, 3000);
}

function scanForActiveOrders() {
  const container = document.getElementById('active-trip-container');
  if (!container) return;

  if (!state.partner.isOnline) {
    container.innerHTML = `
      <div class="bg-amber-50 rounded-3xl p-6 text-center text-amber-800 border border-amber-200">
        <span class="text-3xl block mb-2">😴</span>
        <h4 class="text-sm font-bold">You are currently Offline</h4>
        <p class="text-xs text-amber-700/80 mt-1">Please toggle Online to receive active delivery tasks from merchants.</p>
      </div>
    `;
    return;
  }

  const rawActive = localStorage.getItem('quickdash_active_order');
  if (!rawActive) {
    container.innerHTML = `
      <div class="bg-white rounded-3xl p-6 text-center text-slate-400 border border-slate-100 shadow-sm">
        <span class="text-3xl block mb-2 animate-pulse">📡</span>
        <h4 class="text-sm font-bold text-slate-700">Waiting for Orders</h4>
        <p class="text-xs text-slate-400 mt-1">Ready! We will show new orders here as soon as stores prepare them.</p>
      </div>
    `;
    state.activeOrder = null;
    return;
  }

  try {
    const order = JSON.parse(rawActive);
    state.activeOrder = order;

    // We represent stages:
    // 0: customer placed
    // 1: merchant accepted/preparing
    // 2: ready for pickup (Awaiting Partner Acceptance or Pickup)
    // 3: picked up / out for delivery
    // 4: completed
    
    if (order.stage < 2) {
      container.innerHTML = `
        <div class="bg-brand-50 rounded-3xl p-6 text-center border border-brand-100 shadow-sm">
          <div class="inline-flex items-center justify-center w-12 h-12 bg-brand-100 rounded-2xl mb-3 text-2xl animate-spin text-brand-900" style="animation-duration: 3s">🍔</div>
          <h4 class="text-sm font-bold text-brand-900">Store is Packing Items</h4>
          <p class="text-xs text-brand-700/80 mt-1">Order #QD-${String(order.timestamp).slice(-4)} is being prepared at <b>${order.shopName || 'Store'}</b>. Stay ready to accept!</p>
        </div>
      `;
      return;
    }

    if (order.stage === 2) {
      // Order is ready for pickup!
      // Check if it is already accepted by this partner or needs acceptance
      const isAlreadyAccepted = order.partnerName === state.partner.name;

      if (!isAlreadyAccepted) {
        // Needs acceptance
        renderNewTaskOfferCard(order);
      } else {
        // Already accepted, show Awaiting Pickup status
        renderActiveDeliveryCard(order, 'pickup');
      }
    } else if (order.stage === 3) {
      // Out for delivery
      if (order.partnerName === state.partner.name) {
        renderActiveDeliveryCard(order, 'deliver');
      } else {
        // Assigned to someone else or Ravi Kumar dummy, clear state
        container.innerHTML = `
          <div class="bg-white rounded-3xl p-6 text-center text-slate-400 border border-slate-100 shadow-sm">
            <span class="text-3xl block mb-2">🚚</span>
            <h4 class="text-sm font-bold text-slate-700 font-display">Waiting for Orders</h4>
            <p class="text-xs text-slate-400 mt-1">Ready! We will show new orders here as soon as stores prepare them.</p>
          </div>
        `;
      }
    }
  } catch (err) {
    console.error('Error scanning active order:', err);
  }
}

// Card renderers
function renderNewTaskOfferCard(order) {
  const container = document.getElementById('active-trip-container');
  const suffix = String(order.timestamp).slice(-4);
  
  // Calculate delivery payout estimation
  const distance = order.distance || 4.2;
  const excess = Math.max(0, distance - 3);
  const distanceFee = excess * 10;
  const tip = order.tip || 20;
  const totalPayout = 25.00 + distanceFee + tip;

  container.innerHTML = `
    <div class="bg-brand-900 text-white rounded-3xl p-5 border border-brand-950 shadow-xl space-y-4 animate-bounce relative overflow-hidden" style="animation-iteration-count: 1">
      <div class="absolute -right-6 -bottom-6 w-24 h-24 bg-brand-500/20 rounded-full blur-xl pointer-events-none"></div>
      
      <!-- Card header -->
      <div class="flex justify-between items-start">
        <span class="bg-brand-500 text-brand-950 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider leading-none shadow-sm">
          🔥 NEW DELIVERY TASK AVAILABLE
        </span>
        <span class="font-mono text-brand-300 text-xs">#QD-${suffix}</span>
      </div>

      <!-- Distance and Earnings Bento -->
      <div class="grid grid-cols-2 gap-3 pt-2">
        <div class="bg-white/10 rounded-2xl p-3 border border-white/5">
          <span class="text-[9px] text-brand-300 block font-bold uppercase tracking-wider">Estimated Payout</span>
          <strong class="text-xl font-extrabold text-brand-100 font-display">₹${totalPayout.toFixed(2)}</strong>
        </div>
        <div class="bg-white/10 rounded-2xl p-3 border border-white/5">
          <span class="text-[9px] text-brand-300 block font-bold uppercase tracking-wider">Trip Distance</span>
          <strong class="text-xl font-extrabold text-brand-100 font-display">${distance.toFixed(1)} km</strong>
        </div>
      </div>

      <!-- Route Details -->
      <div class="space-y-3 bg-white/5 rounded-2xl p-4 border border-white/5 text-xs text-brand-200">
        <div class="flex gap-2.5 items-start">
          <span class="text-base">🏪</span>
          <div>
            <strong class="text-white block text-xs">Pickup Store</strong>
            <span class="text-brand-300">${order.shopName || 'Local Merchant'}</span>
          </div>
        </div>
        <div class="border-t border-white/10 my-2"></div>
        <div class="flex gap-2.5 items-start">
          <span class="text-base">📍</span>
          <div>
            <strong class="text-white block text-xs">Deliver To</strong>
            <span class="text-brand-300 line-clamp-1">${order.deliveryAddress || 'Customer Address'}</span>
          </div>
        </div>
      </div>

      <!-- CTA Accept -->
      <button onclick="acceptDeliveryTask()" class="w-full bg-brand-500 hover:bg-brand-600 active:scale-95 text-brand-950 font-bold py-3.5 px-4 rounded-2xl text-xs transition-all shadow-lg flex items-center justify-center gap-2 tracking-wide uppercase">
        <span class="material-symbols-outlined text-base font-bold">check_circle</span>
        <span>Accept Delivery Request</span>
      </button>
    </div>
  `;
}

function renderActiveDeliveryCard(order, step) {
  const container = document.getElementById('active-trip-container');
  const suffix = String(order.timestamp).slice(-4);
  
  // Calculate delivery payout estimation
  const distance = order.distance || 4.2;
  const excess = Math.max(0, distance - 3);
  const distanceFee = excess * 10;
  const tip = order.tip || 20;
  const totalPayout = 25.00 + distanceFee + tip;

  const isPickup = step === 'pickup';

  container.innerHTML = `
    <div class="bg-white rounded-3xl p-5 border border-brand-100 shadow-md space-y-4 relative overflow-hidden">
      <!-- Top banner ribbon -->
      <div class="absolute right-0 top-0 bg-brand-600 text-white text-[9px] font-extrabold px-3 py-1.5 rounded-bl-xl uppercase tracking-wider shadow-sm">
        ${isPickup ? '🛵 GO TO STORE FOR PICKUP' : '🏁 OUT FOR DELIVERY'}
      </div>

      <div class="space-y-1">
        <span class="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Active Trip</span>
        <h3 class="text-sm font-bold text-slate-800 font-display">Order #QD-${suffix}</h3>
      </div>

      <!-- Pay + Details -->
      <div class="grid grid-cols-3 gap-2.5">
        <div class="bg-slate-50 rounded-xl p-2.5">
          <span class="text-[8px] text-slate-400 block font-bold uppercase">Estimated Pay</span>
          <strong class="text-sm font-bold text-brand-900 font-display">₹${totalPayout.toFixed(2)}</strong>
        </div>
        <div class="bg-slate-50 rounded-xl p-2.5">
          <span class="text-[8px] text-slate-400 block font-bold uppercase">Distance</span>
          <strong class="text-sm font-bold text-slate-800 font-display">${distance.toFixed(1)} km</strong>
        </div>
        <div class="bg-slate-50 rounded-xl p-2.5">
          <span class="text-[8px] text-slate-400 block font-bold uppercase">Customer Tip</span>
          <strong class="text-sm font-bold text-amber-700 font-display">₹${tip.toFixed(2)}</strong>
        </div>
      </div>

      <!-- Action Stepper Progress -->
      <div class="flex items-center gap-2 py-2">
        <div class="flex-1 h-1.5 rounded-full ${isPickup ? 'bg-brand-500' : 'bg-brand-500'}"></div>
        <div class="flex-1 h-1.5 rounded-full ${isPickup ? 'bg-slate-200' : 'bg-brand-500'}"></div>
      </div>

      <!-- Info panel -->
      <div class="bg-slate-50 rounded-2xl p-4 space-y-3.5 border border-slate-100 text-xs">
        <!-- Store -->
        <div class="flex gap-2.5 items-start ${!isPickup ? 'opacity-60' : ''}">
          <span class="text-base mt-0.5">🏪</span>
          <div class="flex-1">
            <div class="flex justify-between items-center">
              <strong class="text-slate-800 text-xs font-semibold">${order.shopName || 'Store'}</strong>
              <a href="tel:+919876543210" class="w-6 h-6 bg-brand-50 rounded-full flex items-center justify-center text-xs">📞</a>
            </div>
            <p class="text-slate-400 mt-0.5 text-[11px]">Merchant Pickup Store</p>
          </div>
        </div>
        
        <div class="border-t border-slate-200/50"></div>

        <!-- Customer -->
        <div class="flex gap-2.5 items-start ${isPickup ? 'opacity-60' : ''}">
          <span class="text-base mt-0.5">📍</span>
          <div class="flex-1">
            <div class="flex justify-between items-center">
              <strong class="text-slate-800 text-xs font-semibold">Delivery Address</strong>
              <a href="tel:+919876543210" class="w-6 h-6 bg-brand-50 rounded-full flex items-center justify-center text-xs">📞</a>
            </div>
            <p class="text-slate-500 mt-0.5 text-[11px] leading-relaxed">${order.deliveryAddress || 'Customer Address'}</p>
          </div>
        </div>
      </div>

      <!-- Dynamic Action button -->
      ${isPickup ? `
        <button onclick="completePickup()" class="w-full bg-brand-800 hover:bg-brand-900 active:scale-95 text-white font-bold py-3.5 px-4 rounded-2xl text-xs transition-all shadow-md flex items-center justify-center gap-2 uppercase tracking-wide">
          <span class="material-symbols-outlined text-base">local_shipping</span>
          <span>Confirm Parcel Picked Up 🛵</span>
        </button>
      ` : `
        <button onclick="completeDelivery()" class="w-full bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-bold py-3.5 px-4 rounded-2xl text-xs transition-all shadow-md flex items-center justify-center gap-2 uppercase tracking-wide">
          <span class="material-symbols-outlined text-base">check_circle</span>
          <span>Confirm Handed Over / Delivered 🏁</span>
        </button>
      `}
    </div>
  `;
}

// Active order state transitions
function acceptDeliveryTask() {
  if (!state.activeOrder) return;

  // Update order object with partner details
  state.activeOrder.partnerName = state.partner.name;
  state.activeOrder.partnerPhone = state.partner.phone;
  state.activeOrder.partnerVehicle = state.partner.vehicleType + " (" + state.partner.vehicleNumber + ")";
  
  // Note: the order remains in stage 2 but is now explicitly assigned to us
  localStorage.setItem('quickdash_active_order', JSON.stringify(state.activeOrder));

  showToast('🛵 Trip Accepted! Head over to the merchant store.', 'info');
  scanForActiveOrders();
}

function completePickup() {
  if (!state.activeOrder) return;

  // Move order stage to 3 (out for delivery)
  state.activeOrder.stage = 3;
  localStorage.setItem('quickdash_active_order', JSON.stringify(state.activeOrder));

  showToast('📦 Parcel picked up successfully! Drive safely to customer.', 'local_shipping');
  scanForActiveOrders();
}

function completeDelivery() {
  if (!state.activeOrder) return;

  const order = state.activeOrder;
  
  // Calculate delivery payout
  const distance = order.distance || 4.2;
  const excess = Math.max(0, distance - 3);
  const distanceFee = excess * 10;
  const tip = order.tip || 20;
  const basePay = 25.00;
  const payout = basePay + distanceFee + tip;

  // 1. Credit partner balance
  state.partner.earnings += payout;
  localStorage.setItem('quickdash_partner', JSON.stringify(state.partner));

  // 2. Append to partner delivery history
  const tripDetails = {
    orderId: 'QD-' + String(order.timestamp).slice(-4),
    shopName: order.shopName || 'Local Merchant',
    customerAddress: order.deliveryAddress || 'Customer Address',
    timestamp: Date.now(),
    distance: distance,
    basePay: basePay,
    distanceFee: distanceFee,
    tip: tip,
    totalPayout: payout
  };

  let partnerHistory = [];
  try {
    partnerHistory = JSON.parse(localStorage.getItem('quickdash_partner_orders_history') || '[]');
  } catch (err) {
    partnerHistory = [];
  }
  partnerHistory.unshift(tripDetails);
  localStorage.setItem('quickdash_partner_orders_history', JSON.stringify(partnerHistory));

  // 3. Finalize order state and sync to customer & merchant databases
  const completedOrder = {
    ...order,
    stage: 4,
    status: 'Accepted',
    completedAt: Date.now(),
    partnerName: state.partner.name,
    partnerPhone: state.partner.phone,
    partnerVehicle: state.partner.vehicleType + " (" + state.partner.vehicleNumber + ")"
  };

  // Sync Customer History
  let cHistory = [];
  try {
    cHistory = JSON.parse(localStorage.getItem('quickdash_orders_history') || '[]');
  } catch (err) {
    cHistory = [];
  }
  cHistory.unshift(completedOrder);
  localStorage.setItem('quickdash_orders_history', JSON.stringify(cHistory));

  // Sync Merchant History
  let mHistory = [];
  try {
    mHistory = JSON.parse(localStorage.getItem('quickdash_merchant_orders_history') || '[]');
  } catch (err) {
    mHistory = [];
  }
  mHistory.unshift(completedOrder);
  localStorage.setItem('quickdash_merchant_orders_history', JSON.stringify(mHistory));

  // Clear active order
  localStorage.removeItem('quickdash_active_order');
  state.activeOrder = null;

  showToast(`🎉 Delivery completed! ₹${payout.toFixed(2)} credited.`, 'check');
  
  // Refresh UI
  loadPartnerHistory();
  scanForActiveOrders();
  renderEarningsTab();
}

window.acceptDeliveryTask = acceptDeliveryTask;
window.completePickup = completePickup;
window.completeDelivery = completeDelivery;

// Render Delivery History Lists
function loadPartnerHistory() {
  const container = document.getElementById('recent-trips-list');
  if (!container) return;

  let history = [];
  try {
    history = JSON.parse(localStorage.getItem('quickdash_partner_orders_history') || '[]');
  } catch (err) {
    history = [];
  }

  if (history.length === 0) {
    container.innerHTML = `<div class="text-center py-6 text-slate-400 text-xs">No recent deliveries recorded.</div>`;
    return;
  }

  container.innerHTML = history.slice(0, 5).map(trip => {
    const timeStr = new Date(trip.timestamp).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
    const dateStr = new Date(trip.timestamp).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short'
    });

    return `
      <div class="flex items-center justify-between py-3 text-xs">
        <div class="space-y-1">
          <div class="flex items-center gap-1.5">
            <span class="font-bold text-slate-800">${trip.orderId}</span>
            <span class="text-[9px] text-slate-400">· ${timeStr}, ${dateStr}</span>
          </div>
          <span class="text-slate-500 block truncate max-w-[200px]">${trip.shopName} → ${trip.customerAddress}</span>
        </div>
        <div class="text-right">
          <span class="font-extrabold text-brand-800 block">+₹${trip.totalPayout.toFixed(2)}</span>
          <span class="text-[9px] text-slate-400 block">${trip.distance.toFixed(1)} km</span>
        </div>
      </div>
    `;
  }).join('');
}

// Earnings Tab Analytics and Sorting
function renderEarningsTab() {
  // Balance
  document.getElementById('earnings-balance').textContent = state.partner.earnings.toFixed(2);
  
  let history = [];
  try {
    history = JSON.parse(localStorage.getItem('quickdash_partner_orders_history') || '[]');
  } catch (err) {
    history = [];
  }

  // Aggregate Stats
  const totalOrders = history.length;
  const totalTips = history.reduce((sum, o) => sum + (o.tip || 0), 0);
  
  document.getElementById('stat-total-orders').textContent = totalOrders;
  document.getElementById('stat-total-tips').textContent = '₹' + totalTips.toFixed(0);

  // Load Payout List Breakdown
  const payoutContainer = document.getElementById('payout-list');
  if (payoutContainer) {
    if (history.length === 0) {
      payoutContainer.innerHTML = `<div class="text-center py-6 text-slate-400 text-xs">No transactions recorded.</div>`;
    } else {
      payoutContainer.innerHTML = history.map(trip => {
        const fullDate = new Date(trip.timestamp).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        });

        return `
          <div class="py-4 text-xs space-y-2">
            <div class="flex justify-between items-center">
              <span class="font-bold text-slate-800">${trip.orderId} (${trip.shopName})</span>
              <strong class="text-brand-900 font-extrabold">₹${trip.totalPayout.toFixed(2)}</strong>
            </div>
            
            <div class="grid grid-cols-4 gap-2 text-[10px] text-slate-400">
              <div>
                <span>Base Delivery</span>
                <strong class="text-slate-600 block">₹${trip.basePay.toFixed(2)}</strong>
              </div>
              <div>
                <span>Distance Fee</span>
                <strong class="text-slate-600 block">₹${trip.distanceFee.toFixed(2)}</strong>
              </div>
              <div>
                <span>Customer Tip</span>
                <strong class="text-amber-700 block">₹${trip.tip.toFixed(2)}</strong>
              </div>
              <div class="text-right">
                <span>Date</span>
                <strong class="text-slate-500 block">${fullDate}</strong>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  // Draw chart
  drawEarningsChart();
}

// Chart sorting filters
function setChartFilter(filter) {
  state.chartFilter = filter;
  
  const weeklyBtn = document.getElementById('chart-filter-weekly');
  const monthlyBtn = document.getElementById('chart-filter-monthly');
  const yearlyBtn = document.getElementById('chart-filter-yearly');

  [weeklyBtn, monthlyBtn, yearlyBtn].forEach(btn => {
    btn.className = 'px-3 py-1.5 rounded-lg text-slate-500 transition-colors';
  });

  if (filter === 'weekly') {
    weeklyBtn.className = 'px-3 py-1.5 rounded-lg transition-colors bg-white text-brand-900 shadow-sm';
  } else if (filter === 'monthly') {
    monthlyBtn.className = 'px-3 py-1.5 rounded-lg transition-colors bg-white text-brand-900 shadow-sm';
  } else {
    yearlyBtn.className = 'px-3 py-1.5 rounded-lg transition-colors bg-white text-brand-900 shadow-sm';
  }

  drawEarningsChart();
}

window.setChartFilter = setChartFilter;

// Custom Flex Bar Chart Generator
function drawEarningsChart() {
  const container = document.getElementById('chart-pillars-container');
  if (!container) return;

  let history = [];
  try {
    history = JSON.parse(localStorage.getItem('quickdash_partner_orders_history') || '[]');
  } catch (err) {
    history = [];
  }

  // Initialize aggregates
  let pillars = [];
  let maxEarnings = 100; // Base baseline to avoid zero division

  if (state.chartFilter === 'weekly') {
    // Generate Mon-Sun values from history
    const dayEarnings = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Sort items into day slots
    history.forEach(trip => {
      const day = dayNames[new Date(trip.timestamp).getDay()];
      if (dayEarnings[day] !== undefined) {
        dayEarnings[day] += trip.totalPayout;
      }
    });

    // Make pillars
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    pillars = days.map(day => ({
      label: day,
      val: dayEarnings[day]
    }));

  } else if (state.chartFilter === 'monthly') {
    // Generate W1 to W4/W5 weeks of the month
    const weekEarnings = { 'Week 1': 0, 'Week 2': 0, 'Week 3': 0, 'Week 4': 0 };
    
    history.forEach(trip => {
      const date = new Date(trip.timestamp).getDate();
      if (date <= 7) weekEarnings['Week 1'] += trip.totalPayout;
      else if (date <= 14) weekEarnings['Week 2'] += trip.totalPayout;
      else if (date <= 21) weekEarnings['Week 3'] += trip.totalPayout;
      else weekEarnings['Week 4'] += trip.totalPayout;
    });

    pillars = ['Week 1', 'Week 2', 'Week 3', 'Week 4'].map(w => ({
      label: w,
      val: weekEarnings[w]
    }));

  } else if (state.chartFilter === 'yearly') {
    // Generate 6 bi-monthly slots
    const slots = { 'Jan-Feb': 0, 'Mar-Apr': 0, 'May-Jun': 0, 'Jul-Aug': 0, 'Sep-Oct': 0, 'Nov-Dec': 0 };
    const slotNames = [
      'Jan-Feb', 'Jan-Feb', 
      'Mar-Apr', 'Mar-Apr', 
      'May-Jun', 'May-Jun', 
      'Jul-Aug', 'Jul-Aug', 
      'Sep-Oct', 'Sep-Oct', 
      'Nov-Dec', 'Nov-Dec'
    ];

    history.forEach(trip => {
      const month = new Date(trip.timestamp).getMonth();
      const slot = slotNames[month];
      if (slots[slot] !== undefined) {
        slots[slot] += trip.totalPayout;
      }
    });

    pillars = Object.keys(slots).map(slot => ({
      label: slot,
      val: slots[slot]
    }));
  }

  // Calculate maximum
  maxEarnings = Math.max(...pillars.map(p => p.val), 100);
  document.getElementById('chart-max-val').textContent = '₹' + maxEarnings.toFixed(0);

  // Render bars
  container.innerHTML = pillars.map(p => {
    const pctHeight = Math.max(5, (p.val / maxEarnings) * 100); // Minimum 5% to show small pills
    const hasValue = p.val > 0;
    const activeColor = hasValue ? 'bg-gradient-to-t from-brand-800 to-brand-500 shadow-glow' : 'bg-slate-200';

    return `
      <div class="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
        <!-- Floating hover tooltips -->
        <div class="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-24 bg-slate-900 text-white font-mono text-[9px] py-1 px-2 rounded-md pointer-events-none shadow-lg -translate-y-2 z-10 font-bold whitespace-nowrap">
          ₹${p.val.toFixed(2)}
        </div>
        
        <!-- Growing pillar -->
        <div class="w-full max-w-[28px] rounded-t-lg transition-all duration-700 ease-out ${activeColor}" style="height: ${pctHeight}%"></div>
        
        <!-- Label -->
        <span class="text-[9px] font-bold text-slate-400 truncate w-full text-center leading-none mt-1 uppercase">${p.label}</span>
      </div>
    `;
  }).join('');
}

// Cash Out flow
function triggerCashOut() {
  if (state.partner.earnings <= 0) {
    showToast('❌ You do not have any pending earnings to cash out.', 'error');
    return;
  }

  const amt = state.partner.earnings;
  state.partner.earnings = 0;
  localStorage.setItem('quickdash_partner', JSON.stringify(state.partner));

  // Show visual toast
  showToast(`🎉 ₹${amt.toFixed(2)} transfer initiated to your UPI ID: ${state.partner.upiId}!`, 'account_balance_wallet');
  
  // Reload
  renderEarningsTab();
}

window.triggerCashOut = triggerCashOut;

// Logout partner
function logoutPartner() {
  if (confirm('🚪 Are you sure you want to exit your Rider Portal? You can re-enter from any page footer.')) {
    // We do NOT clear partner registration, just redirect to discover page
    window.location.href = '../discover/discover.html';
  }
}

window.logoutPartner = logoutPartner;

// Custom Toast System
function showToast(message, icon = 'info') {
  const toast = document.getElementById('toast-notify');
  const msgEl = document.getElementById('toast-message');
  const iconEl = document.getElementById('toast-emoji');

  if (!toast) return;

  const icons = {
    info: '🛵',
    check: '✅',
    local_shipping: '📦',
    account_balance_wallet: '💰',
    error: '❌'
  };

  iconEl.textContent = icons[icon] || '🛵';
  msgEl.textContent = message;

  // Animate slide up
  toast.classList.remove('translate-y-12', 'opacity-0');
  toast.classList.add('translate-y-0', 'opacity-100');

  // Slide down in 3.5 seconds
  setTimeout(() => {
    toast.classList.remove('translate-y-0', 'opacity-100');
    toast.classList.add('translate-y-12', 'opacity-0');
  }, 3500);
}
