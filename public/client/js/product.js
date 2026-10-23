document.addEventListener("DOMContentLoaded", () => {
  // Lấy dữ liệu variants trực tiếp từ thuộc tính data-variants trên HTML
  const pageContainer = document.querySelector(".product-detail-page");
  let productVariants = [];
  
  if (pageContainer && pageContainer.dataset.variants) {
    try {
      productVariants = JSON.parse(pageContainer.dataset.variants);
    } catch (e) {
      productVariants = [];
    }
  }

  const colorButtons = document.querySelectorAll(".color-item");
  const sizeButtons = document.querySelectorAll(".size-item");
  const priceNewEl = document.getElementById("product-price-new");
  const priceOldEl = document.getElementById("product-price-old");
  const inputSize = document.getElementById("input-selected-size");
  const inputColor = document.getElementById("input-selected-color");

  let selectedColor = document.querySelector(".color-item.active")?.getAttribute("data-color") || "";
  let selectedSize = document.querySelector(".size-item.active")?.getAttribute("data-size") || "";

  function updatePriceAndVariant() {
    if (!productVariants.length) return;

    let matchedVariant = productVariants.find(v => 
      (!selectedColor || v.color === selectedColor) && 
      (!selectedSize || v.size === selectedSize)
    );

    if (!matchedVariant) {
      matchedVariant = productVariants.find(v => v.size === selectedSize) || productVariants[0];
    }

    if (matchedVariant) {
      const newPrice = Number(matchedVariant.priceNew || matchedVariant.price);
      const oldPrice = Number(matchedVariant.price);

      if (priceNewEl && !isNaN(newPrice)) {
        priceNewEl.innerText = newPrice.toLocaleString('vi-VN') + "đ";
      }
      if (priceOldEl && !isNaN(oldPrice) && oldPrice > newPrice) {
        priceOldEl.innerText = oldPrice.toLocaleString('vi-VN') + "đ";
        priceOldEl.style.display = "inline-block";
      } else if (priceOldEl) {
        priceOldEl.style.display = "none";
      }

      if (inputSize) inputSize.value = matchedVariant.size || "";
      if (inputColor) inputColor.value = matchedVariant.color || "";
    }
  }

  colorButtons.forEach(button => {
    button.addEventListener("click", function() {
      colorButtons.forEach(btn => {
        btn.classList.remove("active", "btn-dark", "text-white");
        btn.classList.add("btn-outline-dark");
      });
      this.classList.add("active", "btn-dark", "text-white");
      this.classList.remove("btn-outline-dark");

      selectedColor = this.getAttribute("data-color");
      updatePriceAndVariant();
    });
  });

  sizeButtons.forEach(button => {
    button.addEventListener("click", function() {
      sizeButtons.forEach(btn => {
        btn.classList.remove("active", "btn-dark", "text-white");
        btn.classList.add("btn-outline-dark");
      });
      this.classList.add("active", "btn-dark", "text-white");
      this.classList.remove("btn-outline-dark");

      selectedSize = this.getAttribute("data-size");
      updatePriceAndVariant();
    });
  });
});