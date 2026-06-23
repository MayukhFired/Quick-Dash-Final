// ── Third-party integrations bootstrap (Google Maps + Razorpay) ───────────

window.QuickDashConfig = window.QuickDashConfig || {};
window.QuickDashIntegrations = window.QuickDashIntegrations || {};

const Integrations = window.QuickDashIntegrations;

Integrations.getGoogleMapsApiKey = function getGoogleMapsApiKey() {
  return (window.QuickDashConfig.googleMapsApiKey || '').trim();
};

Integrations.getRazorpayKeyId = function getRazorpayKeyId() {
  return (window.QuickDashConfig.razorpayKeyId || '').trim();
};

Integrations.loadGoogleMaps = function loadGoogleMaps() {
  const apiKey = Integrations.getGoogleMapsApiKey();
  if (!apiKey) return Promise.reject(new Error('Google Maps API key missing.'));

  if (window.google && window.google.maps) {
    return Promise.resolve(window.google.maps);
  }

  if (window.__qdGoogleMapsPromise) return window.__qdGoogleMapsPromise;

  window.__qdGoogleMapsPromise = new Promise((resolve, reject) => {
    const callbackName = '__qdGoogleMapsReady';
    window[callbackName] = () => {
      resolve(window.google.maps);
      delete window[callbackName];
    };

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error('Failed to load Google Maps SDK.'));
    document.head.appendChild(script);
  });

  return window.__qdGoogleMapsPromise;
};

Integrations.reverseGeocodeGoogle = function reverseGeocodeGoogle(lat, lon) {
  return Integrations.loadGoogleMaps().then(() => new Promise((resolve, reject) => {
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng: lon } }, (results, status) => {
      if (status === 'OK' && results && results.length > 0) {
        resolve(results[0].formatted_address);
      } else {
        reject(new Error(`Google reverse geocode failed: ${status}`));
      }
    });
  }));
};

Integrations.openRazorpayCheckout = function openRazorpayCheckout(opts) {
  const keyId = Integrations.getRazorpayKeyId();
  if (!keyId) throw new Error('Razorpay key ID missing.');
  if (typeof window.Razorpay === 'undefined') throw new Error('Razorpay SDK unavailable.');

  const amountPaise = Math.max(100, Number(opts.amountPaise) || 100);
  const orderRef = opts.orderRef || `qd_${Date.now()}`;
  const prefill = opts.prefill || {};

  const rz = new window.Razorpay({
    key: keyId,
    amount: amountPaise,
    currency: 'INR',
    name: 'QuickDash',
    description: opts.description || 'QuickDash order payment',
    order_id: opts.orderId || undefined,
    notes: {
      quickdash_order_ref: orderRef
    },
    prefill: {
      name: prefill.name || '',
      email: prefill.email || '',
      contact: String(prefill.contact || '').replace(/^\+/, '')
    },
    theme: { color: '#2d6a4f' },
    handler: function onSuccess(response) {
      if (typeof opts.onSuccess === 'function') opts.onSuccess(response);
    },
    modal: {
      ondismiss: function onDismiss() {
        if (typeof opts.onDismiss === 'function') opts.onDismiss();
      }
    }
  });

  rz.open();
};
