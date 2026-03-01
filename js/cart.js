(function () {
  function qs(s) { return document.querySelector(s); }
  function qsa(s) { return Array.from(document.querySelectorAll(s)); }
  function onReady(fn) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else fn(); }

  const WORKER_URL = 'https://stripe-worker.thechicartiststudio.workers.dev';

  onReady(() => {
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const cartIcon  = qs('#cartIcon');
    const cartCount = qs('#cartCount');

    function saveCart() { localStorage.setItem('cart', JSON.stringify(cart)); }
    function updateCartCount() { if (cartCount) cartCount.textContent = cart.length; }
    function showToast(msg) {
      const t = document.getElementById('cartToast');
      if (!t) return;
      t.textContent = msg;
      t.classList.add('show');
      setTimeout(() => t.classList.remove('show'), 2000);
    }
    function getCartType() { return cart.length === 0 ? null : (cart[0].type || 'physical'); }

    updateCartCount();

    // ── Add to cart ──
    document.addEventListener('click', e => {
      const btn = e.target.closest('.add-to-cart');
      if (!btn) return;

      const item = {
        id:    btn.dataset.id,
        name:  btn.dataset.name,
        price: Number(btn.dataset.price) || 0,
        image: btn.dataset.image || '',
        type:  btn.dataset.type || 'physical'
      };

      const cartType = getCartType();
      if (cartType && cartType !== item.type) {
        const typeLabel     = cartType === 'digital' ? 'digital products' : 'physical products';
        const newTypeLabel  = item.type === 'digital' ? 'a digital product' : 'a physical product';
        const ok = confirm(
          `Your cart already has ${typeLabel}.\n\n` +
          `We currently don't support mixing digital and physical products in the same order.\n\n` +
          `Click OK to clear your cart and add ${newTypeLabel}, or cancel to keep your current cart.`
        );
        if (!ok) return;
        cart = [];
      }

      cart.push(item);
      saveCart();
      updateCartCount();
      showToast(`${item.name} added to cart ✨`);
    });

    if (cartIcon) {
      cartIcon.style.cursor = 'pointer';
      cartIcon.addEventListener('click', () => window.location.href = 'cart.html');
    }

    // ── Cart page ──
    const cartPage = qs('#cartPage');
    if (!cartPage) {
      // Still wire up lightbox on non-cart pages
      initLightbox();
      return;
    }

    const cartContainer    = qs('#cartItems');
    const totalBox         = qs('#cartTotal');
    const orderItemsInput  = qs('#orderItems');
    const orderImagesInput = qs('#orderImages');
    const orderTotalInput  = qs('#orderTotal');
    const orderShippingInput = qs('#orderShipping');
    const orderTaxInput    = qs('#orderTax');
    const orderProvinceInput = qs('#orderProvince');
    const orderZipInput    = qs('#orderZip');
    const orderCountryInput = qs('#orderCountry');
    const orderForm        = qs('#orderForm');
    const countrySelect    = qs('#country');
    const provinceSelect   = qs('#province');
    const zipInput         = qs('#zip');
    const stripeBox        = qs('#stripe-button-container');
    const shippingMsg      = qs('#shippingMsg');
    const customerEmailInput = qs('#customerEmail');
    const customerNameInput  = qs('#customerName');
    const addressSection   = qs('#addressSection');

    let currentCurrency = 'USD';
    let appliedDiscount = 0; // discount amount in dollars, set when coupon is validated
    let selectedDigitalCountry = ''; // set by the Canada/USA/Other buttons for digital carts


    // ── Pricing helpers ──
    function subtotal() { return cart.reduce((s, i) => s + Number(i.price || 0), 0); }

    function getShipping() {
      if (getCartType() === 'digital') return 0;
      const c = countrySelect ? countrySelect.value : '';
      return c === 'Canada' ? 3 : c === 'USA' ? 7 : 0;
    }

    const taxRates = { ON: 0.13, QC: 0.05, NS: 0.15, NB: 0.15, MB: 0.05, BC: 0.05, PE: 0.15, SK: 0.05, AB: 0.05, NL: 0.15, NT: 0.05, YT: 0.05, NU: 0.05 };
    function computeTax(discountedSubtotal, shipping) {
      const cartType = getCartType();
      let country, province;
      if (cartType === 'digital') {
        country  = selectedDigitalCountry;
        province = qs('#digitalProvince') ? qs('#digitalProvince').value : '';
      } else {
        country  = countrySelect  ? countrySelect.value  : '';
        province = provinceSelect ? provinceSelect.value : '';
      }
      if (country !== 'Canada' || !province) return 0;
      return (discountedSubtotal + shipping) * (taxRates[province] ?? 0.05);
    }

    // ── Allowed countries ──
    function isAllowed(country, province) {
      const cartType = getCartType();
      if (cartType === 'digital') {
        if (!selectedDigitalCountry || selectedDigitalCountry === 'Other') return false;
        if (selectedDigitalCountry === 'Canada' && province === 'SK') return false;
        return ['Canada', 'USA'].includes(selectedDigitalCountry);
      }
      if (country === 'Canada' && province === 'SK') return false;
      return ['Canada', 'USA'].includes(country);
    }

    // ── Address visibility (hide for digital) ──
    function updateAddressVisibility() {
      const isDigital = getCartType() === 'digital';
      const digitalSection  = qs('#digitalCountrySection');
      const physicalSection = qs('#physicalAddressSection');
      const physicalNotes   = qs('#physicalNotes');
      if (digitalSection)  digitalSection.style.display  = isDigital ? '' : 'none';
      if (physicalSection) physicalSection.style.display = isDigital ? 'none' : '';
      if (physicalNotes)   physicalNotes.style.display   = isDigital ? 'none' : '';
    }

    // ── Render cart ──
    function getProductPage(id) {
      if (!id) return 'index.html';
      if (id.startsWith('card'))     return 'cards.html';
      if (id.startsWith('bookmark')) return 'bookmarks.html';
      if (id.startsWith('class'))    return 'OnlineClass.html';
      return 'index.html';
    }

    function render() {
      updateAddressVisibility();

      const cartType = getCartType();
      let country, province;
      if (cartType === 'digital') {
        country  = selectedDigitalCountry;
        province = qs('#digitalProvince') ? qs('#digitalProvince').value : '';
      } else {
        country  = countrySelect  ? countrySelect.value  : '';
        province = provinceSelect ? provinceSelect.value : '';
      }
      const allowed  = isAllowed(country, province);

      if (stripeBox) {
        const show = cart.length > 0 && allowed;
        stripeBox.style.display = show ? 'block' : 'none';

        if (shippingMsg) {
          if (!country) {
            shippingMsg.innerText = '';
          } else if (!allowed && cartType === 'digital' && province === 'SK') {
            shippingMsg.innerHTML = 'Sorry, we are in process to get registered for Saskatchewan provincial tax and cannot process orders from SK from this webpage. <a href="international_store.html" style="color:#b09a82; font-weight:500;">Please visit our International Store</a>';
          } else if (!allowed && country === 'Canada' && province === 'SK') {
            shippingMsg.innerText = 'Sorry, we do not deliver to Saskatchewan.';
          } else if (!allowed) {
            shippingMsg.innerText = cartType === 'digital'
              ? ''
              : 'Delivery available in Canada and USA only.';
          } else {
            shippingMsg.innerText = cartType === 'digital'
              ? `Available in ${country}. Paying in ${currentCurrency}.`
              : currentCurrency === 'CAD'
                ? `Untracked Canada Post delivery. Shipping: $${getShipping().toFixed(2)} CAD.`
                : `Tracked delivery. Shipping: $${getShipping().toFixed(2)} USD.`;
          }
        }
      }

      if (!cartContainer) return;
      cartContainer.innerHTML = '';

      if (cart.length === 0) {
        cartContainer.innerHTML = '<p>Your cart is empty.</p>';
        if (totalBox) totalBox.innerText = 'Total: $0.00';
        return;
      }

      cart.forEach((it, idx) => {
        const d = document.createElement('div');
        d.className = 'cart-item d-flex align-items-center mb-3';
        d.innerHTML = `
          <a href="product.html?id=${it.id}">
            <img src="${it.image || ''}" alt="${it.name}" width="80" class="me-3 rounded" style="cursor:pointer;">
          </a>
          <div class="flex-grow-1">
            <strong>${it.name}</strong>
            <p>$${Number(it.price).toFixed(2)}</p>
          </div>
          <button class="btn btn-sm btn-danger remove-item" data-index="${idx}">Remove</button>
        `;
        cartContainer.appendChild(d);
      });

      qsa('.remove-item').forEach(b => b.addEventListener('click', () => {
        const i = Number(b.dataset.index);
        if (!Number.isNaN(i)) { cart.splice(i, 1); saveCart(); updateCartCount(); render(); }
      }));

      const s = subtotal(), sh = getShipping();
      const disc = Math.min(appliedDiscount, s);
      const discountedS = Math.max(0, s - disc);
      const tax = computeTax(discountedS, sh);
      const tot = discountedS + sh + tax;

      if (totalBox) {
        const discLine = disc > 0 ? ` − Discount: $${disc.toFixed(2)}` : '';
        if (cartType === 'digital') {
          totalBox.innerText = tax > 0
            ? `Total: $${tot.toFixed(2)}  (Subtotal: $${s.toFixed(2)}${discLine} + Tax: $${tax.toFixed(2)})`
            : `Total: $${tot.toFixed(2)}  (Subtotal: $${s.toFixed(2)}${discLine})`;
        } else {
          totalBox.innerText = `Total: $${tot.toFixed(2)} (Subtotal: $${s.toFixed(2)}${discLine} + Shipping: $${sh.toFixed(2)} + Tax: $${tax.toFixed(2)})`;
        }
      }

      if (orderItemsInput)    orderItemsInput.value    = cart.map(i => `${i.name} ($${Number(i.price).toFixed(2)})`).join(', ');
      if (orderImagesInput)   orderImagesInput.value   = cart.map(i => i.image).join(', ');
      if (orderTotalInput)    orderTotalInput.value    = tot.toFixed(2);
      if (orderShippingInput) orderShippingInput.value = sh.toFixed(2);
      if (orderTaxInput)      orderTaxInput.value      = tax.toFixed(2);
      if (orderProvinceInput) orderProvinceInput.value = province;
      if (orderZipInput)      orderZipInput.value      = zipInput ? zipInput.value : '';
      if (orderCountryInput)  orderCountryInput.value  = country;
    }

    // ── Province options ──
    let canadaHTML = '', usaHTML = '';
    const placeholder = '<option value="">Select Province / State</option>';
    if (provinceSelect) {
      const cg = provinceSelect.querySelector('optgroup[label="Canada"]');
      const ug = provinceSelect.querySelector('optgroup[label="USA"]');
      if (cg) canadaHTML = Array.from(cg.querySelectorAll('option')).map(o => o.outerHTML).join('');
      if (ug) usaHTML    = Array.from(ug.querySelectorAll('option')).map(o => o.outerHTML).join('');
      provinceSelect.innerHTML = placeholder;
    }

    function setProvince(country) {
      if (!provinceSelect) return;
      if (country === 'Canada') {
        provinceSelect.innerHTML = placeholder + canadaHTML;
        provinceSelect.required = true;
        provinceSelect.style.display = '';
      } else if (country === 'USA') {
        provinceSelect.innerHTML = placeholder + usaHTML;
        provinceSelect.required = false;
        provinceSelect.style.display = '';
      } else {
        provinceSelect.innerHTML = placeholder;
        provinceSelect.required = false;
        provinceSelect.style.display = 'none';
        provinceSelect.value = '';
      }
    }

    // ── Google Address Autocomplete ──
    window.initAddressAutocomplete = function () {
      const addressInput = qs('#address');
      if (!addressInput || !window.google?.maps?.places) return;

      const autocomplete = new google.maps.places.Autocomplete(addressInput, {
        types: ['address'],
        //componentRestrictions: { country: ['us', 'ca', 'uk'] },
        componentRestrictions: { country: ['us', 'ca'] },
        fields: ['address_components']
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (!place.address_components) return;

        let country = '', province = '', zip = '';
        place.address_components.forEach(c => {
          if (c.types.includes('postal_code')) zip = c.long_name;
          if (c.types.includes('country')) country = c.long_name === 'United States' ? 'USA' : (c.long_name === 'United Kingdom' ? 'UK' : 'Canada');
          if (c.types.includes('administrative_area_level_1')) province = c.short_name;
        });

        const zipEl = document.getElementById('zip');
        if (zipEl) zipEl.value = zip;

        if (countrySelect && country) {
          countrySelect.value = country;
          currentCurrency = (getCartType() === 'digital') ? 'USD' : (country === 'Canada' ? 'CAD' : 'USD');
          setProvince(country);
          render();
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
      document.body.appendChild(script);
    } else {
      initAddressAutocomplete();
    }

    if (countrySelect) {
      countrySelect.addEventListener('change', () => {
        const country = countrySelect.value;
        currentCurrency = (getCartType() === 'digital') ? 'USD' : (country === 'Canada' ? 'CAD' : 'USD');
        setProvince(country);
        render();
      });
    }
    if (provinceSelect) provinceSelect.addEventListener('change', render);

    // ── Digital country buttons ──
    const canadaProvinces = [
      ['AB','Alberta'],['BC','British Columbia'],['MB','Manitoba'],['NB','New Brunswick'],
      ['NL','Newfoundland and Labrador'],['NS','Nova Scotia'],['NT','Northwest Territories'],
      ['NU','Nunavut'],['ON','Ontario'],['PE','Prince Edward Island'],['QC','Quebec'],
      ['SK','Saskatchewan'],['YT','Yukon']
    ];
    const usaStates = [
      ['AL','Alabama'],['AK','Alaska'],['AZ','Arizona'],['AR','Arkansas'],['CA','California'],
      ['CO','Colorado'],['CT','Connecticut'],['DE','Delaware'],['FL','Florida'],['GA','Georgia'],
      ['HI','Hawaii'],['ID','Idaho'],['IL','Illinois'],['IN','Indiana'],['IA','Iowa'],
      ['KS','Kansas'],['KY','Kentucky'],['LA','Louisiana'],['ME','Maine'],['MD','Maryland'],
      ['MA','Massachusetts'],['MI','Michigan'],['MN','Minnesota'],['MS','Mississippi'],
      ['MO','Missouri'],['MT','Montana'],['NE','Nebraska'],['NV','Nevada'],['NH','New Hampshire'],
      ['NJ','New Jersey'],['NM','New Mexico'],['NY','New York'],['NC','North Carolina'],
      ['ND','North Dakota'],['OH','Ohio'],['OK','Oklahoma'],['OR','Oregon'],['PA','Pennsylvania'],
      ['RI','Rhode Island'],['SC','South Carolina'],['SD','South Dakota'],['TN','Tennessee'],
      ['TX','Texas'],['UT','Utah'],['VT','Vermont'],['VA','Virginia'],['WA','Washington'],
      ['WV','West Virginia'],['WI','Wisconsin'],['WY','Wyoming']
    ];

    qsa('.digital-country-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        // Highlight selected button
        qsa('.digital-country-btn').forEach(b => {
          b.style.borderColor = '#ddd'; b.style.background = '#fff'; b.style.color = '#333';
        });
        btn.style.borderColor = '#222'; btn.style.background = '#222'; btn.style.color = '#fff';

        const country = btn.dataset.country;
        selectedDigitalCountry = country;

        const intlMsg     = qs('#internationalMsg');
        const provSection = qs('#digitalProvinceSection');
        const digitalProv = qs('#digitalProvince');
        const dcInput     = qs('#digitalCountry');

        if (dcInput) dcInput.value = country;

        if (country === 'Other') {
          if (intlMsg)     intlMsg.style.display     = '';
          if (provSection) provSection.style.display = 'none';
          if (digitalProv) digitalProv.value         = '';
          currentCurrency = 'USD';
        } else {
          if (intlMsg)     intlMsg.style.display = 'none';
          if (provSection) provSection.style.display = '';
          currentCurrency = 'USD';
          if (digitalProv) {
            const opts = country === 'Canada' ? canadaProvinces : usaStates;
            digitalProv.innerHTML =
              `<option value="">Select ${country === 'Canada' ? 'Province' : 'State'}</option>` +
              opts.map(([code, name]) => `<option value="${code}">${name}</option>`).join('');
          }
        }
        render();
      });
    });

    if (qs('#digitalProvince')) qs('#digitalProvince').addEventListener('change', render);

    // ── Stripe Checkout ──
    async function handleStripeCheckout() {
      const cartType = getCartType();
      let country, province;
      if (cartType === 'digital') {
        country  = selectedDigitalCountry;
        province = qs('#digitalProvince') ? qs('#digitalProvince').value : '';
      } else {
        country  = countrySelect  ? countrySelect.value  : '';
        province = provinceSelect ? provinceSelect.value : '';
      }

      // Enforce T&C checkbox
      const termsBox = qs('#termsCheckbox');
      const termsMsg = qs('#termsMsg');
      if (termsBox && !termsBox.checked) {
        if (termsMsg) termsMsg.style.display = '';
        termsBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      if (termsMsg) termsMsg.style.display = 'none';

      // For digital products, only email + name needed, no address
      if (cartType !== 'digital') {
        if (orderForm && !orderForm.checkValidity()) {
          orderForm.reportValidity();
          return;
        }
      }
      if (!customerEmailInput?.value) {
        alert('Please enter your email before proceeding.');
        return;
      }

      if (cart.length === 0) {
        alert('Your cart is empty.');
        return;
      }

      if (!isAllowed(country, province)) {
        alert('Sorry, orders are not available in your selected country/province.');
        return;
      }

      // Require zip code for physical orders (Google Form has it as mandatory)
      if (cartType !== 'digital' && (!zipInput?.value || zipInput.value.trim() === '' || zipInput.value.trim() === 'zip code')) {
        alert('Please enter a valid shipping address with a zip/postal code to proceed.');
        qs('#address')?.focus();
        return;
      }

      const stripeBtn = qs('#stripeCheckoutBtn');
      if (stripeBtn) { stripeBtn.disabled = true; stripeBtn.textContent = 'Redirecting to payment…'; }

      try {
        // Save address details to sessionStorage so thank-you.html can include them in the order notification
        const pendingAddress = {
          address:  qs('#address')?.value  || '',
          zip:      zipInput?.value        || '',
          province: province,
          country:  country,
          name:     customerNameInput?.value || '',
          email:    customerEmailInput?.value || ''
        };
        sessionStorage.setItem('pendingOrderAddress', JSON.stringify(pendingAddress));

        const response = await fetch(`${WORKER_URL}/create-checkout-session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cart: cart.map(i => ({ id: i.id, name: i.name, image: i.image, type: i.type })),
            currency: currentCurrency,
            country,
            province,
            zip:      zipInput?.value          || '',
            email:    customerEmailInput?.value,
            name:     customerNameInput?.value || '',
            couponCode: (qs('#couponInput')?.value || '').trim().toUpperCase() || null
          })
        });

        const data = await response.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          throw new Error(data.error || 'Failed to create checkout session');
        }
      } catch (err) {
        console.error('Stripe error:', err);
        alert('Payment setup failed: ' + err.message + '\nPlease try again or contact us.');
        const stripeBtn = qs('#stripeCheckoutBtn');
        if (stripeBtn) { stripeBtn.disabled = false; stripeBtn.textContent = 'Pay with Card'; }
      }
    }

    const stripeBtn = qs('#stripeCheckoutBtn');
    if (stripeBtn) stripeBtn.addEventListener('click', handleStripeCheckout);

    // Wire up coupon Apply button — validates against the worker before confirming
    const couponBtn = qs('#applyCouponBtn');
    if (couponBtn) {
      couponBtn.addEventListener('click', async () => {
        const couponInput = qs('#couponInput');
        const couponMsg   = qs('#couponMsg');
        const code = (couponInput?.value || '').trim().toUpperCase();
        if (!code) {
          if (couponMsg) { couponMsg.textContent = 'Please enter a coupon code.'; couponMsg.style.color = '#c0392b'; }
          return;
        }
        // Validate against the worker using a dummy cart entry
        couponBtn.disabled = true;
        couponBtn.textContent = 'Checking…';
        try {
          const res = await fetch(`${WORKER_URL}/validate-coupon`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              couponCode: code,
              subtotal: subtotal(),
              cartItems: cart.map(i => ({ id: i.id, price: i.price }))
            })
          });
          const data = await res.json();
          if (res.ok && data.valid) {
            appliedDiscount = data.discountAmount || 0;
            if (couponMsg) { couponMsg.textContent = `✓ ${data.label} applied!`; couponMsg.style.color = '#27ae60'; }
            couponBtn.textContent = 'Apply';
            couponBtn.style.background = '#222';
            couponBtn.disabled = false;
            render();
          } else {
            appliedDiscount = 0;
            if (couponMsg) { couponMsg.textContent = `✗ ${data.reason || 'Invalid coupon code.'}`; couponMsg.style.color = '#c0392b'; }
            couponBtn.disabled = false;
            couponBtn.textContent = 'Apply';
            render();
          }
        } catch {
          if (couponMsg) { couponMsg.textContent = 'Could not verify coupon. Please try again.'; couponMsg.style.color = '#c0392b'; }
          couponBtn.disabled = false;
          couponBtn.textContent = 'Apply';
        }
      });
    }

    render();
    initLightbox();

    function initLightbox() {
      const sels = ['.photo-grid img'];
      let lb = qs('#lightbox') || qs('.lightbox');
      if (!lb) {
        lb = document.createElement('div');
        lb.id = 'lightbox'; lb.className = 'lightbox';
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
    }
  });
})();