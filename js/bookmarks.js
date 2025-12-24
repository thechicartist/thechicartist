document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('bookmarkGrid');

  if (!grid) return;

  for (let i = 1; i <= 130; i++) {
    const col = document.createElement('div');
    const price = (i ==2 || i == 3 || i ==4) ? 39.99 : 8.99;
    col.className = 'col-6 col-md-4 col-lg-2 mb-4';

    col.innerHTML = `
      <div class="product-item">
        <img src="images/bookmarks/b${i}.jpeg"
             alt="Bookmark ${i}"
             class="img-fluid"
             loading="lazy">

        <div class="product-overlay">
          <div class="product-overlay-inner">
            <p class="product-price">$${price}</p>

            <button class="btn btn-sm add-to-cart"
                    data-id="bookmark${i}"
                    data-name="Hand-painted Bookmark ${i}"
                    data-price="${price}"
                    data-image="images/bookmarks/b${i}.jpeg">
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    `;

    grid.appendChild(col);
  }
});
