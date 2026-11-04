const Product = require('../../models/product.model');
const Order = require('../../models/order.model');
const filterStatusHelper = require('../../helpers/filterStatus');
const searchHelper = require('../../helpers/search');
const paginationHelper = require('../../helpers/pagination');

module.exports.index = async (req, res) => {
  const status = ['active', 'inactive'].includes(req.query.status) ? req.query.status : '';
  const filterStatus = filterStatusHelper({ ...req, query: { ...req.query, status } });
  if (req.query.stock === 'out' && !status) {
    const allStatusFilter = filterStatus.find(item => item.status === '');
    if (allStatusFilter) allStatusFilter.class = '';
  }
  const search = searchHelper(req);
  const findQuery = { deleted: false };

  if (status) findQuery.status = status;
  if (search.regex) findQuery.title = search.regex;
  if (req.query.stock === 'out') {
    findQuery.$expr = {
      $eq: [
        { $cond: ['$hasVariants', { $sum: { $ifNull: ['$variants.stock', []] } }, { $ifNull: ['$stock', 0] }] },
        0
      ]
    };
  }

  const countProducts = await Product.countDocuments(findQuery);
  const pagination = paginationHelper({ currentPage: 1, limitItems: 10 }, countProducts, req);
  const products = await Product.find(findQuery)
    .select('title stock hasVariants variants status')
    .sort({ title: 1 })
    .skip(pagination.skipItems)
    .limit(pagination.limitItems)
    .lean();

  const productIds = products.map(product => String(product._id));
  const soldRows = productIds.length
    ? await Order.aggregate([
      { $unwind: '$products' },
      { $match: { 'products.product_id': { $in: productIds } } },
      {
        $group: {
          _id: {
            productId: '$products.product_id',
            size: { $ifNull: ['$products.size', ''] },
            color: { $ifNull: ['$products.color', ''] }
          },
          quantity: { $sum: '$products.quantity' }
        }
      }
    ])
    : [];
  const soldByVariant = new Map(soldRows.map(row => [
    `${row._id.productId}|${row._id.size}|${row._id.color}`,
    row.quantity
  ]));

  const inventoryProducts = products.map(product => {
    const inventoryVariants = product.hasVariants
      ? (product.variants || []).map(variant => {
        const key = `${product._id}|${variant.size || ''}|${variant.color || ''}`;
        const remaining = Number(variant.stock) || 0;
        const sold = soldByVariant.get(key) || 0;
        return { ...variant, remaining, sold, totalQuantity: remaining + sold };
      })
      : [];
    const remaining = product.hasVariants
      ? inventoryVariants.reduce((sum, variant) => sum + variant.remaining, 0)
      : Number(product.stock) || 0;
    const sold = product.hasVariants
      ? inventoryVariants.reduce((sum, variant) => sum + variant.sold, 0)
      : soldByVariant.get(`${product._id}||`) || 0;
    return { ...product, inventoryVariants, remaining, sold, totalQuantity: remaining + sold };
  });

  res.render('admin/pages/inventory/index', {
    pageTitle: 'Quản lý tồn kho',
    products: inventoryProducts,
    filterStatus,
    keyword: search.keyword,
    stockFilter: req.query.stock || '',
    pagination
  });
};
