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
  <p>All products are shipped carefully packaged to arrive in perfect condition.</p>
  <p>Please note: Due to the handmade nature of these pieces, slight variations may occur — making each set truly one-of-a-kind.
</p>
`;

(function() {
  for (let i = 1; i <= 139; i++) {
    const price = (i === 115) ? 39.99
                : (i === 126 || i === 124 || i === 137) ? 25.99
                : (i === 49 || i === 128 || i === 45 || i === 123) ? 11.99
                : 9.99;
    addProduct({
      id: `bookmark${i}`, 
      name: `Hand-painted Watercolor Bookmark ${i}`, 
      price,
      type: 'physical',
      images: [`images/bookmarks/b${i}.jpeg`],
      description: defaultBookmarkDesc,
      category: 'bookmark'
    });
  }
})();

// ---- Per-product overrides ----
 PRODUCTS['bookmark42'].images = ['images/bookmarks/b42.jpeg', 'images/bookmarks/b42.jpeg'];
 PRODUCTS['bookmark82'].soldOut = true;
 PRODUCTS['bookmark65'].soldOut = true;
 PRODUCTS['bookmark8'].soldOut = true;
 PRODUCTS['bookmark115'].name = `Coffee Loving Reader Set of 2 Hand-painted Watercolor Bookmarks`;
 PRODUCTS['bookmark124'].name = `Set of 2 Hand-painted Sunflower Watercolor Bookmarks`;
 PRODUCTS['bookmark126'].name = `Honey Bee; Honey Comb Set of 2 Hand-painted Watercolor Bookmarks`;

 PRODUCTS['bookmark137'] = {...PRODUCTS['bookmark137'], name: `Bridgerton themed Original Watercolor Bookmarks- Set of 2`, description: `<p>A pair of original hand-painted watercolor bookmarks inspired by the beloved Bridgerton series.</p>
  <p>Each bookmark is carefully crafted with attention to detail, capturing the romantic and elegant essence of the Bridgerton world.</p>
  <p>Size: <strong>2 × 6 inches</strong> — perfect for marking your place in any book.</p>
  <p>Comes with a high-quality protective sleeve to keep it pristine.</p>
  <p>All products are shipped carefully packaged to arrive in perfect condition.</p>
  <p>Please note: Due to the handmade nature of these pieces, slight variations may occur — making each set truly one-of-a-kind.
</p>`};


// ============================================================
//  CARDS / PAINTINGS
// ============================================================
const defaultCardDesc = `<p>An original hand-painted watercolor painting, crafted with care and attention to detail.</p>
  <p>Size: <strong>5 × 7 inches</strong>, unframed — ready for styling or gifting.</p>
  <p>Available as a greeting card upon request at no additional cost,
     with a blank interior and a white envelope included.</p>
  <p>All products are shipped carefully packaged to arrive in perfect condition.</p>
    <p>Please note: Due to the handmade nature of these pieces, slight variations may occur — making each set truly one-of-a-kind.
</p>`;

(function() {
  for (let i = 1; i <= 43; i++) {
    const price = (i === 2 || i === 5 || i === 6) ? 39.99
                : (i === 43) ? 25.99
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

// ---- Per-product overrides ----
 PRODUCTS['card2'].images = ['images/cards/c2.jpeg', 'images/cards/c2.jpeg'];
 PRODUCTS['card7'].images = ['images/cards/c7.jpeg', 'images/cards/c7b.jpeg'];
 PRODUCTS['card10'].images = ['images/cards/c10.jpeg', 'images/cards/c10b.jpeg'];
 PRODUCTS['card16'].images = ['images/cards/c16.jpeg', 'images/cards/c16b.jpeg'];
 PRODUCTS['card26'].soldOut = true;


 PRODUCTS['card43'] = {...PRODUCTS['card43'],
  name: `Mother's Day Original Watercolor Greeting Card` , 
  description : `<p>A beautiful Floral Mother's Day greeting card, hand-painted with watercolors.</p>
  <p>Size: <strong>5 × 7 inches</strong>.</p>
  <p> All Greeting cards come with a blank interior and a white envelope.</p>
  <p> All products are shipped carefully packaged to arrive in perfect condition.</p>
  <p>Please note: Due to the handmade nature of these pieces, slight variations may occur — making each set truly one-of-a-kind.
</p>`};



// ============================================================
//  ONLINE CLASSES (digital)
//  To add a new class, copy one block and update the fields.
// ============================================================

