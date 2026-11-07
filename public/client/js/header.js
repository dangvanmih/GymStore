// xử lý menu mobile

document.addEventListener("DOMContentLoaded", () => {
  const mobileMenuButton = document.getElementById("btnMobileMenu");
  const mobileNavigation = document.getElementById("mobileNavigation");

  if (mobileMenuButton && mobileNavigation) {
    const closeMobileMenu = () => {
      mobileNavigation.classList.remove("is-open");
      mobileNavigation.setAttribute("aria-hidden", "true");
      mobileMenuButton.setAttribute("aria-expanded", "false");
      mobileMenuButton.setAttribute("aria-label", "Mở menu");
      mobileMenuButton.innerHTML = '<i class="fa-solid fa-bars" aria-hidden="true"></i>';
    };

    mobileMenuButton.addEventListener("click", () => {
      const isOpen = mobileNavigation.classList.toggle("is-open");
      mobileNavigation.setAttribute("aria-hidden", String(!isOpen));
      mobileMenuButton.setAttribute("aria-expanded", String(isOpen));
      mobileMenuButton.setAttribute("aria-label", isOpen ? "Đóng menu" : "Mở menu");
      mobileMenuButton.innerHTML = `<i class="fa-solid fa-${isOpen ? "xmark" : "bars"}" aria-hidden="true"></i>`;
    });

    mobileNavigation.addEventListener("click", event => {
      if (event.target.closest("a")) closeMobileMenu();
    });

    document.addEventListener("keydown", event => {
      if (event.key === "Escape") closeMobileMenu();
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth >= 992) closeMobileMenu();
    });
  }


// Xử lý tìm kiếm sản phẩm


  const searchInput = document.getElementById("searchInput");
  const searchResultsContainer = document.getElementById("search-results");
  const suggestionsBlock = document.getElementById("searchSuggestionsBlock"); // Khối gợi ý

  if (searchInput && searchResultsContainer) {
    let timeout = null;

    const showSearchResults = () => {
      const inputRect = searchInput.getBoundingClientRect();
      const top = Math.max(0, inputRect.bottom + 8);
      const width = Math.min(inputRect.width, window.innerWidth - 24);
      const left = Math.max(12, Math.min(inputRect.left, window.innerWidth - width - 12));
      searchResultsContainer.style.left = `${left}px`;
      searchResultsContainer.style.right = "auto";
      searchResultsContainer.style.width = `${width}px`;
      searchResultsContainer.style.top = `${top}px`;
      searchResultsContainer.style.maxHeight = `${Math.max(0, window.innerHeight - top - 12)}px`;
      searchResultsContainer.style.display = "block";
    };

    searchInput.addEventListener("input", function() {
      clearTimeout(timeout);
      const keyword = this.value.trim();

      if (keyword.length === 0) {
        searchResultsContainer.style.display = "none";
        searchResultsContainer.innerHTML = "";
        if (suggestionsBlock) suggestionsBlock.style.display = "block"; // Hiện lại gợi ý khi xóa trống ô input
        return;
      }

      // Khi bắt đầu gõ, bạn có thể ẩn khối gợi ý từ khóa đi để nhường chỗ hoàn toàn cho danh sách sản phẩm
      if (suggestionsBlock) suggestionsBlock.style.display = "none";

      timeout = setTimeout(() => {
        fetch(`/products/api/search?keyword=${encodeURIComponent(keyword)}`)
          .then(res => res.json())
          .then(data => {
            if (data.products && data.products.length > 0) {
              let html = '<div class="list-group list-group-flush shadow-sm bg-white rounded border">';
              
              data.products.forEach(item => {
                const priceNewStr = item.priceNew ? item.priceNew.toLocaleString('vi-VN') + 'đ' : '';
                const priceOldStr = item.price && item.price > item.priceNew ? item.price.toLocaleString('vi-VN') + 'đ' : '';

                html += `
                  <a href="/products/detail/${item.slug}" class="list-group-item list-group-item-action search-result-item">
                    <div class="search-result-info">
                      <h6 class="mb-1 text-dark font-weight-bold" style="font-size: 14px; line-height: 1.4;">${item.title}</h6>
                      <div class="d-flex align-items-center">
                        <span class="text-danger font-weight-bold mr-2" style="font-size: 13px;">${priceNewStr}</span>
                        ${priceOldStr ? `<span class="text-muted text-decoration-line-through small" style="font-size: 12px;">${priceOldStr}</span>` : ''}
                      </div>
                    </div>
                    <img src="${item.thumbnail}" alt="${item.title}" class="search-result-image">
                  </a>
                `;
              });

              html += `
                <div class="text-center py-2 bg-light">
                  <a href="/products/search?q=${encodeURIComponent(data.keyword)}" 
                     onclick="event.preventDefault(); window.location.href=this.href;" 
                     class="text-dark font-weight-bold small text-decoration-none d-block">
                    Xem thêm ${data.total} sản phẩm &rarr;
                  </a>
                </div>
              `;
              
              html += '</div>';
              searchResultsContainer.innerHTML = html;
              showSearchResults();
            } else {
              searchResultsContainer.innerHTML = `
                <div class="text-center py-3 text-muted small bg-white border rounded">
                  Không tìm thấy sản phẩm nào phù hợp với "<strong>${keyword}</strong>"
                </div>
              `;
              showSearchResults();
            }
          })
          .catch(err => console.log("Lỗi tìm kiếm:", err));
      }, 300);
    });
  }
});

