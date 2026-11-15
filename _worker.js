/**
 * Cloudflare Pages advanced-mode Worker.
 *
 * Pages sends every request here. Non-product requests are passed directly to
 * the existing static-asset service, preserving the current site behaviour.
 * Product requests receive SEO metadata in the initial HTML response.
 */

const CANONICAL_ORIGIN = 'https://www.thechicartist.com';
const PRODUCT_PATHS = new Set(['/product', '/product.html']);

let catalogSourcePromise;

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function plainDescription(product) {
  const source = product.descriptionHtml || product.details || '';
  const text = source.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return `${product.name}. ${text}`.slice(0, 155);
}

function canonicalUrl(id) {
  return `${CANONICAL_ORIGIN}/product?id=${encodeURIComponent(id)}`;
}

function metadataFor(product) {
  const title = `${product.name} | The Chic Artist`;
  const description = plainDescription(product);
  const canonical = canonicalUrl(product.id);
  const images = product.images.map((image) => new URL(image, `${CANONICAL_ORIGIN}/`).href);
  const schema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description,
    image: images,
    sku: product.id,
    brand: { '@type': 'Brand', name: 'The Chic Artist' },
    offers: {
      '@type': 'Offer',
      url: canonical,
      priceCurrency: 'USD',
      price: String(product.price),
      availability: product.soldOut
        ? 'https://schema.org/SoldOut'
        : 'https://schema.org/InStock'
    }
  }).replace(/</g, '\\u003c');

  return {
    title,
    head: `
      <meta name="description" content="${escapeHtml(description)}">
      <link rel="canonical" href="${escapeHtml(canonical)}">
      <meta property="og:type" content="product">
      <meta property="og:title" content="${escapeHtml(title)}">
      <meta property="og:description" content="${escapeHtml(description)}">
      <meta property="og:url" content="${escapeHtml(canonical)}">
      <meta property="og:image" content="${escapeHtml(images[0])}">
      <meta name="twitter:card" content="summary_large_image">
      <meta name="twitter:title" content="${escapeHtml(title)}">
      <meta name="twitter:description" content="${escapeHtml(description)}">
      <meta name="twitter:image" content="${escapeHtml(images[0])}">
      <script type="application/ld+json" data-product-schema>${schema}</script>`
  };
}


function productBodyHtml(product) {
  const image = new URL(product.images[0], `${CANONICAL_ORIGIN}/`).href;
  const description = product.descriptionHtml ||
    `<p>${escapeHtml(product.details || '')}</p>`;

  const price = Number(product.price).toFixed(2);
  const category = product.id.startsWith('ebook-')
    ? 'E-Book'
    : product.id.startsWith('class-')
      ? 'Online Class'
      : product.id.startsWith('painting')
        ? 'Original Painting'
        : 'Watercolor Bookmark';

  const productType = ['ebook', 'class'].some(type =>
    product.id.startsWith(`${type}-`)
  ) ? 'digital' : 'physical';

  const cartButton = product.soldOut
    ? `<button class="btn-add-cart sold-out" disabled>Sold Out</button>`
    : `<button
        class="btn-add-cart add-to-cart"
        data-id="${escapeHtml(product.id)}"
        data-name="${escapeHtml(product.name)}"
        data-price="${price}"
        data-image="${escapeHtml(product.images[0])}"
        data-type="${productType}"
      >Add to Cart</button>`;

  return `
    <div class="product-detail">
      <div class="slider-column">
        <div class="slider-wrapper">
          <div class="slider-track">
            <div class="slider-slide">
              <img
                src="${escapeHtml(image)}"
                alt="${escapeHtml(product.name)}"
                class="slider-img"
              >
            </div>
          </div>
        </div>
      </div>

      <div class="product-info">
        <p class="product-category-tag">${category}</p>
        <h1>${escapeHtml(product.name)}</h1>
        <p class="product-price-tag">$${price}</p>
        ${cartButton}
        <div class="product-description">
          ${description}
        </div>
      </div>
    </div>
  `;
}


function invalidMetadata() {
  return {
    title: 'Product Not Found | The Chic Artist',
    head: '<meta name="robots" content="noindex,follow">'
  };
}

