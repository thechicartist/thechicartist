/**
 * Cloudflare Worker — Stripe Checkout (server-side pricing)
 * Environment variables:
 *   STRIPE_SECRET_KEY  → sk_live_xxxx
 *   STRIPE_SECRET_KEY_SANDBOX → sk_test_xxxx
 *   RESEND_API_KEY     → key_xxxx
 *   ALLOWED_ORIGIN     → https://thechicartist.com
 */

// ============================================================
//  PRICING — single source of truth
// ============================================================
function getProductPrice(productId) {
  if (productId.startsWith('bookmark')) {
    const n = parseInt(productId.replace('bookmark', ''));
    if (n === 115)                          return 39.99;
    if (n === 126 || n === 124)             return 25.99;
    if (n === 49 || n === 128 || n === 45)  return 11.99;
    return 9.99;
  }
  if (productId.startsWith('card')) {
    const n = parseInt(productId.replace('card', ''));
    if (n === 2 || n === 5 || n === 6)    return 39.99;
    return 19.99;
  }
  const classPrices = {
    'class-lavender': 30.00,
    // add more classes here
  };
    const ebookPrices = {
    'ebook-watercolor-basics': 15.99,
    'ebook-spring-flowers':    20.99,
    // add more classes here
  };
  if (classPrices[productId] !== undefined) return classPrices[productId];
  if (ebookPrices[productId] !== undefined) return ebookPrices[productId];
  
  return null;
}

function isDigital(productId) {
  return (productId.startsWith('class') || productId.startsWith('ebook'));
}

// ============================================================
//  COUPON CODES — edit here to add/remove codes
//
//  Fields:
//    type        → 'percent' (% off) or 'fixed' ($ off)
//    amount      → number (percent value or dollar amount)
//    minCart     → (optional) minimum subtotal required, e.g. 30.00
//    productTypes → (optional) array of allowed product types:
//                   'physical', 'digital', 'class', 'ebook'
//                   omit to allow all product types
//
//  Examples:
//    'SAVE5':    { type: 'fixed',   amount: 5,  minCart: 25 }
//    'CLASSOFF': { type: 'percent', amount: 10, productTypes: ['class'] }
//    'BOOKOFF':  { type: 'percent', amount: 15, productTypes: ['physical'], minCart: 20 }
// ============================================================
const COUPON_CODES = {
  'WELCOME10': { type: 'percent', amount: 10 },
  'CHIC15':    { type: 'percent', amount: 15, minCart: 50 },
  'FLAT5':     { type: 'fixed',   amount: 5.00, minCart: 30 },
  'CLASSOFF':  { type: 'percent', amount: 20, productTypes: ['class'] },
  'EBOOKOFF':  { type: 'percent', amount: 10, productTypes: ['ebook'] },
};

function applyDiscount(subtotal, code, cartItems) {
  const coupon = COUPON_CODES[code.toUpperCase()];
  if (!coupon) return { invalid: true };

  // Check minimum cart value
  if (coupon.minCart && subtotal < coupon.minCart)
    return { invalid: true, reason: `Minimum cart value of $${coupon.minCart.toFixed(2)} required for this code.` };

  // Check product type restriction
  if (coupon.productTypes && coupon.productTypes.length > 0) {
    const allowed = coupon.productTypes;
    const cartMatches = cartItems.some(item => {
      if (allowed.includes('class'))    return item.id.startsWith('class');
      if (allowed.includes('ebook'))    return item.id.startsWith('ebook');
      if (allowed.includes('physical')) return !item.id.startsWith('class') && !item.id.startsWith('ebook');
      if (allowed.includes('digital'))  return item.id.startsWith('class') || item.id.startsWith('ebook');
      return false;
    });
    if (!cartMatches)
      return { invalid: true, reason: `This code is only valid for: ${allowed.join(', ')}.` };
  }

  const discount = coupon.type === 'percent'
    ? parseFloat((subtotal * coupon.amount / 100).toFixed(2))
    : Math.min(coupon.amount, subtotal);
  const label = coupon.type === 'percent'
    ? `Discount (${coupon.amount}% off)`
    : `Discount ($${coupon.amount.toFixed(2)} off)`;
  return { discount, label };
}

// ============================================================
//  ITEM ELIGIBILITY — checks if an item matches a coupon's productTypes
// ============================================================
function itemIsEligible(itemId, productTypes) {
  if (!productTypes || productTypes.length === 0) return true; // no restriction = all eligible
  for (const t of productTypes) {
    if (t === 'class'    && itemId.startsWith('class'))   return true;
    if (t === 'ebook'    && itemId.startsWith('ebook'))   return true;
    if (t === 'physical' && !itemId.startsWith('class') && !itemId.startsWith('ebook')) return true;
    if (t === 'digital'  && (itemId.startsWith('class') || itemId.startsWith('ebook'))) return true;
  }
  return false;
}

