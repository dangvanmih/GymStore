# Tích hợp VNPay Sandbox bằng Return URL

## Cấu hình local

1. Sao chép `.env.example` thành `.env`.
2. Điền `VNPAY_TMN_CODE` và `VNPAY_HASH_SECRET` bằng thông tin VNPay cấp cho merchant sandbox. Không đưa `VNPAY_HASH_SECRET` vào frontend hoặc commit lên Git.
3. Đặt `VNPAY_RETURN_URL` về app local, ví dụ `http://localhost:3000/checkout/vnpay-return`.
4. Mở website bằng cùng host đã ghi trong Return URL. Nếu URL là `localhost`, hãy checkout tại `http://localhost:3000`; nếu dùng `127.0.0.1` thì Return URL cũng phải dùng `127.0.0.1` để trình duyệt gửi đúng cookie khách.
5. Khởi động lại app sau khi sửa `.env`.

Không cần ngrok cho luồng Return URL này vì trình duyệt của khách mở lại địa chỉ local trên chính máy đang thử nghiệm. Không cấu hình IPN trong luồng hiện tại.

## Luồng xử lý

- Checkout tạo đơn trong database trước khi chuyển khách sang VNPay. Số tiền lấy từ order phía server và gửi theo đơn vị VND nhân 100.
- Return URL xác minh HMAC-SHA512, mã merchant, mã tham chiếu và số tiền trước khi cập nhật trạng thái thanh toán.
- Trạng thái giao hàng vẫn riêng với trạng thái thanh toán. Admin chỉ xác nhận xử lý đơn VNPay sau khi thanh toán thành công.

Lưu ý: nếu khách thanh toán xong nhưng đóng trình duyệt trước khi VNPay chuyển về Return URL, ứng dụng không nhận được callback để cập nhật trạng thái. Khi cần xử lý trường hợp đó tự động, cần bật lại IPN với endpoint HTTPS công khai.

Tham khảo tài liệu chính thức: [Tích hợp thanh toán PAY](https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html), [Bảng mã lỗi](https://sandbox.vnpayment.vn/apis/docs/bang-ma-loi/).
