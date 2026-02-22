document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('ebookGrid');
  if (!grid) return;

  // Get only e-book products
  const ebooks = Object.values(PRODUCTS).filter(p => p.category === 'ebook');

  if (ebooks.length === 0) {
    grid.innerHTML = '<p class="text-center">No e-books available at this time. Check back soon!</p>';
    return;
  }

  ebooks.forEach(product => {
    const col = document.createElement('div');
    col.className = 'col-6 col-md-4 col-lg-3 mb-4';

    col.innerHTML = `
      <div class="product-item">
        <a href="product.html?id=${product.id}" class="product-link" aria-label="View ${product.name}">
          <img src="${product.images[0]}"
               alt="${product.name}"
               class="img-fluid"
               id="${product.id}"
               loading="lazy">
        </a>
        <div class="product-overlay">
          <div class="product-overlay-inner">
            <p class="product-price">$${Number(product.price).toFixed(2)}</p>
            <a href="product.html?id=${product.id}" class="btn btn-sm btn-outline-dark mb-1">View Details</a>
            ${product.polarUrl
              ? `<a href="${product.polarUrl}" class="btn btn-sm btn-dark" target="_blank" style="text-decoration:none;">Buy Now</a>`
              : `<button class="btn btn-sm add-to-cart"
                    data-id="${product.id}"
                    data-name="${product.name}"
                    data-price="${product.price}"
                    data-image="${product.images[0]}"
                    data-type="digital">
                  Buy Now
                </button>`
            }
          </div>
        </div>
      </div>
    `;

    grid.appendChild(col);
  });
});