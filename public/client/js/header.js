document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("searchInput");
  const searchResultsContainer = document.getElementById("search-results");
  const suggestionsBlock = document.getElementById("searchSuggestionsBlock"); // Khối gợi ý

  if (searchInput && searchResultsContainer) {
    let timeout = null;

    const showSearchResults = () => {
      const inputBottom = searchInput.getBoundingClientRect().bottom;
      const top = Math.max(0, inputBottom + 8);
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
                  <a href="/products/detail/${item.slug}" class="list-group-item list-group-item-action d-flex align-items-center justify-content-between py-3 border-bottom">
                    <div class="pr-3">
                      <h6 class="mb-1 text-dark font-weight-bold" style="font-size: 14px; line-height: 1.4;">${item.title}</h6>
                      <div class="d-flex align-items-center">
                        <span class="text-danger font-weight-bold mr-2" style="font-size: 13px;">${priceNewStr}</span>
                        ${priceOldStr ? `<span class="text-muted text-decoration-line-through small" style="font-size: 12px;">${priceOldStr}</span>` : ''}
                      </div>
                    </div>
                    <img src="${item.thumbnail}" alt="${item.title}" style="width: 50px; height: 60px; object-fit: cover; border-radius: 4px;" class="flex-shrink-0">
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

