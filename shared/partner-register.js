/**
 * QuickDash Delivery Partner Registration Modal
 * Self-contained logic for footer integration
 */

function openPartnerRegistration() {
  // If partner is already registered (approved or pending), redirect directly
  const savedPartner = localStorage.getItem('quickdash_partner');
  if (savedPartner) {
    // Navigate to partner dashboard (assuming 1 level deep relative path)
    window.location.href = '../partner/partner.html';
    return;
  }

  // Create the modal container if it doesn't exist
  let modal = document.getElementById('partner-reg-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'partner-reg-modal';
    modal.className = 'partner-modal-overlay';
    
    // Inject the HTML form
    modal.innerHTML = `
      <div class="partner-modal-content">
        <div class="partner-modal-header">
          <div class="partner-modal-title-wrap">
            <span class="partner-modal-icon">🛵</span>
            <div>
              <h3>Join QuickDash Delivery Network</h3>
              <p>Be your own boss. Earn on every delivery.</p>
            </div>
          </div>
          <button class="partner-modal-close" onclick="closePartnerRegistration()">&times;</button>
        </div>
        <form id="partner-reg-form" onsubmit="handlePartnerSubmit(event)">
          <div class="partner-form-grid">
            <!-- Left Column: Personal Info -->
            <div class="partner-form-section">
              <h4>👤 Personal Details</h4>
              <div class="partner-input-group">
                <label for="p-name">Full Name</label>
                <input type="text" id="p-name" placeholder="John Doe" required>
              </div>
              <div class="partner-input-row">
                <div class="partner-input-group flex-1">
                  <label for="p-phone">Phone Number</label>
                  <div class="partner-phone-wrapper">
                    <span class="phone-prefix">+91</span>
                    <input type="tel" id="p-phone" placeholder="9876543210" pattern="[0-9]{10}" required>
                  </div>
                </div>
              </div>
              <div class="partner-input-group">
                <label for="p-email">Email Address</label>
                <input type="email" id="p-email" placeholder="john@example.com" required>
              </div>
              <div class="partner-input-group">
                <label for="p-password">Password</label>
                <input type="password" id="p-password" placeholder="Min. 6 characters" minlength="6" required>
              </div>
              <div class="partner-input-group">
                <label for="p-location">House Location / Address</label>
                <input type="text" id="p-location" placeholder="Street Name, Area, City" required>
              </div>
            </div>

            <!-- Right Column: Vehicle & Payment details -->
            <div class="partner-form-section">
              <h4>🛵 Vehicle & Payment</h4>
              <div class="partner-input-row">
                <div class="partner-input-group flex-1">
                  <label for="p-vehicle-type">Vehicle Type</label>
                  <select id="p-vehicle-type" required>
                    <option value="" disabled selected>Select vehicle</option>
                    <option value="scooter">🛵 Scooter / Scooty</option>
                    <option value="bike">🏍️ Motorcycle / Bike</option>
                    <option value="cycle">🚲 Bicycle</option>
                    <option value="van">🚐 Delivery Van</option>
                  </select>
                </div>
                <div class="partner-input-group flex-1" id="p-vehicle-num-container">
                  <label for="p-vehicle-num">Vehicle Number</label>
                  <input type="text" id="p-vehicle-num" placeholder="DL 7S AB 1234">
                </div>
              </div>
              
              <!-- UPI ID Field (User Request) -->
              <div class="partner-input-group">
                <label for="p-upi">UPI ID (to receive payments)</label>
                <input type="text" id="p-upi" placeholder="yourname@okaxis" required>
                <small class="upi-hint">Your earnings will be credited directly to this UPI account.</small>
              </div>

              <div class="partner-file-row">
                <div class="partner-input-group">
                  <label>Identification Document</label>
                  <div class="file-upload-box" onclick="document.getElementById('p-id-doc').click()">
                    <span class="file-box-icon">🪪</span>
                    <span id="p-id-label" style="text-align: center;">Upload Aadhar / ID Card</span>
                    <input type="file" id="p-id-doc" accept="image/*,application/pdf" style="display:none" onchange="updateFileName(this, 'p-id-label')" required>
                  </div>
                </div>
                <div class="partner-input-group">
                  <label>Driving License (PDF)</label>
                  <div class="file-upload-box" id="license-box" onclick="document.getElementById('p-license').click()">
                    <span class="file-box-icon">📄</span>
                    <span id="p-license-label" style="text-align: center;">Upload License (PDF)</span>
                    <input type="file" id="p-license" accept="application/pdf" style="display:none" onchange="updateFileName(this, 'p-license-label')" required>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="partner-submit-wrapper">
            <button type="submit" class="btn-partner-submit">Submit Application ⚡</button>
            <p class="terms-text">By submitting, you agree to QuickDash Delivery Partner Terms and Conditions.</p>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);
    
    // Inject Styles if they are not already injected
    if (!document.getElementById('partner-modal-styles')) {
      const styles = document.createElement('style');
      styles.id = 'partner-modal-styles';
      styles.textContent = `
        .partner-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(10, 25, 18, 0.85);
          backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 99999;
          opacity: 0;
          transition: opacity 0.3s ease;
          overflow-y: auto;
          padding: 20px;
        }
        .partner-modal-overlay.active {
          opacity: 1;
        }
        .partner-modal-content {
          background: #ffffff;
          border-radius: 24px;
          width: 100%;
          max-width: 900px;
          box-shadow: 0 25px 50px -12px rgba(4, 15, 10, 0.5);
          border: 1px solid rgba(45, 106, 79, 0.15);
          overflow: hidden;
          transform: scale(0.95);
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          color: #2b3a32;
          font-family: 'Space Grotesk', 'Montserrat', sans-serif;
        }
        .partner-modal-overlay.active .partner-modal-content {
          transform: scale(1);
        }
        .partner-modal-header {
          background: linear-gradient(135deg, #1b4332, #2d6a4f);
          padding: 24px 32px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: #ffffff;
        }
        .partner-modal-title-wrap {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .partner-modal-icon {
          font-size: 32px;
          background: rgba(255, 255, 255, 0.15);
          width: 56px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 16px;
        }
        .partner-modal-header h3 {
          margin: 0;
          font-size: 22px;
          font-weight: 700;
          letter-spacing: -0.5px;
          font-family: 'Space Grotesk', sans-serif;
        }
        .partner-modal-header p {
          margin: 4px 0 0 0;
          font-size: 14px;
          opacity: 0.85;
          font-family: 'Montserrat', sans-serif;
        }
        .partner-modal-close {
          background: none;
          border: none;
          color: #ffffff;
          font-size: 36px;
          cursor: pointer;
          opacity: 0.8;
          transition: 0.2s;
          line-height: 1;
        }
        .partner-modal-close:hover {
          opacity: 1;
          transform: scale(1.1);
        }
        #partner-reg-form {
          padding: 32px;
        }
        .partner-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
        }
        @media (max-width: 768px) {
          .partner-form-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }
          #partner-reg-form {
            padding: 20px;
          }
          .partner-modal-overlay {
            align-items: flex-start;
          }
        }
        .partner-form-section h4 {
          margin: 0 0 20px 0;
          font-size: 16px;
          color: #1b4332;
          border-bottom: 2px solid rgba(45, 106, 79, 0.1);
          padding-bottom: 8px;
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 600;
        }
        .partner-input-group {
          margin-bottom: 18px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .partner-input-group label {
          font-size: 13px;
          font-weight: 600;
          color: #2d6a4f;
          font-family: 'Montserrat', sans-serif;
        }
        .partner-input-group input, 
        .partner-input-group select {
          padding: 12px 16px;
          border: 1.5px solid rgba(45, 106, 79, 0.15);
          border-radius: 12px;
          font-size: 14px;
          outline: none;
          transition: all 0.2s ease;
          font-family: 'Montserrat', sans-serif;
        }
        .partner-input-group input:focus, 
        .partner-input-group select:focus {
          border-color: #52b788;
          box-shadow: 0 0 0 4px rgba(82, 183, 136, 0.15);
          background-color: #f0faf3;
        }
        .partner-input-row {
          display: flex;
          gap: 16px;
        }
        .flex-1 {
          flex: 1;
        }
        .partner-phone-wrapper {
          display: flex;
          align-items: center;
          border: 1.5px solid rgba(45, 106, 79, 0.15);
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.2s ease;
        }
        .partner-phone-wrapper:focus-within {
          border-color: #52b788;
          box-shadow: 0 0 0 4px rgba(82, 183, 136, 0.15);
          background-color: #f0faf3;
        }
        .phone-prefix {
          background: #f0faf3;
          padding: 12px 14px;
          font-size: 14px;
          font-weight: 600;
          color: #2d6a4f;
          border-right: 1.5px solid rgba(45, 106, 79, 0.15);
          font-family: 'Montserrat', sans-serif;
        }
        .partner-phone-wrapper input {
          border: none !important;
          padding: 12px 16px;
          width: 100%;
          border-radius: 0;
        }
        .partner-phone-wrapper input:focus {
          box-shadow: none !important;
          background-color: transparent !important;
        }
        .upi-hint {
          font-size: 11px;
          color: #40916c;
          margin-top: 2px;
          font-family: 'Montserrat', sans-serif;
        }
        .partner-file-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-top: 10px;
        }
        .file-upload-box {
          border: 2px dashed rgba(45, 106, 79, 0.25);
          border-radius: 14px;
          padding: 16px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 100px;
          background: #fafdfb;
        }
        .file-upload-box:hover {
          border-color: #52b788;
          background: #f0faf3;
          transform: translateY(-2px);
        }
        .file-box-icon {
          font-size: 28px;
        }
        .file-upload-box span:not(.file-box-icon) {
          font-size: 12px;
          font-weight: 500;
          color: #2d6a4f;
          word-break: break-all;
          font-family: 'Montserrat', sans-serif;
        }
        .partner-submit-wrapper {
          margin-top: 32px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        .btn-partner-submit {
          background: linear-gradient(135deg, #2d6a4f, #1b4332);
          color: white;
          border: none;
          padding: 14px 48px;
          font-size: 16px;
          font-weight: 700;
          border-radius: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 15px rgba(27, 67, 50, 0.2);
          width: 100%;
          max-width: 320px;
          font-family: 'Space Grotesk', sans-serif;
        }
        .btn-partner-submit:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(27, 67, 50, 0.35);
          background: linear-gradient(135deg, #40916c, #2d6a4f);
        }
        .btn-partner-submit:active {
          transform: translateY(0);
        }
        .terms-text {
          font-size: 11px;
          color: #8fa99a;
          margin: 0;
          font-family: 'Montserrat', sans-serif;
        }
      `;
      document.head.appendChild(styles);
    }
  }

  // Handle license vs bicycle details conditional toggle
  const vehicleSelect = document.getElementById('p-vehicle-type');
  const vehicleNumInput = document.getElementById('p-vehicle-num');
  const licenseBox = document.getElementById('license-box');
  const licenseFileInput = document.getElementById('p-license');

  const handleVehicleChange = () => {
    const val = vehicleSelect.value;
    if (val === 'cycle') {
      // Hide license box / vehicle number and make not required
      licenseBox.style.opacity = '0.5';
      licenseBox.style.pointerEvents = 'none';
      licenseFileInput.required = false;
      vehicleNumInput.required = false;
      vehicleNumInput.placeholder = 'No plate required';
      vehicleNumInput.disabled = true;
      vehicleNumInput.value = '';
    } else {
      licenseBox.style.opacity = '1';
      licenseBox.style.pointerEvents = 'auto';
      licenseFileInput.required = true;
      vehicleNumInput.required = true;
      vehicleNumInput.placeholder = 'DL 7S AB 1234';
      vehicleNumInput.disabled = false;
    }
  };

  vehicleSelect.onchange = handleVehicleChange;

  // Show the modal
  modal.style.display = 'flex';
  // Trigger transition
  setTimeout(() => {
    modal.classList.add('active');
  }, 10);
}

function closePartnerRegistration() {
  const modal = document.getElementById('partner-reg-modal');
  if (modal) {
    modal.classList.remove('active');
    setTimeout(() => {
      modal.style.display = 'none';
    }, 300);
  }
}

function updateFileName(input, labelId) {
  const label = document.getElementById(labelId);
  if (input.files && input.files.length > 0) {
    label.textContent = input.files[0].name;
    label.style.color = '#2d6a4f';
    label.style.fontWeight = '700';
  } else {
    if (labelId === 'p-id-label') {
      label.textContent = 'Upload Aadhar / ID Card';
    } else {
      label.textContent = 'Upload License (PDF)';
    }
    label.style.fontWeight = '500';
  }
}

function handlePartnerSubmit(event) {
  event.preventDefault();

  const name = document.getElementById('p-name').value.trim();
  const phone = '+91 ' + document.getElementById('p-phone').value.trim();
  const email = document.getElementById('p-email').value.trim();
  const password = document.getElementById('p-password').value;
  const location = document.getElementById('p-location').value.trim();
  const vehicleType = document.getElementById('p-vehicle-type').value;
  const vehicleNumber = document.getElementById('p-vehicle-num').value.trim();
  const upiId = document.getElementById('p-upi').value.trim();
  
  // Validations
  if (!name || !email || !password || !location || !vehicleType || !upiId) {
    alert('Please fill out all mandatory fields.');
    return;
  }

  // Validate UPI ID format roughly
  const upiRegex = /^[\w.-]+@[\w.-]+$/;
  if (!upiRegex.test(upiId)) {
    alert('Please enter a valid UPI ID (e.g., yourname@bank).');
    return;
  }

  // ── Blacklist Enforcement Check (Admin Ban Logic) ──────────────
  try {
    const blacklist = JSON.parse(localStorage.getItem('quickdash_blacklist') || '[]');
    const isBanned = blacklist.some(entry =>
      (entry.email && entry.email.toLowerCase() === email.toLowerCase()) ||
      (entry.phone && (entry.phone === phone || entry.phone === '+91 ' + document.getElementById('p-phone').value.trim()))
    );
    if (isBanned) {
      alert('⛔ ACCESS DENIED: This email or phone number has been permanently banned by the administrator. You cannot register as a delivery partner with these credentials.');
      return;
    }
  } catch (e) { /* blacklist parse error, continue */ }

  const idDocFile = document.getElementById('p-id-doc').files[0];
  const licenseFile = document.getElementById('p-license').files[0];

  if (!idDocFile) {
    alert('Please upload your Identification Document.');
    return;
  }

  if (vehicleType !== 'cycle' && !licenseFile) {
    alert('Please upload your Driving License.');
    return;
  }

  // Save partner info
  const partnerData = {
    name: name,
    phone: phone,
    email: email,
    password: password,
    location: location,
    vehicleType: vehicleType,
    vehicleNumber: vehicleType === 'cycle' ? 'BICYCLE' : vehicleNumber,
    upiId: upiId,
    idDocName: idDocFile.name,
    licenseName: vehicleType === 'cycle' ? 'N/A' : licenseFile.name,
    isApproved: false,
    status: 'pending',
    earnings: 0,
    isOnline: false
  };

  localStorage.setItem('quickdash_partner', JSON.stringify(partnerData));

  // Success flow animation
  const form = document.getElementById('partner-reg-form');
  form.innerHTML = `
    <div style="text-align: center; padding: 40px 20px; font-family: 'Space Grotesk', sans-serif;">
      <span style="font-size: 64px;">🎉</span>
      <h3 style="font-size: 24px; color: #1b4332; margin: 16px 0 8px 0; font-weight: 700;">Application Submitted!</h3>
      <p style="font-size: 15px; color: #40916c; max-width: 450px; margin: 0 auto 24px auto; line-height: 1.5; font-family: 'Montserrat', sans-serif;">
        Your application has been received successfully. You will now be redirected to your dedicated Partner Dashboard where you can monitor your approval status.
      </p>
      <div style="font-size: 13px; color: #8fa99a; font-family: 'Montserrat', sans-serif;">
        Redirecting in 3 seconds...
      </div>
    </div>
  `;

  setTimeout(() => {
    closePartnerRegistration();
    // Redirect to partner dashboard (assuming pages are at discover/discover.html,shops/shops.html depth 1)
    window.location.href = '../partner/partner.html';
  }, 3000);
}

// Auto-open modal if redirected from partner dashboard
document.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('quickdash_trigger_partner_reg') === 'true') {
    localStorage.removeItem('quickdash_trigger_partner_reg');
    setTimeout(() => {
      openPartnerRegistration();
    }, 500);
  }
});
