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


// scroll-header
let lastScroll = window.scrollY;
let lastHeaderDirectionChange = lastScroll;
const header = document.querySelector(".header");

if (header) {
  window.addEventListener("scroll", () => {
    const currentScroll = window.scrollY;
    const direction = Math.sign(currentScroll - lastScroll);

    if (currentScroll < 80) {
      header.classList.remove("hide");
      lastHeaderDirectionChange = currentScroll;
    } else if (direction && Math.abs(currentScroll - lastHeaderDirectionChange) >= 8) {
      header.classList.toggle("hide", direction > 0);
      lastHeaderDirectionChange = currentScroll;
    }

    lastScroll = currentScroll;
  }, { passive: true });
}

//end-scrol-header


// tăng giảm số lượng sản phẩm
document.addEventListener("DOMContentLoaded", () => {
  const btnQtyList = document.querySelectorAll("[action-qty]");

  btnQtyList.forEach((btn) => {
    btn.addEventListener("click", () => {
      const action = btn.getAttribute("action-qty");
      const input = btn.parentElement.querySelector("input[name='quantity']");
      if (!input) return;

      let currentVal = parseInt(input.value) || 1;
      const min = parseInt(input.getAttribute("min")) || 1;
      const max = parseInt(input.getAttribute("max")) || 999;

      if (action === "minus") {
        if (currentVal > min) input.value = currentVal - 1;
      } else if (action === "plus") {
        if (currentVal < max) input.value = currentVal + 1;
      }
    });
  });
});

// trượt banner
document.addEventListener("DOMContentLoaded", function () {
  // Khởi tạo Swiper cho Slider Banner Trang Chủ
  const homeBannerSwiper = new Swiper('.main-home-slider', {
    loop: true,               // Cho phép lặp vô hạn vòng slider
    speed: 800,               // Tốc độ chuyển slide (mili-giây)
    autoplay: {
      delay: 5000,            // Thời gian tự động chuyển slide (5 giây)
      disableOnInteraction: false, // Tiếp tục chạy autoplay sau khi người dùng bấm nút chuyển
    },
    pagination: {
      el: '.swiper-pagination',
      clickable: true,        // Cho phép bấm vào dấu chấm để chuyển slide
    },
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev',
    },
    effect: 'slide',          // Hiệu ứng trượt ngang
  });
});

// Xử lý ẩn thông báo Flash (Alert)
const showAlert = document.querySelector("[show-alert]");
if (showAlert) {
  const time = parseInt(showAlert.getAttribute("data-time")) || 3000;
  const closeAlert = showAlert.querySelector("[close-alert]");

  // Tự động ẩn sau khoảng thời gian 'data-time'
  setTimeout(() => {
    showAlert.classList.add("alert-hidden");
  }, time);

  // Nút đóng thủ công
  if (closeAlert) {
    closeAlert.addEventListener("click", () => {
      showAlert.classList.add("alert-hidden");
    });
  }
};

//xử lý nhập lại password
const formRegister = document.querySelector("form[action*='/user/register']");
if (formRegister) {
  formRegister.addEventListener("submit", (e) => {
    const password = formRegister.querySelector("input[name='password']").value;
    const confirmPassword = formRegister.querySelector("input[name='confirmPassword']").value;

    if (password !== confirmPassword) {
      e.preventDefault(); // Ngăn chặn không cho form submit lên server
      alert("Mật khẩu nhập lại không khớp! Vui lòng kiểm tra lại.");
    }
  });
}
