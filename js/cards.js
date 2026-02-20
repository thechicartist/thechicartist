document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('cardGrid');
  if (!grid) return;

  for (let i = 45; i >= 1; i--) {
    const product = PRODUCTS[`card${i}`];
    if (!product) continue;

    const col = document.createElement('div');
    col.className = 'col-6 col-md-4 col-lg-2 mb-4';

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
            <button class="btn btn-sm add-to-cart"
                    data-id="${product.id}"
                    data-name="${product.name}"
                    data-price="${product.price}"
                    data-type="physical"
                    data-image="${product.images[0]}">
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    `;

    grid.appendChild(col);
  }
});