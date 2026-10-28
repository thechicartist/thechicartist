The Chic Artist — U.S. Section 338 checkout update

Files to deploy
---------------
1. worker.js  -> deploy to the existing Cloudflare Worker.
2. cart.js    -> replace the website's js/cart.js.
3. cart.html  -> replace the website's cart.html.

No change is required to product.html or products.js for this update. The existing product page labels selected formats as '(Painting)' or '(Greeting Card)', and cart.js also carries the selected format to the Worker.

Behavior implemented
--------------------
- U.S. physical carts request a server-side estimate from POST /estimate-customs-duty.
- The cart shows the estimate and keeps the Stripe button hidden until an estimate succeeds.
- Checkout recomputes the duty server-side and adds it as a separate Stripe line item where non-zero.
- The Worker verifies each product price from its own product-price function; it does not use browser-supplied prices for the duty calculation.
- The checkout order payload and the Worker order-confirmation email support a customsDuty field.
- Coupon discounts are reflected in the customs-value estimate.
- The frontend contains no tariff rate table. Change the rates only in SECTION_338_DUTY_RATE_BY_HTS near the top of worker.js, then redeploy the Worker.

Current configured Section 338 estimate table
--------------------------------------------
9701.91.00 / 9701910000 (original painting): 50%
4823.90.86 / 4823908680 (paper bookmark): 50%
4909.00.40 / 4909004000 (greeting card): 0% Section 338 additional duty

Important limitations
---------------------
- This calculates the Section 338 additional-duty estimate only. It does not calculate carrier/broker processing fees or every possible import charge.
- Rates are centralized but not automatically fetched live from CBP. If CBP changes its measure or the product classification is revised, update the single rate table in worker.js and redeploy it.
- Classification choices are the working codes selected for this implementation; this code is not a binding customs determination.

Deployment order
----------------
1. Deploy worker.js first so /estimate-customs-duty exists.
2. Upload cart.js and cart.html to the static website.
3. Test a U.S. order with an original painting, a greeting card, and a bookmark before making live sales.
