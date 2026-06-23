/**
 * Aegis Command Center - Main Controller
 */

// ── Master State ──────────────────────────────────────────────────
const state = {
  activeTab: 'overview',
  analyticsTimeline: 'weekly',
  complaintFilter: 'all',
  verificationSubTab: 'registrations',
  selectedStore: null,
  activeBanTarget: null, // { type: 'store'|'partner'|'customer', id: string, email: string, phone: string }
  cityData: {
    name: 'New Delhi',
    storesCount: 5,
    newStoresCount: 1,
    visitsCount: 14208,
    peakHours: '19:00 - 21:00',
    ordersDelivered: 890,
    ordersTotal: 912,
    fulfillmentPct: 97.5,
    growthPct: 12.4
  },
  // Complaints seed data
  complaints: [
    {
      id: 'TC-904',
      user: 'Rahul Kumar (Customer)',
      text: 'Debited twice for order QD-8120. Second charge did not reflect in order history.',
      priority: 'critical',
      status: 'pending',
      timestamp: Date.now() - 4 * 3600 * 1000
    },
    {
      id: 'TC-891',
      user: 'Sharma Grocery (Merchant)',
      text: 'Rider assigned to order QD-7431 did not arrive at pickup station for over 25 minutes.',
      priority: 'urgent',
      status: 'pending',
      timestamp: Date.now() - 12 * 3600 * 1000
    },
    {
      id: 'TC-612',
      user: 'Pooja Rawat (Customer)',
      text: 'Received incorrect item size for milk carton (requested 1L, got 500ml).',
      priority: 'routine',
      status: 'pending',
      timestamp: Date.now() - 24 * 3600 * 1000
    },
    {
      id: 'TC-302',
      user: 'Aman Deep (Rider)',
      text: 'Payout amount for batch DL-812 is showing incorrect calculation in the earnings history.',
      priority: 'urgent',
      status: 'pending',
      timestamp: Date.now() - 2 * 24 * 3600 * 1000
    }
  ]
};

// ── Initialize ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initAegisDashboard();
});

function initAegisDashboard() {
  // Setup tabs
  switchTab('overview');
  setVerificationSubTab('registrations');
  setComplaintPriorityFilter('all');
  
  // Render tabs data
  updateOverviewTab();
  updateAnalyticsTab();
  updateVerificationTab();
  updateStoresTab();
  updateComplaintsTab();
  
  // Console terminal handshake
  logTerminal('Establishing orbital data sync... [OK]');
  logTerminal('System ready. Aegis Command Center activated.');

  // Render Nodal Badges
  renderSystemBadges();
}

// ── Tab Router ────────────────────────────────────────────────────
function switchTab(tabId) {
  state.activeTab = tabId;
  
  // Hide all sections
  document.querySelectorAll('.tab-section').forEach(sec => sec.classList.add('hidden'));
  
  // Show target section
  const targetSection = document.getElementById(`tab-${tabId}`);
  if (targetSection) targetSection.classList.remove('hidden');

  // Desktop active buttons state
  ['overview', 'analytics', 'verification', 'stores', 'complaints'].forEach(t => {
    const btn = document.getElementById(`nav-btn-${t}`);
    if (btn) {
      if (t === tabId) {
        btn.className = 'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all bg-gradient-to-r from-cyan-500/10 to-transparent border-l-2 border-cyan-400 text-cyan-400';
      } else {
        btn.className = 'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all text-slate-400 hover:text-slate-200 hover:bg-white/5 border-l-2 border-transparent';
      }
    }
  });

  // Mobile active buttons state
  ['overview', 'analytics', 'verification', 'stores', 'complaints'].forEach(t => {
    const mobileBtn = document.getElementById(`mobile-nav-btn-${t}`);
    if (mobileBtn) {
      if (t === tabId) {
        mobileBtn.className = 'flex flex-col items-center justify-center w-12 text-cyan-400 transition-all font-bold';
      } else {
        mobileBtn.className = 'flex flex-col items-center justify-center w-12 text-slate-500 transition-all font-semibold';
      }
    }
  });

  // Perform tab-specific triggers
  if (tabId === 'overview') updateOverviewTab();
  if (tabId === 'analytics') updateAnalyticsTab();
  if (tabId === 'verification') updateVerificationTab();
  if (tabId === 'stores') updateStoresTab();
  if (tabId === 'complaints') updateComplaintsTab();
}

window.switchTab = switchTab;

// ── Dynamic Localized Overview ────────────────────────────────────
function handleCitySearch(e) {
  if (e.key !== 'Enter') return;
  const inputVal = document.getElementById('search-city-input').value.trim();
  if (!inputVal) return;

  // Simulate premium localized search computation
  logTerminal(`Scanning metropolitan records for: ${inputVal}...`);
  
  // Deterministic seed generation based on city string to keep stats stable
  let seed = 0;
  for (let i = 0; i < inputVal.length; i++) {
    seed += inputVal.charCodeAt(i);
  }

  // Draw realistic stats based on seed
  state.cityData = {
    name: inputVal,
    storesCount: (seed % 15) + 3,
    newStoresCount: (seed % 4) + 1,
    visitsCount: (seed * 18) % 15000 + 4000,
    peakHours: `${(seed % 4) + 16}:00 - ${(seed % 4) + 20}:00`,
    ordersTotal: (seed * 8) % 1000 + 300,
    fulfillmentPct: 90 + (seed % 10)
  };
  state.cityData.ordersDelivered = Math.floor(state.cityData.ordersTotal * (state.cityData.fulfillmentPct / 100));
  state.cityData.growthPct = parseFloat(((seed % 200) / 10 - 5).toFixed(1));

  // Apply new city data to UI
  updateOverviewTab();
  logTerminal(`Localized sync approved. Nodal region code: ${inputVal.substring(0,3).toUpperCase()}-NCR-01`);
  
  // Update console terminal with metrics
  logTerminal(`Stats: Active Stores: ${state.cityData.storesCount}, Footfalls: ${state.cityData.visitsCount}`);
}

window.handleCitySearch = handleCitySearch;

function updateOverviewTab() {
  // Set headers
  document.getElementById('overview-node-region').textContent = `${state.cityData.name.toUpperCase()}-NCR-01`;
  
  // Stats
  document.getElementById('overview-stores-active').textContent = state.cityData.storesCount;
  document.getElementById('overview-stores-new-desc').textContent = `New registrations this week: ${state.cityData.newStoresCount}`;
  
  document.getElementById('overview-visits').textContent = state.cityData.visitsCount.toLocaleString();
  document.getElementById('overview-visits-peak').textContent = `Peak hours today: ${state.cityData.peakHours}`;
  
  document.getElementById('overview-orders-delivered').textContent = state.cityData.ordersDelivered;
  document.getElementById('overview-orders-total').textContent = state.cityData.ordersTotal;
  
  const pctStr = `${state.cityData.fulfillmentPct.toFixed(1)}%`;
  document.getElementById('overview-fulfillment-pct').textContent = pctStr;
  document.getElementById('overview-progress-bar').style.width = pctStr;
  document.getElementById('overview-orders-accepted').textContent = `Accepted orders currently in transit: ${Math.max(2, state.cityData.ordersTotal - state.cityData.ordersDelivered)}`;

  // Populate active shops list based on custom shops + mock data
  const shopListContainer = document.getElementById('overview-shops-list');
  if (shopListContainer) {
    let customShops = [];
    try {
      customShops = JSON.parse(localStorage.getItem('quickdash_custom_shops') || '[]');
    } catch (e) {
      customShops = [];
    }

    const allShops = [...DEFAULT_SHOPS, ...customShops];
    
    shopListContainer.innerHTML = allShops.map(shop => {
      const activeText = shop.isOpen ? 'OPEN' : 'CLOSED';
      const activeColor = shop.isOpen ? 'text-emerald-400 border-emerald-800/40 bg-emerald-950/20' : 'text-rose-400 border-rose-800/40 bg-rose-950/20';
      const disabledBadge = shop.isDisabled ? `<span class="text-[8px] bg-rose-950 text-rose-400 border border-rose-800/60 px-1 py-0.2 rounded uppercase ml-1">DISABLED</span>` : '';

      return `
        <div class="flex items-center justify-between p-2 rounded-xl bg-slate-950/30 border border-slate-800/60 text-[11px]">
          <div class="space-y-0.5 text-left">
            <strong class="text-slate-200 block truncate max-w-[150px]">${shop.name}</strong>
            <span class="text-slate-500 font-mono text-[9px] capitalize">${shop.category} ${disabledBadge}</span>
          </div>
          <span class="border px-2 py-0.5 rounded font-mono text-[9px] font-bold ${activeColor}">${activeText}</span>
        </div>
      `;
    }).join('');
  }
}

