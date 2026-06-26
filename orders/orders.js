// ── Room 8: Orders Page JavaScript ───────────────────────────────

const state = {
  orders: [],
  selectedOrder: null,
  currentUser: null
};

// ── DOM Elements ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadUserProfile();
  adjustFloatingDockForMerchant();
  loadOrdersHistory();
  renderOrdersList();
});

// ── Load User Profile & Auth Button ────────────────────────────────
function loadUserProfile() {
  try {
    const saved = localStorage.getItem('quickdash_user');
    if (saved) state.currentUser = JSON.parse(saved);
  } catch (e) {
    state.currentUser = null;
  }
  renderAuthButton();
}

// ── Load past orders from localStorage ─────────────────────────────
function loadOrdersHistory() {
  try {
    const raw = localStorage.getItem('quickdash_orders_history');
    if (raw) {
      state.orders = JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to parse orders history:', e);
    state.orders = [];
  }
}

// ── Render List of Cards ───────────────────────────────────────────
function renderOrdersList() {
  const container = document.getElementById('orders-cards-container');
  const countBadge = document.getElementById('orders-count');
  
  if (!container) return;

  // Set counts
  countBadge.textContent = `${state.orders.length} Order${state.orders.length === 1 ? '' : 's'}`;

  if (state.orders.length === 0) {
    container.innerHTML = `
      <div class="orders-empty-state">
        <div class="empty-state-icon">🛍️</div>
        <h4>No past orders found</h4>
        <p>Looks like you haven't placed any orders yet. Explore your local community stores!</p>
        <a href="../discover/discover.html" class="btn-start-shopping">Start Shopping</a>
      </div>
    `;
    return;
  }

  container.innerHTML = state.orders.map((order, index) => {
    const suffix = String(order.timestamp).slice(-4);
    const dateStr = new Date(order.timestamp).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    
    // Create preview of item names
    const itemsPreview = order.items && order.items.length > 0 
      ? order.items.map(item => `${item.name} (${item.qty})`).join(', ')
      : 'Items not recorded';

    const countItems = order.items ? order.items.reduce((acc, curr) => acc + curr.qty, 0) : 0;
    
    const activeClass = state.selectedOrder && state.selectedOrder.timestamp === order.timestamp ? 'active' : '';

    const storePhoto = order.shopPhoto || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200';

    // Check if there is feedback
    const starRating = order.feedback && order.feedback.ratings && order.feedback.ratings.store
      ? `⭐ ${order.feedback.ratings.store}/5`
      : 'Unrated';

    return `
      <div class="order-card ${activeClass}" onclick="selectOrder(${index}, this)">
        <img class="order-card-img" src="${storePhoto}" alt="${escapeHTML(order.shopName)}" />
        <div class="order-card-info">
          <div class="order-card-header">
            <h4 class="order-card-store">${escapeHTML(order.shopName)}</h4>
            <span class="order-card-price">₹${order.grandTotal}</span>
          </div>
          <div class="order-card-meta">
            <span>📅 ${dateStr}</span>
            <span>📦 ${countItems} Item${countItems === 1 ? '' : 's'}</span>
            <span class="order-card-rating">${starRating}</span>
          </div>
          <p class="order-card-items-desc">${escapeHTML(itemsPreview)}</p>
          <div class="order-card-footer">
            <span class="order-id-badge">QD-${suffix}</span>
            <span class="order-card-tag">Delivered</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ── Select and display an order ────────────────────────────────────
function selectOrder(index, cardElement) {
  const order = state.orders[index];
  if (!order) return;

  state.selectedOrder = order;

  // Toggle card active styling
  document.querySelectorAll('.order-card').forEach(c => c.classList.remove('active'));
  if (cardElement) {
    cardElement.classList.add('active');
  }

  // Display detail panel
  const placeholder = document.getElementById('detail-placeholder');
  const card = document.getElementById('detail-card');
  const panel = document.getElementById('order-detail-section');

  if (placeholder) placeholder.style.display = 'none';
  if (card) card.style.display = 'block';
  
  // For mobile screen layout: open panel as modal overlay
  if (window.innerWidth <= 900) {
    panel.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  const suffix = String(order.timestamp).slice(-4);
  const dateTimeStr = new Date(order.timestamp).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Calculate items sum
  const totalItemsCount = order.items ? order.items.reduce((acc, curr) => acc + curr.qty, 0) : 0;

  // Recipient info
  const recipientLabel = order.recipientType === 'other' 
    ? `🎁 Gift for: <b>${escapeHTML(order.recipientName)}</b> (📞 ${escapeHTML(order.recipientPhone)})`
    : `🛍️ Delivered to: <b>${escapeHTML(order.recipientName)}</b> (📞 ${escapeHTML(order.recipientPhone)})`;

  // Item lines
  const itemsHtml = order.items && order.items.length > 0
    ? order.items.map(item => `
        <div class="detail-item-row">
          <div class="detail-item-desc">
            ${item.img ? `<img class="detail-item-thumb" src="${item.img}" alt="${escapeHTML(item.name)}" />` : ''}
            <div>
              <span class="detail-item-name">${escapeHTML(item.name)}</span>
              <span class="detail-item-qty">x${item.qty}</span>
            </div>
          </div>
          <span class="detail-item-subtotal">₹${item.price * item.qty}</span>
        </div>
      `).join('')
    : '<p style="color:var(--gray-400);font-size:0.85rem">Itemized list unavailable.</p>';

  // Feedback block
  let feedbackHtml = '';
  if (order.feedback && order.feedback.ratings) {
    const ratings = order.feedback.ratings;
    feedbackHtml = `
      <div class="detail-feedback-block">
        <h5 style="font-family:var(--font-h);font-size:0.85rem;font-weight:800;color:var(--g900);margin-bottom:0.6rem">Your Feedback ⭐</h5>
        <div class="detail-feedback-stars">
          <div class="feedback-star-row">
            <span>🏪 Store Quality</span>
            <span>${'⭐'.repeat(ratings.store)} (${ratings.store}/5)</span>
          </div>
          <div class="feedback-star-row">
            <span>🛵 Delivery Partner</span>
            <span>${'⭐'.repeat(ratings.partner)} (${ratings.partner}/5)</span>
          </div>
          <div class="feedback-star-row">
            <span>📱 App Experience</span>
            <span>${'⭐'.repeat(ratings.app)} (${ratings.app}/5)</span>
          </div>
        </div>
        ${order.feedback.review ? `<p class="detail-feedback-comment">"${escapeHTML(order.feedback.review)}"</p>` : ''}
      </div>
    `;
  }

  card.innerHTML = `
    <!-- Detail Header -->
    <div class="detail-header">
      <button class="detail-mobile-close" onclick="closeDetailsPanel()">✕</button>
      <div class="detail-header-row">
        <h4 class="detail-store-name">${escapeHTML(order.shopName)}</h4>
        <span class="detail-order-id">Order QD-${suffix}</span>
      </div>
      <div class="detail-timestamp">📅 ${dateTimeStr} · ${totalItemsCount} Item${totalItemsCount === 1 ? '' : 's'}</div>
    </div>

    <!-- Detail Body -->
    <div class="detail-body">
      
      <!-- Store & Delivery Info -->
      <div class="detail-meta-block">
        <div class="detail-meta-row">
          <span class="detail-meta-icon">📍</span>
          <div class="detail-meta-text">
            <h5>Delivery Address</h5>
            <p>${escapeHTML(order.deliveryAddress || 'Address not provided')}</p>
            ${order.landmark ? `<p style="font-size:0.75rem;color:var(--gray-400)">Landmark: ${escapeHTML(order.landmark)}</p>` : ''}
          </div>
        </div>

        <div class="detail-meta-row">
          <span class="detail-meta-icon">👤</span>
          <div class="detail-meta-text">
            <h5>Recipient Details</h5>
            <p>${recipientLabel}</p>
          </div>
        </div>

        <div class="detail-meta-row">
          <span class="detail-meta-icon">🛵</span>
          <div class="detail-meta-text">
            <h5>Delivery Partner</h5>
            <p>Ravi Kumar · DL 7S 4821</p>
          </div>
        </div>
      </div>

      <!-- Items Breakdown -->
      <div class="detail-items-block">
        <h5 class="detail-block-title">Items Ordered</h5>
        <div class="detail-items-list">
          ${itemsHtml}
        </div>
      </div>

      <!-- Billing Summary -->
      <div class="detail-bill-block">
        <div class="detail-bill-row">
          <span>Items Subtotal</span>
          <span>₹${order.subtotal || 0}</span>
        </div>
        <div class="detail-bill-row">
          <span>GST (5%)</span>
          <span>₹${order.gst || 0}</span>
        </div>
        <div class="detail-bill-row">
          <span>Platform Fee</span>
          <span>₹${order.platformFee || 5}</span>
        </div>
        <div class="detail-bill-row">
          <span>Base Delivery</span>
          <span>₹${order.baseDelivery || 25}</span>
        </div>
        ${order.additionalDelivery ? `
          <div class="detail-bill-row">
            <span>Additional Distance Fee</span>
            <span>₹${order.additionalDelivery}</span>
          </div>
        ` : ''}
        <div class="detail-bill-row grand-total-row">
          <span>Total Paid</span>
          <span>₹${order.grandTotal || 0}</span>
        </div>
      </div>

      <!-- Feedback -->
      ${feedbackHtml}

    </div>

    <!-- Action buttons -->
    <div class="detail-footer-actions">
      <button class="btn-detail-reorder" onclick="reorderCurrent()">
        <span>🔁</span> Reorder Items
      </button>
      <button class="btn-detail-download" onclick="downloadInvoicePDF()">
        <span>📄</span> PDF Invoice
      </button>
    </div>
  `;
}

// ── Close Details Panel on Mobile ──────────────────────────────────
function closeDetailsPanel() {
  const panel = document.getElementById('order-detail-section');
  if (panel) {
    panel.classList.remove('open');
  }
  document.body.style.overflow = '';
}

window.closeDetailsPanel = closeDetailsPanel;

// ── Reorder items: sets cart states and redirects to cart ─────────
function reorderCurrent() {
  const order = state.selectedOrder;
  if (!order) return;

  // Check if there is an existing cart
  try {
    const rawCart = localStorage.getItem('quickdash_cart');
    if (rawCart && Object.keys(JSON.parse(rawCart)).length > 0) {
      const confirmSwap = confirm("🛒 You already have items in your cart. Reordering will replace your current cart items. Do you want to proceed?");
      if (!confirmSwap) return;
    }

    // Build the new cart dictionary
    const newCart = {};
    order.items.forEach(item => {
      newCart[item.id] = item.qty;
    });

    localStorage.setItem('quickdash_cart', JSON.stringify(newCart));
    localStorage.setItem('quickdash_cart_shop', order.shopId);

    // Redirect to cart page
    alert("🛍️ Items successfully added to your cart! Redirecting to Cart review.");
    window.location.href = '../cart/cart.html';
  } catch (e) {
    console.error('Failed to perform reorder operation:', e);
    alert('❌ Reorder failed due to a browser storage issue.');
  }
}

window.reorderCurrent = reorderCurrent;

// ── Beautiful Client-side PDF Invoice Generation using jsPDF ───────
function downloadInvoicePDF() {
  const order = state.selectedOrder;
  if (!order) return;

  const { jsPDF } = window.jspdf;
  if (!jsPDF) {
    alert("PDF library is loading. Please try again in a moment.");
    return;
  }

  const doc = new jsPDF();
  
  const suffix = String(order.timestamp).slice(-4);
  const dateStr = new Date(order.timestamp).toLocaleString('en-IN');

  // Colors Palette
  const darkGreen = [27, 67, 50];    // #1b4332
  const lightGreen = [82, 183, 136];  // #52b788
  const textDark = [33, 37, 41];
  const borderLight = [222, 226, 230];

  // Title Banner
  doc.setFillColor(...darkGreen);
  doc.rect(0, 0, 210, 38, 'F');

  // Brand Name
  doc.setTextColor(255, 255, 255);
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(22);
  doc.text("QuickDash", 15, 25);

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Empowering local communities, one delivery at a time", 15, 31);

  // INVOICE text on header right
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(18);
  doc.text("TAX INVOICE", 150, 25);

  // Restore text defaults
  doc.setTextColor(...textDark);

  // Invoice Meta
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Invoice No: ", 15, 50);
  doc.setFont("Helvetica", "normal");
  doc.text(`QD-INV-${order.timestamp}-${suffix}`, 36, 50);

  doc.setFont("Helvetica", "bold");
  doc.text("Order Date: ", 15, 56);
  doc.setFont("Helvetica", "normal");
  doc.text(dateStr, 36, 56);

  doc.setFont("Helvetica", "bold");
  doc.text("Store Name: ", 15, 62);
  doc.setFont("Helvetica", "normal");
  doc.text(order.shopName, 36, 62);

  // Recipient / Delivery Details
  doc.setDrawColor(...borderLight);
  doc.setLineWidth(0.5);
  doc.line(15, 68, 195, 68);

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(10);
  doc.text("DELIVERED TO:", 15, 76);
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(9);
  doc.text(order.recipientName || 'Customer', 15, 82);
  doc.text(`Phone: +91 ${order.recipientPhone || '9876543210'}`, 15, 87);
  
  // Wrap address text beautifully
  const addressLines = doc.splitTextToSize(order.deliveryAddress || 'Address not provided', 85);
  doc.text(addressLines, 15, 92);

  // Partner Details
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(10);
  doc.text("DELIVERY PARTNER:", 115, 76);
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Ravi Kumar (QuickDash Delivery Partner)", 115, 82);
  doc.text("Vehicle: Honda Activa (DL 7S 4821)", 115, 87);

  // Items Table Header
  let tableY = 115;
  doc.setFillColor(248, 249, 250);
  doc.rect(15, tableY, 180, 8, 'F');
  
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(9);
  doc.text("SI.", 18, tableY + 5);
  doc.text("PRODUCT NAME", 30, tableY + 5);
  doc.text("QTY", 120, tableY + 5);
  doc.text("UNIT PRICE", 140, tableY + 5);
  doc.text("SUBTOTAL", 170, tableY + 5);

  doc.line(15, tableY, 195, tableY);
  doc.line(15, tableY + 8, 195, tableY + 8);

  // Table rows
  doc.setFont("Helvetica", "normal");
  let rowY = tableY + 8;
  
  order.items.forEach((item, index) => {
    rowY += 8;
    doc.text(String(index + 1), 18, rowY);
    
    // Crop product name if too long
    const nameStr = item.name.length > 40 ? item.name.substring(0, 38) + "..." : item.name;
    doc.text(nameStr, 30, rowY);
    
    doc.text(String(item.qty), 122, rowY);
    doc.text(`Rs. ${item.price}`, 142, rowY);
    doc.text(`Rs. ${item.price * item.qty}`, 172, rowY);
    
    doc.setDrawColor(240, 240, 240);
    doc.line(15, rowY + 3, 195, rowY + 3);
  });

  // Calculate bill coordinates
  let billY = rowY + 12;
  doc.setDrawColor(...borderLight);
  doc.line(115, billY, 195, billY);

  // Inner lines
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(9);

  const billLines = [
    { label: "Items Subtotal", val: order.subtotal },
    { label: "GST (5%)", val: order.gst },
    { label: "Platform Fee", val: order.platformFee || 5 },
    { label: "Base Delivery", val: order.baseDelivery || 25 }
  ];

  if (order.additionalDelivery) {
    billLines.push({ label: "Distance Fee", val: order.additionalDelivery });
  }

  billLines.forEach(line => {
    billY += 6;
    doc.text(line.label, 115, billY);
    doc.text(`Rs. ${line.val}`, 172, billY);
  });

  // Total payable
  billY += 8;
  doc.setFillColor(240, 248, 245);
  doc.rect(115, billY - 5, 80, 8, 'F');
  
  doc.setFont("Helvetica", "bold");
  doc.text("Grand Total", 117, billY);
  doc.text(`Rs. ${order.grandTotal}`, 172, billY);

  // Paid Stamp!
  doc.setDrawColor(...lightGreen);
  doc.setFillColor(240, 248, 245);
  doc.setLineWidth(1);
  doc.rect(20, billY - 8, 45, 12);
  
  doc.setTextColor(...lightGreen);
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(12);
  doc.text("PAID & SECURED", 23, billY);

  // Footer stamp
  doc.setTextColor(150, 150, 150);
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Thank you for buying local and supporting local store owners! 💚", 15, 275);
  doc.text("QuickDash is a community project. Need help? Call +91 98765 43210 or email care@quickdash.com", 15, 280);

  // Save the PDF
  doc.save(`QuickDash_Invoice_QD-${suffix}.pdf`);
}

window.downloadInvoicePDF = downloadInvoicePDF;

// ── Utility ──────────────────────────────────────────────────────
function escapeHTML(str = '') {
  return String(str).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}
