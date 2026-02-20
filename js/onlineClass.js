document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('OnlineClassGrid');
  if (!grid) return;

  // Get all digital products from PRODUCTS
  const classes = Object.values(PRODUCTS).filter(p => p.type === 'digital');

  if (classes.length === 0) {
    grid.innerHTML = '<p class="text-center">No classes available at this time. Check back soon!</p>';
    return;
  }

  classes.forEach(product => {
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
            ${product.date ? `<p style="font-size:0.75rem; margin:4px 0;">${product.date}</p>` : ''}
            <a href="product.html?id=${product.id}" class="btn btn-sm btn-outline-dark mb-1">View Details</a>
            <button class="btn btn-sm add-to-cart"
                    data-id="${product.id}"
                    data-name="${product.name}"
                    data-price="${product.price}"
                    data-image="${product.images[0]}"
                    data-type="digital">
              Register
            </button>
          </div>
        </div>
      </div>
    `;

    grid.appendChild(col);
  });
});