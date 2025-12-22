// Consolidated cart + lightbox (clean single-file implementation)
(function () {
  function qs(s){ return document.querySelector(s); }
  function qsa(s){ return Array.from(document.querySelectorAll(s)); }
  function onReady(fn){ if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', fn); else fn(); }

  onReady(()=>{
    // Cart state
    let cart = JSON.parse(localStorage.getItem('cart')||'[]');
    const cartIcon = qs('#cartIcon');
    const cartCount = qs('#cartCount');
    function saveCart(){ localStorage.setItem('cart', JSON.stringify(cart)); }
    function updateCartCount(){ if(cartCount) cartCount.textContent = cart.length; }
    updateCartCount();

    // Add to cart
    qsa('.add-to-cart').forEach(btn=> btn.addEventListener('click', ()=>{
      const p = { id: btn.dataset.id, name: btn.dataset.name, price: Number(btn.dataset.price)||0, image: btn.dataset.image||'' };
      cart.push(p); saveCart(); updateCartCount(); alert(`${p.name} added to cart`);
    }));

    if(cartIcon){ cartIcon.style.cursor='pointer'; cartIcon.addEventListener('click', ()=> window.location.href='cart.html'); }

    // Cart page
    const cartPage = qs('#cartPage');
    if(cartPage){
      const cartContainer = qs('#cartItems');
      const totalBox = qs('#cartTotal');
      const orderItemsInput = qs('#orderItems');
      const orderTotalInput = qs('#orderTotal');
      const orderShippingInput = qs('#orderShipping');
      const orderTaxInput = qs('#orderTax');
      const orderProvinceInput = qs('#orderProvince');
      const orderForm = qs('#orderForm');
      const countrySelect = qs('#country');
      const provinceSelect = qs('#province');
      const paypalBox = qs('#paypal-button-container');
      const shippingMsg = qs('#shippingMsg');
      const payerEmailInput = qs('#payerEmail');
      const customerEmailInput = qs('#customerEmail');  

      function subtotal(){ return cart.reduce((s,i)=>s+Number(i.price||0),0); }
      function getShipping(){ const c = countrySelect?countrySelect.value:''; return c==='Canada'?3: (c==='USA'?9:0); }
      const taxRates = { 'ON':0.13,'QC':0.14975,'NS':0.15,'NB':0.15,'MB':0.12,'BC':0.12,'PE':0.15,'SK':0.11,'AB':0.05,'NL':0.15,'NT':0.05,'YT':0.05,'NU':0.05 };
      function computeTax(){ if(!countrySelect||countrySelect.value!=='Canada'||!provinceSelect) return 0; const base = subtotal() + getShipping(); return base * (taxRates[provinceSelect.value] ?? 0.05); }

      function render(){
        if(!cartContainer) return;
        cartContainer.innerHTML='';
        if(cart.length===0){ cartContainer.innerHTML='<p>Your cart is empty.</p>'; if(totalBox) totalBox.innerText='Total: $0.00'; return; }
        cart.forEach((it,idx)=>{
          const d=document.createElement('div'); d.className='cart-item d-flex align-items-center mb-3';
          d.innerHTML = ` <img src="${it.image||''}" alt="${it.name}" width="80" class="me-3 rounded"> <div class="flex-grow-1"><strong>${it.name}</strong><p>$${Number(it.price).toFixed(2)}</p></div><button class="btn btn-sm btn-danger remove-item" data-index="${idx}">Remove</button>`;
          cartContainer.appendChild(d);
        });
        qsa('.remove-item').forEach(b=> b.addEventListener('click', ()=>{ const i=Number(b.dataset.index); if(!Number.isNaN(i)){ cart.splice(i,1); saveCart(); updateCartCount(); render(); }}));

        const s = subtotal(); const sh = getShipping(); const tax = computeTax(); const tot = s+sh+tax;
        if(totalBox) totalBox.innerText = `Total: $${tot.toFixed(2)} (Subtotal: $${s.toFixed(2)} + Shipping: $${sh.toFixed(2)} + Tax: $${tax.toFixed(2)})`;
        if(orderItemsInput) orderItemsInput.value = cart.map(i=>`${i.name} ($${Number(i.price).toFixed(2)})`).join(', ');
        if(orderTotalInput) orderTotalInput.value = tot.toFixed(2);
        if(orderShippingInput) orderShippingInput.value = sh.toFixed(2);
        if(orderTaxInput) orderTaxInput.value = tax.toFixed(2);
        if(orderProvinceInput) orderProvinceInput.value = provinceSelect?provinceSelect.value:'';
      }

      // province/state options extraction
      let canadaHTML=''; let usaHTML=''; const placeholder = '<option value="">Select Province / State</option>';
      if(provinceSelect){ const cg = provinceSelect.querySelector('optgroup[label="Canada"]'); const ug = provinceSelect.querySelector('optgroup[label="USA"]'); if(cg) canadaHTML = Array.from(cg.querySelectorAll('option')).map(o=>o.outerHTML).join(''); if(ug) usaHTML = Array.from(ug.querySelectorAll('option')).map(o=>o.outerHTML).join(''); provinceSelect.innerHTML = placeholder; }
      function setProvince(country){ if(!provinceSelect) return; if(country==='Canada'){ provinceSelect.innerHTML = placeholder + canadaHTML; provinceSelect.required = true; provinceSelect.style.display='inline-block'; } else if(country==='USA'){ provinceSelect.innerHTML = placeholder + usaHTML; provinceSelect.required = false; provinceSelect.style.display='inline-block'; } else { provinceSelect.innerHTML = placeholder; provinceSelect.required = false; provinceSelect.style.display='none'; provinceSelect.value=''; } }

      if(countrySelect) countrySelect.addEventListener('change', ()=>{ const v = countrySelect.value; if(v==='USA'||v==='Canada'){ if(paypalBox) paypalBox.style.display='block'; if(shippingMsg) shippingMsg.innerText = `Delivery available. Shipping: $${getShipping().toFixed(2)}.`; } else { if(paypalBox) paypalBox.style.display='none'; if(shippingMsg) shippingMsg.innerText = 'Delivery not available outside USA & Canada.'; } setProvince(v); render(); });
      if(provinceSelect) provinceSelect.addEventListener('change', render);

      if(typeof paypal !== 'undefined' && paypal.Buttons){ 
        paypal.Buttons({
          createOrder: (data, actions) => {
            if (orderForm && !orderForm.checkValidity()) {
              orderForm.reportValidity();
              return actions.reject();
            }

            if (!customerEmailInput?.value) {
              alert('Please enter your email before proceeding.');
              return actions.reject();
            }

            const amount = (subtotal() + getShipping() + computeTax()).toFixed(2);

            return actions.order.create({
              purchase_units: [{
                amount: { value: amount },
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
                shipping: getShipping().toFixed(2),
                tax: computeTax().toFixed(2),
                province: provinceSelect?.value || '',
                payerEmail: customerEmailInput?.value || details.payer?.email_address || ''
              };

              // Save for Thank You page
              sessionStorage.setItem('lastOrder', JSON.stringify(orderData));
              console.log('Order data saved to sessionStorage');

              // Populate hidden Formspree fields
              if (orderItemsInput) orderItemsInput.value = cart.map(i => `${i.name} ($${Number(i.price).toFixed(2)})`).join(', ');
              if (orderTotalInput) orderTotalInput.value = orderData.total;
              if (orderShippingInput) orderShippingInput.value = orderData.shipping;
              if (orderTaxInput) orderTaxInput.value = orderData.tax;
              if (orderProvinceInput) orderProvinceInput.value = orderData.province;
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



          onCancel: (data) => {
            alert('Payment was cancelled. Your cart is still saved.');
          },

          onError: (err) => {
            console.error('PayPal error', err);
            alert('Payment failed. Please try again or use another method.');
          }}).render('#paypal-button-container'); 
      }

      render();
    }

    // lightbox
    (function(){
      const sels = ['.photo-grid img','.product-grid img','.category-grid img','.gallery-grid img','.gallery-item img'];
      let lb = qs('#lightbox')||qs('.lightbox'); 
      if(!lb){ 
        lb = document.createElement('div'); 
        lb.id='lightbox'; 
        lb.className='lightbox'; 
        lb.innerHTML = '<span class="close">&times;</span><img class="lightbox-content" id="lightbox-img">'; 
        document.body.appendChild(lb); 
      } 
      const lbImg = lb.querySelector('.lightbox-content'); 
      const closeBtn = lb.querySelector('.close'); 
      function open(src,alt){ lb.classList.add('show'); if(lbImg){ lbImg.src = src; lbImg.alt = alt||''; } } 
      function close(){ lb.classList.remove('show'); } 
      if(closeBtn) closeBtn.addEventListener('click', close); 
      lb.addEventListener('click', e=>{ if(e.target===lb) close(); }); 
      document.addEventListener('keydown', e=>{ if(e.key==='Escape') close(); }); 
      sels.forEach(s=> qsa(s).forEach(img=>{ 
        if(img.dataset.lbAttached) return; 
        img.style.cursor='pointer'; 
        img.addEventListener('click', ()=>open(img.src,img.alt)); 
        img.dataset.lbAttached='1'; 
      }));
    })();

  });
})();