// ============================================================
//  EBOOK DELIVERY — maps product ID to R2 filename
//  Add your ebook product IDs and their exact filenames in R2 here
// ============================================================
const EBOOK_FILES = {
  'ebook-watercolor-basics': 'Watercolor_Made_Simple.pdf',
  'ebook-spring-flowers': 'Spring_Flowers_in_Watercolor.pdf'
  // add more: 'ebook-florals': 'florals-guide.pdf',
};

async function generateDownloadToken(env, filename) {
  // Generate a signed token: base64(filename + expiry + hmac)
  // Token is valid for 24 hours, verified in /download endpoint
  const expiry = Date.now() + 24 * 60 * 60 * 1000;
  const payload = `${filename}:${expiry}`;
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(env.STRIPE_SECRET_KEY),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  const sigHex = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
  const token = btoa(`${payload}:${sigHex}`);
  // Download is served by the Worker itself, not the static site
  const workerBase = 'https://stripe-worker.thechicartiststudio.workers.dev';
  return `${workerBase}/download?token=${encodeURIComponent(token)}`;
}

async function verifyDownloadToken(env, token) {
  // Returns filename if valid, null if expired or tampered
  try {
    const decoded = atob(token);
    const lastColon = decoded.lastIndexOf(':');
    const secondLastColon = decoded.lastIndexOf(':', lastColon - 1);
    const payload = decoded.substring(0, lastColon);
    const sigHex  = decoded.substring(lastColon + 1);
    const [filename, expiry] = [decoded.substring(0, secondLastColon), parseInt(decoded.substring(secondLastColon + 1, lastColon))];
    if (Date.now() > expiry) return null; // expired
    const key = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(env.STRIPE_SECRET_KEY),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
    const expectedHex = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
    if (sigHex !== expectedHex) return null; // tampered
    return filename;
  } catch { return null; }
}

async function sendEbookEmail(env, email, name, downloads) {
  // downloads = [{ title, url }]
  const itemsHtml = downloads.map(d =>
    `<p style="margin:12px 0;">
      <strong>${d.title}</strong><br>
      <a href="${d.url}" style="color:#b09a82;">Click here to download your e-book</a>
      <br><small style="color:#999;">This link expires in 24 hours.</small>
    </p>`
  ).join('');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Neetika <neetika@thechicartist.com>',  // replace with your domain once verified
      to: email,
      subject: 'Your E-Book Download — The Chic Artist',
      html: `
        <div style="font-family:'Georgia',serif; max-width:560px; margin:0 auto; color:#2c2c2c;">
          <h2 style="font-weight:400; font-style:italic; color:#2c2c2c;">Thank you, ${name || 'friend'} 💐</h2>
          <p>Your purchase is confirmed. Here are your download links:</p>
          ${itemsHtml}
          <hr style="border:none; border-top:1px solid #ece8e1; margin:24px 0;">
          <p style="font-size:0.85rem; color:#888;">
            If you have any trouble, contact us by visiting 
            <a href="https://thechicartist.com" style="color:#b09a82;">thechicartist.com</a>.
          </p>
          <p style="font-size:0.85rem; color:#888;">— Neetika, The Chic Artist</p>
        </div>
      `
    })
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('Resend error:', err);
  }
}

// ============================================================
//  BOOKING CONFIG — edit prices here
// ============================================================
const BOOKING_PRICES = {
  '15min': { price: 12.00, label: '15-Minute Session', duration: 15 },
  '30min': { price: 18.00, label: '30-Minute Session', duration: 30 },
};