async function catalogSource(env) {
  if (!catalogSourcePromise) {
    const request = new Request('https://assets.local/js/products.js');
    catalogSourcePromise = env.ASSETS.fetch(request).then(async (response) => {
      if (!response.ok) throw new Error(`Catalog request failed: ${response.status}`);
      return response.text();
    });
  }
  return catalogSourcePromise;
}

function namesFromCatalog(source, constantName) {
  const start = source.indexOf(`const ${constantName} = {`);
  const end = source.indexOf('\n};', start);
  if (start === -1 || end === -1) throw new Error(`Missing ${constantName} catalog`);

  const names = new Map();
  const entries = source.slice(start, end).matchAll(/^\s*(\d+):\s*(['"])(.*?)\2,?\s*$/gm);
  for (const [, id, , name] of entries) names.set(Number(id), name);
  return names;
}

function bookmarkProduct(id, names) {
  const number = Number(id.slice('bookmark'.length));
  if (!Number.isInteger(number) || id !== `bookmark${number}` || number < 1 || number > 139) return null;
  const name = names.get(number);
  if (!name) throw new Error(`Missing bookmark${number} name`);

  return {
    id,
    name,
    price: number === 115 ? 39.99 : (number === 124 || number === 126 || number === 137) ? 25.99 : 11.99,
    images: [`images/bookmarks/b${number}.jpeg`],
    details: number === 137
      ? 'A pair of original hand-painted watercolor bookmarks inspired by the beloved Bridgerton series.'
      : 'Each bookmark is hand-painted with watercolors, making every piece truly one of a kind.',
    soldOut: [8, 65, 82].includes(number)
  };
}

function paintingProduct(id, names) {
  const number = Number(id.slice('painting'.length));
  if (!Number.isInteger(number) || id !== `painting${number}` || number < 1 || number > 26) return null;
  const name = names.get(number);
  if (!name) throw new Error(`Missing painting${number} name`);

  return {
    id,
    name,
    price: number === 2 || number === 16 ? 39.99 : 24.99,
    images: [`images/paintings/c${number}.jpeg`],
    details: number === 2
      ? "A beautiful Floral Mother's Day greeting card, hand-painted with watercolors. Size: 5 × 7 inches. All Greeting cards come with a blank interior and a white envelope."
      : `${name} is an original hand-painted watercolor, available as an unframed painting or as a greeting card.`,
    soldOut: false
  };
}

const OTHER_PRODUCTS = {
  'class-cherry-blossom': {
    name: 'Watercolor Cherry Blossom Bookmark Workshop',
    price: 30.00,
    images: ['images/onlineclass/o3.jpeg'],
    details: "Join me for a cozy, creative watercolor session, where we'll paint Cherry Blossom bookmark — a design loved for its warmth, softness, and joyful flow.",
    soldOut: true
  },
  'ebook-watercolor-basics': {
    name: "Watercolour Made Simple: A beginner's guide to Watercolor Basics - eBook",
    price: 15.99,
    images: ['images/ebooks/e1.jpg', 'images/ebooks/e2.jpg', 'images/ebooks/e3.jpg', 'images/ebooks/e4.jpg'],
    details: 'If you’ve ever felt drawn to watercolor but didn’t know where to begin, this book is for you.',
    descriptionHtml: `
      <p>If you’ve ever felt drawn to watercolor but didn’t know where to begin, this book is for you.</p>

      <p>This 27 pages digital guide is a gentle, welcoming introduction to watercolor — created especially for beginners who want to paint without pressure, fear, or overwhelm. It’s not a textbook, and it’s not about perfection. It’s about slowing down, understanding the basics, and learning to enjoy the quiet magic of watercolor.</p>

      <p>Inside, I share everything I wish I had known when I first picked up a brush — explained in a warm, simple, and encouraging way. This book is designed to feel like a calm companion you can return to again and again.</p>

      <p>What you’ll find inside:
      - A soft introduction to watercolor and the mindset behind it
      - A beginner-friendly overview of supplies (without needing anything fancy)
      - Understanding color, water ratio, and paint behavior
      - Getting to know your brushes and basic brush marks
      - Watercolor techniques like wet-on-wet, wet-on-dry, layering, and lifting
      - Color mixing, color schemes, and using the color wheel gently
      - Finding inspiration and painting with imagination
      - Beautiful visuals, examples, and artwork throughout
      </p>

      <p>This book focuses on understanding watercolor, not rushing into complicated projects. It builds confidence slowly and naturally — perfect if you’re new, returning after a break, or simply want a softer approach to learning.</p>

      <p>Who this book is for:<br>
      ✔ Absolute beginners<br>
      ✔ Anyone feeling intimidated by watercolor<br>
      ✔ Artists who love a calm, intuitive learning style<br>
      ✔ Creatives who enjoy visual, gentle instruction</p>
      `,
    soldOut: false
  },
  'ebook-watercolor-spring-flowers': {
    name: "Spring Flowers in Watercolor: A beginner's guide to Loose Floral Painting - eBook",
    price: 15.99,
    images: ['images/ebooks/e5.jpg', 'images/ebooks/e6.jpg', 'images/ebooks/e7.jpg', 'images/ebooks/e8.jpg'],
    details: 'Learn how to paint beautiful spring flowers with watercolor in a calm, simple, and approachable way.',
    descriptionHtml: `
      <p>Learn how to paint beautiful spring flowers with watercolor in a calm, simple, and approachable way.</p>

      <p>This digital book was created to guide you through the gentle process of painting loose watercolor florals. Whether you are completely new to watercolor or looking to develop a softer floral style, this guide will help you understand the basics while enjoying the creative process.</p>

      <p>Inside the book, you’ll find step-by-step demonstrations of popular spring flowers along with simple brush techniques, color guidance, and floral composition tips.</p>

      <p>What You'll Learn:<br>
      ✔ Understanding watercolor basics<br>
      ✔ The colors of spring and how to use them<br>
      ✔ My personal spring palette<br>
      ✔ Simple brush techniques for petals and leaves<br>
      ✔ Step-by-step flower tutorials<br>
      ✔ How to paint stems, greenery, and leaf clusters<br>
      ✔ Creating simple floral compositions<br>
      ✔ Turning your florals into small projects</p>
      `,
    soldOut: false
  },
  'ebook-all_about_pumpkins': {
    name: 'All About Pumpkins: An Autumn Collection of Watercolor Pumpkins - eBook',
    price: 10.99,
    images: ['images/ebooks/e9.jpg', 'images/ebooks/e10.jpg', 'images/ebooks/e11.jpg', 'images/ebooks/e12.jpg'],
    details: 'Step into a world of crisp autumn air, glowing golden light, and irresistible cozy charm.',
    descriptionHtml: `
      <p>Step into a world of crisp autumn air, glowing golden light, and irresistible cozy charm.</p>

      <p>Whether you are an aspiring artist picking up a brush for the first time, a seasoned painter seeking fresh inspiration, or simply someone who adores the quiet beauty of the fall season, this e-book is crafted as a magical sanctuary for your creative soul.</p>

      <p>More than just an instructional guide, this collection is an immersive artistic journey through the harvest patch. Meet a whimsical cast of heirloom pumpkin characters—from the rich, fiery tones of Ignatius to the ghostly alabaster magic of Genevieve and the graceful, sweeping curves of Willoughby. Each chapter celebrates the warmth, nostalgia, and rich textures that make autumn feel like home.</p>

      <p>Why You’ll Fall in Love With This Book:<br>
      🧡 Step-by-Step Watercolor Tutorials: Clear, encouraging, and delightful instruction suitable for all skill levels.<br>
      🧡 Ready-to-Trace Master Outlines: Skip the stress of drawing from scratch—simply print or transfer the included sketches directly onto your paper.<br>
      🧡 Curated Color Palettes & Swatches: Learn the secret to blending glowing underwashes, earthy moss tones, and rich rustic speckles.<br>
      🧡 Versatile Layering & Texturing Techniques: Master foundational glazing, stippling, and wet-on-wet methods that you can apply to any future watercolor subject—from botanical florals to rich landscapes!<br>
      🧡 Charming Autumn Lore & Fun Facts: Discover the fascinating history and cozy tales behind classic harvest gourds as you paint.<br>
      🧡 A Visual Feast for Fall Lovers: Even if you just want to curl up with a hot cup of cider and flip through the gorgeous, vibrant pages, this book brings instant seasonal warmth to your screen.</p>

      <p>Whether you are looking to create handmade greeting paintings, frame your own seasonal wall art, or unwind with a relaxing autumn hobby, All About Pumpkins is your ultimate companion for the season.</p>

      <p>Bring the heart of the harvest straight to your studio today—and let the cozy painting begin!</p>
      `,
    soldOut: false
  },
  'ebook-autumn-doodles': {
    name: 'Autumn Doodles: A Collection of Autumn-inspired Watercolor Doodles',
    price: 1.99,
    images: ['images/ebooks/e14.jpg', 'images/ebooks/e13.jpg'],
    details: 'A collection of autumn-inspired watercolor doodles for creative seasonal painting.',
    descriptionHtml: `
      <p>Step into a world of crisp autumn air, glowing golden light, and irresistible cozy charm.</p>

      <p>Whether you are an aspiring artist picking up a brush for the first time, a seasoned painter seeking fresh inspiration, or simply someone who adores the quiet beauty of the fall season, this doodle page is crafted as a magical sanctuary for your creative soul.</p>

      <p>Follow my YouTube video <a href="https://youtu.be/oh2fUv5zyls" target="_blank" rel="noopener">here</a> to color this page along!</p>

      <p>Whether you are looking to create handmade greeting paintings, frame your own seasonal wall art, or unwind with a relaxing autumn hobby, use this page as your creative outlet.</p>

      <p>Bring the heart of the harvest straight to your studio today—and let the cozy painting begin!</p>
      `,
    soldOut: false
  }
};

async function getProduct(id, env) {
  if (!id) return null;
  if (OTHER_PRODUCTS[id]) return { id, ...OTHER_PRODUCTS[id] };

  const source = await catalogSource(env);
  if (id.startsWith('bookmark')) return bookmarkProduct(id, namesFromCatalog(source, 'bookmarkNames'));
  if (id.startsWith('painting')) return paintingProduct(id, namesFromCatalog(source, 'paintingNames'));
  return null;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // The Apps Worker uses this header when fetching the original app files.
    // This prevents the proxy request from being redirected back to itself.
    const isAppsProxy = request.headers.get('X-Apps-Proxy') === '1';

    if (!isAppsProxy && request.method === 'GET') {
      const path = url.pathname;
      const isScreenPace = path === '/ScreenPace' || path.startsWith('/ScreenPace/');
      const isVoxCue = path === '/VoxCue' || path.startsWith('/VoxCue/');

      if (isScreenPace || isVoxCue) {
        const destination = new URL(url.toString());
        destination.protocol = 'https:';
        destination.hostname = 'apps.thechicartist.com';
        if (path === '/ScreenPace' || path === '/VoxCue') {
          destination.pathname = `${path}/`;
        }
        return Response.redirect(destination.toString(), 301);
      }
    }

    const response = await env.ASSETS.fetch(request);
    if (!PRODUCT_PATHS.has(url.pathname) || request.method !== 'GET' || !response.headers.get('content-type')?.includes('text/html')) {
      return response;
    }

    let product;
    try {
      product = await getProduct(url.searchParams.get('id'), env);
    } catch (error) {
      // Preserve the origin asset if the catalog cannot be read. A temporary
      // asset-binding failure must not turn valid products into noindex pages.
      console.error('Unable to read product catalog', error);
      return response;
    }

    const metadata = product ? metadataFor(product) : invalidMetadata();
    return new HTMLRewriter()
      .on('title', {
        element(element) {
          element.setInnerContent(metadata.title);
        }
      })
      .on('head', {
        element(element) {
          element.append(metadata.head, { html: true });
        }
      })
      .on('main#productMain', {
        element(element) {
          if (product) {
            element.setInnerContent(productBodyHtml(product), {
              html: true
            });
          }
        }
      })
      .transform(response);
  }
};
