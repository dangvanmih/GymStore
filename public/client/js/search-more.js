document.addEventListener("DOMContentLoaded", () => {
  const button = document.getElementById("load-more-search");
  const productList = document.getElementById("search-product-list");
  const errorMessage = document.getElementById("load-more-error");

  if (!button || !productList) return;

  button.addEventListener("click", async () => {
    const loaded = Number(button.dataset.loaded) || 0;
    button.disabled = true;
    button.textContent = "Đang tải...";
    errorMessage?.classList.add("d-none");

    try {
      const params = new URLSearchParams({ q: button.dataset.query || "", skip: String(loaded) });
      const response = await fetch(`/products/search/more?${params}`);
      if (!response.ok) throw new Error("Request failed");

      const data = await response.json();
      productList.insertAdjacentHTML("beforeend", data.html);
      button.dataset.loaded = String(data.loaded);

      if (data.loaded >= data.total) {
        button.parentElement.remove();
      } else {
        button.disabled = false;
        button.textContent = "Xem thêm";
      }
    } catch (error) {
      button.disabled = false;
      button.textContent = "Xem thêm";
      errorMessage?.classList.remove("d-none");
    }
  });
});
