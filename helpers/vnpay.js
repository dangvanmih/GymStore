const crypto = require("crypto");

const encodeValue = value => encodeURIComponent(String(value)).replace(/%20/g, "+");

const getSortedParams = params => Object.keys(params)
  .filter(key => key.startsWith("vnp_") && !["vnp_SecureHash", "vnp_SecureHashType"].includes(key))
  .sort()
  .reduce((result, key) => {
    if (Array.isArray(params[key]) || params[key] === undefined || params[key] === null) {
      throw new Error(`Tham số VNPay không hợp lệ: ${key}`);
    }
    result[key] = params[key];
    return result;
  }, {});

const getSignData = params => Object.keys(params)
  .map(key => `${key}=${encodeValue(params[key])}`)
  .join("&");

const createSignature = (params, secret) => crypto
  .createHmac("sha512", secret)
  .update(getSignData(getSortedParams(params)), "utf8")
  .digest("hex");

module.exports.isConfigured = () => Boolean(
  process.env.VNPAY_TMN_CODE &&
  process.env.VNPAY_HASH_SECRET &&
  process.env.VNPAY_RETURN_URL
);

module.exports.createPaymentUrl = (order, req) => {
  const tmnCode = process.env.VNPAY_TMN_CODE;
  const hashSecret = process.env.VNPAY_HASH_SECRET;
  const returnUrl = process.env.VNPAY_RETURN_URL;
  const paymentUrl = process.env.VNPAY_PAYMENT_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
  if (!tmnCode || !hashSecret || !returnUrl) throw new Error("Chưa cấu hình đủ thông tin VNPay trong file .env.");

  const now = new Date();
  const dateFormatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23"
  });
  const getDateString = date => {
    const parts = Object.fromEntries(dateFormatter.formatToParts(date).map(part => [part.type, part.value]));
    return `${parts.year}${parts.month}${parts.day}${parts.hour}${parts.minute}${parts.second}`;
  };
  const expireDate = new Date(now.getTime() + 15 * 60 * 1000);
  let ipAddress = String(req.ip || req.socket.remoteAddress || "127.0.0.1").replace(/^::ffff:/, "");
  if (ipAddress === "::1") ipAddress = "127.0.0.1";
  const params = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: tmnCode,
    vnp_Amount: String(Math.round(order.total * 100)),
    vnp_CurrCode: "VND",
    vnp_TxnRef: order.paymentTxnRef,
    vnp_OrderInfo: `Thanh toan don hang ${order.orderNumber}`,
    vnp_OrderType: "other",
    vnp_Locale: "vn",
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr: ipAddress,
    vnp_CreateDate: getDateString(now),
    vnp_ExpireDate: getDateString(expireDate)
  };

  const signData = getSignData(getSortedParams(params));
  const secureHash = crypto.createHmac("sha512", hashSecret).update(signData, "utf8").digest("hex");
  const query = Object.keys(params).sort().map(key => `${key}=${encodeValue(params[key])}`).join("&");
  return `${paymentUrl}?${query}&vnp_SecureHash=${secureHash}`;
};

module.exports.verifyResponse = params => {
  const secureHash = String(params.vnp_SecureHash || "");
  if (!/^[a-f\d]{128}$/i.test(secureHash) || !process.env.VNPAY_HASH_SECRET) return false;
  let expectedHash;
  try {
    expectedHash = createSignature(params, process.env.VNPAY_HASH_SECRET);
  } catch (error) {
    return false;
  }
  const expected = Buffer.from(expectedHash, "hex");
  const received = Buffer.from(secureHash, "hex");
  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
};