async function sendBookingEmail(env, { email, name, slot_label, date, time, booking_id, booking_date, booking_time, duration_mins }) {
  // Build Google Calendar link
  // booking_date = 'YYYY-MM-DD', booking_time = 'HH:MM', duration_mins = 15 or 30
  function toGCalDate(dateStr, timeStr) {
    // Returns YYYYMMDDTHHmmss format (local, no timezone — GCal will use user's tz)
    return dateStr.replace(/-/g, '') + 'T' + timeStr.replace(':', '') + '00';
  }
  function addMinutes(timeStr, mins) {
    const [h, m] = timeStr.split(':').map(Number);
    const total = h * 60 + m + mins;
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  }
  const endTime = addMinutes(booking_time, duration_mins);
  const gcalStart = toGCalDate(booking_date, booking_time);
  const gcalEnd   = toGCalDate(booking_date, endTime);
  const gcalTitle = encodeURIComponent(`${slot_label} with Neetika — The Chic Artist`);
  const gcalDetails = encodeURIComponent(`Booking ID: ${booking_id}\n\nIf you need to reschedule, reply to your confirmation email.`);
  const gcalLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${gcalTitle}&dates=${gcalStart}/${gcalEnd}&details=${gcalDetails}`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Neetika <neetika@thechicartist.com>',
      to: email,
      subject: `Your booking is confirmed — ${slot_label}`,
      html: `
        <div style="font-family:'Georgia',serif; max-width:560px; margin:0 auto; color:#2c2c2c;">
          <h2 style="font-weight:400; font-style:italic; color:#2c2c2c;">You're booked! 🌸</h2>
          <p>Hi ${name || 'friend'}, here are your session details:</p>
          <p><strong>Session:</strong> ${slot_label}</p>
          <p><strong>Date:</strong> ${date}</p>
          <p><strong>Time:</strong> ${time}</p>
          <p>You will receive the zoom link for the meeting shortly.</p>
          <p style="margin-top:20px;">
            <a href="${gcalLink}" target="_blank"
               style="display:inline-block; padding:12px 24px; background:#4285F4; color:#fff;
                      text-decoration:none; border-radius:4px; font-family:Arial,sans-serif;
                      font-size:0.9rem; font-style:normal;">
              📅 Add to Google Calendar
            </a>
          </p>
          <hr style="border:none; border-top:1px solid #ece8e1; margin:24px 0;">
          <p style="font-size:0.85rem; color:#888;">Booking ID: ${booking_id}</p>
          <p style="font-size:0.85rem; color:#888;">If you need to reschedule, just reply to this email.</p>
          <p style="font-size:0.85rem; color:#888;">— Neetika, The Chic Artist</p>
        </div>
      `
    })
  });
  if (!res.ok) console.error('Resend booking email error:', await res.text());
}

// ============================================================
//  SHIPPING — only physical, digital is always free
// ============================================================
function getShipping(country, cartIsDigital) {
  if (cartIsDigital)        return 0;
  if (country === 'Canada') return 3.00;
  if (country === 'USA')    return 7.00;
  return 0;
}

// ============================================================
//  TAX — province-based for Canada (same for both types)
//  UK: no tax charged here (Stripe handles VAT separately)
// ============================================================
const TAX_RATES = {
  ON: 0.13, QC: 0.05, NS: 0.15, NB: 0.15,
  MB: 0.05, BC: 0.05, PE: 0.15, SK: 0.05,
  AB: 0.05, NL: 0.15, NT: 0.05, YT: 0.05, NU: 0.05
};
function computeTax(subtotal, shipping, country, province) {
  if (country !== 'Canada') return 0;
  return (subtotal + shipping) * (TAX_RATES[province] ?? 0.05);
}

// ============================================================
//  MAIN
// ============================================================
export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return corsResponse('', 204, env, request.headers.get('Origin'));
    }
    const url = new URL(request.url);
    if (request.method === 'POST' && url.pathname === '/create-checkout-session') {
      return handleCheckout(request, env);
    }
    if (request.method === 'POST' && url.pathname === '/validate-coupon') {
      return handleValidateCoupon(request, env);
    }
    if (request.method === 'GET' && url.pathname === '/download') {
      return handleDownload(request, env);
    }
    if (request.method === 'POST' && url.pathname === '/send-ebook-email') {
      const body = await request.json();
      await sendEbookEmail(env, body.email, body.name, body.downloads);
      return corsResponse(JSON.stringify({ ok: true }), 200, env, origin);
    }
    // ---- Booking routes ----
    if (request.method === 'GET' && url.pathname === '/booking/available-slots') {
      return handleGetAvailableSlots(request, env);
    }
    if (request.method === 'POST' && url.pathname === '/booking/create-checkout') {
      return handleBookingCheckout(request, env);
    }
    if (request.method === 'POST' && url.pathname === '/booking/confirm') {
      return handleBookingConfirm(request, env);
    }
    if (request.method === 'POST' && url.pathname === '/send-booking-email') {
      const origin = request.headers.get('Origin');
      const body = await request.json();
      await sendBookingEmail(env, body);
      return corsResponse(JSON.stringify({ ok: true }), 200, env, origin);
    }
    // ---- Review routes ----
    if (request.method === 'GET' && url.pathname === '/reviews') {
      return handleGetReviews(request, env);
    }
    if (request.method === 'POST' && url.pathname === '/reviews/submit') {
      return handleSubmitReview(request, env);
    }
    if (request.method === 'GET' && url.pathname === '/reviews/approve') {
      return handleApproveReview(request, env);
    }
    return new Response('Not found', { status: 404 });
  }
};

async function handleValidateCoupon(request, env) {
  const origin = request.headers.get('Origin');
  let body;
  try { body = await request.json(); }
  catch { return corsResponse(JSON.stringify({ error: 'Invalid JSON' }), 400, env, origin); }

  const { couponCode, subtotal, cartItems } = body;
  if (!couponCode) return corsResponse(JSON.stringify({ valid: false }), 200, env, origin);

  const coupon = COUPON_CODES[couponCode.toUpperCase()];
  if (!coupon) return corsResponse(JSON.stringify({ valid: false, reason: 'Invalid coupon code.' }), 200, env, origin);

  // Check minCart if subtotal was provided
  if (coupon.minCart && subtotal !== undefined && subtotal < coupon.minCart)
    return corsResponse(JSON.stringify({ valid: false, reason: `Minimum cart value of $${coupon.minCart.toFixed(2)} required for this code.` }), 200, env, origin);

  // Check productTypes if cartItems were provided
  if (coupon.productTypes && cartItems && cartItems.length > 0) {
    const allowed = coupon.productTypes;
    const cartMatches = cartItems.some(item => {
      if (allowed.includes('class'))    return item.id.startsWith('class');
      if (allowed.includes('ebook'))    return item.id.startsWith('ebook');
      if (allowed.includes('physical')) return !item.id.startsWith('class') && !item.id.startsWith('ebook');
      if (allowed.includes('digital'))  return item.id.startsWith('class') || item.id.startsWith('ebook');
      return false;
    });
    if (!cartMatches)
      return corsResponse(JSON.stringify({ valid: false, reason: `This code is only valid for: ${allowed.join(', ')}.` }), 200, env, origin);
  }

  // Calculate discount on eligible items only (respects productTypes restriction)
  const eligibleSubtotal = (cartItems && cartItems.length > 0)
    ? cartItems.filter(i => itemIsEligible(i.id, coupon.productTypes)).reduce((s, i) => s + (i.price || 0), 0)
    : subtotal || 0;
  const discountAmount = eligibleSubtotal > 0
    ? (coupon.type === 'percent'
        ? parseFloat((eligibleSubtotal * coupon.amount / 100).toFixed(2))
        : Math.min(coupon.amount, eligibleSubtotal))
    : 0;
  const label = coupon.type === 'percent'
    ? `${coupon.amount}% off`
    : `$${coupon.amount.toFixed(2)} off`;
  return corsResponse(JSON.stringify({ valid: true, label, discountAmount }), 200, env, origin);
}

async function handleCheckout(request, env) {
  const origin = request.headers.get('Origin');
  let body;
  try { body = await request.json(); }
  catch { return corsResponse(JSON.stringify({ error: 'Invalid JSON' }), 400, env, origin); }

  const { cart, currency, country, province, zip, email, name, couponCode } = body;

  if (!cart || cart.length === 0)
    return corsResponse(JSON.stringify({ error: 'Cart is empty' }), 400, env, origin);

  // Detect if this is a digital-only or physical-only cart
  const cartIsDigital = cart.every(i => isDigital(i.id));
  const cartIsPhysical = cart.every(i => !isDigital(i.id));

  if (!cartIsDigital && !cartIsPhysical)
    return corsResponse(JSON.stringify({ error: 'Cannot mix digital and physical products' }), 400, env, origin);

  // Country validation
  const physicalAllowed = ['Canada', 'USA'];
  const digitalAllowed  = ['Canada', 'USA', 'UK'];
  const allowed = cartIsDigital ? digitalAllowed : physicalAllowed;
  if (!allowed.includes(country))
    return corsResponse(JSON.stringify({ error: `Orders not available in ${country}`, }), 400, env, origin);
  if (country === 'Canada' && province === 'SK')
    return corsResponse(JSON.stringify({ error: 'Sorry, we do not deliver to Saskatchewan' }), 400, env, origin);

  // Force USD for digital products regardless of country
  const effectiveCurrency = cartIsDigital ? 'usd' : currency.toLowerCase();
  const verifiedCart = [];
  for (const item of cart) {
    const price = getProductPrice(item.id);
    if (price === null)
      return corsResponse(JSON.stringify({ error: `Unknown product: ${item.id}` }), 400, env, origin);
    verifiedCart.push({ ...item, price });
  }

  // Totals
  const subtotal = verifiedCart.reduce((s, i) => s + i.price, 0);

  let discount = 0, discountLabel = null;
  if (couponCode) {
    // For productType-restricted coupons, discount is calculated on eligible items only
    const couponDef = COUPON_CODES[couponCode.toUpperCase()];
    const eligibleBase = couponDef?.productTypes
      ? verifiedCart.filter(i => itemIsEligible(i.id, couponDef.productTypes)).reduce((s, i) => s + i.price, 0)
      : subtotal;
    const result = applyDiscount(eligibleBase, couponCode, verifiedCart);
    if (result.invalid)
      return corsResponse(JSON.stringify({ error: result.reason || `Invalid coupon code: ${couponCode}` }), 400, env, origin);
    discount = result.discount;
    discountLabel = result.label;
  }
  const discountedSubtotal = Math.max(0, subtotal - discount);

  const shipping = getShipping(country, cartIsDigital);
  const tax      = computeTax(discountedSubtotal, shipping, country, province);
  const total    = (discountedSubtotal + shipping + tax).toFixed(2);

  const coupon = couponCode ? COUPON_CODES[couponCode.toUpperCase()] : null;

  // Sum only the eligible items to calculate each item's proportional share
  const eligibleSubtotal = verifiedCart.reduce((s, item) =>
    itemIsEligible(item.id, coupon?.productTypes) ? s + item.price : s, 0);

  // Build line items — discount baked into eligible item prices (Stripe requires positive unit_amount)
  let discountAssigned = 0;
  const eligibleItems = verifiedCart.filter(item => itemIsEligible(item.id, coupon?.productTypes));

  const line_items = verifiedCart.map(item => {
    let unit_amount = Math.round(item.price * 100);

    if (discount > 0 && eligibleSubtotal > 0 && itemIsEligible(item.id, coupon?.productTypes)) {
      const isLastEligible = item === eligibleItems[eligibleItems.length - 1];
      const share = isLastEligible
        ? Math.round(discount * 100) - discountAssigned          // absorb rounding remainder
        : Math.round((item.price / eligibleSubtotal) * discount * 100);
      discountAssigned += share;
      unit_amount = Math.max(0, unit_amount - share);
    }

    return {
      price_data: {
        currency: effectiveCurrency,
        product_data: { name: item.name, images: item.image ? [`${env.ALLOWED_ORIGIN}/${item.image}`] : [] },
        unit_amount
      },
      quantity: 1
    };
  });

  // Discount is already baked into item unit_amounts above — no separate line needed

  if (shipping > 0) line_items.push({
    price_data: { currency: effectiveCurrency, product_data: { name: 'Shipping' }, unit_amount: Math.round(shipping * 100) },
    quantity: 1
  });

  if (tax > 0) line_items.push({
    price_data: { currency: effectiveCurrency, product_data: { name: `Tax (${province})` }, unit_amount: Math.round(tax * 100) },
    quantity: 1
  });

  // 1. Generate download tokens for any ebook items
  const ebookDownloads = [];
  if (cartIsDigital) {
    for (const item of verifiedCart) {
      if (item.id.startsWith('ebook') && EBOOK_FILES[item.id]) {
        try {
          const url = await generateDownloadToken(env, EBOOK_FILES[item.id]);
          ebookDownloads.push({ id: item.id, title: item.name, url });
        } catch (e) {
          console.error('Failed to generate token for', item.id, e);
        }
      }
    }
  }

  // 2. Build order data (includes download links for thank-you page)
  const verifiedOrderData = {
    items: verifiedCart, total, currency,
    shipping: shipping.toFixed(2), tax: tax.toFixed(2),
    province: province || '', zip: zip || '', country,
    payerEmail: email, payerName: name || '',
    cartType: cartIsDigital ? 'digital' : 'physical',
    ebookDownloads: ebookDownloads.map(d => ({ title: d.title, url: d.url }))
  };

  const encodedOrder = encodeURIComponent(JSON.stringify(verifiedOrderData));

  const formBody = buildStripeFormBody({
    mode: 'payment',
    customer_email: email,
    success_url: `${env.ALLOWED_ORIGIN}/thank-you.html?order=${encodedOrder}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.ALLOWED_ORIGIN}/cart.html`,
    line_items,
    metadata: { country, province: province || '', email, name: name || '', shipping: String(shipping), tax: tax.toFixed(2), currency, discount: discount.toFixed(2), couponCode: couponCode || '' }
  });

  // 3. Create Stripe session
  const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formBody
  });

  const session = await stripeRes.json();
  if (!stripeRes.ok) {
    console.error('Stripe error:', session);
    return corsResponse(JSON.stringify({ error: session.error?.message || 'Stripe error' }), 500, env, origin);
  }


  return corsResponse(JSON.stringify({ url: session.url }), 200, env, origin);
}

function buildStripeFormBody(obj, prefix = '') {
  const parts = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}[${key}]` : key;
    if (Array.isArray(value)) {
      value.forEach((item, i) => {
        if (typeof item === 'object' && item !== null) parts.push(buildStripeFormBody(item, `${fullKey}[${i}]`));
        else parts.push(`${encodeURIComponent(`${fullKey}[${i}]`)}=${encodeURIComponent(item)}`);
      });
    } else if (typeof value === 'object' && value !== null) {
      parts.push(buildStripeFormBody(value, fullKey));
    } else if (value !== undefined && value !== null) {
      parts.push(`${encodeURIComponent(fullKey)}=${encodeURIComponent(value)}`);
    }
  }
  return parts.join('&');
}

