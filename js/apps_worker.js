const ORIGIN = "https://thechicartist.com";

const LOGO = ORIGIN + "/images/the_Chic_Artist_logo_nocolor.png";
const FAVICON = ORIGIN + "/images/favicon.png";
const SCREENPACE_ICON = ORIGIN + "/ScreenPace/assets/screenpace-icon.png";
const VOXCUE_ICON = ORIGIN + "/VoxCue/images/VoxCue.png";

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Sitemap
    if (path === "/sitemap.xml") {
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <url>
        <loc>https://apps.thechicartist.com/</loc>
      </url>
      <url>
        <loc>https://apps.thechicartist.com/ScreenPace/</loc>
      </url>
      <url>
        <loc>https://apps.thechicartist.com/VoxCue/</loc>
      </url>
      <url>
        <loc>https://apps.thechicartist.com/ScreenPace/privacy</loc>
      </url>
      <url>
        <loc>https://apps.thechicartist.com/ScreenPace/support</loc>
      </url>
      <url>
        <loc>https://apps.thechicartist.com/ScreenPace/terms</loc>
      </url>
      <url>
        <loc>https://apps.thechicartist.com/ScreenPace/scrolling-fun-or-addiction</loc>
      </url>
      <url>
        <loc>https://apps.thechicartist.com/VoxCue/privacy</loc>
      </url>
      <url>
        <loc>https://apps.thechicartist.com/VoxCue/support</loc>
      </url>
      <url>
        <loc>https://apps.thechicartist.com/VoxCue/terms</loc>
      </url>
      <url>
        <loc>https://apps.thechicartist.com/VoxCue/creator-tips</loc>
      </url>
      <url>
        <loc>https://apps.thechicartist.com/VoxCue/creator-tips/how-to-use-a-teleprompter</loc>
      </url>
    </urlset>`;

      return new Response(sitemap, {
        headers: {
          "content-type": "application/xml; charset=UTF-8",
          "cache-control": "public, max-age=3600"
        }
      });
    }

    // Robots.txt
    if (path === "/robots.txt") {
      const robots = `User-agent: *
    Allow: /

    Sitemap: https://apps.thechicartist.com/sitemap.xml`;

      return new Response(robots, {
        headers: {
          "content-type": "text/plain; charset=UTF-8",
          "cache-control": "public, max-age=3600"
        }
      });
    }

    // Homepage
    if (path === "/" || path === "/index.html") {
      return new Response(HOME_PAGE, {
        headers: {
          "content-type": "text/html; charset=UTF-8",
          "cache-control": "public, max-age=300",
        },
      });
    }

    // Favicon
    if (path === "/favicon.ico") {
      return Response.redirect(FAVICON, 302);
    }

    // Proxy ScreenPace and VoxCue through this subdomain.
    let originPath;

    if (path.startsWith("/ScreenPace/") || path === "/ScreenPace") {
      originPath = path;
    } else if (path.startsWith("/VoxCue/") || path === "/VoxCue") {
      originPath = path;
    } else {
      return new Response("Page not found", { status: 404 });
    }

    // Preserve query strings.
    const originURL = new URL(originPath, ORIGIN);
    originURL.search = url.search;

    // Forward the original request method and relevant headers.
    const headers = new Headers(request.headers);
    headers.set("Host", new URL(ORIGIN).host);
    headers.delete("cookie");

    const originRequest = new Request(originURL.toString(), {
      method: request.method,
      headers,
      body:
        request.method !== "GET" && request.method !== "HEAD"
          ? request.body
          : undefined,
      redirect: "manual",
    });

    let response;

    try {
      response = await fetch(originRequest);
    } catch (error) {
      return new Response("Unable to load the requested app page.", {
        status: 502,
      });
    }

    // Keep redirects on the apps subdomain when they point to our app pages.
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("Location");

      if (location) {
        const redirected = new URL(location, originURL);

        if (redirected.hostname === "thechicartist.com") {
          if (
            redirected.pathname.startsWith("/ScreenPace/") ||
            redirected.pathname === "/ScreenPace"
          ) {
            redirected.hostname = url.hostname;
          } else if (
            redirected.pathname.startsWith("/VoxCue/") ||
            redirected.pathname === "/VoxCue"
          ) {
            redirected.hostname = url.hostname;
          }

          const responseHeaders = new Headers(response.headers);
          responseHeaders.set("Location", redirected.toString());

          return new Response(null, {
            status: response.status,
            headers: responseHeaders,
          });
        }
      }

      return response;
    }

    const contentType = response.headers.get("content-type") || "";

    // Rewrite links in HTML so app navigation stays on this subdomain.
    if (contentType.includes("text/html")) {
      return new HTMLRewriter()
        .on("a[href]", {
          element(element) {
            rewriteAttribute(element, "href", url.hostname);
          },
        })
        .on("link[href]", {
          element(element) {
            rewriteAttribute(element, "href", url.hostname);
          },
        })
        .on("script[src]", {
          element(element) {
            rewriteAttribute(element, "src", url.hostname);
          },
        })
        .on("img[src]", {
          element(element) {
            rewriteAttribute(element, "src", url.hostname);
          },
        })
        .on("source[src]", {
          element(element) {
            rewriteAttribute(element, "src", url.hostname);
          },
        })
        .on("form[action]", {
          element(element) {
            rewriteAttribute(element, "action", url.hostname);
          },
        })
        .transform(response);
    }

    // Pass images, CSS, JavaScript, fonts and other assets through unchanged.
    return response;
  },
};

