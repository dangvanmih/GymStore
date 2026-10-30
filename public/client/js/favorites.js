document.addEventListener("submit", async event => {
  const form = event.target.closest("form[data-favorite-form]");
  if (!form) return;

  event.preventDefault();
  const button = form.querySelector(".favorite-toggle-button");
  if (!button || button.disabled) return;

  button.disabled = true;
  try {
    const response = await fetch(form.action, {
      method: "POST",
      headers: { "X-Requested-With": "XMLHttpRequest" }
    });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error("Không thể cập nhật sản phẩm yêu thích.");

    const icon = button.querySelector("i");
    icon.classList.toggle("fa-solid", data.isFavorite);
    icon.classList.toggle("fa-regular", !data.isFavorite);
    button.setAttribute("aria-label", data.isFavorite ? "Xóa khỏi yêu thích" : "Thêm vào yêu thích");
    button.title = data.isFavorite ? "Xóa khỏi yêu thích" : "Thêm vào yêu thích";

    const favoriteLink = document.querySelector(".favorite-link");
    if (favoriteLink) {
      let badge = favoriteLink.querySelector(".favorite-badge");
      if (data.favoriteCount > 0) {
        if (!badge) {
          badge = document.createElement("span");
          badge.className = "favorite-badge";
          favoriteLink.appendChild(badge);
        }
        badge.textContent = data.favoriteCount;
      } else if (badge) {
        badge.remove();
      }
    }

    if (!data.isFavorite && window.location.pathname === "/favorites") {
      form.closest(".favorite-product-card")?.remove();
      const productList = document.getElementById("favorite-products");
      if (productList && !productList.querySelector(".favorite-product-card")) {
        productList.classList.add("d-none");
        document.getElementById("favorite-empty")?.classList.remove("d-none");
      }
    }
  } catch (error) {
    window.alert(error.message || "Không thể cập nhật sản phẩm yêu thích.");
  } finally {
    button.disabled = false;
  }
});
