/**
 * ============================================================
 *  PRODUCT DATABASE — The Chic Artist
 *
 *  type: 'physical' → bookmarks, paintings (shipped, CA+USA only)
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
                : 11.99;
    addProduct({
      id: `bookmark${i}`, 
      name: `Hand-painted Watercolor Bookmark ${i}`, 
      price,
      type: 'physical',
      images: [`images/bookmarks/b${i}.jpeg`],
      description: defaultBookmarkDesc,
      soldOut: false,
      category: 'bookmark'
    });
  }
})();

// ---- Per-product overrides ----
const bookmarkNames = {
  1: 'Mischief Managed Watercolor Bookmark',
  2: 'Greenery and White Berries Watercolor Bookmark',
  3: 'Ginkgo and Autumn Leaves Watercolor Bookmark',
  4: 'Blue Forget-Me-Not Watercolor Bookmark',
  5: 'Strawberry Blossom Watercolor Bookmark',
  6: 'Purple Wildflower Watercolor Bookmark',
  7: 'Pink Cherry Blossom Watercolor Bookmark',
  8: 'Orange Berry Branch Watercolor Bookmark',
  9: 'Purple Hydrangea Watercolor Bookmark',
  10: 'Blue and Violet Wildflowers Watercolor Bookmark',
  11: 'Soft Pink Magnolia Watercolor Bookmark',
  12: 'Blue Morning Glory Watercolor Bookmark',
  13: 'Pink Magnolia Watercolor Bookmark',
  14: 'Pink Garden Rose Watercolor Bookmark',
  15: 'Autumn Leaves Watercolor Bookmark',
  16: 'Orange Poppy Watercolor Bookmark',
  17: 'Blue Garden Flowers Watercolor Bookmark',
  18: 'Orange Slices and Leaves Watercolor Bookmark',
  19: 'Pink Roses and Greenery Watercolor Bookmark',
  20: 'Purple Garden Flowers Watercolor Bookmark',
  21: 'Strawberry Garden Watercolor Bookmark',
  22: 'Pink Rose Watercolor Bookmark',
  23: 'Yellow Cosmos Watercolor Bookmark',
  24: 'Purple Cosmos and Greenery Watercolor Bookmark',
  25: 'Lemon and Citrus Watercolor Bookmark',
  26: 'Watermelon Slices Watercolor Bookmark',
  27: 'Yellow Citrus and Green Leaves Watercolor Bookmark',
  28: 'Purple Lavender Watercolor Bookmark',
  29: 'Blue Wildflowers Watercolor Bookmark',
  30: 'Peach Slices Watercolor Bookmark',
  31: 'Pink Sweet Pea Watercolor Bookmark',
  32: 'Yellow Garden Flowers Watercolor Bookmark',
  33: 'Blueberry Branch Watercolor Bookmark',
  34: 'Red Poppy Watercolor Bookmark',
  35: 'Fresh Lime Watercolor Bookmark',
  36: 'Pink Tulip Watercolor Bookmark',
  37: 'Purple Flower Sprigs Watercolor Bookmark',
  38: 'Purple Berry Branch Watercolor Bookmark',
  39: 'Pink Hanging Blossoms Watercolor Bookmark',
  40: 'Large Pink Rose Watercolor Bookmark',
  41: 'Pink Hearts and Greenery Watercolor Bookmark',
  42: 'Purple Cherry Blossom Watercolor Bookmark',
  43: 'Pink Cupcake Watercolor Bookmark',
  44: 'Red Mushroom Watercolor Bookmark',
  45: 'Colorful Garden Flowers Watercolor Bookmark',
  46: 'Sunflower and Pink Foliage Watercolor Bookmark',
  47: 'Blue Heart Flowers Watercolor Bookmark',
  48: 'Yellow Wildflowers Watercolor Bookmark',
  49: 'Purple and Yellow Garden Flowers Watercolor Bookmark',
  50: 'Orange Cosmos Watercolor Bookmark',
  51: 'Red Poppy Flowers Watercolor Bookmark',
  52: 'Orange Wildflowers Watercolor Bookmark',
  53: 'Soft Blush Flowers Watercolor Bookmark',
  54: 'Pink Magnolia Blooms Watercolor Bookmark',
  55: 'Yellow Tulips Watercolor Bookmark',
  56: 'Golden Hanging Blossoms Watercolor Bookmark',
  57: 'Pink and Orange Honeysuckle Watercolor Bookmark',
  58: 'Orange Slice Watercolor Bookmark',
  59: 'Purple Cosmos Flowers Watercolor Bookmark',
  60: 'Pink Coneflowers Watercolor Bookmark',
  61: 'Yellow Magnolia Blooms Watercolor Bookmark',
  62: 'Purple Flowers and Yellow Fillers Watercolor Bookmark',
  63: 'Yellow Wildflower Meadow Watercolor Bookmark',
  64: 'Pink Coneflower Watercolor Bookmark',
  65: 'Pale Yellow Wildflowers Watercolor Bookmark',
  66: 'Red Carnations Watercolor Bookmark',
  67: 'Orange Tulips Watercolor Bookmark',
  68: 'Golden Yellow Tulips Watercolor Bookmark',
  69: 'Purple Hydrangea Blooms Watercolor Bookmark',
  70: 'Purple Cosmos Sprigs Watercolor Bookmark',
  71: 'Pink Cherry Blossoms Watercolor Bookmark',
  72: 'Lavender Heart Flowers Watercolor Bookmark',
  73: 'Orange Heart Flowers Watercolor Bookmark',
  74: 'Orange Daisy Flowers Watercolor Bookmark',
  75: 'Red Heart Hot Air Balloon Watercolor Bookmark',
  76: 'Purple and Pink Berry Branch Watercolor Bookmark',
  77: 'Pink Tulips Watercolor Bookmark',
  78: 'Pink Coneflowers with Golden Centers Watercolor Bookmark',
  79: 'Blueberry Sprig Watercolor Bookmark',
  80: 'Purple Wisteria Watercolor Bookmark',
  81: 'Golden Yellow Flowers Watercolor Bookmark',
  82: 'Pink Garden Roses Watercolor Bookmark',
  83: 'Purple Salvia Watercolor Bookmark',
  84: 'Yellow Wildflower Sprigs Watercolor Bookmark',
  85: 'Red Hanging Berry Branch Watercolor Bookmark',
  86: 'Green Leaf Branch Watercolor Bookmark',
  87: 'Pink Cosmos Watercolor Bookmark',
  88: 'Soft Pink Flowers Watercolor Bookmark',
  89: 'Orange Cosmos and Fillers Watercolor Bookmark',
  90: 'Pink Heart Flowers Watercolor Bookmark',
  91: 'Pink Cherry Blossom Twig Watercolor Bookmark',
  92: 'Blue Christmas Ornaments Watercolor Bookmark',
  93: 'Red Berries and Green Leaves Watercolor Bookmark',
  94: 'Christmas Holly and Berries Watercolor Bookmark',
  95: 'Watermelon Slice Watercolor Bookmark',
  96: 'Pink and Purple Wildflowers Watercolor Bookmark',
  97: 'Colorful Ice Cream Watercolor Bookmark',
  98: 'Pink Anemone Watercolor Bookmark',
  99: 'Pink Christmas Baubles Watercolor Bookmark',
  100: 'Blue Lavender Sprigs Watercolor Bookmark',
  101: 'Orange Slices and Star Anise Watercolor Bookmark',
  102: 'Red Autumn Leaves Watercolor Bookmark',
  103: 'Cranberry Branch and Autumn Leaves Watercolor Bookmark',
  104: 'Golden Autumn Leaves Watercolor Bookmark',
  105: 'Watercolor Pumpkin Bookmark',
  106: 'Golden Ginkgo Leaves Watercolor Bookmark',
  107: 'Sunflower and Autumn Leaves Watercolor Bookmark',
  108: 'Cascading Orange Slices Watercolor Bookmark',
  109: 'Golden Yellow Poppies Watercolor Bookmark',
  110: 'Red Foliage Watercolor Bookmark',
  111: 'Blue Forget-Me-Not Flowers Watercolor Bookmark',
  112: 'Always Watercolor Literary Bookmark',
  113: 'Red Wildflowers Watercolor Bookmark',
  114: 'Autumn Branch Watercolor Bookmark',
  115: 'Coffee Loving Reader Set of 2 Hand-Painted Watercolor Bookmarks',
  116: 'Teal Deer Silhouette Watercolor Bookmark',
  117: 'Purple Cosmos Sprig Watercolor Bookmark',
  118: 'Rosehip and Autumn Leaves Watercolor Bookmark',
  119: 'Autumn Maple Leaves Watercolor Bookmark',
  120: 'Orange Black-Eyed Susan Watercolor Bookmark',
  121: 'Sunflowers and Greenery Watercolor Bookmark',
  122: 'Orange Slices and Greenery Watercolor Bookmark',
  123: 'Sunflower and Blue Wildflowers Watercolor Bookmark',
  124: 'Set of 2 Hand-Painted Sunflower Watercolor Bookmarks',
  125: 'Purple Petal Flowers Watercolor Bookmark',
  126: 'Honey Bee and Honeycomb Set of 2 Hand-Painted Watercolor Bookmarks',
  127: 'Colorful Watercolor Glasses Bookmark',
  128: 'Purple Lavender Sprigs Watercolor Bookmark',
  129: 'Purple Anemone Watercolor Bookmark',
  130: 'Pink Cherry Blossom and Falling Petals Watercolor Bookmark',
  131: 'Pink and Yellow Garden Flowers Watercolor Bookmark',
  132: 'Bee and Lavender Watercolor Bookmark',
  133: 'Orange Branch Watercolor Bookmark',
  134: 'Pink Blossom Branch Watercolor Bookmark',
  135: 'Purple Blossoms and Paintbrush Watercolor Bookmark',
  136: 'Lavender Sprig Watercolor Bookmark',
  137: 'Bridgerton Themed Original Watercolor Bookmarks – Set of 2',
  138: 'Lemon and Blue Floral Watercolor Bookmark',
  139: 'Pink Cherry Blossom Branch Watercolor Bookmark'
};

Object.entries(bookmarkNames).forEach(([n, name]) => {
  PRODUCTS[`bookmark${n}`].name = name;
});

 PRODUCTS['bookmark42'].images = ['images/bookmarks/b42.jpeg', 'images/bookmarks/b42.jpeg'];
 PRODUCTS['bookmark82'].soldOut = true;
 PRODUCTS['bookmark65'].soldOut = true;
 PRODUCTS['bookmark8'].soldOut = true;

 PRODUCTS['bookmark137'] = {...PRODUCTS['bookmark137'], description: `<p>A pair of original hand-painted watercolor bookmarks inspired by the beloved Bridgerton series.</p>
  <p>Each bookmark is carefully crafted with attention to detail, capturing the romantic and elegant essence of the Bridgerton world.</p>
  <p>Size: <strong>2 × 6 inches</strong> — perfect for marking your place in any book.</p>
  <p>Comes with a high-quality protective sleeve to keep it pristine.</p>
  <p>All products are shipped carefully packaged to arrive in perfect condition.</p>
  <p>Please note: Due to the handmade nature of these pieces, slight variations may occur — making each set truly one-of-a-kind.
</p>`};


// ============================================================
// PAINTINGS
// ============================================================
const defaultCardDesc = `<p>An original hand-painted watercolor painting, crafted with care and attention to detail.</p>
  <p>Size: <strong>5 × 7 inches</strong>, unframed — ready for styling or gifting.</p>
  <p>Choose your format: original painting, or a greeting card at no additional cost,
     with a blank interior and a white envelope included.</p>
  <p>All products are shipped carefully packaged to arrive in perfect condition.</p>
    <p>Please note: Due to the handmade nature of these pieces, slight variations may occur — making each set truly one-of-a-kind.
</p>`;

(function() {
  for (let i = 1; i <= 26; i++) {
    const price = (i === 16 || i === 2) ? 39.99
                : 24.99;

    addProduct({
      id: `painting${i}`, 
      name: `Hand-painted Watercolor Painting ${i}`, 
      price,
      type: 'physical',
      images: [`images/paintings/c${i}.jpeg`],
      description: defaultCardDesc,
      soldOut: false,
      category: 'card'
    });
  }
})();

// ---- Per-product overrides ----

 PRODUCTS['painting1'].name = `Hand-painted Watercolor Painting: "Cake slice with candle and strawberry"`;

 PRODUCTS['painting2'] = {...PRODUCTS['painting2'],
  description : `<p>A beautiful Floral Mother's Day greeting card, hand-painted with watercolors.</p>
  <p>Size: <strong>5 × 7 inches</strong>.</p>
  <p> All Greeting cards come with a blank interior and a white envelope.</p>
  <p> All products are shipped carefully packaged to arrive in perfect condition.</p>
  <p>Please note: Due to the handmade nature of these pieces, slight variations may occur — making each set truly one-of-a-kind.
</p>`};

const paintingNames = {
  1:  'Strawberry Birthday Cake Slice with Candle Original Watercolor',
  2:  "Mother's Day Mom Roses and Wildflowers Original Watercolor",
  3:  'Pink Peony and Rose Spring Bouquet Original Watercolor',
  4:  'Pink and Peach Magnolia Blossom Branch Original Watercolor',
  5:  'Blush Peony and Rose Bouquet with Red Buds Original Watercolor',
  6:  'Christmas Mistletoe with Red Bow Original Watercolor',
  7:  'Poinsettia Christmas Bauble Original Watercolor',
  8:  'Christmas Poinsettia Bouquet with Gold Outlines Original Watercolor',
  9:  'Poinsettia and Berries Christmas Tree Original Watercolor',
  10: 'Pine Branch with Red and Gold Christmas Ornaments Original Watercolor',
  11: 'Evergreen and Teal Leaf Christmas Wreath Original Watercolor',
  12: 'Christmas Orange Slices, Pinecones and Holly Original Watercolor',
  13: 'Green Leaf Christmas Tree with Gold Border Original Watercolor',
  14: 'Golden Christmas Bauble with Berries and Greenery Original Watercolor',
  15: 'Christmas Holly and Pine Corner with Gold Accents Original Watercolor',
  16: 'Christmas Owl in Orange Beanie and Red Scarf Original Watercolor',
  17: 'Olive Leaf and Gold Berry Sprig Christmas Wreath Original Watercolor',
  18: 'Red and Blush Berry Christmas Wreath Original Watercolor',
  19: 'Smiling Christmas Snowman in Orange Beanie Original Watercolor',
  20: 'Christmas Bouquet with Red Anemone and Cream Roses Original Watercolor',
  21: 'Blue Floral Christmas Ornament Original Watercolor',
  22: 'Christmas Snow Bird in Orange Beanie on a Pine Branch Original Watercolor',
  23: 'Eucalyptus and Red Berry Christmas Wreath Original Watercolor',
  24: 'Gilded Leaf Christmas Wreath Original Watercolor',
  25: 'Golden Christmas Ornament with Leaf Pattern and Berries Original Watercolor',
  26: 'Red Christmas Ornament with Holly and Pine Original Watercolor',
};
Object.entries(paintingNames).forEach(([n, name]) => PRODUCTS[`painting${n}`].name = name);
Object.values(PRODUCTS)
  .filter(p => p.category === 'card' && p.description === defaultCardDesc)
  .forEach(p => p.description = `<p><strong>${p.name}</strong> is an original hand-painted watercolor, available as an unframed painting or as a greeting card.</p>` + defaultCardDesc);

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

addProduct({
  id: 'ebook-all_about_pumpkins',
  name: 'All About Pumpkins: An Autumn Collection of Watercolor Pumpkins - eBook',
  price: 10.99,
  salePrice: 10.99,
  polarPrice:10.99,
  type: 'digital',
  category: 'ebook',
  polarUrl: 'https://buy.polar.sh/polar_cl_Hosj0DAyTfO2HQoifvgpJs2yKcRsf11O1CXvQ3zviHb',
  images: ['images/ebooks/e9.jpg', 'images/ebooks/e10.jpg', 'images/ebooks/e11.jpg', 'images/ebooks/e12.jpg'],
  description: `
  
    <p>Step into a world of crisp autumn air, glowing golden light, and irresistible cozy charm.</p>
    
    <p>Whether you are an aspiring artist picking up a brush for the first time, 
    a seasoned painter seeking fresh inspiration, or simply someone who adores the quiet beauty of the fall season, 
    this e-book is crafted as a magical sanctuary for your creative soul.</p>



     <p>More than just an instructional guide, this collection is an immersive artistic journey through the harvest patch. 
     Meet a whimsical cast of heirloom pumpkin characters—from the rich, fiery tones of Ignatius to the ghostly alabaster magic of Genevieve and the graceful, 
     sweeping curves of Willoughby. Each chapter celebrates the warmth, nostalgia, and rich textures that make autumn feel like home..</p>

     <p>

        Why You’ll Fall in Love With This Book:<br>
        🧡 Step-by-Step Watercolor Tutorials: Clear, encouraging, and delightful instruction suitable for all skill levels.<br>
        🧡 Ready-to-Trace Master Outlines: Skip the stress of drawing from scratch—simply print or transfer the included sketches directly onto your paper.<br>
        🧡 Curated Color Palettes & Swatches: Learn the secret to blending glowing underwashes, earthy moss tones, and rich rustic speckles.<br>
        🧡 Versatile Layering & Texturing Techniques: Master foundational glazing, stippling, and wet-on-wet methods that you can apply to any future watercolor subject—from botanical florals to rich landscapes!<br>
        🧡 Charming Autumn Lore & Fun Facts: Discover the fascinating history and cozy tales behind classic harvest gourds as you paint.<br>
        🧡 A Visual Feast for Fall Lovers: Even if you just want to curl up with a hot cup of cider and flip through the gorgeous, vibrant pages, this book brings instant seasonal warmth to your screen.<br>

</p>

<p>Whether you are looking to create handmade greeting paintings, frame your own seasonal wall art, or unwind with a relaxing autumn hobby, All About Pumpkins is your ultimate companion for the season.

Bring the heart of the harvest straight to your studio today—and let the cozy painting begin!</p>
  `
});

addProduct({
  id: 'ebook-autumn-doodles',
  name: 'Autumn Doodles: A Collection of Autumn-inspired Watercolor Doodles',
  price: 1.99,
  salePrice: 1.99,
  polarPrice:1.99,
  type: 'digital',
  category: 'ebook',
  polarUrl: 'https://buy.polar.sh/polar_cl_Hosj0DAyTfO2HQoifvgpJs2yKcRsf11O1CXvQ3zviHb',
  images: ['images/ebooks/e14.jpg', 'images/ebooks/e13.jpg'],
  description: `
  
    <p>Step into a world of crisp autumn air, glowing golden light, and irresistible cozy charm.</p>
    
    <p>Whether you are an aspiring artist picking up a brush for the first time, 
    a seasoned painter seeking fresh inspiration, or simply someone who adores the quiet beauty of the fall season, 
    this doodle page is crafted as a magical sanctuary for your creative soul.</p>



     <p>Follow my youtube video <a href="https://youtu.be/oh2fUv5zyls" target="_blank">here</a> to color this page along!</p>


<p>Whether you are looking to create handmade greeting paintings, frame your own seasonal wall art, or unwind with a relaxing autumn hobby, Use this page as your creative outlet.

Bring the heart of the harvest straight to your studio today—and let the cozy painting begin!</p>
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