async function handleDownload(request, env) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  if (!token) return new Response('Missing token', { status: 400 });

  const filename = await verifyDownloadToken(env, token);
  if (!filename) return new Response('Link expired or invalid. Please contact us for a new download link.', { status: 403 });

  const object = await env.EBOOK_BUCKET.get(filename);
  if (!object) return new Response('File not found', { status: 404 });

  return new Response(object.body, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    }
  });
}

// ============================================================
//  BOOKING: GET AVAILABLE SLOTS
//  GET /booking/available-slots?date=YYYY-MM-DD&slot_type=15min|30min
// ============================================================
async function handleGetAvailableSlots(request, env) {
  const origin = request.headers.get('Origin');
  const url = new URL(request.url);
  const date = url.searchParams.get('date');
  const slotType = url.searchParams.get('slot_type') || '30min';

  if (!date) return corsResponse(JSON.stringify({ error: 'date required' }), 400, env, origin);
  if (!env.BOOKINGS_DB) return corsResponse(JSON.stringify({ error: 'BOOKINGS_DB binding missing — add D1 binding in Worker settings' }), 500, env, origin);

  const dayOfWeek = new Date(date + 'T12:00:00').getDay();

  const avail = await env.BOOKINGS_DB.prepare(
    'SELECT * FROM availability WHERE day_of_week = ? AND is_active = 1'
  ).bind(dayOfWeek).first();

  if (!avail) return corsResponse(JSON.stringify({ slots: [] }), 200, env, origin);

  const existing = await env.BOOKINGS_DB.prepare(
    "SELECT booking_time, slot_type FROM bookings WHERE booking_date = ? AND status = 'confirmed'"
  ).bind(date).all();

  // Build a set of all blocked minutes (a booking blocks its start time + its full duration)
  const blockedMinutes = new Set();
  for (const row of existing.results) {
    const [bh, bm] = row.booking_time.split(':').map(Number);
    const bookedStart = bh * 60 + bm;
    const bookedDuration = BOOKING_PRICES[row.slot_type]?.duration || 30;
    // Block every minute from start to end of that booking
    for (let m = bookedStart; m < bookedStart + bookedDuration; m++) {
      blockedMinutes.add(m);
    }
  }

  const blocked = await env.BOOKINGS_DB.prepare(
    'SELECT blocked_time FROM blocked_slots WHERE blocked_date = ?'
  ).bind(date).all();
  const blockedTimes = new Set(blocked.results.map(r => r.blocked_time));

  const duration = BOOKING_PRICES[slotType]?.duration || 30;
  const slots = [];
  let [startH, startM] = avail.start_time.split(':').map(Number);
  const [endH, endM] = avail.end_time.split(':').map(Number);
  const endMinutes = endH * 60 + endM;

  while (startH * 60 + startM + duration <= endMinutes) {
    const timeStr = `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`;
    const slotStartMinute = startH * 60 + startM;
    // Slot is unavailable if ANY minute it occupies is blocked
    let overlaps = false;
    for (let m = slotStartMinute; m < slotStartMinute + duration; m++) {
      if (blockedMinutes.has(m)) { overlaps = true; break; }
    }
    const available = !overlaps && !blockedTimes.has(timeStr);
    slots.push({ time: timeStr, available });
    startM += duration;
    if (startM >= 60) { startH += Math.floor(startM / 60); startM = startM % 60; }
  }

  return corsResponse(JSON.stringify({ slots }), 200, env, origin);
}

