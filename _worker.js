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
  return `${product.name}. ${product.details}`.replace(/\s+/g, ' ').trim().slice(0, 155);
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
    soldOut: false
  },
  'ebook-watercolor-spring-flowers': {
    name: "Spring Flowers in Watercolor: A beginner's guide to Loose Floral Painting - eBook",
    price: 15.99,
    images: ['images/ebooks/e5.jpg', 'images/ebooks/e6.jpg', 'images/ebooks/e7.jpg', 'images/ebooks/e8.jpg'],
    details: 'Learn how to paint beautiful spring flowers with watercolor in a calm, simple, and approachable way.',
    soldOut: false
  },
  'ebook-all_about_pumpkins': {
    name: 'All About Pumpkins: An Autumn Collection of Watercolor Pumpkins - eBook',
    price: 10.99,
    images: ['images/ebooks/e9.jpg', 'images/ebooks/e10.jpg', 'images/ebooks/e11.jpg', 'images/ebooks/e12.jpg'],
    details: 'Step into a world of crisp autumn air, glowing golden light, and irresistible cozy charm.',
    soldOut: false
  },
  'ebook-autumn-doodles': {
    name: 'Autumn Doodles: A Collection of Autumn-inspired Watercolor Doodles',
    price: 1.99,
    images: ['images/ebooks/e14.jpg', 'images/ebooks/e13.jpg'],
    details: 'Step into a world of crisp autumn air, glowing golden light, and irresistible cozy charm.',
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
      .on('title', { element(element) { element.setInnerContent(metadata.title); } })
      .on('head', { element(element) { element.append(metadata.head, { html: true }); } })
      .transform(response);
  }
};