// ── Tab 2: Analytics desk SVG Drawing ──────────────────────────────
function setAnalyticsTimeline(timeline) {
  state.analyticsTimeline = timeline;
  
  const weeklyBtn = document.getElementById('btn-timeline-weekly');
  const monthlyBtn = document.getElementById('btn-timeline-monthly');
  const yearlyBtn = document.getElementById('btn-timeline-yearly');
  
  [weeklyBtn, monthlyBtn, yearlyBtn].forEach(b => {
    b.className = 'px-4 py-2 rounded-xl text-slate-400 transition-all';
  });

  if (timeline === 'weekly') {
    weeklyBtn.className = 'px-4 py-2 rounded-xl transition-all bg-cyan-500/10 text-cyan-400 border border-cyan-800/60';
  } else if (timeline === 'monthly') {
    monthlyBtn.className = 'px-4 py-2 rounded-xl transition-all bg-cyan-500/10 text-cyan-400 border border-cyan-800/60';
  } else {
    yearlyBtn.className = 'px-4 py-2 rounded-xl transition-all bg-cyan-500/10 text-cyan-400 border border-cyan-800/60';
  }

  updateAnalyticsTab();
}

window.setAnalyticsTimeline = setAnalyticsTimeline;

function updateAnalyticsTab() {
  let datasets = {
    weekly: {
      current: [42, 59, 81, 74, 98, 120, 110],
      previous: [35, 48, 70, 80, 85, 95, 90],
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      growth: 14.5
    },
    monthly: {
      current: [240, 310, 480, 410],
      previous: [210, 280, 420, 390],
      labels: ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4'],
      growth: 9.8
    },
    yearly: {
      current: [1800, 2200, 2900, 3400, 3900, 4800],
      previous: [1500, 1900, 2400, 3100, 3600, 4100],
      labels: ['Jan-Feb', 'Mar-Apr', 'May-Jun', 'Jul-Aug', 'Sep-Oct', 'Nov-Dec'],
      growth: 16.2
    }
  };

  const activeSet = datasets[state.analyticsTimeline];
  
  // Render growth stats
  const growthBadge = document.getElementById('analytics-growth-badge');
  const growthPctText = document.getElementById('analytics-growth-pct');
  
  if (activeSet.growth >= 0) {
    growthBadge.className = 'bg-emerald-950/50 border border-emerald-800/60 px-3 py-1 rounded-xl text-xs font-bold text-emerald-400 flex items-center gap-1.5';
    growthPctText.textContent = `▲ +${activeSet.growth}% Growth`;
  } else {
    growthBadge.className = 'bg-rose-950/50 border border-rose-800/60 px-3 py-1 rounded-xl text-xs font-bold text-rose-400 flex items-center gap-1.5';
    growthPctText.textContent = `▼ ${activeSet.growth}% Drop`;
  }

  // Aggregate active rider nodes count (mock count based on active partner)
  let activeRidersCount = 42;
  const savedRider = localStorage.getItem('quickdash_partner');
  if (savedRider) {
    const rider = JSON.parse(savedRider);
    if (rider.isApproved && rider.isOnline) activeRidersCount++;
  }
  document.getElementById('analytics-active-riders').textContent = activeRidersCount;

  // Render SVG Chart Lines
  const svg = document.getElementById('analytics-svg-chart');
  if (!svg) return;

  const width = svg.clientWidth || 500;
  const height = svg.clientHeight || 192;
  const maxVal = Math.max(...activeSet.current, ...activeSet.previous) * 1.15;
  const pointsCount = activeSet.current.length;
  const stepX = width / (pointsCount - 1);

  // SVG drawing paths
  let currentPoints = [];
  let previousPoints = [];

  for (let i = 0; i < pointsCount; i++) {
    const x = i * stepX;
    const yCurrent = height - (activeSet.current[i] / maxVal) * height * 0.8 - 15;
    const yPrevious = height - (activeSet.previous[i] / maxVal) * height * 0.8 - 15;
    currentPoints.push({ x, y: yCurrent });
    previousPoints.push({ x, y: yPrevious });
  }

  // Construct Path string
  const currentPathD = buildSVGPath(currentPoints);
  const previousPathD = buildSVGPath(previousPoints);

  // Generate gridlines and text labels in SVG
  let svgContent = '';
  
  // Horizontal gridline guides
  for (let g = 1; g <= 3; g++) {
    const yVal = height - (g * 0.25) * height * 0.8 - 15;
    svgContent += `<line x1="0" y1="${yVal}" x2="${width}" y2="${yVal}" stroke="#1e293b" stroke-dasharray="4,4" stroke-width="1" />`;
  }

  // Draw previous dashed gray line
  svgContent += `<path d="${previousPathD}" fill="none" stroke="#64748b" stroke-width="2" stroke-dasharray="6,4" />`;
  
  // Draw current glowing cyan line
  svgContent += `<path d="${currentPathD}" fill="none" stroke="#3cd7ff" stroke-width="3" style="filter: drop-shadow(0 0 4px rgba(60,215,255,0.4))" />`;

  // Draw dots and interaction layers
  for (let i = 0; i < pointsCount; i++) {
    const pt = currentPoints[i];
    const prevPt = previousPoints[i];
    
    // Previous dots
    svgContent += `<circle cx="${prevPt.x}" cy="${prevPt.y}" r="3" fill="#64748b" />`;
    
    // Current glowing dots
    svgContent += `
      <g class="group cursor-pointer">
        <circle cx="${pt.x}" cy="${pt.y}" r="5" fill="#3cd7ff" stroke="#0f172a" stroke-width="2" />
        <circle cx="${pt.x}" cy="${pt.y}" r="8" fill="rgba(60,215,255,0.2)" class="scale-0 group-hover:scale-100 transition-transform origin-center" />
      </g>
    `;

    // Horizontal Labels
    svgContent += `
      <text x="${pt.x}" y="${height - 2}" text-anchor="middle" fill="#94a3b8" font-family="JetBrains Mono" font-size="9px">${activeSet.labels[i]}</text>
    `;
  }

  svg.innerHTML = svgContent;
}

function buildSVGPath(points) {
  if (points.length === 0) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i].x} ${points[i].y}`;
  }
  return d;
}

// ── Interactive Terminal Parser ───────────────────────────────────
function handleTerminalCommand(e) {
  if (e.key !== 'Enter') return;
  const input = document.getElementById('terminal-cmd-input');
  const cmd = input.value.trim().toLowerCase();
  input.value = '';

  if (!cmd) return;

  logTerminal(`admin@aegis:~# ${cmd}`);

  if (cmd === '/help') {
    logTerminal('Available cyber shell diagnostics:');
    logTerminal('  /stats    - Outputs current regional nodal statistics.');
    logTerminal('  /health   - Evaluates system packet latencies.');
    logTerminal('  /logs     - Echoes recent verified administrative action events.');
    logTerminal('  /banned   - Lists phone/emails permanently blacklisted.');
    logTerminal('  /clear    - Purges current terminal scroll buffer.');
  } else if (cmd === '/stats') {
    logTerminal(`Region: ${state.cityData.name.toUpperCase()}`);
    logTerminal(`  * Node Active Stores: ${state.cityData.storesCount}`);
    logTerminal(`  * Consumer Footfalls: ${state.cityData.visitsCount}`);
    logTerminal(`  * Target Payout Volume: ${state.cityData.ordersDelivered} Clear`);
  } else if (cmd === '/health') {
    logTerminal('Pinging orbital networks:');
    logTerminal('  * gateway-delhi-01.quickdash.in -> 12ms [STABLE]');
    logTerminal('  * store-sync-nodal.quickdash.in -> 8ms [STABLE]');
    logTerminal('  * db-replica-local-backup       -> 0.2ms [STABLE]');
    logTerminal('Status: Systems integrity fully operational.');
  } else if (cmd === '/logs') {
    logTerminal('Recent System Log Events:');
    logTerminal('  * [14:02:11] User admin logged into Aegis Shell.');
    logTerminal('  * [15:10:48] Nodal region दिल्ली synchronized.');
    logTerminal('  * [15:20:10] Blacklist sync done. 0 blocks flagged.');
  } else if (cmd === '/banned') {
    let blacklist = [];
    try {
      blacklist = JSON.parse(localStorage.getItem('quickdash_blacklist') || '[]');
    } catch (e) {
      blacklist = [];
    }
    
    if (blacklist.length === 0) {
      logTerminal('Blacklist is empty. No accounts are banned.');
    } else {
      logTerminal('Permanently blacklisted profiles:');
      blacklist.forEach((b, idx) => {
        logTerminal(`  [${idx+1}] Target: ${b.target} | Phone: ${b.phone || 'N/A'} | Email: ${b.email || 'N/A'} | Reason: ${b.reason}`);
      });
    }
  } else if (cmd === '/clear') {
    const logs = document.getElementById('terminal-logs');
    logs.innerHTML = '<div class="text-slate-500">Terminal buffer cleared. Ready.</div>';
  } else {
    logTerminal(`Unknown terminal diagnostics: "${cmd}". Type /help for assistance.`);
  }
}