// ============================================================
//  BOOKING: CREATE STRIPE CHECKOUT
//  POST /booking/create-checkout
// ============================================================
async function handleBookingCheckout(request, env) {
  const origin = request.headers.get('Origin');
  let body;
  try { body = await request.json(); }
  catch { return corsResponse(JSON.stringify({ error: 'Invalid JSON' }), 400, env, origin); }

  const { slot_type, booking_date, booking_time, customer_name, customer_email, notes } = body;

  if (!slot_type || !booking_date || !booking_time || !customer_name || !customer_email)
    return corsResponse(JSON.stringify({ error: 'Missing required fields' }), 400, env, origin);

  const slotInfo = BOOKING_PRICES[slot_type];
  if (!slotInfo) return corsResponse(JSON.stringify({ error: 'Invalid slot type' }), 400, env, origin);

  const existingBooking = await env.BOOKINGS_DB.prepare(
    "SELECT id FROM bookings WHERE booking_date = ? AND booking_time = ? AND status = 'confirmed'"
  ).bind(booking_date, booking_time).first();
  if (existingBooking)
    return corsResponse(JSON.stringify({ error: 'This slot has just been booked. Please choose another time.' }), 409, env, origin);

  const bookingId = `BK-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

  await env.BOOKINGS_DB.prepare(
    'INSERT INTO bookings (id, customer_name, customer_email, slot_type, price, booking_date, booking_time, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(bookingId, customer_name, customer_email, slot_type, slotInfo.price, booking_date, booking_time, 'pending', notes || '').run();

  const formattedDate = new Date(booking_date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const stripeBody = buildStripeFormBody({
    mode: 'payment',
    customer_email: customer_email,
    success_url: `${env.ALLOWED_ORIGIN}/thank-you.html?booking_id=${bookingId}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.ALLOWED_ORIGIN}/schedule.html`,
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: { name: slotInfo.label, description: `${formattedDate} at ${booking_time}` },
        unit_amount: Math.round(slotInfo.price * 100)
      },
      quantity: 1
    }],
    metadata: { booking_id: bookingId, type: 'booking' }
  });

  const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: stripeBody
  });

  const session = await stripeRes.json();
  if (!stripeRes.ok) {
    await env.BOOKINGS_DB.prepare('DELETE FROM bookings WHERE id = ?').bind(bookingId).run();
    return corsResponse(JSON.stringify({ error: session.error?.message || 'Payment error' }), 500, env, origin);
  }

  await env.BOOKINGS_DB.prepare('UPDATE bookings SET stripe_session_id = ? WHERE id = ?').bind(session.id, bookingId).run();

  return corsResponse(JSON.stringify({ url: session.url }), 200, env, origin);
}

// ============================================================
//  BOOKING: CONFIRM AFTER PAYMENT
//  POST /booking/confirm  { booking_id, session_id }
// ============================================================
async function handleBookingConfirm(request, env) {
  const origin = request.headers.get('Origin');
  let body;
  try { body = await request.json(); }
  catch { return corsResponse(JSON.stringify({ error: 'Invalid JSON' }), 400, env, origin); }

  const { booking_id, session_id } = body;
  if (!booking_id || !session_id)
    return corsResponse(JSON.stringify({ error: 'Missing booking_id or session_id' }), 400, env, origin);

  const stripeRes = await fetch(`https://api.stripe.com/v1/checkout/sessions/${session_id}`, {
    headers: { 'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}` }
  });
  const session = await stripeRes.json();

  if (!stripeRes.ok || session.payment_status !== 'paid')
    return corsResponse(JSON.stringify({ error: 'Payment not completed' }), 400, env, origin);

  await env.BOOKINGS_DB.prepare(
    "UPDATE bookings SET status = 'confirmed' WHERE id = ? AND stripe_session_id = ?"
  ).bind(booking_id, session_id).run();

  const booking = await env.BOOKINGS_DB.prepare('SELECT * FROM bookings WHERE id = ?').bind(booking_id).first();

  // Notify Neetika
  if (booking && env.RESEND_API_KEY) {
    const formattedDate = new Date(booking.booking_date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Bookings <neetika@thechicartist.com>',
        to: 'thechicartiststudio@gmail.com',
        subject: `New booking: ${BOOKING_PRICES[booking.slot_type]?.label} on ${formattedDate}`,
        html: `
          <div style="font-family:'Georgia',serif; max-width:560px; margin:0 auto; color:#2c2c2c;">
            <h2 style="font-weight:400;">New Booking 📅</h2>
            <p><strong>Customer:</strong> ${booking.customer_name} (${booking.customer_email})</p>
            <p><strong>Session:</strong> ${BOOKING_PRICES[booking.slot_type]?.label}</p>
            <p><strong>Date:</strong> ${formattedDate}</p>
            <p><strong>Time:</strong> ${booking.booking_time}</p>
            <p><strong>Booking ID:</strong> <code>${booking.id}</code></p>
          </div>
        `
      })
    }).catch(e => console.error('Neetika notification error:', e));
  }

  return corsResponse(JSON.stringify({ ok: true, booking }), 200, env, origin);
}