function rewriteAttribute(element, attribute, hostname) {
  const value = element.getAttribute(attribute);
  if (!value) return;

  try {
    const target = new URL(value, "https://" + hostname);

    if (target.hostname !== "thechicartist.com") return;

    if (
      target.pathname.startsWith("/ScreenPace/") ||
      target.pathname === "/ScreenPace"
    ) {
      target.hostname = hostname;
      element.setAttribute(attribute, target.pathname + target.search + target.hash);
      return;
    }

    if (
      target.pathname.startsWith("/VoxCue/") ||
      target.pathname === "/VoxCue"
    ) {
      target.hostname = hostname;
      element.setAttribute(attribute, target.pathname + target.search + target.hash);
    }
  } catch (error) {
    // Leave invalid or non-URL attribute values unchanged.
  }
}

const HOME_PAGE = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#0b0c0e">

  <title>ScreenPace & VoxCue | Apps by The Chic Artist</title>

  <link rel="canonical" href="https://apps.thechicartist.com/">
  
  <meta name="description" content="Discover ScreenPace, for more mindful screen time, and VoxCue, a voice-activated teleprompter for natural recording. Thoughtful apps by The Chic Artist.">

  <link rel="icon" type="image/png" href="${FAVICON}">

  <style>
    :root {
      color-scheme: dark;
      --bg: #0b0c0e;
      --surface: #14161a;
      --text: #f2f0ea;
      --muted: #a4a7ae;
      --dim: #777c86;
      --accent: #ffb648;
      --accent-soft: rgba(255,182,72,.11);
      --border: rgba(255,255,255,.1);
      --max: 1080px;
    }

    * { box-sizing: border-box; }

    html { scroll-behavior: smooth; }

    body {
      margin: 0;
      background:
        radial-gradient(ellipse at 80% 0%, rgba(255,182,72,.075), transparent 36rem),
        var(--bg);
      color: var(--text);
      font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.65;
      -webkit-font-smoothing: antialiased;
    }

    a { color: inherit; text-decoration: none; }

    a:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 4px;
    }

    .wrap {
      width: min(var(--max), calc(100% - 48px));
      margin: 0 auto;
    }

    .nav { border-bottom: 1px solid var(--border); }

    .nav-inner {
      min-height: 100px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 24px;
    }

    .app-card.clickable-card {
      cursor: pointer;
    }

    .app-card.clickable-card:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 4px;
    }
      
    .brand {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: flex-start;
      gap: 12px;
      flex-shrink: 0;
      white-space: nowrap;
      text-decoration: none;
    }

    .brand img {
      display: block;
      width: 80px;
      max-width: none;
      height: auto;
      flex-shrink: 0;
    }

    .brand-name {
      display: inline-block;
      white-space: nowrap;
      font-size: 23px;
      font-weight: 650;
      letter-spacing: -0.04em;
      color: var(--text);
      flex-shrink: 0;
    }

    .nav-note {
      color: var(--muted);
      font-size: 13px;
    }

    .hero {
      padding: 100px 0 70px;
      text-align: center;
    }

    .eyebrow {
      color: var(--accent);
      text-transform: uppercase;
      letter-spacing: .16em;
      font-size: 11px;
      font-weight: 650;
      margin: 0 0 22px;
    }

    h1 {
      max-width: 850px;
      margin: 0 auto 24px;
      font-size: clamp(42px, 7vw, 76px);
      line-height: 1.04;
      letter-spacing: -.065em;
      font-weight: 620;
    }

    .gold { color: var(--accent); }

    .hero-copy {
      max-width: 650px;
      margin: 0 auto;
      color: var(--muted);
      font-size: clamp(17px, 2vw, 20px);
    }

    .hero-note {
      display: inline-flex;
      gap: 9px;
      margin-top: 28px;
      padding: 9px 14px;
      border: 1px solid var(--border);
      border-radius: 100px;
      color: #c6c8cc;
      font-size: 12px;
    }

    .hero-note span { color: var(--accent); }

    .section { padding: 45px 0 85px; }

    .section-head {
      max-width: 650px;
      margin: 0 auto 38px;
      text-align: center;
    }

    .section-head h2 {
      margin: 0 0 12px;
      font-size: clamp(29px, 4vw, 42px);
      line-height: 1.13;
      letter-spacing: -.04em;
    }

    .section-head p {
      margin: 0;
      color: var(--muted);
    }

    .apps {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 20px;
    }

    .app-card {
      display: flex;
      flex-direction: column;
      padding: 32px;
      border: 1px solid rgba(255,255,255,.15);
      border-radius: 22px;
      background: linear-gradient(145deg, rgba(255,255,255,.035), transparent 58%), var(--surface);
      transition: transform .2s ease, border-color .2s ease;
    }

    .app-card:hover {
      transform: translateY(-4px);
      border-color: rgba(255,182,72,.45);
    }

    .app-top {
      display: flex;
      align-items: center;
      gap: 15px;
      margin-bottom: 25px;
    }

    .app-icon {
      width: 66px;
      height: 66px;
      flex: 0 0 auto;
      object-fit: cover;
      border-radius: 17px;
      background: #171717;
    }

    .app-kicker {
      margin: 0 0 2px;
      color: var(--dim);
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: .13em;
    }

    .app-name {
      margin: 0;
      font-size: 25px;
      letter-spacing: -.04em;
    }

    .app-card h3 {
      margin: 0 0 12px;
      font-size: clamp(22px, 3vw, 29px);
      line-height: 1.2;
      letter-spacing: -.04em;
    }

    .app-description {
      color: var(--muted);
      margin: 0 0 22px;
    }

    .pills {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin: 0 0 28px;
    }

    .pill {
      border: 1px solid var(--border);
      border-radius: 100px;
      padding: 5px 10px;
      color: #c7c9ce;
      font-size: 11px;
    }

    .card-link {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 18px;
      width: 100%;
      margin-top: auto;
      padding: 13px 16px;
      border: 1px solid rgba(255,255,255,.16);
      border-radius: 12px;
      font-weight: 600;
      font-size: 14px;
    }

    .card-link:hover { background: var(--accent-soft); }

    .arrow {
      color: var(--accent);
      font-size: 20px;
    }

    .vision {
      border-top: 1px solid var(--border);
      border-bottom: 1px solid var(--border);
      background: rgba(255,255,255,.018);
    }

    .vision-inner {
      display: grid;
      grid-template-columns: .8fr 1.2fr;
      gap: 65px;
      align-items: start;
      padding-top: 70px;
      padding-bottom: 70px;
    }

    .vision h2 {
      margin: 0;
      font-size: clamp(30px, 4vw, 43px);
      line-height: 1.12;
      letter-spacing: -.045em;
    }

    .vision-copy p {
      margin: 0 0 16px;
      color: var(--muted);
    }

    .principles {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 14px;
      margin-top: 26px;
    }

    .principle {
      border-top: 1px solid rgba(255,255,255,.16);
      padding-top: 14px;
    }

    .principle strong {
      display: block;
      margin-bottom: 4px;
      font-size: 14px;
    }

    .principle span {
      display: block;
      color: var(--dim);
      font-size: 12px;
      line-height: 1.5;
    }

    .closing {
      text-align: center;
      padding: 76px 0 82px;
    }

    .closing h2 {
      margin: 0 0 12px;
      font-size: clamp(28px, 4vw, 40px);
      letter-spacing: -.045em;
    }

    .closing p {
      max-width: 540px;
      margin: 0 auto;
      color: var(--muted);
    }

    footer { border-top: 1px solid var(--border); }

    .footer-inner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 20px;
      min-height: 92px;
      color: var(--dim);
      font-size: 12px;
    }

    .footer-brand {
      color: var(--text);
      font-weight: 600;
    }

    .footer-links {
      display: flex;
      gap: 20px;
      flex-wrap: wrap;
    }

    .footer-links a:hover { color: var(--accent); }

    @media (max-width: 760px) {
      .nav-inner { min-height: 82px; }
      .brand img {
        width: 65px;
        max-width: none;
      }

      .brand-name {
        font-size: 18px;
      }
      .nav-note { display: none; }
      .hero { padding: 70px 0 55px; }
      .apps { grid-template-columns: 1fr; }
      .app-card { padding: 26px; }
      .vision-inner {
        grid-template-columns: 1fr;
        gap: 24px;
        padding-top: 54px;
        padding-bottom: 54px;
      }
      .principles { grid-template-columns: 1fr; gap: 18px; }
      .footer-inner {
        align-items: flex-start;
        flex-direction: column;
        justify-content: center;
        padding: 24px 0;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      html { scroll-behavior: auto; }
      *, *::before, *::after { transition: none !important; }
    }
  </style>
</head>

<body>
  <header class="nav">
    <div class="wrap nav-inner">
      <a class="brand" href="/" aria-label="The Chic Artist Apps home">
        <img src="${LOGO}" alt="">
        <span class="brand-name">The Chic Artist</span>
      </a>
      <span class="nav-note">A small collection of thoughtful apps</span>
    </div>
  </header>

  <main>
    <section class="hero wrap">
      <p class="eyebrow">Made with care by The Chic Artist</p>
      <h1>Useful little tools.<br><span class="gold">More room for what matters.</span></h1>
      <p class="hero-copy">The Chic Artist began with creativity and the joy of making things. That same spirit now extends to apps: thoughtfully designed tools that make everyday digital life feel a little more intentional, focused, and human.</p>
      <div class="hero-note"><span>✦</span> Simple by design. Private by default. Made for real life.</div>
    </section>

    <section class="section wrap" aria-labelledby="apps-title">
      <div class="section-head">
        <p class="eyebrow">Explore the apps</p>
        <h2 id="apps-title">A little help with <span class="gold">how you live and create.</span></h2>
        <p>Two different needs, one shared idea: technology should support you—not get in your way.</p>
      </div>

      <div class="apps">
        <article class="app-card clickable-card" data-href="/ScreenPace/" tabindex="0" role="link" aria-label="Explore ScreenPace">
          <div class="app-top">
            <img class="app-icon" src="${SCREENPACE_ICON}" alt="ScreenPace app icon">
            <div>
              <p class="app-kicker">For a healthier digital rhythm</p>
              <h3 class="app-name">ScreenPace</h3>
            </div>
          </div>

          <h3>Take a break. Not the whole day.</h3>
          <p class="app-description">Build a more mindful relationship with distracting apps. ScreenPace gives you small, hourly allowances that reset—so one unplanned scroll doesn’t have to take over your day.</p>

          <div class="pills">
            <span class="pill">Hourly app limits</span>
            <span class="pill">Focus Hours</span>
            <span class="pill">Private on-device insights</span>
            <span class="pill">No subscription</span>
          </div>

          <a class="card-link" href="/ScreenPace/">Explore ScreenPace <span class="arrow">↗</span></a>
        </article>

        <article class="app-card clickable-card" data-href="/VoxCue/" tabindex="0" role="link" aria-label="Explore VoxCue">
          <div class="app-top">
            <img class="app-icon" src="${VOXCUE_ICON}" alt="VoxCue app icon">
            <div>
              <p class="app-kicker">For more natural recording</p>
              <h3 class="app-name">VoxCue</h3>
            </div>
          </div>

          <h3>Speak naturally. Your script keeps up.</h3>
          <p class="app-description">Record without constantly checking your notes. VoxCue scrolls your script as you speak, helping you stay present, hands-free, and connected to the camera.</p>

          <div class="pills">
            <span class="pill">Voice-activated scrolling</span>
            <span class="pill">Hands-free recording</span>
            <span class="pill">On-device privacy</span>
            <span class="pill">No subscription</span>
          </div>

          <a class="card-link" href="/VoxCue/">Explore VoxCue <span class="arrow">↗</span></a>
        </article>
      </div>
    </section>

    <section class="vision">
      <div class="wrap vision-inner">
        <div>
          <p class="eyebrow">The thinking behind the apps</p>
          <h2>Technology should make space for <span class="gold">being human.</span></h2>
        </div>

        <div class="vision-copy">
          <p>At The Chic Artist, making has always been about bringing a little more beauty, clarity, and intention into everyday life. These apps are an extension of that philosophy—practical tools shaped around real people and the moments they want to protect.</p>

          <p>That means keeping things focused, avoiding unnecessary complexity, and treating privacy as a feature rather than an afterthought. Whether you’re trying to spend less time scrolling or feel more natural in front of a camera, the goal is the same: help technology work for you, so you can get back to what matters.</p>

          <div class="principles">
            <div class="principle">
              <strong>Thoughtful, not bloated</strong>
              <span>Useful features without needless clutter.</span>
            </div>
            <div class="principle">
              <strong>Private by design</strong>
              <span>Your personal activity stays on your device in both apps.</span>
            </div>
            <div class="principle">
              <strong>Made for real life</strong>
              <span>Flexible tools that support your own rhythm.</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="closing wrap">
      <p class="eyebrow">A work in progress, made with intention</p>
      <h2>Thanks for being here.</h2>
      <p>Explore the apps, find the one that fits your day, and make a little more room for what matters to you.</p>
    </section>
  </main>

  <footer>
    <div class="wrap footer-inner">
      <div>
        <a class="footer-brand" href="https://thechicartist.com/">The Chic Artist</a>
        <span> · © <span id="year">2026</span></span>
      </div>

      <nav class="footer-links" aria-label="Footer">
        <a href="/ScreenPace/">ScreenPace</a>
        <a href="/VoxCue/">VoxCue</a>
        <a href="https://thechicartist.com/">Main website</a>
      </nav>
    </div>
  </footer>

  <script>
    document.getElementById("year").textContent = new Date().getFullYear();

    document.querySelectorAll(".clickable-card").forEach((card) => {
      card.addEventListener("click", (event) => {
        // Let the existing Explore link handle its own clicks.
        if (event.target.closest("a")) return;

        window.location.href = card.dataset.href;
      });

      card.addEventListener("keydown", (event) => {
        if (event.target !== card) return;

        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          window.location.href = card.dataset.href;
        }
      });
    });
  </script>
</body>
</html>`;