window.handleTerminalCommand = handleTerminalCommand;

function logTerminal(message) {
  const container = document.getElementById('terminal-logs');
  if (!container) return;

  const div = document.createElement('div');
  div.textContent = message;
  container.appendChild(div);
  
  // Auto-scroll
  container.scrollTop = container.scrollHeight;
}

// ── Tab 3: Verification Desk Sync ─────────────────────────────────
function setVerificationSubTab(tab) {
  state.verificationSubTab = tab;
  
  const regBtn = document.getElementById('btn-ver-new-registrations');
  const modBtn = document.getElementById('btn-ver-profile-changes');
  
  const regSec = document.getElementById('verification-registrations-section');
  const modSec = document.getElementById('verification-profile-changes-section');

  [regBtn, modBtn].forEach(b => {
    b.className = 'px-4 py-2 rounded-xl text-slate-400 transition-all';
  });

  if (tab === 'registrations') {
    regBtn.className = 'px-4 py-2 rounded-xl transition-all bg-cyan-500/10 text-cyan-400 border border-cyan-800/60';
    regSec.classList.remove('hidden');
    modSec.classList.add('hidden');
  } else {
    modBtn.className = 'px-4 py-2 rounded-xl transition-all bg-cyan-500/10 text-cyan-400 border border-cyan-800/60 relative';
    modSec.classList.remove('hidden');
    regSec.classList.add('hidden');
  }
  
  updateVerificationTab();
}

window.setVerificationSubTab = setVerificationSubTab;