// ============================================================
//  REVIEWS: GET approved reviews for a product
//  GET /reviews?product_id=bookmark1
// ============================================================
async function handleGetReviews(request, env) {
  const origin = request.headers.get('Origin');
  const url = new URL(request.url);
  const product_id = url.searchParams.get('product_id');

  let result;
  if (product_id) {
    result = await env.REVIEWS_DB.prepare(
      "SELECT id, reviewer_name, rating, comment, product_id, created_at FROM reviews WHERE product_id = ? AND approved = 1 ORDER BY created_at DESC"
    ).bind(product_id).all();
  } else {
    result = await env.REVIEWS_DB.prepare(
      "SELECT id, reviewer_name, rating, comment, product_id, created_at FROM reviews WHERE approved = 1 ORDER BY created_at DESC"
    ).all();
  }

  return corsResponse(JSON.stringify({ reviews: result.results }), 200, env, origin);
}

// ============================================================
//  REVIEWS: Submit a new review (pending approval)
//  POST /reviews/submit { product_id, reviewer_name, rating, comment }
// ============================================================
async function handleSubmitReview(request, env) {
  const origin = request.headers.get('Origin');
  let body;
  try { body = await request.json(); }
  catch { return corsResponse(JSON.stringify({ error: 'Invalid JSON' }), 400, env, origin); }

  const { product_id, reviewer_name, rating, comment } = body;
  if (!product_id || !reviewer_name || !rating)
    return corsResponse(JSON.stringify({ error: 'Missing required fields' }), 400, env, origin);
  if (rating < 1 || rating > 5)
    return corsResponse(JSON.stringify({ error: 'Rating must be 1–5' }), 400, env, origin);

  const id = `RV-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

  await env.REVIEWS_DB.prepare(
    'INSERT INTO reviews (id, product_id, reviewer_name, rating, comment) VALUES (?, ?, ?, ?, ?)'
  ).bind(id, product_id, reviewer_name.trim(), parseInt(rating), (comment || '').trim()).run();

  // Notify Neetika with one-click approval link
  if (env.RESEND_API_KEY && env.REVIEW_SECRET) {
    const approveUrl = `https://stripe-worker.thechicartiststudio.workers.dev/reviews/approve?id=${id}&key=${env.REVIEW_SECRET}`;
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Reviews <neetika@thechicartist.com>',
        to: 'thechicartiststudio@gmail.com',
        subject: `New review pending approval — ${product_id}`,
        html: `
          <div style="font-family:'Georgia',serif; max-width:560px; margin:0 auto; color:#2c2c2c;">
            <h2 style="font-weight:400;">New Review ⭐</h2>
            <p><strong>Product:</strong> ${product_id}</p>
            <p><strong>From:</strong> ${reviewer_name}</p>
            <p><strong>Rating:</strong> ${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}</p>
            <p><strong>Comment:</strong> ${comment || '(no comment)'}</p>
            <hr style="border:none; border-top:1px solid #ece8e1; margin:24px 0;">
            <a href="${approveUrl}" style="display:inline-block; padding:12px 24px; background:#4a7c59; color:#fff; text-decoration:none; border-radius:4px; font-family:Arial,sans-serif;">
              ✓ Approve this review
            </a>
            <p style="font-size:0.8rem; color:#999; margin-top:16px;">If you don't approve it, it simply won't show on the site.</p>
          </div>
        `
      })
    }).catch(e => console.error('Review notification error:', e));
  }

  return corsResponse(JSON.stringify({ ok: true }), 200, env, origin);
}

