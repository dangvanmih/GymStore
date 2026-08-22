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


//scroll web
document.addEventListener("DOMContentLoaded", function () {
  const lenis = new Lenis({
    duration: 0.17,      // Thời gian mượt (giảm số này thì nhanh hơn, tăng thì chậm hơn)
    easing: (t) => t,   // Hàm easing, có thể custom
    smooth: true,
  });

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }

  requestAnimationFrame(raf);
});
//end-scroll-web

// scroll-header
let lastScroll = 0; //vị trí scroll của lần trước
const header = document.querySelector(".header");

window.addEventListener("scroll", () => {
  const currentScroll = window.scrollY;

  if (currentScroll > lastScroll) { //đang scroll xuống
    // scroll xuống
    header.classList.add("hide");

  } else { //đang scroll lên
    // scroll lên
    header.classList.remove("hide");
  }

  lastScroll = currentScroll; // sau mỗi lần scroll thì gán lại vị trí scroll mới nhất
});

//end-scrol-header