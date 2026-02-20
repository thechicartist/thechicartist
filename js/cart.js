// Consolidated cart + lightbox (clean single-file implementation)
(function () {
  function qs(s) { return document.querySelector(s); }
  function qsa(s) { return Array.from(document.querySelectorAll(s)); }
  function onReady(fn) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else fn(); }

  // ===== CONFIGURATION =====
  // Replace this with your deployed Cloudflare Worker URL after deploying stripe-worker.js
  const WORKER_URL = 'https://stripe-worker.thechicartiststudio.workers.dev';


  onReady(() => {
    // Cart state
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const cartIcon = qs('#cartIcon');
    const cartCount = qs('#cartCount');
    function saveCart() { localStorage.setItem('cart', JSON.stringify(cart)); }
    function updateCartCount() { if (cartCount) cartCount.textContent = cart.length; }
    function showCartToast(message) {
      const toast = document.getElementById('cartToast');
      if (!toast) return;
      toast.textContent = message;
      toast.classList.add('show');
      setTimeout(() => { toast.classList.remove('show'); }, 2000);
    }
    updateCartCount();

    // Add to cart
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.add-to-cart');
      if (!btn) return;
      const p = {
        id: btn.dataset.id,
        name: btn.dataset.name,
        price: Number(btn.dataset.price) || 0,
        image: btn.dataset.image || ''
      };
      cart.push(p);
      saveCart();
      updateCartCount();
      showCartToast(`${p.name} added to cart ✨`);
    });

    if (cartIcon) { cartIcon.style.cursor = 'pointer'; cartIcon.addEventListener('click', () => window.location.href = 'cart.html'); }

    // Cart page
    const cartPage = qs('#cartPage');
    if (cartPage) {
      const cartContainer = qs('#cartItems');
      const totalBox = qs('#cartTotal');
      const orderItemsInput = qs('#orderItems');
      const orderImagesInput = qs('#orderImages');
      const orderTotalInput = qs('#orderTotal');
      const orderShippingInput = qs('#orderShipping');
      const orderTaxInput = qs('#orderTax');
      const orderProvinceInput = qs('#orderProvince');
      const orderZipInput = qs('#orderZip');
      const orderCountryInput = qs('#orderCountry');
      const orderForm = qs('#orderForm');
      const countrySelect = qs('#country');
      const provinceSelect = qs('#province');
      const zipInput = qs('#zip');
      const stripeBox = qs('#stripe-button-container');
      const shippingMsg = qs('#shippingMsg');
      const customerEmailInput = qs('#customerEmail');
      const customerNameInput = qs('#customerName');

      // ===== Google Address Autocomplete (USA + Canada) =====
      let addressAutocomplete;

      window.initAddressAutocomplete = function () {
        const addressInput = qs('#address');
        if (!addressInput || !window.google || !google.maps.places) return;

        addressAutocomplete = new google.maps.places.Autocomplete(addressInput, {
          types: ['address'],
          componentRestrictions: { country: ['us', 'ca'] },
          fields: ['address_components', 'formatted_address']
        });

        addressAutocomplete.addListener('place_changed', () => {
          const place = addressAutocomplete.getPlace();
          if (!place.address_components) return;

          let country = '';
          let province = '';
          let zip = '';

          place.address_components.forEach(c => {
            if (c.types.includes('postal_code')) zip = c.long_name;
          });

          const zipInput = document.getElementById('zip');
          if (zipInput) zipInput.value = zip;

          place.address_components.forEach(c => {
            if (c.types.includes('country')) {
              country = c.long_name === 'United States' ? 'USA' : 'Canada';
            }
            if (c.types.includes('administrative_area_level_1')) {
              province = c.short_name;
            }
          });

          if (countrySelect && country) {
            countrySelect.value = country;

            // Look up fresh in case initAddressAutocomplete ran before cartPage init
            const _stripeBox = document.getElementById('stripe-button-container');
            const _shippingMsg = document.getElementById('shippingMsg');

            const currency = (country === 'Canada') ? 'CAD' : (country === 'USA') ? 'USD' : null;
            if (currency) {
              currentCurrency = currency;
              if (_stripeBox) _stripeBox.style.display = 'block';
              if (_shippingMsg) _shippingMsg.innerText = `Delivery available. Paying in ${currency}.`;
            } else {
              if (_stripeBox) _stripeBox.style.display = 'none';
              if (_shippingMsg) _shippingMsg.innerText = 'Delivery not available.';
            }

            if (typeof setProvince === 'function') setProvince(country);
            if (typeof render === 'function') render();
          }

          setTimeout(() => {
            if (provinceSelect && province) {
              provinceSelect.value = province;
              provinceSelect.dispatchEvent(new Event('change'));
            }
          }, 200);
        });
      };

      if (!document.getElementById('gmap-script')) {
        const script = document.createElement('script');
        script.id = 'gmap-script';
        script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyCfoNbNyrU_e-tQ4Q4uLLD9IPdcmJJ_rRg&libraries=places&callback=initAddressAutocomplete`;
        script.onload = initAddressAutocomplete;
        document.body.appendChild(script);
      } else {
        initAddressAutocomplete();
      }

      // ===== Currency handling =====
      let currentCurrency = 'USD';

      function getCurrencyByCountry(country) {
        if (country === 'Canada') return 'CAD';
        if (country === 'USA') return 'USD';
        return null;
      }

      function subtotal() { return cart.reduce((s, i) => s + Number(i.price || 0), 0); }
      function getShipping() { const c = countrySelect ? countrySelect.value : ''; return c === 'Canada' ? 3 : (c === 'USA' ? 7 : 0); }
      const taxRates = { 'ON': 0.13, 'QC': 0.05, 'NS': 0.15, 'NB': 0.15, 'MB': 0.05, 'BC': 0.05, 'PE': 0.15, 'SK': 0.05, 'AB': 0.05, 'NL': 0.15, 'NT': 0.05, 'YT': 0.05, 'NU': 0.05 };
      function computeTax() { if (!countrySelect || countrySelect.value !== 'Canada' || !provinceSelect) return 0; const base = subtotal() + getShipping(); return base * (taxRates[provinceSelect.value] ?? 0.05); }

      function getProductPage(productId) {
        if (!productId) return 'index.html';
        if (productId.startsWith('card')) return 'cards.html';
        if (productId.startsWith('bookmark')) return 'bookmarks.html';
        return 'index.html';
      }

      function render() {
        if (stripeBox) {
          if (cart.length > 0 && countrySelect && ((countrySelect.value === 'Canada' && provinceSelect && provinceSelect.value !== 'SK') || countrySelect.value === 'USA')) {
            stripeBox.style.display = 'block';
            if (shippingMsg) shippingMsg.innerText = `Delivery available. Shipping: $${getShipping().toFixed(2)}.`;
          } else {
            stripeBox.style.display = 'none';
            if (shippingMsg) shippingMsg.innerText = '';
          }
        }
        if (!cartContainer) return;
        cartContainer.innerHTML = '';
        if (cart.length === 0) { cartContainer.innerHTML = '<p>Your cart is empty.</p>'; if (totalBox) totalBox.innerText = 'Total: $0.00'; return; }
        cart.forEach((it, idx) => {
          const d = document.createElement('div'); d.className = 'cart-item d-flex align-items-center mb-3';
          d.innerHTML = `
            <a href="${getProductPage(it.id)}#${it.id}">
              <img src="${it.image || ''}" alt="${it.name}" width="80" class="me-3 rounded">
            </a>
            <div class="flex-grow-1">
              <strong>${it.name}</strong>
              <p>$${Number(it.price).toFixed(2)}</p>
            </div>
            <button class="btn btn-sm btn-danger remove-item" data-index="${idx}">Remove</button>
          `;
          cartContainer.appendChild(d);
        });
        qsa('.remove-item').forEach(b => b.addEventListener('click', () => { const i = Number(b.dataset.index); if (!Number.isNaN(i)) { cart.splice(i, 1); saveCart(); updateCartCount(); render(); } }));

        const s = subtotal(); const sh = getShipping(); const tax = computeTax(); const tot = s + sh + tax;
        if (totalBox) totalBox.innerText = `Total: $${tot.toFixed(2)} (Subtotal: $${s.toFixed(2)} + Shipping: $${sh.toFixed(2)} + Tax: $${tax.toFixed(2)})`;
        if (orderItemsInput) orderItemsInput.value = cart.map(i => `${i.name} ($${Number(i.price).toFixed(2)})`).join(', ');
        if (orderImagesInput) orderImagesInput.value = cart.map(i => i.image).join(', ');
        if (orderTotalInput) orderTotalInput.value = tot.toFixed(2);
        if (orderShippingInput) orderShippingInput.value = sh.toFixed(2);
        if (orderTaxInput) orderTaxInput.value = tax.toFixed(2);
        if (orderProvinceInput) orderProvinceInput.value = provinceSelect ? provinceSelect.value : '';
        if (orderZipInput) orderZipInput.value = zipInput ? zipInput.value : '';
        if (orderCountryInput) orderCountryInput.value = countrySelect ? countrySelect.value : '';
      }

      // province/state options extraction
      let canadaHTML = ''; let usaHTML = ''; const placeholder = '<option value="">Select Province / State</option>';
      if (provinceSelect) { const cg = provinceSelect.querySelector('optgroup[label="Canada"]'); const ug = provinceSelect.querySelector('optgroup[label="USA"]'); if (cg) canadaHTML = Array.from(cg.querySelectorAll('option')).map(o => o.outerHTML).join(''); if (ug) usaHTML = Array.from(ug.querySelectorAll('option')).map(o => o.outerHTML).join(''); provinceSelect.innerHTML = placeholder; }
      function setProvince(country) { if (!provinceSelect) return; if (country === 'Canada') { provinceSelect.innerHTML = placeholder + canadaHTML; provinceSelect.required = true; provinceSelect.style.display = 'inline-block'; } else if (country === 'USA') { provinceSelect.innerHTML = placeholder + usaHTML; provinceSelect.required = false; provinceSelect.style.display = 'inline-block'; } else { provinceSelect.innerHTML = placeholder; provinceSelect.required = false; provinceSelect.style.display = 'none'; provinceSelect.value = ''; } }

      if (countrySelect) {
        countrySelect.addEventListener('change', () => {
          const country = countrySelect.value;
          const currency = getCurrencyByCountry(country);

          if (!currency) {
            if (stripeBox) stripeBox.style.display = 'none';
            if (shippingMsg) shippingMsg.innerText = 'Delivery not available.';
            return;
          }

          currentCurrency = currency;
          if (stripeBox) stripeBox.style.display = 'block';
          if (shippingMsg) shippingMsg.innerText = `Delivery available. Paying in ${currency}.`;

          setProvince(country);
          render();
        });
      }

      if (provinceSelect) provinceSelect.addEventListener('change', render);

      // ===== Stripe Checkout =====
      async function handleStripeCheckout() {
        // Validate form
        if (orderForm && !orderForm.checkValidity()) {
          orderForm.reportValidity();
          return;
        }
        if (!customerEmailInput?.value) {
          alert('Please enter your email before proceeding.');
          return;
        }
        if (cart.length === 0) {
          alert('Your cart is empty.');
          return;
        }

        const stripeBtn = qs('#stripeCheckoutBtn');
        if (stripeBtn) { stripeBtn.disabled = true; stripeBtn.textContent = 'Redirecting to payment…'; }

        // Save order info to sessionStorage so thank-you.html can read it
          const orderData = {
            items: cart,
            total: (subtotal() + getShipping() + computeTax()).toFixed(2),
            currency: currentCurrency,
            shipping: getShipping().toFixed(2),
            tax: computeTax().toFixed(2),
            province: provinceSelect?.value || '',
            zip: zipInput?.value || '',
            country: countrySelect?.value || '',
            payerEmail: customerEmailInput?.value || '',
            payerName: customerNameInput?.value || ''
          };
          sessionStorage.setItem('lastOrder', JSON.stringify(orderData));

        try {
          const response = await fetch(`${WORKER_URL}/create-checkout-session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              cart,
              shipping: getShipping(),
              tax: computeTax(),
              currency: currentCurrency,
              country: countrySelect?.value || '',
              province: provinceSelect?.value || '',
              zip: zipInput?.value || '',
              email: customerEmailInput?.value,
              name: customerNameInput?.value || '',
              orderData
            })
          });

          const data = await response.json();

          if (data.url) {
            // Don't clear cart here — clear it only after successful payment on thank-you page
            window.location.href = data.url;
          } else {
            throw new Error(data.error || 'Failed to create checkout session');
          }
        } catch (err) {
          console.error('Stripe error:', err);
          alert('Payment setup failed: ' + err.message + '\nPlease try again or contact us.');
          if (stripeBtn) { stripeBtn.disabled = false; stripeBtn.textContent = 'Pay with Card'; }
        }
      }

      // Attach click handler to Stripe button
      const stripeBtn = qs('#stripeCheckoutBtn');
      if (stripeBtn) stripeBtn.addEventListener('click', handleStripeCheckout);

      render();
    }

    // lightbox
    (function () {
      const sels = ['.photo-grid img', '.product-grid img', '.category-grid img'];
      let lb = qs('#lightbox') || qs('.lightbox');
      if (!lb) {
        lb = document.createElement('div');
        lb.id = 'lightbox';
        lb.className = 'lightbox';
        lb.innerHTML = '<span class="close">&times;</span><img class="lightbox-content" id="lightbox-img">';
        document.body.appendChild(lb);
      }
      const lbImg = lb.querySelector('.lightbox-content');
      const closeBtn = lb.querySelector('.close');
      function open(src, alt) { lb.classList.add('show'); if (lbImg) { lbImg.src = src; lbImg.alt = alt || ''; } }
      function close() { lb.classList.remove('show'); }
      if (closeBtn) closeBtn.addEventListener('click', close);
      lb.addEventListener('click', e => { if (e.target === lb) close(); });
      document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
      sels.forEach(s => qsa(s).forEach(img => {
        if (img.dataset.lbAttached) return;
        img.style.cursor = 'pointer';
        img.addEventListener('click', () => open(img.src, img.alt));
        img.dataset.lbAttached = '1';
      }));
    })();

  });
})();