addProduct({
  id: 'class-cherry-blossom',
  name: 'Watercolor Cherry Blossom Bookmark Workshop',
  price: 30.00,
  type: 'digital',
  category: 'class',
  images: ['images/onlineclass/o3.jpeg'],
  date: 'April 16th, 2026, 2:00 PM – 3:00 PM EST',
  time: '2:00 PM – 3:00 PM EST',
  format: 'Live Online on Zoom',
  description: `
    <p>Join me for a cozy, creative watercolor session, where we'll paint 
    <strong>Cherry Blossom bookmark</strong> — a design loved for its warmth,
    softness, and joyful flow.</p>
    <p>You'll learn how to create loose, expressive cherry blossoms using simple brush movements,
    gentle color blending, and an intuitive approach to watercolor.</p>
    <p>By the end of the session, you'll walk away with a hand-painted cherry blossom bookmark
    that feel personal, beautiful, and truly one of a kind.</p>
    <p>✨ No prior watercolor experience needed<br>
    ✨ Slow, guided, and confidence-building<br>
    ✨ A creative keepsake you'll love using again and again</p>
    <h5 style="margin-top:1.5rem; margin-bottom:0.5rem;">Date and Time</h5>
    <p>
      Date: April 16th, 2026<br>
      Time: 2:00 PM – 3:00 PM EST
    </p>
    <h5 style="margin-top:1.5rem; margin-bottom:0.5rem;">Materials Required for this workshops</h5>
    <p>
      Watercolor paper (cut to bookmark size, 2" × 6")<br>
      Round brushes (Size 2 / 4 / 6 recommended)<br>
      Watercolor paints<br>
      Mixing palette<br>
      Two water containers<br>
      Paper towel or cloth<br>
      Pencil & eraser
    </p>
    
  `
});

PRODUCTS['class-cherry-blossom'].soldOut = true;

// Note id must always start with 'class-' for digital products to work properly in cart.js
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

// ============================================================
//  E-BOOKS (digital download)
//  To add a new e-book, copy one block and update the fields.
// ============================================================

addProduct({
  id: 'ebook-watercolor-basics',
  name: 'Watercolour Made Simple: A beginner\'s guide to Watercolor Basics - eBook',
  price: 15.99,
  polarPrice:15.99,
  type: 'digital',
  category: 'ebook',
  polarUrl: 'https://buy.polar.sh/polar_cl_tqIIWdNWB4J2ZSYuD2oslma7mGDwAZzAZiAQk4Sdf5S',
  images: ['images/ebooks/e1.jpg', 'images/ebooks/e2.jpg', 'images/ebooks/e3.jpg', 'images/ebooks/e4.jpg'],
  description: `
  
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

     <p>This book focuses on understanding watercolor, not rushing into complicated projects.
      It builds confidence slowly and naturally — perfect if you’re new, returning after a break, 
      or simply want a softer approach to learning. </p>

     <p>

        Who this book is for:<br>
        ✔ Absolute beginners<br>
        ✔ Anyone feeling intimidated by watercolor<br>
        ✔ Artists who love a calm, intuitive learning style<br>
        ✔ Creatives who enjoy visual, gentle instruction
</p>
  `
});

addProduct({
  id: 'ebook-watercolor-spring-flowers',
  name: 'Spring Flowers in Watercolor: A beginner\'s guide to Loose Floral Painting - eBook',
  price: 15.99,
  polarPrice:15.99,
  type: 'digital',
  category: 'ebook',
  polarUrl: 'https://buy.polar.sh/polar_cl_Hosj0DAyTfO2HQoifvgpJs2yKcRsf11O1CXvQ3zviHb',
  images: ['images/ebooks/e5.jpg', 'images/ebooks/e6.jpg', 'images/ebooks/e7.jpg', 'images/ebooks/e8.jpg'],
  description: `
  
    <p>Learn how to paint beautiful spring flowers with watercolor in a calm, simple, and approachable way.</p>
    
    <p>This digital book was created to guide you through the gentle process of painting loose watercolor florals. 
    Whether you are completely new to watercolor or looking to develop a softer floral style, this guide will help 
    you understand the basics while enjoying the creative process.</p>




     <p>Inside the book, you’ll find step-by-step demonstrations of popular spring flowers along with 
     simple brush techniques, color guidance, and floral composition tips.</p>

     <p>

        What You'll Learn:<br>
        ✔ Understanding watercolor basics<br>
        ✔ The colors of spring and how to use them<br>
        ✔ My personal spring palette<br>
        ✔ Simple brush techniques for petals and leaves<br>
        ✔ Step-by-step flower tutorials<br>
        ✔ How to paint stems, greenery, and leaf clusters<br>
        ✔ Creating simple floral compositions<br>
        ✔ Turning your florals into small projects

</p>
  `
});

// Note id must always start with 'ebook-' for digital products to work properly in cart.js
// To add more e-books:
// addProduct({
//   id: 'ebook-florals', 
//   name: 'Loose Watercolor Florals',
//   price: 22.00,
//   type: 'digital',
//   category: 'ebook',
//   images: ['images/ebooks/e2.jpeg'],
//   description: `<p>Your description here.</p>`
// });