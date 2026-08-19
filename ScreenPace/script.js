(function () {
  const config = window.ScreenPaceSite || {};

  document.querySelectorAll("[data-current-year]").forEach((element) => {
    element.textContent = new Date().getFullYear();
  });

  document.querySelectorAll("[data-price]").forEach((element) => {
    if (config.price) element.textContent = config.price;
  });

  document.querySelectorAll("[data-price-label]").forEach((element) => {
    if (config.priceLabel) element.textContent = config.priceLabel;
  });

  document.querySelectorAll("[data-support-email]").forEach((element) => {
    if (!config.supportEmail) return;
    element.textContent = config.supportEmail;
    if (element.tagName === "A") {
      element.href = `mailto:${config.supportEmail}`;
    }
  });

  document.querySelectorAll("[data-app-store-link]").forEach((link) => {
    if (config.appStoreURL) {
      link.href = config.appStoreURL;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.removeAttribute("aria-disabled");
      link.querySelectorAll("[data-app-cta-label]").forEach((label) => {
        label.textContent = "Get ScreenPace";
      });
      return;
    }

    link.href = "#pricing";
    link.setAttribute("aria-disabled", "true");
    link.classList.add("is-coming-soon");
  });
})();
