// searchOverlay

document.addEventListener('DOMContentLoaded', function () {
  const btnOpenSearch = document.getElementById('btnOpenSearch');
  const btnCloseSearch = document.getElementById('btnCloseSearch');
  const searchOverlay = document.getElementById('searchOverlay');
  const searchInput = document.getElementById('searchInput');

  // Mở Overlay Tìm kiếm
  btnOpenSearch.addEventListener('click', function () {
    searchOverlay.classList.add('active');
    // Focus ngay vào ô nhập liệu sau khi mở
    setTimeout(() => {
      searchInput.focus();
    }, 100);
  });

  // Đóng Overlay khi bấm nút X
  btnCloseSearch.addEventListener('click', function () {
    searchOverlay.classList.remove('active');
  });

  // Đóng Overlay khi click ra vùng nền xám bên ngoài
  searchOverlay.addEventListener('click', function (e) {
    if (e.target === searchOverlay) {
      searchOverlay.classList.remove('active');
    }
  });

  // Đóng Overlay khi bấm phím ESC trên bàn phím
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && searchOverlay.classList.contains('active')) {
      searchOverlay.classList.remove('active');
    }
  });
});

// end searchOverlay