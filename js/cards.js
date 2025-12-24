document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('cardGrid');

  if (!grid) return;

  for (let i = 1; i <= 45; i++) {
    const col = document.createElement('div');
    const price = (i ==2 || i == 3 || i ==4) ? 39.99 : 8.99;
    col.className = 'col-6 col-md-4 col-lg-2 mb-4';

    col.innerHTML = `
      <div class="product-item">
        <img src="images/cards/c${i}.jpeg"
             alt="card ${i}"
             class="img-fluid"
             loading="lazy">

        <div class="product-overlay">
          <div class="product-overlay-inner">
            <p class="product-price">$${price}</p>

            <button class="btn btn-sm add-to-cart"
                    data-id="card${i}"
                    data-name="Hand-painted card ${i}"
                    data-price="${price}"
                    data-image="images/cards/c${i}.jpeg">
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    `;

    grid.appendChild(col);
  }
});
