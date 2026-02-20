/**
 * ============================================================
 *  PRODUCT DATABASE — The Chic Artist
 *
 *  type: 'physical' → bookmarks, cards (shipped, CA+USA only)
 *  type: 'digital'  → online classes (CA+USA+UK, no shipping)
 * ============================================================
 */

const PRODUCTS = {};

function addProduct(product) {
  PRODUCTS[product.id] = product;
}

// ============================================================
//  BOOKMARKS
// ============================================================
const defaultBookmarkDesc = `
  <p>Each bookmark is hand-painted with watercolors, making every piece truly one of a kind.</p>
  <p>Size: <strong>2 × 6 inches</strong> — fits perfectly in any book.</p>
  <p>Comes with a high-quality protective sleeve to keep it pristine.</p>
  <p>Ships carefully packaged to arrive in perfect condition.</p>
`;

(function() {
  for (let i = 1; i <= 129; i++) {
    const price = (i === 115) ? 39.99
                : (i === 126 || i === 124) ? 25.99
                : (i === 49 || i === 128 || i === 45) ? 11.99
                : 9.99;
    const name = (i === 115 || i === 126 || i === 124)
      ? `Set of 2 Hand-painted Watercolor Bookmarks ${i}`
      : `Hand-painted Watercolor Bookmark ${i}`;
    addProduct({
      id: `bookmark${i}`, name, price,
      type: 'physical',
      images: [`images/bookmarks/b${i}.jpeg`],
      description: defaultBookmarkDesc,
      category: 'bookmark'
    });
  }
})();

// ---- Per-product overrides ----
// PRODUCTS['bookmark42'].images = ['images/bookmarks/b42.jpeg', 'images/bookmarks/b42b.jpeg'];


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
                : 19.99;
    addProduct({
      id: `card${i}`,
      name: `Hand-painted Watercolor Painting ${i}`,
      price,
      type: 'physical',
      images: [`images/cards/c${i}.jpeg`],
      description: defaultCardDesc,
      category: 'card'
    });
  }
})();


// ============================================================
//  ONLINE CLASSES (digital)
//  To add a new class, copy one block and update the fields.
// ============================================================

addProduct({
  id: 'class-sunflower',
  name: 'Watercolor Sunflower Bookmark Workshop',
  price: 50.00,
  type: 'digital',
  category: 'class',
  images: ['images/onlineclass/o1.jpeg'],
  date: 'March 3rd, 2026, 12:30 PM – 2:00 PM EST',
  time: '12:30 PM – 2:00 PM EST',
  format: 'Live Online on Zoom',
  description: `
    <p>Join me for a cozy, creative watercolor session where we'll paint my
    <strong>signature sunflower bookmark</strong> set — a design loved for its warmth,
    softness, and joyful flow.</p>
    <p>You'll learn how to create loose, expressive sunflowers using simple brush movements,
    gentle color blending, and an intuitive approach to watercolor.</p>
    <p>By the end of the session, you'll walk away with a set of hand-painted sunflower bookmarks
    that feel personal, beautiful, and truly one of a kind.</p>
    <p>✨ No prior watercolor experience needed<br>
    ✨ Slow, guided, and confidence-building<br>
    ✨ A creative keepsake you'll love using again and again</p>
    <p><strong>Materials needed:</strong> Watercolor paper (2"×6"), round brushes (size 2/4/6/8),
    watercolor paints, mixing palette, two water containers, paper towel, pencil & eraser.</p>
  `
});

// To add more classes:
// addProduct({
//   id: 'class-rose',
//   name: 'Watercolor Rose Workshop',
//   price: 50.00,
//   type: 'digital',
//   category: 'class',
//   images: ['images/onlineclass/o2.jpeg'],
//   date: 'April 5th, 2026',
//   time: '12:30 PM – 2:00 PM EST',
//   format: 'Live Online on Zoom',
//   description: `<p>Your description here.</p>`
// });