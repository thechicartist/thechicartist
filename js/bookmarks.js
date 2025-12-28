document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('bookmarkGrid');

  if (!grid) return;

  for (let i = 129; i >=1; i--) {
    const col = document.createElement('div');
    const price = (i ==115) ? 39.99 : (i==126 || i==124) ? 25.99 : (i== 49 || i == 128 || i==45) ? 11.99 : (i==129) ? 9.99 : 8.99;
    col.className = 'col-6 col-md-4 col-lg-2 mb-4';

    col.innerHTML = `
      <div class="product-item">
        <img src="images/bookmarks/b${i}.jpeg"
             alt="Hand-painted watercolor bookmark ${i}"
             class="img-fluid"
             id="bookmark${i}"
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
