const mongoose = require("mongoose");

module.exports.connect = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);

    // Gỡ TTL cũ đã xóa cả giỏ hàng của tài khoản sau 24 giờ.
    try {
      await mongoose.connection.collection("carts").dropIndex("createdAt_1");
    } catch (error) {
      if (![26, 27].includes(error.code) && !["NamespaceNotFound", "IndexNotFound"].includes(error.codeName)) throw error;
    }

    await mongoose.connection.collection("carts").createIndex(
      { expiresAt: 1 },
      {
        expireAfterSeconds: 0,
      }
    );

    console.log("Connect Success!");
  } catch (error) {
    console.error("Connect Error:", error.message);

    // Đẩy lỗi về nơi gọi hàm để xử lý
    throw error;
  }
};
