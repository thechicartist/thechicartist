// Consolidated cart + lightbox (clean single-file implementation)
(function () {
  function qs(s) { return document.querySelector(s); }
  function qsa(s) { return Array.from(document.querySelectorAll(s)); }
  function onReady(fn) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else fn(); }
  


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

      setTimeout(() => {
        toast.classList.remove('show');
      }, 2000); // 2 seconds
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
      const paypalBox = qs('#paypal-button-container');
      const shippingMsg = qs('#shippingMsg');
      const payerEmailInput = qs('#payerEmail');
      const customerEmailInput = qs('#customerEmail');


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
            if (c.types.includes('postal_code')) {
              zip = c.long_name;
            }
          });

          // Fill zip field
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

          // Auto-set country dropdown
          if (countrySelect && country) {
            countrySelect.value = country;
            countrySelect.dispatchEvent(new Event('change'));
          }

          // Auto-set province/state
          setTimeout(() => {
            if (provinceSelect && province) {
              provinceSelect.value = province;
              provinceSelect.dispatchEvent(new Event('change'));
            }
          }, 200);
          
        });
      };
      // Load script dynamically
      if (!document.getElementById('gmap-script')) {
        const script = document.createElement('script');
        script.id = 'gmap-script';
        script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyCfoNbNyrU_e-tQ4Q4uLLD9IPdcmJJ_rRg&libraries=places&callback=initAddressAutocomplete`;
        script.onload = initAddressAutocomplete;
        document.body.appendChild(script);
      } else {
        initAddressAutocomplete();
      }

      // ===== PayPal currency handling =====
      let currentCurrency = 'USD';
      let paypalLoadedCurrency = null;

      function getCurrencyByCountry(country) {
        if (country === 'Canada') return 'CAD';
        if (country === 'USA') return 'USD';
        return null;
      }

      function loadPayPalSDK(currency) {
        if (paypalLoadedCurrency === currency) return;

        paypalLoadedCurrency = currency;

        // Remove old SDK
        const oldScript = document.getElementById('paypal-sdk');
        if (oldScript) oldScript.remove();

        // Clear previous buttons
        if (paypalBox) paypalBox.innerHTML = '';

        const script = document.createElement('script');
        script.id = 'paypal-sdk';
        script.src = `https://www.paypal.com/sdk/js?client-id=ARXieRvyprGI6jMyKMWlaH1JCoVq-K07TzcNBwJMmMsZv9z-0jsh2KBx3eY9y9FQrPqcl_spRXxZR1Ma&disable-funding=credit&currency=${currency}`;
        script.onload = renderPayPalButtons;
        document.body.appendChild(script);
      }


      function subtotal() { return cart.reduce((s, i) => s + Number(i.price || 0), 0); }
      function getShipping() { const c = countrySelect ? countrySelect.value : ''; return c === 'Canada' ? 3 : (c === 'USA' ? 7 : 0); }
      const taxRates = { 'ON': 0.13, 'QC': 0.14975, 'NS': 0.15, 'NB': 0.15, 'MB': 0.12, 'BC': 0.12, 'PE': 0.15, 'SK': 0.11, 'AB': 0.05, 'NL': 0.15, 'NT': 0.05, 'YT': 0.05, 'NU': 0.05 };
      function computeTax() { if (!countrySelect || countrySelect.value !== 'Canada' || !provinceSelect) return 0; const base = subtotal() + getShipping(); return base * (taxRates[provinceSelect.value] ?? 0.05); }

      function getProductPage(productId) {
        if (productId.startsWith('card')) return 'cards.html';
        if (productId.startsWith('bookmark')) return 'bookmarks.html';
        // add more types if needed
        return 'index.html'; // fallback
      }

      function render() {
        if (paypalBox) {
          if (cart.length > 0 && countrySelect && (countrySelect.value === 'Canada' || countrySelect.value === 'USA')) {
            paypalBox.style.display = 'block';
            if (shippingMsg) shippingMsg.innerText = `Delivery available. Shipping: $${getShipping().toFixed(2)}.`;
          } else {
            paypalBox.style.display = 'none';
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
            paypalBox.style.display = 'none';
            shippingMsg.innerText = 'Delivery not available.';
            return;
          }

          currentCurrency = currency;
          paypalBox.style.display = 'block';
          shippingMsg.innerText = `Delivery available. Paying in ${currency}.`;

          setProvince(country);
          render();

          loadPayPalSDK(currency);
        });
      }


      if (provinceSelect) provinceSelect.addEventListener('change', render);

      function renderPayPalButtons() {

        const paypalBox = document.querySelector('#paypal-button-container');
        const emptyMsg = document.querySelector('#emptyCartMsg') || document.createElement('p');

        emptyMsg.id = 'emptyCartMsg';
        emptyMsg.style.color = '#555';
        emptyMsg.style.fontStyle = 'italic';
        emptyMsg.style.marginTop = '10px';

        if (!paypalBox) return;

        // Clear previous button
        paypalBox.innerHTML = '';

        if (cart.length === 0) {
          paypalBox.style.display = 'none';
          emptyMsg.textContent = 'Your cart is empty. Add items to proceed.';
          paypalBox.parentNode.insertBefore(emptyMsg, paypalBox.nextSibling);
          return;
        } else {
          paypalBox.style.display = 'block';
          if (emptyMsg.parentNode) emptyMsg.parentNode.removeChild(emptyMsg);
        }


        if (typeof paypal === 'undefined' || !paypalBox) return;

        paypal.Buttons({
          createOrder: (data, actions) => {
            if (orderForm && !orderForm.checkValidity()) {
              orderForm.reportValidity();
              return Promise.reject(new Error('Cart is Empty'));

            }

            if (!customerEmailInput?.value) {
              alert('Please enter your email before proceeding.');
              return Promise.reject(new Error('Invalid email address'));

            }

                  const amount = (subtotal() + getShipping() + computeTax()).toFixed(2);

                  return actions.order.create({
                    purchase_units: [{
                amount: {
                  value: amount,
                  currency_code: currentCurrency
                },
                      description: 'Order from The Chic Artist'
                    }]
                  });
          },

          onApprove: (data, actions) => {
            return actions.order.capture().then(async details => {
              console.log('PayPal order captured:', details);

              // Build order data
              const orderData = {
                items: cart,
                total: (subtotal() + getShipping() + computeTax()).toFixed(2),
                currency: currentCurrency,
                shipping: getShipping().toFixed(2),
                tax: computeTax().toFixed(2),
                province: provinceSelect?.value || '',
                zip: zipInput?.value || '',
                country: countrySelect?.value || '',
                payerEmail: customerEmailInput?.value || details.payer?.email_address || ''
              };

              // Save for Thank You page
              sessionStorage.setItem('lastOrder', JSON.stringify(orderData));
              console.log('Order data saved to sessionStorage');
              const orderImagesInput = document.getElementById('orderImages');

              // Populate hidden Formspree fields
              if (orderItemsInput) orderItemsInput.value = cart.map(i => `${i.name} ($${i.price})`).join(', ');    
              if (orderImagesInput) orderImagesInput.value = orderData.items.map(i => i.image).join(',');
              if (orderTotalInput) orderTotalInput.value = `${orderData.total} ${currentCurrency}`;
              if (orderShippingInput) orderShippingInput.value = orderData.shipping;
              if (orderTaxInput) orderTaxInput.value = orderData.tax;
              if (orderProvinceInput) orderProvinceInput.value = orderData.province;
              if (orderZipInput) orderZipInput.value = orderData.zip;
              if (orderCountryInput) orderCountryInput.value = orderData.country;
              if (payerEmailInput) payerEmailInput.value = orderData.payerEmail;

              // Clear cart immediately
              cart = [];
              saveCart();
              updateCartCount();

              // Send email to Formspree
              try {
                const response = await fetch(orderForm.action, {
                  method: 'POST',
                  body: new FormData(orderForm),
                  headers: { 'Accept': 'application/json' }
                });

                if (!response.ok) {
                  console.warn('Formspree email failed', response);
                } else {
                  console.log('Formspree email sent successfully');
                }
              } catch (err) {
                console.error('Error sending Formspree email', err);
              }

              // Redirect after everything is done
              window.location.href = 'thank-you.html';
            });
          },



          onError: err => {
            console.error('PayPal error', err);
            const errDiv = document.getElementById('paypalError');
            if (errDiv) {
              alert('Payment failed. ' + (err || ''));
            }
          },

          onCancel: data => {
            console.log('Payment cancelled by user', data);
            alert('Payment cancelled. Your cart is still saved.');
          }

        }).render('#paypal-button-container');
      }


      render();
    }

    // lightbox
    (function () {
      const sels = ['.photo-grid img', '.product-grid img', '.category-grid img', '.gallery-grid img', '.gallery-item img'];
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
