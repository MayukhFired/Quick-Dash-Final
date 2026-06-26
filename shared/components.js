// ── QuickDash Shared Components ────────────────────────────────────
// Injects: footer (full or trimmed), profile drawer
// Exposes: renderAuthButton(), openProfileDrawer(), closeProfileDrawer(), logoutUser()
// Usage: add data-footer="full|trimmed" on <body>, then call renderAuthButton() from page init.

(function () {
  // ── Footer Templates ──────────────────────────────────────────────
  const FOOTER_FULL = `
  <footer class="site-footer">
    <div class="footer-inner">
      <div class="footer-brand">
        <div class="footer-logo">
          <div class="logo-badge sm">Q</div>
          <span class="logo-name">QuickDash</span>
        </div>
        <p class="footer-tagline">Empowering local shops. Connecting communities. One delivery at a time.</p>
        <div class="footer-socials">
          <a href="#" class="social-btn" aria-label="Instagram">📸</a>
          <a href="#" class="social-btn" aria-label="Twitter">🐦</a>
          <a href="#" class="social-btn" aria-label="Facebook">👥</a>
          <a href="#" class="social-btn" aria-label="WhatsApp">💬</a>
        </div>
      </div>
      <div class="footer-links-group">
        <div class="footer-col">
          <h4>Company</h4>
          <ul>
            <li><a href="#">About Us</a></li>
            <li><a href="#">Our Mission</a></li>
            <li><a href="#">Blog</a></li>
            <li><a href="#">Careers</a></li>
            <li><a href="#">Press</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Support</h4>
          <ul>
            <li><a href="#">Help Center</a></li>
            <li><a href="#">Track Order</a></li>
            <li><a href="#">Return Policy</a></li>
            <li><a href="#">Contact Us</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Legal</h4>
          <ul>
            <li><a href="#">Terms &amp; Conditions</a></li>
            <li><a href="#">Privacy Policy</a></li>
            <li><a href="#">Cookie Policy</a></li>
            <li><a href="#">Merchant Agreement</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-cta-col">
        <div class="footer-cta-card">
          <div class="cta-icon">🛵</div>
          <h4>Become a Delivery Partner</h4>
          <p>Earn on your own schedule. Join hundreds of delivery partners in your city.</p>
          <a href="javascript:void(0)" class="btn-join-us" id="btn-join-delivery" onclick="openPartnerRegistration()">Join Us →</a>
        </div>
        <div class="footer-cta-card" style="margin-top:1rem;">
          <div class="cta-icon">🏪</div>
          <h4>List Your Shop</h4>
          <p>Already a merchant? Register your shop on QuickDash and grow your business.</p>
          <a href="../signup/signup.html" class="btn-join-us outline">Register Shop →</a>
        </div>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© 2025 QuickDash. All rights reserved. Made with 💚 for local communities.</span>
      <div class="footer-bottom-links">
        <a href="#">Terms</a>
        <a href="#">Privacy</a>
        <a href="#">Sitemap</a>
      </div>
    </div>
  </footer>`;

  const FOOTER_TRIMMED = `
  <footer class="site-footer">
    <div class="footer-inner">
      <div class="footer-brand">
        <div class="footer-logo">
          <div class="logo-badge sm">Q</div>
          <span class="logo-name">QuickDash</span>
        </div>
        <p class="footer-tagline">Empowering local shops. Connecting communities. One delivery at a time.</p>
        <div class="footer-socials">
          <a href="#" class="social-btn" aria-label="Instagram">📸</a>
          <a href="#" class="social-btn" aria-label="Twitter">🐦</a>
          <a href="#" class="social-btn" aria-label="Facebook">👥</a>
          <a href="#" class="social-btn" aria-label="WhatsApp">💬</a>
        </div>
      </div>
      <div class="footer-links-group">
        <div class="footer-col">
          <h4>Company</h4>
          <ul>
            <li><a href="#">About Us</a></li>
            <li><a href="#">Our Mission</a></li>
            <li><a href="#">Blog</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Support</h4>
          <ul>
            <li><a href="#">Help Center</a></li>
            <li><a href="#">Track Order</a></li>
            <li><a href="#">Contact Us</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Legal</h4>
          <ul>
            <li><a href="#">Terms &amp; Conditions</a></li>
            <li><a href="#">Privacy Policy</a></li>
          </ul>
        </div>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© 2025 QuickDash. All rights reserved. Made with 💚 for local communities.</span>
    </div>
  </footer>`;

  // ── Profile Drawer Template ───────────────────────────────────────
  const DRAWER_HTML = `
  <div class="drawer-overlay" id="drawer-overlay" onclick="closeProfileDrawer()"></div>
  <div class="profile-drawer" id="profile-drawer">
    <div class="drawer-header">
      <h3>My Profile</h3>
      <button class="drawer-close" onclick="closeProfileDrawer()">✕</button>
    </div>
    <div class="drawer-body" id="drawer-body"></div>
  </div>`;

  // ── Mount on DOMContentLoaded ─────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    // Inject footer
    const footerMount = document.getElementById('footer-mount');
    if (footerMount) {
      const variant = footerMount.dataset.variant;
      footerMount.outerHTML = variant === 'trimmed' ? FOOTER_TRIMMED : FOOTER_FULL;
    }

    // Inject profile drawer
    const drawerMount = document.getElementById('drawer-mount');
    if (drawerMount) {
      drawerMount.outerHTML = DRAWER_HTML;
    }
  });

  // ── Auth helpers ──────────────────────────────────────────────────
  function _getUser() {
    // Each page stores user in either a local `currentUser` var or `state.currentUser`.
    // We read directly from localStorage so components.js is self-contained.
    try {
      const raw = localStorage.getItem('quickdash_user');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function _esc(str) {
    return String(str || '').replace(/[&<>'"]/g, c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c])
    );
  }

  window.renderAuthButton = function () {
    const container = document.getElementById('header-auth');
    if (!container) return;
    const user = _getUser();
    if (user) {
      const initial = (user.name || 'U').charAt(0).toUpperCase();
      container.innerHTML = `
        <button class="btn-profile" id="profile-btn" onclick="openProfileDrawer()" aria-label="Open profile">
          <div class="profile-avatar">${initial}</div>
          <span>${user.name ? user.name.split(' ')[0] : 'Profile'}</span>
        </button>`;
    } else {
      container.innerHTML = `
        <button class="btn-auth" id="auth-btn" onclick="window.location.href='../signup/signin.html'">
          Sign Up / Log In
        </button>`;
    }
  };

  window.openProfileDrawer = function () {
    const user = _getUser();
    if (!user) return;
    const body = document.getElementById('drawer-body');
    if (!body) return;
    const initial = (user.name || 'U').charAt(0).toUpperCase();
    const role = user.role === 'merchant' ? '🏪 Merchant' : '🛍️ Customer';
    body.innerHTML = `
      <div class="profile-info-row">
        <div class="profile-avatar-lg">${initial}</div>
        <div>
          <div class="profile-name">${_esc(user.name || 'User')}</div>
          <div class="profile-email">${_esc(user.email || '')}</div>
          <span class="profile-role-badge">${role}</span>
        </div>
      </div>
      <ul class="drawer-menu">
        <li><a href="../orders/orders.html"><span class="menu-icon">📦</span> My Orders</a></li>
        <li><a href="#"><span class="menu-icon">📍</span> Saved Addresses</a></li>
        <li><a href="#"><span class="menu-icon">❤️</span> Favourite Shops</a></li>
        <li><a href="#"><span class="menu-icon">🏷️</span> Coupons &amp; Offers</a></li>
        <li><a href="#"><span class="menu-icon">⚙️</span> Account Settings</a></li>
        <li><a href="#"><span class="menu-icon">🎧</span> Help &amp; Support</a></li>
        <li><button class="danger" onclick="logoutUser()"><span class="menu-icon">🚪</span> Log Out</button></li>
      </ul>`;
    document.getElementById('drawer-overlay').classList.add('open');
    document.getElementById('profile-drawer').classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  window.closeProfileDrawer = function () {
    const overlay = document.getElementById('drawer-overlay');
    const drawer = document.getElementById('profile-drawer');
    if (overlay) overlay.classList.remove('open');
    if (drawer) drawer.classList.remove('open');
    document.body.style.overflow = '';
  };

  window.logoutUser = function () {
    if (!confirm('Are you sure you want to log out?')) return;
    localStorage.removeItem('quickdash_user');
    closeProfileDrawer();
    renderAuthButton();
    // Update page-level state if it exists
    if (typeof state !== 'undefined' && state.currentUser !== undefined) state.currentUser = null;
  };

  window.adjustFloatingDockForMerchant = function () {
    const user = _getUser();
    if (!user || user.role !== 'merchant') return;
    const shopsDock = document.getElementById('nav-dock-shops');
    if (shopsDock) {
      shopsDock.href = '../yourstore/yourstore.html';
      shopsDock.id = 'nav-dock-yourstore';
      shopsDock.querySelector('.nav-dock-label').textContent = 'Your Store';
    }
  };
})();