// ============================================================
//  REVIEWS: Approve a review via secret link
//  GET /reviews/approve?id=RV-xxx&key=YOUR_SECRET
// ============================================================
async function handleApproveReview(request, env) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  const key = url.searchParams.get('key');

  if (!key || key !== env.REVIEW_SECRET)
    return new Response('Unauthorized', { status: 401 });
  if (!id)
    return new Response('Missing id', { status: 400 });

  await env.REVIEWS_DB.prepare(
    "UPDATE reviews SET approved = 1 WHERE id = ?"
  ).bind(id).run();

  return new Response(`
    <html><body style="font-family:Georgia,serif; text-align:center; padding:60px; color:#2c2c2c;">
      <h2>✓ Review approved!</h2>
      <p>The review is now live on the product page.</p>
    </body></html>
  `, { status: 200, headers: { 'Content-Type': 'text/html' } });
}

function corsResponse(body, status, env, requestOrigin) {
  const allowedOrigins = [env?.ALLOWED_ORIGIN, 'http://127.0.0.1:5500', 'http://localhost:5500', 'http://127.0.0.1:3000', 'http://localhost:3000'].filter(Boolean);
  const origin = allowedOrigins.includes(requestOrigin) ? requestOrigin : (env?.ALLOWED_ORIGIN || '*');
  return new Response(body, {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' }
  });
}