function updateVerificationTab() {
  // Clear lists
  const storeList = document.getElementById('ver-list-stores');
  const partnerList = document.getElementById('ver-list-partners');
  const changesList = document.getElementById('ver-list-profile-changes');

  // Load from local storage
  let userObj = null;
  let partnerObj = null;
  
  try {
    const rawUser = localStorage.getItem('quickdash_user');
    if (rawUser) userObj = JSON.parse(rawUser);
  } catch (e) {}

  try {
    const rawPartner = localStorage.getItem('quickdash_partner');
    if (rawPartner) partnerObj = JSON.parse(rawPartner);
  } catch (e) {}

  // 1. Pending Store Owners (New Registrations)
  let pendingStores = [];
  if (userObj && userObj.role === 'merchant' && userObj.isApproved === false && !userObj.updatePending) {
    pendingStores.push(userObj);
  }

  // 2. Pending Delivery Partners (New Registrations)
  let pendingPartners = [];
  if (partnerObj && partnerObj.isApproved === false && !partnerObj.updatePending) {
    pendingPartners.push(partnerObj);
  }

  // 3. Profile Modifications Queue
  let pendingChanges = [];
  if (userObj && userObj.role === 'merchant' && userObj.updatePending === true) {
    pendingChanges.push({ type: 'merchant', data: userObj });
  }
  if (partnerObj && partnerObj.updatePending === true) {
    pendingChanges.push({ type: 'partner', data: partnerObj });
  }

  // Set count badges
  document.getElementById('count-ver-stores').textContent = pendingStores.length;
  document.getElementById('count-ver-partners').textContent = pendingPartners.length;
  
  const modCountText = document.getElementById('count-ver-profile-changes');
  if (modCountText) modCountText.textContent = pendingChanges.length;

  const modBadge = document.getElementById('badge-ver-profile-changes');
  if (modBadge) {
    if (pendingChanges.length > 0) {
      modBadge.textContent = pendingChanges.length;
      modBadge.classList.remove('hidden');
    } else {
      modBadge.classList.add('hidden');
    }
  }

  // Calculate overall badge-verification count (Sidebar / Mobile bar)
  const totalVerPending = pendingStores.length + pendingPartners.length + pendingChanges.length;
  const sysVerBadge = document.getElementById('badge-verification');
  const mobVerBadge = document.getElementById('mobile-badge-verification');
  
  [sysVerBadge, mobVerBadge].forEach(badge => {
    if (badge) {
      if (totalVerPending > 0) {
        badge.textContent = totalVerPending;
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    }
  });

  // Render Stores list
  if (pendingStores.length === 0) {
    storeList.innerHTML = `<div class="text-center py-12 text-slate-500 text-xs">No pending store registrations.</div>`;
  } else {
    storeList.innerHTML = pendingStores.map(store => `
      <div class="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/60 text-left space-y-3.5 relative overflow-hidden">
        <div class="flex justify-between items-start">
          <div class="space-y-0.5">
            <h4 class="font-bold text-slate-200 text-sm leading-snug">${store.shopName}</h4>
            <span class="text-[10px] text-cyan-400 font-mono tracking-wider block font-bold capitalize">Category: ${store.category}</span>
          </div>
          <span class="text-xs bg-cyan-950 text-cyan-400 border border-cyan-800/60 px-2.5 py-0.5 rounded-lg font-mono">OWNER</span>
        </div>
        <div class="grid grid-cols-2 gap-3 text-[11px] text-slate-400">
          <div>
            <span>Contact Owner</span>
            <strong class="text-slate-300 block font-medium mt-0.5">${store.name}</strong>
          </div>
          <div>
            <span>UPI ID Address</span>
            <strong class="text-slate-300 block font-medium mt-0.5 font-mono">${store.upiId}</strong>
          </div>
        </div>
        <button onclick="openLightbox('store')" class="w-full bg-cyan-500/10 hover:bg-cyan-500 hover:text-slate-950 border border-cyan-800/40 hover:border-cyan-500 text-cyan-400 font-bold py-2 px-4 rounded-xl text-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 uppercase">
          <span class="material-symbols-outlined text-sm font-bold">document_scanner</span>
          <span>Examine Submitted Documents</span>
        </button>
      </div>
    `).join('');
  }

  // Render Partners list
  if (pendingPartners.length === 0) {
    partnerList.innerHTML = `<div class="text-center py-12 text-slate-500 text-xs">No pending rider applications.</div>`;
  } else {
    partnerList.innerHTML = pendingPartners.map(partner => `
      <div class="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/60 text-left space-y-3.5 relative overflow-hidden">
        <div class="flex justify-between items-start">
          <div class="space-y-0.5">
            <h4 class="font-bold text-slate-200 text-sm leading-snug">${partner.name}</h4>
            <span class="text-[10px] text-cyan-400 font-mono tracking-wider block font-bold capitalize">Vehicle: ${partner.vehicleType} (${partner.vehicleNumber})</span>
          </div>
          <span class="text-xs bg-cyan-950 text-cyan-400 border border-cyan-800/60 px-2.5 py-0.5 rounded-lg font-mono">DELIVERY</span>
        </div>
        <div class="grid grid-cols-2 gap-3 text-[11px] text-slate-400">
          <div>
            <span>Contact Phone</span>
            <strong class="text-slate-300 block font-medium mt-0.5">${partner.phone}</strong>
          </div>
          <div>
            <span>UPI ID Address</span>
            <strong class="text-slate-300 block font-medium mt-0.5 font-mono">${partner.upiId}</strong>
          </div>
        </div>
        <button onclick="openLightbox('partner')" class="w-full bg-cyan-500/10 hover:bg-cyan-500 hover:text-slate-950 border border-cyan-800/40 hover:border-cyan-500 text-cyan-400 font-bold py-2 px-4 rounded-xl text-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 uppercase">
          <span class="material-symbols-outlined text-sm font-bold">document_scanner</span>
          <span>Examine Submitted Documents</span>
        </button>
      </div>
    `).join('');
  }

  // Render Profile modifications list
  if (changesList) {
    if (pendingChanges.length === 0) {
      changesList.innerHTML = `<div class="text-center py-12 text-slate-500 text-xs">No pending profile changes.</div>`;
    } else {
      changesList.innerHTML = pendingChanges.map(change => {
        const isMerchant = change.type === 'merchant';
        const label = isMerchant ? '🏪 Store Owner Profile Update' : '🛵 Delivery Partner Profile Update';
        const title = isMerchant ? change.data.shopName : change.data.name;
        
        return `
          <div class="p-4 rounded-2xl bg-slate-950/40 border border-amber-900/40 text-left space-y-3.5 relative overflow-hidden">
            <div class="absolute -right-6 -bottom-6 w-16 h-16 bg-amber-500/5 rounded-full blur-xl pointer-events-none"></div>
            
            <div class="flex justify-between items-start">
              <div class="space-y-0.5">
                <h4 class="font-bold text-slate-200 text-sm leading-snug">${title}</h4>
                <span class="text-[10px] text-amber-400 block font-semibold">${label}</span>
              </div>
              <span class="text-xs bg-amber-950/50 text-amber-400 border border-amber-800/50 px-2.5 py-0.5 rounded-lg font-mono font-bold">MODIFICATION</span>
            </div>
            
            <div class="text-slate-400 text-xs leading-relaxed max-w-md">
              The user has requested updates to their live profile settlements or identification credentials. Review changes side-by-side.
            </div>

            <button onclick="openProfileDiffModal('${change.type}')" class="w-full bg-amber-500/10 hover:bg-amber-500 hover:text-slate-950 border border-amber-800/40 hover:border-amber-500 text-amber-400 font-bold py-2 px-4 rounded-xl text-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 uppercase">
              <span class="material-symbols-outlined text-sm font-bold">compare</span>
              <span>Compare Profile Updates</span>
            </button>
          </div>
        `;
      }).join('');
    }
  }
}

// ── Holographic Lightbox Logic ────────────────────────────────────
let activeLightboxRole = null; // 'store' | 'partner'

function openLightbox(role) {
  activeLightboxRole = role;
  
  const lightbox = document.getElementById('verification-lightbox');
  if (!lightbox) return;

  let userObj = null;
  let partnerObj = null;

  try {
    const rawUser = localStorage.getItem('quickdash_user');
    if (rawUser) userObj = JSON.parse(rawUser);
  } catch (e) {}

  try {
    const rawPartner = localStorage.getItem('quickdash_partner');
    if (rawPartner) partnerObj = JSON.parse(rawPartner);
  } catch (e) {}

  const lightName = document.getElementById('light-name');
  const lightPhone = document.getElementById('light-phone');
  const lightAddress = document.getElementById('light-address');
  const lightUpi = document.getElementById('light-upi');
  
  const boxVehicle = document.getElementById('light-box-vehicle-row');
  const boxShop = document.getElementById('light-box-shop-row');
  const filesContainer = document.getElementById('light-files-container');
  
  lightbox.classList.remove('hidden');

  if (role === 'store') {
    const store = userObj;
    document.getElementById('lightbox-icon').textContent = '🏪';
    document.getElementById('lightbox-title').textContent = 'Store Owner Verification Desk';
    document.getElementById('lightbox-subtitle').textContent = 'Auditing shop owner and business credentials.';

    lightName.textContent = store.name || '--';
    lightPhone.textContent = store.phone || '--';
    lightUpi.textContent = store.upiId || '--';

    // Address
    if (store.address && typeof store.address === 'object') {
      if (store.address.latitude) {
        lightAddress.textContent = `📍 GPS (Lat: ${store.address.latitude.toFixed(4)}, Lon: ${store.address.longitude.toFixed(4)})`;
      } else {
        lightAddress.textContent = `${store.address.line || ''}, ${store.address.city || ''} (Pin: ${store.address.pincode || ''})`;
      }
    } else {
      lightAddress.textContent = store.address || '--';
    }

    boxVehicle.classList.add('hidden');
    boxShop.classList.remove('hidden');
    document.getElementById('light-shop-name').textContent = store.shopName || '--';
    document.getElementById('light-shop-category').textContent = store.category || '--';

    // Files
    filesContainer.innerHTML = `
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center space-y-2">
        <span class="text-xl block">👤</span>
        <strong class="text-slate-300 block text-[10px]">OWNER PHOTO</strong>
        <span class="text-[9px] text-slate-500 font-mono block truncate">${store.ownerPhoto || 'photo_owner.jpg'}</span>
        <span class="text-[9px] bg-emerald-950/30 text-emerald-400 border border-emerald-800/40 px-2 py-0.5 rounded font-mono font-bold">SECURE SCAN</span>
      </div>
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center space-y-2">
        <span class="text-xl block">📸</span>
        <strong class="text-slate-300 block text-[10px]">STORE FRONT PHOTO</strong>
        <span class="text-[9px] text-slate-500 font-mono block truncate">${store.shopPhoto || 'photo_store.jpg'}</span>
        <span class="text-[9px] bg-emerald-950/30 text-emerald-400 border border-emerald-800/40 px-2 py-0.5 rounded font-mono font-bold">SECURE SCAN</span>
      </div>
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center space-y-2 col-span-2">
        <span class="text-xl block">🪪</span>
        <strong class="text-slate-300 block text-[10px]">AADHAAR CARD / ID DOC</strong>
        <span class="text-[9px] text-slate-500 font-mono block truncate">${store.aadhaarFile || 'aadhaar_card.pdf'}</span>
        <span class="text-[9px] bg-emerald-950/30 text-emerald-400 border border-emerald-800/40 px-2 py-0.5 rounded font-mono font-bold">SECURE SCAN</span>
      </div>
    `;

  } else {
    const partner = partnerObj;
    document.getElementById('lightbox-icon').textContent = '🛵';
    document.getElementById('lightbox-title').textContent = 'Delivery Partner Verification Desk';
    document.getElementById('lightbox-subtitle').textContent = 'Auditing rider identity and vehicle permissions.';

    lightName.textContent = partner.name || '--';
    lightPhone.textContent = partner.phone || '--';
    lightAddress.textContent = partner.location || '--';
    lightUpi.textContent = partner.upiId || '--';

    boxShop.classList.add('hidden');
    boxVehicle.classList.remove('hidden');
    document.getElementById('light-vehicle-type').textContent = partner.vehicleType || '--';
    document.getElementById('light-vehicle-number').textContent = partner.vehicleNumber || '--';

    // Files
    filesContainer.innerHTML = `
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center space-y-2">
        <span class="text-xl block">🪪</span>
        <strong class="text-slate-300 block text-[10px]">IDENTIFICATION DOCUMENT</strong>
        <span class="text-[9px] text-slate-500 font-mono block truncate">${partner.idDocName || 'identity_doc.png'}</span>
        <span class="text-[9px] bg-emerald-950/30 text-emerald-400 border border-emerald-800/40 px-2 py-0.5 rounded font-mono font-bold">SECURE SCAN</span>
      </div>
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center space-y-2">
        <span class="text-xl block">📄</span>
        <strong class="text-slate-300 block text-[10px]">LICENSE PDF</strong>
        <span class="text-[9px] text-slate-500 font-mono block truncate">${partner.licenseName || 'license_driver.pdf'}</span>
        <span class="text-[9px] bg-emerald-950/30 text-emerald-400 border border-emerald-800/40 px-2 py-0.5 rounded font-mono font-bold">SECURE SCAN</span>
      </div>
    `;
  }
}

window.openLightbox = openLightbox;

function closeLightbox() {
  const lightbox = document.getElementById('verification-lightbox');
  if (lightbox) lightbox.classList.add('hidden');
}

window.closeLightbox = closeLightbox;

function approveLightboxApp() {
  if (activeLightboxRole === 'store') {
    let store = JSON.parse(localStorage.getItem('quickdash_user'));
    store.isApproved = true;
    localStorage.setItem('quickdash_user', JSON.stringify(store));
    
    // Add store directly to custom shops
    let customShops = [];
    try {
      customShops = JSON.parse(localStorage.getItem('quickdash_custom_shops') || '[]');
    } catch (e) {}
    
    const shopId = `custom-merchant-store`;
    if (!customShops.some(s => s.id === shopId)) {
      customShops.push({
        id: shopId,
        name: store.shopName,
        category: store.category || 'grocery',
        photo: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500',
        lat: 28.6150,
        lon: 77.2120,
        rating: 4.8,
        reviewsCount: 12,
        avgProductValue: 120,
        isOpen: true
      });
      localStorage.setItem('quickdash_custom_shops', JSON.stringify(customShops));
    }

    showToast('🏪 Store Owner verified and shop added to network!', 'check');
    logTerminal(`Shop verified: ${store.shopName}. Added custom store listing ID: ${shopId}`);
  } else {
    let partner = JSON.parse(localStorage.getItem('quickdash_partner'));
    partner.isApproved = true;
    partner.status = 'approved';
    partner.isOnline = true;
    partner.earnings = 1845.00; // Gift them an initial starting balance!
    
    localStorage.setItem('quickdash_partner', JSON.stringify(partner));
    
    // Seed initial mock history for partner to display nice bento dashboard
    const mockHistory = [
      {
        orderId: 'QD-8912',
        shopName: 'Sharma Grocery Store',
        customerAddress: 'Sec 14, Pocket B, New Delhi',
        timestamp: Date.now() - 4 * 24 * 60 * 60 * 1000 - 3 * 3600 * 1000,
        distance: 2.1,
        basePay: 25.00,
        distanceFee: 0.00,
        tip: 20.00,
        totalPayout: 45.00
      },
      {
        orderId: 'QD-7431',
        shopName: 'Sharma Grocery Store',
        customerAddress: 'Pratap Nagar, Gali 2, New Delhi',
        timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000 - 1.5 * 3600 * 1000,
        distance: 4.8,
        basePay: 25.00,
        distanceFee: 18.00,
        tip: 50.00,
        totalPayout: 93.00
      }
    ];
    localStorage.setItem('quickdash_partner_orders_history', JSON.stringify(mockHistory));

    showToast('🛵 Delivery Partner verified and activated!', 'check');
    logTerminal(`Rider verified: ${partner.name}. Assigned vehicle: ${partner.vehicleType}`);
  }

  closeLightbox();
  updateVerificationTab();
  updateOverviewTab();
}

window.approveLightboxApp = approveLightboxApp;

function rejectLightboxApp() {
  if (confirm('Are you sure you want to decline this registration application? This will wipe their pending files.')) {
    if (activeLightboxRole === 'store') {
      localStorage.removeItem('quickdash_user');
      showToast('❌ Store owner registration declined and purged.', 'error');
      logTerminal('Store Owner registration declined by administrator.');
    } else {
      localStorage.removeItem('quickdash_partner');
      localStorage.removeItem('quickdash_partner_orders_history');
      showToast('❌ Delivery partner application declined and purged.', 'error');
      logTerminal('Delivery Partner application declined by administrator.');
    }
    
    closeLightbox();
    updateVerificationTab();
    updateOverviewTab();
  }
}

window.rejectLightboxApp = rejectLightboxApp;

// ── Profile Difference Modal Logic (User Request) ──────────────────
let activeDiffRole = null; // 'merchant' | 'partner'

function openProfileDiffModal(role) {
  activeDiffRole = role;
  
  const modal = document.getElementById('profile-diff-modal');
  if (!modal) return;

  let userObj = null;
  let partnerObj = null;

  try {
    const rawUser = localStorage.getItem('quickdash_user');
    if (rawUser) userObj = JSON.parse(rawUser);
  } catch (e) {}

  try {
    const rawPartner = localStorage.getItem('quickdash_partner');
    if (rawPartner) partnerObj = JSON.parse(rawPartner);
  } catch (e) {}

  const origFields = document.getElementById('diff-original-fields');
  const propFields = document.getElementById('diff-proposed-fields');

  modal.classList.remove('hidden');

  if (role === 'merchant') {
    const orig = userObj;
    const prop = userObj.pendingChanges || {};

    origFields.innerHTML = `
      <div class="pb-1.5 border-b border-slate-800/40">
        <span class="text-slate-500 block text-[9px]">Shop Name</span>
        <strong class="text-slate-300 font-medium">${orig.shopName || '--'}</strong>
      </div>
      <div class="pb-1.5 border-b border-slate-800/40">
        <span class="text-slate-500 block text-[9px]">Category</span>
        <strong class="text-slate-300 font-medium capitalize">${orig.category || '--'}</strong>
      </div>
      <div>
        <span class="text-slate-500 block text-[9px]">Receiving Settlements UPI</span>
        <strong class="text-slate-300 font-mono font-medium truncate block">${orig.upiId || '--'}</strong>
      </div>
    `;

    propFields.innerHTML = `
      <div class="pb-1.5 border-b border-amber-900/40">
        <span class="text-amber-500/70 block text-[9px]">Requested Shop Name</span>
        <strong class="${orig.shopName !== prop.shopName ? 'text-amber-300 font-bold bg-amber-950/50 px-1 py-0.2 rounded' : 'text-slate-300 font-medium'}">${prop.shopName || '--'}</strong>
      </div>
      <div class="pb-1.5 border-b border-amber-900/40">
        <span class="text-amber-500/70 block text-[9px]">Requested Category</span>
        <strong class="${orig.category !== prop.category ? 'text-amber-300 font-bold bg-amber-950/50 px-1 py-0.2 rounded capitalize' : 'text-slate-300 font-medium capitalize'}">${prop.category || '--'}</strong>
      </div>
      <div>
        <span class="text-amber-500/70 block text-[9px]">Requested Settlements UPI</span>
        <strong class="${orig.upiId !== prop.upiId ? 'text-amber-300 font-bold bg-amber-950/50 px-1 py-0.2 rounded font-mono truncate block' : 'text-slate-300 font-mono font-medium truncate block'}">${prop.upiId || '--'}</strong>
      </div>
    `;

  } else {
    const orig = partnerObj;
    const prop = partnerObj.pendingChanges || {};

    origFields.innerHTML = `
      <div class="pb-1.5 border-b border-slate-800/40">
        <span class="text-slate-500 block text-[9px]">Full Name</span>
        <strong class="text-slate-300 font-medium">${orig.name || '--'}</strong>
      </div>
      <div class="pb-1.5 border-b border-slate-800/40">
        <span class="text-slate-500 block text-[9px]">Vehicle Type</span>
        <strong class="text-slate-300 font-medium capitalize">${orig.vehicleType || '--'}</strong>
      </div>
      <div class="pb-1.5 border-b border-slate-800/40">
        <span class="text-slate-500 block text-[9px]">Plate Number</span>
        <strong class="text-slate-300 font-medium font-mono">${orig.vehicleNumber || '--'}</strong>
      </div>
      <div>
        <span class="text-slate-500 block text-[9px]">Receiving Earnings UPI</span>
        <strong class="text-slate-300 font-mono font-medium truncate block">${orig.upiId || '--'}</strong>
      </div>
    `;

    propFields.innerHTML = `
      <div class="pb-1.5 border-b border-amber-900/40">
        <span class="text-amber-500/70 block text-[9px]">Requested Full Name</span>
        <strong class="${orig.name !== prop.name ? 'text-amber-300 font-bold bg-amber-950/50 px-1 py-0.2 rounded' : 'text-slate-300 font-medium'}">${prop.name || '--'}</strong>
      </div>
      <div class="pb-1.5 border-b border-amber-900/40">
        <span class="text-amber-500/70 block text-[9px]">Requested Vehicle Type</span>
        <strong class="${orig.vehicleType !== prop.vehicleType ? 'text-amber-300 font-bold bg-amber-950/50 px-1 py-0.2 rounded capitalize' : 'text-slate-300 font-medium capitalize'}">${prop.vehicleType || '--'}</strong>
      </div>
      <div class="pb-1.5 border-b border-amber-900/40">
        <span class="text-amber-500/70 block text-[9px]">Requested Plate Number</span>
        <strong class="${orig.vehicleNumber !== prop.vehicleNumber ? 'text-amber-300 font-bold bg-amber-950/50 px-1 py-0.2 rounded font-mono' : 'text-slate-300 font-mono font-medium'}">${prop.vehicleNumber || '--'}</strong>
      </div>
      <div>
        <span class="text-amber-500/70 block text-[9px]">Requested Earnings UPI</span>
        <strong class="${orig.upiId !== prop.upiId ? 'text-amber-300 font-bold bg-amber-950/50 px-1 py-0.2 rounded font-mono truncate block' : 'text-slate-300 font-mono font-medium truncate block'}">${prop.upiId || '--'}</strong>
      </div>
    `;
  }
}

window.openProfileDiffModal = openProfileDiffModal;

function closeProfileDiffModal() {
  const modal = document.getElementById('profile-diff-modal');
  if (modal) modal.classList.add('hidden');
}

window.closeProfileDiffModal = closeProfileDiffModal;

function approveProfileUpdates() {
  if (activeDiffRole === 'merchant') {
    let user = JSON.parse(localStorage.getItem('quickdash_user'));
    const changes = user.pendingChanges || {};

    // 1. Merge into live profile
    user.shopName = changes.shopName || user.shopName;
    user.category = changes.category || user.category;
    user.upiId = changes.upiId || user.upiId;

    // 2. Clear changes flag
    user.updatePending = false;
    delete user.pendingChanges;

    localStorage.setItem('quickdash_user', JSON.stringify(user));

    // 3. Merge into custom shops list
    let customShops = [];
    try {
      customShops = JSON.parse(localStorage.getItem('quickdash_custom_shops') || '[]');
    } catch (e) {}

    let shop = customShops.find(s => s.id === 'custom-merchant-store');
    if (shop) {
      shop.name = user.shopName;
      shop.category = user.category;
      localStorage.setItem('quickdash_custom_shops', JSON.stringify(customShops));
    }

    showToast('🏪 Store owner profile modifications verified and approved live!', 'check');
    logTerminal(`Profile edits approved for Merchant: ${user.shopName}. Live updates applied.`);

  } else {
    let partner = JSON.parse(localStorage.getItem('quickdash_partner'));
    const changes = partner.pendingChanges || {};

    // 1. Merge into live partner profile
    partner.name = changes.name || partner.name;
    partner.vehicleType = changes.vehicleType || partner.vehicleType;
    partner.vehicleNumber = changes.vehicleNumber || partner.vehicleNumber;
    partner.upiId = changes.upiId || partner.upiId;

    // 2. Clear changes flag
    partner.updatePending = false;
    delete partner.pendingChanges;

    localStorage.setItem('quickdash_partner', JSON.stringify(partner));

    showToast('🛵 Delivery Partner profile modifications verified and approved live!', 'check');
    logTerminal(`Profile edits approved for Rider: ${partner.name}. Live updates applied.`);
  }

  closeProfileDiffModal();
  updateVerificationTab();
  updateOverviewTab();
}

window.approveProfileUpdates = approveProfileUpdates;

function rejectProfileUpdates() {
  if (confirm('Are you sure you want to reject these profile modifications? The old profile values will remain active.')) {
    if (activeDiffRole === 'merchant') {
      let user = JSON.parse(localStorage.getItem('quickdash_user'));
      user.updatePending = false;
      delete user.pendingChanges;
      localStorage.setItem('quickdash_user', JSON.stringify(user));
      showToast('❌ Merchant profile changes rejected.', 'error');
      logTerminal('Merchant profile updates rejected by administrator.');
    } else {
      let partner = JSON.parse(localStorage.getItem('quickdash_partner'));
      partner.updatePending = false;
      delete partner.pendingChanges;
      localStorage.setItem('quickdash_partner', JSON.stringify(partner));
      showToast('❌ Delivery Partner profile changes rejected.', 'error');
      logTerminal('Delivery Partner profile updates rejected by administrator.');
    }

    closeProfileDiffModal();
    updateVerificationTab();
  }
}

window.rejectProfileUpdates = rejectProfileUpdates;

// ── Tab 4: Complaints Portal Logic ───────────────────────────────
function setComplaintPriorityFilter(priority) {
  state.complaintFilter = priority;
  
  const allBtn = document.getElementById('btn-comp-filter-all');
  const critBtn = document.getElementById('btn-comp-filter-critical');
  const urgBtn = document.getElementById('btn-comp-filter-urgent');
  const resBtn = document.getElementById('btn-comp-filter-resolved');
  
  [allBtn, critBtn, urgBtn, resBtn].forEach(b => {
    b.className = 'px-3 py-2 rounded-xl text-slate-400 transition-all';
  });

  if (priority === 'all') {
    allBtn.className = 'px-3 py-2 rounded-xl transition-all bg-cyan-500/10 text-cyan-400 border border-cyan-800/60';
  } else if (priority === 'critical') {
    critBtn.className = 'px-3 py-2 rounded-xl transition-all bg-cyan-500/10 text-cyan-400 border border-cyan-800/60 flex items-center gap-1.5';
  } else if (priority === 'urgent') {
    urgBtn.className = 'px-3 py-2 rounded-xl transition-all bg-cyan-500/10 text-cyan-400 border border-cyan-800/60 flex items-center gap-1.5';
  } else {
    resBtn.className = 'px-3 py-2 rounded-xl transition-all bg-cyan-500/10 text-cyan-400 border border-cyan-800/60 flex items-center gap-1.5';
  }

  updateComplaintsTab();
}

window.setComplaintPriorityFilter = setComplaintPriorityFilter;

function updateComplaintsTab() {
  const container = document.getElementById('complaints-list');
  if (!container) return;

  let filtered = state.complaints;
  
  if (state.complaintFilter !== 'all') {
    if (state.complaintFilter === 'resolved') {
      filtered = state.complaints.filter(c => c.status === 'resolved');
    } else {
      filtered = state.complaints.filter(c => c.priority === state.complaintFilter && c.status !== 'resolved');
    }
  } else {
    // Show unresolved first
    filtered = [...state.complaints].sort((a,b) => (a.status === 'resolved' ? 1 : 0) - (b.status === 'resolved' ? 1 : 0));
  }

  // Count active complaints
  const activeCount = state.complaints.filter(c => c.status === 'pending').length;
  document.getElementById('count-complaints-total').textContent = activeCount;

  // Sync general badges
  const sysCompBadge = document.getElementById('badge-complaints');
  const mobCompBadge = document.getElementById('mobile-badge-complaints');
  
  [sysCompBadge, mobCompBadge].forEach(badge => {
    if (badge) {
      if (activeCount > 0) {
        badge.textContent = activeCount;
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    }
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div class="text-center py-12 text-slate-500 text-xs">No complaints logged in this category.</div>`;
    return;
  }

  container.innerHTML = filtered.map(c => {
    const isPending = c.status === 'pending';
    
    // Priority badges
    const pBadges = {
      critical: 'bg-rose-950/60 text-rose-400 border-rose-800/60',
      urgent: 'bg-amber-950/50 text-amber-400 border-amber-800/50',
      routine: 'bg-slate-900/40 text-slate-400 border-slate-800/60'
    };
    const pBadge = pBadges[c.priority] || 'bg-slate-900 text-slate-400';

    return `
      <div id="ticket-card-${c.id}" class="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/60 text-left space-y-3.5 relative overflow-hidden transition-all ${!isPending ? 'opacity-50' : ''}">
        <div class="flex justify-between items-start">
          <div class="space-y-0.5">
            <h4 class="font-bold text-slate-200 text-sm leading-snug">${c.user}</h4>
            <span class="text-[9px] text-slate-500 font-mono block">Ticket ID: ${c.id}</span>
          </div>
          
          <div class="flex gap-2">
            <span class="text-[9px] border px-2 py-0.5 rounded font-mono font-bold uppercase ${pBadge}">${c.priority}</span>
            <span class="text-[9px] border px-2 py-0.5 rounded font-mono font-bold uppercase ${isPending ? 'bg-amber-950/30 text-amber-400 border-amber-800/50' : 'bg-emerald-950/40 text-emerald-400 border-emerald-800/50'}">${isPending ? 'PENDING' : 'RESOLVED'}</span>
          </div>
        </div>
        
        <p class="text-slate-300 text-xs leading-relaxed">${c.text}</p>

        ${isPending ? `
          <div class="pt-3 border-t border-slate-800/60 flex gap-3">
            <button onclick="resolveGrievance('${c.id}')" class="flex-1 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold py-2 px-4 rounded-xl text-[11px] transition-all active:scale-95 flex items-center justify-center gap-1">
              <span class="material-symbols-outlined text-sm font-bold">done</span>
              <span>Resolve & Close</span>
            </button>
            <button onclick="dispatchCitizenResponse('${c.id}')" class="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2 px-4 rounded-xl text-[11px] transition-all flex items-center justify-center gap-1">
              <span class="material-symbols-outlined text-sm">chat_bubble</span>
              <span>Send Warning</span>
            </button>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
}

function resolveGrievance(id) {
  const ticket = state.complaints.find(c => c.id === id);
  if (ticket) {
    ticket.status = 'resolved';
    showToast(`✅ Complaint ticket ${id} has been resolved successfully!`, 'check');
    logTerminal(`Grievance resolved: Ticket ID ${id} closed.`);
    
    // Refresh with animations
    const card = document.getElementById(`ticket-card-${id}`);
    if (card) {
      card.classList.add('scale-95', 'opacity-0');
      setTimeout(() => {
        updateComplaintsTab();
        renderSystemBadges();
      }, 300);
    } else {
      updateComplaintsTab();
      renderSystemBadges();
    }
  }
}

window.resolveGrievance = resolveGrievance;

function dispatchCitizenResponse(id) {
  const resp = prompt('Enter message warning to dispatch to user:', 'We have flagged your ticket and initiated standard diagnostics. Please maintain network protocols.');
  if (resp) {
    alert(`✉️ Warning dispatched successfully to target: "${resp}"`);
    logTerminal(`Warning dispatched for Grievance ${id}: "${resp}"`);
  }
}

window.dispatchCitizenResponse = dispatchCitizenResponse;

// ── Tab 5: Stores Management Tab ──────────────────────────────────
function updateStoresTab() {
  let customShops = [];
  try {
    customShops = JSON.parse(localStorage.getItem('quickdash_custom_shops') || '[]');
  } catch (e) {}

  const allShops = [...DEFAULT_SHOPS, ...customShops];
  document.getElementById('count-stores-total').textContent = allShops.length;

  handleStoreListFilter();
}

function handleStoreListFilter() {
  const searchVal = document.getElementById('search-store-input').value.trim().toLowerCase();
  const categoryVal = document.getElementById('filter-store-category').value;
  
  const listContainer = document.getElementById('stores-manager-list');
  if (!listContainer) return;

  let customShops = [];
  try {
    customShops = JSON.parse(localStorage.getItem('quickdash_custom_shops') || '[]');
  } catch (e) {}

  const allShops = [...DEFAULT_SHOPS, ...customShops];

  // Apply filters
  let filtered = allShops.filter(shop => {
    const matchSearch = shop.name.toLowerCase().includes(searchVal);
    const matchCategory = categoryVal === 'all' || shop.category === categoryVal;
    return matchSearch && matchCategory;
  });

  if (filtered.length === 0) {
    listContainer.innerHTML = `<div class="text-center py-12 text-slate-500 text-xs">No stores registered match the criteria.</div>`;
    return;
  }

  listContainer.innerHTML = filtered.map(shop => {
    const selectedClass = state.selectedStore && state.selectedStore.id === shop.id ? 'border-cyan-400 bg-cyan-950/10 shadow-glow-cyan' : 'border-slate-800/60 bg-slate-950/40';
    const statusText = shop.isOpen ? 'ONLINE' : 'OFFLINE';
    const statusColor = shop.isOpen ? 'text-emerald-400 bg-emerald-950/20 border-emerald-800/40' : 'text-slate-400 bg-slate-800/30 border-slate-700/40';
    const disabledBadge = shop.isDisabled ? `<span class="text-[8px] bg-rose-950 text-rose-400 border border-rose-800/60 px-1.5 py-0.2 rounded uppercase ml-1 font-extrabold leading-none">DISABLED</span>` : '';

    return `
      <div onclick="selectStoreForDetail('${shop.id}')" class="p-3.5 rounded-2xl border transition-all cursor-pointer text-left flex justify-between items-center gap-3 ${selectedClass}">
        <div class="space-y-1.5 flex-1 min-w-0">
          <div class="flex justify-between items-start">
            <h4 class="font-bold text-slate-200 text-xs truncate leading-tight font-display">${shop.name}</h4>
          </div>
          <div class="flex items-center gap-1.5 text-[9px] text-slate-500 uppercase font-mono font-bold leading-none">
            <span class="capitalize">${shop.category}</span>
            <span>·</span>
            <span>⭐ ${shop.rating.toFixed(1)}</span>
            ${disabledBadge}
          </div>
        </div>
        <span class="text-[9px] border px-2 py-0.5 rounded font-mono font-bold uppercase shrink-0 ${statusColor}">${statusText}</span>
      </div>
    `;
  }).join('');
}

window.handleStoreListFilter = handleStoreListFilter;

function selectStoreForDetail(shopId) {
  let customShops = [];
  try {
    customShops = JSON.parse(localStorage.getItem('quickdash_custom_shops') || '[]');
  } catch (e) {}

  const allShops = [...DEFAULT_SHOPS, ...customShops];
  const shop = allShops.find(s => s.id === shopId);
  
  if (!shop) return;

  state.selectedStore = shop;

  // Refresh lists to show selection highlight
  handleStoreListFilter();

  document.getElementById('store-detail-empty').classList.add('hidden');
  document.getElementById('store-detail-content').classList.remove('hidden');

  // Fill details
  document.getElementById('detail-store-photo').src = shop.photo;
  document.getElementById('detail-store-name').textContent = shop.name;
  document.getElementById('detail-store-category').textContent = shop.category;
  
  // Disabled state
  const disBadge = document.getElementById('detail-store-disabled-badge');
  const disBtnText = document.getElementById('btn-detail-disable-text');
  
  if (shop.isDisabled) {
    disBadge.classList.remove('hidden');
    disBtnText.textContent = 'Enable Store Operations';
  } else {
    disBadge.classList.add('hidden');
    disBtnText.textContent = 'Disable Store Operations';
  }

  document.getElementById('detail-store-rating').textContent = `${shop.rating.toFixed(1)} (${shop.reviewsCount} reviews)`;
  document.getElementById('detail-store-coords').textContent = `${shop.lat.toFixed(4)}, ${shop.lon.toFixed(4)}`;

  // Product Counts
  let productsCount = 5;
  if (shop.id === 'store-1') productsCount = 6;
  else if (shop.id === 'store-2') productsCount = 5;
  else if (shop.id === 'store-3') productsCount = 4;
  else if (shop.id === 'store-4') productsCount = 4;
  else if (shop.id === 'store-5') productsCount = 3;
  else if (shop.id === 'custom-merchant-store') productsCount = 4;

  document.getElementById('detail-store-products-count').textContent = `${productsCount} Live Catalog Items`;

  // Estimate earnings
  let earnings = 2450.00;
  if (shop.id === 'store-1') earnings = 14208.50;
  else if (shop.id === 'store-2') earnings = 9480.00;
  else if (shop.id === 'store-3') earnings = 18940.00;
  else if (shop.id === 'store-4') earnings = 3450.00;
  else if (shop.id === 'store-5') earnings = 1200.00;
  else if (shop.id === 'custom-merchant-store') {
    // Sync with actual earnings if any
    earnings = 0.00;
  }
  document.getElementById('detail-store-earnings').textContent = `₹${earnings.toLocaleString()}`;

  // Fetch owner data if custom shop, else show mock info
  let ownerName = 'Sharma Kirana Ltd';
  let ownerPhone = '+919876543210';
  let ownerEmail = 'sharmagrocery@quickdash.in';
  let ownerUpi = 'sharma@okaxis';

  if (shop.id === 'custom-merchant-store') {
    try {
      const user = JSON.parse(localStorage.getItem('quickdash_user') || '{}');
      ownerName = user.name || ownerName;
      ownerPhone = user.phone || ownerPhone;
      ownerEmail = user.email || ownerEmail;
      ownerUpi = user.upiId || ownerUpi;
    } catch (e) {}
  } else {
    // Generate deterministic mock owner profile for original default shops
    let hash = 0;
    for (let i = 0; i < shop.name.length; i++) {
      hash += shop.name.charCodeAt(i);
    }
    ownerName = shop.name.split(' ')[0] + ' Partner';
    ownerPhone = `+9198${(hash % 90000000) + 10000000}`;
    ownerEmail = (shop.name.split(' ')[0].toLowerCase()) + `@quickdash.in`;
    ownerUpi = (shop.name.split(' ')[0].toLowerCase()) + `@oksbi`;
  }

  document.getElementById('detail-owner-name').textContent = ownerName;
  document.getElementById('detail-owner-phone').textContent = ownerPhone;
  document.getElementById('detail-owner-email').textContent = ownerEmail;
  document.getElementById('detail-owner-upi').textContent = ownerUpi;
}

window.selectStoreForDetail = selectStoreForDetail;

// Toggle disable store
function toggleStoreDisabled() {
  if (!state.selectedStore) return;
  const shop = state.selectedStore;

  let customShops = [];
  try {
    customShops = JSON.parse(localStorage.getItem('quickdash_custom_shops') || '[]');
  } catch (e) {}

  // Find in list
  let targetList = customShops;
  let inCustom = true;
  let match = customShops.find(s => s.id === shop.id);
  
  if (!match) {
    // It's a default shop, copy it over to custom shops to manage persistence!
    match = { ...shop };
    customShops.push(match);
    inCustom = true;
  }

  match.isDisabled = !match.isDisabled;
  localStorage.setItem('quickdash_custom_shops', JSON.stringify(customShops));

  // Sync state
  shop.isDisabled = match.isDisabled;

  // Refresh UI
  selectStoreForDetail(shop.id);
  updateOverviewTab();

  if (shop.isDisabled) {
    showToast('🏪 Store operation disabled. Hidden from client search discovery!', 'local_shipping');
    logTerminal(`Store disabled: ${shop.name}. Nodal listing suspended.`);
  } else {
    showToast('🏪 Store operations re-enabled and active online!', 'check');
    logTerminal(`Store re-enabled: ${shop.name}. Nodal listing restored.`);
  }
}

window.toggleStoreDisabled = toggleStoreDisabled;

// Permanent ban logic (User Request)
function triggerBanModal(targetType) {
  state.activeBanTarget = {
    type: targetType,
    id: null,
    email: null,
    phone: null
  };

  if (targetType === 'store') {
    if (!state.selectedStore) return;
    const shop = state.selectedStore;
    state.activeBanTarget.id = shop.id;

    if (shop.id === 'custom-merchant-store') {
      try {
        const user = JSON.parse(localStorage.getItem('quickdash_user') || '{}');
        state.activeBanTarget.email = user.email;
        state.activeBanTarget.phone = user.phone;
      } catch (e) {}
    } else {
      // Deterministic mock credentials for default stores
      let hash = 0; for (let i = 0; i < shop.name.length; i++) hash += shop.name.charCodeAt(i);
      state.activeBanTarget.email = (shop.name.split(' ')[0].toLowerCase()) + `@quickdash.in`;
      state.activeBanTarget.phone = `+9198${(hash % 90000000) + 10000000}`;
    }
  }

  // Show modal
  const modal = document.getElementById('ban-proof-modal');
  if (modal) {
    modal.classList.remove('hidden');
    document.getElementById('ban-proof-input').value = '';
  }
}

window.triggerBanModal = triggerBanModal;

function closeBanModal() {
  const modal = document.getElementById('ban-proof-modal');
  if (modal) modal.classList.add('hidden');
  state.activeBanTarget = null;
}

window.closeBanModal = closeBanModal;

function executeBanishment() {
  const proofText = document.getElementById('ban-proof-input').value.trim();
  
  if (!proofText) {
    alert('⚖️ Proof validation mandatory. Please supply appropriate proof details.');
    return;
  }

  if (!state.activeBanTarget) return;

  const target = state.activeBanTarget;

  // 1. Load current blacklist
  let blacklist = [];
  try {
    blacklist = JSON.parse(localStorage.getItem('quickdash_blacklist') || '[]');
  } catch (e) {}

  // 2. Add to blacklist array
  blacklist.push({
    target: target.id || 'Unknown',
    email: target.email || 'N/A',
    phone: target.phone || 'N/A',
    reason: proofText,
    timestamp: Date.now()
  });

  localStorage.setItem('quickdash_blacklist', JSON.stringify(blacklist));

  // 3. Purge active data and kick out
  if (target.type === 'store') {
    let customShops = [];
    try {
      customShops = JSON.parse(localStorage.getItem('quickdash_custom_shops') || '[]');
    } catch (e) {}

    // Wipes shop entry
    customShops = customShops.filter(s => s.id !== target.id);
    localStorage.setItem('quickdash_custom_shops', JSON.stringify(customShops));

    // Wipes owner user profile if custom shop
    if (target.id === 'custom-merchant-store') {
      localStorage.removeItem('quickdash_user');
    }

    showToast('⚖️ Store expelled permanently. Credentials blacklisted successfully!', 'error');
    logTerminal(`Banishment enforced: Expelled store ID ${target.id}. Credentials phone: ${target.phone}, email: ${target.email} added to permanent blacklists.`);
  }

  // Clear selections
  document.getElementById('store-detail-content').classList.add('hidden');
  document.getElementById('store-detail-empty').classList.remove('hidden');
  state.selectedStore = null;

  closeBanModal();
  updateStoresTab();
  updateOverviewTab();
}

window.executeBanishment = executeBanishment;

// ── Nodal system health display metrics ───────────────────────────
function renderSystemBadges() {
  // Counts pending applications
  let userObj = null;
  let partnerObj = null;
  try {
    const rawUser = localStorage.getItem('quickdash_user');
    if (rawUser) userObj = JSON.parse(rawUser);
  } catch (e) {}

  try {
    const rawPartner = localStorage.getItem('quickdash_partner');
    if (rawPartner) partnerObj = JSON.parse(rawPartner);
  } catch (e) {}

  let pendingStores = 0;
  if (userObj && userObj.role === 'merchant' && userObj.isApproved === false && !userObj.updatePending) pendingStores++;

  let pendingPartners = 0;
  if (partnerObj && partnerObj.isApproved === false && !partnerObj.updatePending) pendingPartners++;

  let pendingChanges = 0;
  if (userObj && userObj.role === 'merchant' && userObj.updatePending === true) pendingChanges++;
  if (partnerObj && partnerObj.updatePending === true) pendingChanges++;

  const totalVerification = pendingStores + pendingPartners + pendingChanges;
  
  const sysVerBadge = document.getElementById('badge-verification');
  const mobVerBadge = document.getElementById('mobile-badge-verification');

  [sysVerBadge, mobVerBadge].forEach(badge => {
    if (badge) {
      if (totalVerification > 0) {
        badge.textContent = totalVerification;
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    }
  });

  // Complaints Count
  const activeComplaints = state.complaints.filter(c => c.status === 'pending').length;
  const sysCompBadge = document.getElementById('badge-complaints');
  const mobCompBadge = document.getElementById('mobile-badge-complaints');

  [sysCompBadge, mobCompBadge].forEach(badge => {
    if (badge) {
      if (activeComplaints > 0) {
        badge.textContent = activeComplaints;
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    }
  });
}

// Exit command Center Redirection
function logoutAdmin() {
  if (confirm('🚪 Do you want to close your administrative dashboard? You will be redirected to the main store.')) {
    window.location.href = '../discover/discover.html';
  }
}

window.logoutAdmin = logoutAdmin;

// ── Custom Toast ──────────────────────────────────────────────────
function showToast(message, icon = 'info') {
  const toast = document.getElementById('toast-notify');
  const msgEl = document.getElementById('toast-message');
  const iconEl = document.getElementById('toast-emoji');

  if (!toast) return;

  const icons = {
    info: '🛰️',
    check: '✅',
    local_shipping: '🏪',
    error: '❌'
  };

  iconEl.textContent = icons[icon] || '🛰️';
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
