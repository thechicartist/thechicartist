# ScreenPace website

Portable static pages prepared for `https://thechicartist.com/ScreenPace/`.
They require no build system, database, analytics, cookies, or external fonts.

## Pages

- `index.html` — promotional and pricing page
- `privacy.html` — public privacy policy for App Store Connect
- `support.html` — public support URL and product FAQ
- `terms.html` — terms and purchase expectations
- `404.html` — optional not-found page

## Before upload

1. Open `site-config.js`.
2. Set `appStoreURL` after the App Store listing exists.
3. Confirm `price`, `priceLabel`, and `supportEmail`.
4. Upload the complete contents of this folder to `/ScreenPace/` on
   `thechicartist.com`; keep the `assets` folder beside the HTML files.
5. Confirm these public URLs work:
   - `https://thechicartist.com/ScreenPace/`
   - `https://thechicartist.com/ScreenPace/privacy.html`
   - `https://thechicartist.com/ScreenPace/support.html`
   - `https://thechicartist.com/ScreenPace/terms.html`
6. Enter the privacy and support URLs in App Store Connect.

The iOS app already links to these exact privacy and support URLs. Upload the
pages before distributing the app through TestFlight or the App Store so those
links are live for testers and App Review.

The current `$1.99` text is presented as a one-time launch price. The legal
terms deliberately say “one-time purchase,” not “available forever,” because
future operating-system compatibility and App Store availability cannot be
guaranteed.
