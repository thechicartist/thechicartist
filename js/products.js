/**
 * ============================================================
 *  PRODUCT DATABASE — The Chic Artist
 *  Edit this file to update product info, add descriptions,
 *  or add extra images for any product.
 * ============================================================
 *
 *  Each product entry:
 *  {
 *    id:          'bookmark42'         — must match data-id on Add to Cart button
 *    name:        'Hand-painted ...'   — display name
 *    price:       8.99                 — number
 *    images:      ['img1.jpg', ...]    — first image is the main one
 *    description: 'HTML or plain text' — shown on product detail page
 *    category:    'bookmark' | 'card'  — used for back navigation
 *  }
 */

const PRODUCTS = {};

// ============================================================
//  HELPER — registers a product
// ============================================================
function addProduct(product) {
  PRODUCTS[product.id] = product;
}

// ============================================================
//  BOOKMARKS
// ============================================================

// Default description for bookmarks (override per product below if needed)
const defaultBookmarkDesc = `
  <p>Each bookmark is hand-painted with watercolors, making every piece truly one of a kind.</p>
  <p>Size: <strong>2 × 6 inches</strong> — fits perfectly in any book.</p>
  <p>Comes with a high-quality protective sleeve to keep it pristine.</p>
  <p>Ships carefully packaged to arrive in perfect condition.</p>
`;

// Generate all bookmarks automatically
(function() {
  for (let i = 1; i <= 129; i++) {
    if (i === 0) continue;
    const price = (i === 115) ? 39.99
                : (i === 126 || i === 124) ? 25.99
                : (i === 49 || i === 128 || i === 45) ? 11.99
                : 9.99;
    const name = (i === 115 || i === 126 || i === 124)
      ? `Set of 2 Hand-painted Watercolor Bookmarks ${i}`
      : `Hand-painted Watercolor Bookmark ${i}`;

    addProduct({
      id: `bookmark${i}`,
      name,
      price,
      images: [`images/bookmarks/b${i}.jpeg`],
      description: defaultBookmarkDesc,
      category: 'bookmark'
    });
  }
})();

// ---- Per-product overrides ----
// To add extra images or a custom description for a specific bookmark,
// uncomment and edit one of these examples:

// PRODUCTS['bookmark42'].images = ['images/bookmarks/b42.jpeg', 'images/bookmarks/b42b.jpeg'];
// PRODUCTS['bookmark42'].description = '<p>Custom description here.</p>';

// PRODUCTS['bookmark115'].description = `
//   <p>A gorgeous set of 2 matching hand-painted bookmarks.</p>
//   <p>Perfect as a gift or to keep one for yourself!</p>
//   <p>Size: <strong>2 × 6 inches</strong> each, with protective sleeves.</p>
// `;


// ============================================================
//  CARDS / PAINTINGS
// ============================================================

const defaultCardDesc = `
  <p>An original hand-painted watercolor painting, crafted with care and attention to detail.</p>
  <p>Size: <strong>5 × 7 inches</strong>, unframed — ready for styling or gifting.</p>
  <p>Available as a greeting card upon request at no additional cost,
     with a blank interior and a white envelope included.</p>
  <p>Ships carefully packaged to arrive in perfect condition.</p>
`;

(function() {
  for (let i = 1; i <= 45; i++) {
    const price = (i === 2 || i === 5 || i === 6) ? 39.99
                : 18.99;

    addProduct({
      id: `card${i}`,
      name: `Hand-painted Watercolor Painting ${i}`,
      price,
      images: [`images/cards/c${i}.jpeg`],
      description: defaultCardDesc,
      category: 'card'
    });
  }
})();

// ---- Per-product overrides for cards ----
 PRODUCTS['card2'].images = ['images/cards/c2.jpeg', 'images/cards/c2.jpeg'];
// PRODUCTS['card2'].description = '<p>Custom description here.</p>';