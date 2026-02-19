document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('OnlineClassGrid');

  if (!grid) return;

  for (let i = 1; i <= 1; i++) {
    const col = document.createElement('div');
    const price = 50.00;
    const link = (i == 1) ? "SunFlowerClass.html" : "RoseClass.html";
    
    col.className = 'col-6 col-md-4 col-lg-2 mb-4';

    col.innerHTML = `
      <div class="product-item">
      <a href="${link}" class="stretched-link"></a> 
        <img src="images/onlineclass/o${i}.jpeg" 
             alt="Hand-painted watercolor Bookmark Live Workshop"

             class="img-fluid"
             id ="onlineclass${i}"
             loading="lazy">
             

        <div class="product-overlay">
          <div class="product-overlay-inner">
            <p class="product-price">$${price}</p>

            
          </div>
        </div>
      </div>
    `;

    grid.appendChild(col);
  }
});
