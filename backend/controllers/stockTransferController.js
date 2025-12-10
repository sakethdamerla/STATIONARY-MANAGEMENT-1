const { StockTransfer, TransferBranch } = require('../models/stockTransferModel');
const { Product } = require('../models/productModel');
const { Transaction } = require('../models/transactionModel');
const asyncHandler = require('express-async-handler');

/**
 * @desc    Get all transfer branches (campuses/stations)
 * @route   GET /api/stock-transfers/branches
 * @access  Public
 */
const getBranches = asyncHandler(async (req, res) => {
  const { activeOnly, withStock } = req.query;
  const filter = {};
  
  if (activeOnly === 'true') {
    filter.isActive = true;
  }

  let query = TransferBranch.find(filter);

  if (withStock === 'true') {
    query = query.populate('stock.product', 'name price category');
  }

  const branches = await query.sort({ name: 1 });

  res.json(branches);
});

/**
 * @desc    Get branch stock for a specific product
 * @route   GET /api/stock-transfers/branches/:id/stock/:productId
 * @access  Public
 */
const getBranchStock = asyncHandler(async (req, res) => {
  const branch = await TransferBranch.findById(req.params.id)
    .populate('stock.product', 'name price category');

  if (!branch) {
    res.status(404);
    throw new Error('Branch not found');
  }

  const { productId } = req.params;
  const stockEntry = branch.stock.find(
    (s) => s.product._id.toString() === productId
  );

  res.json({
    branch: branch.name,
    productId,
    quantity: stockEntry ? stockEntry.quantity : 0,
    product: stockEntry ? stockEntry.product : null,
  });
});

/**
 * @desc    Get all products stock for a branch
 * @route   GET /api/stock-transfers/branches/:id/stock
 * @access  Public
 */
const getBranchStockAll = asyncHandler(async (req, res) => {
  const branch = await TransferBranch.findById(req.params.id)
    .populate('stock.product', 'name price category stock');

  if (!branch) {
    res.status(404);
    throw new Error('Branch not found');
  }

  res.json({
    branch: {
      _id: branch._id,
      name: branch.name,
      location: branch.location,
    },
    stock: branch.stock || [],
  });
});

/**
 * @desc    Create a new transfer branch (campus/station)
 * @route   POST /api/stock-transfers/branches
 * @access  Public
 */
const createBranch = asyncHandler(async (req, res) => {
  const { name, location, description } = req.body;

  if (!name || !name.trim()) {
    res.status(400);
    throw new Error('Branch name is required');
  }

  // Check if branch with same name already exists
  const existingBranch = await TransferBranch.findOne({ 
    name: name.trim() 
  });

  if (existingBranch) {
    res.status(400);
    throw new Error('Branch with this name already exists');
  }

  const branch = new TransferBranch({
    name: name.trim(),
    location: location?.trim() || '',
    description: description?.trim() || '',
    isActive: true,
  });

  const createdBranch = await branch.save();
  res.status(201).json(createdBranch);
});

/**
 * @desc    Update a transfer branch
 * @route   PUT /api/stock-transfers/branches/:id
 * @access  Public
 */
const updateBranch = asyncHandler(async (req, res) => {
  const branch = await TransferBranch.findById(req.params.id);

  if (!branch) {
    res.status(404);
    throw new Error('Branch not found');
  }

  const { name, location, description, isActive } = req.body;

  if (name !== undefined && name.trim()) {
    // Check if another branch with this name exists
    const existingBranch = await TransferBranch.findOne({ 
      name: name.trim(),
      _id: { $ne: req.params.id }
    });

    if (existingBranch) {
      res.status(400);
      throw new Error('Branch with this name already exists');
    }

    branch.name = name.trim();
  }

  if (location !== undefined) branch.location = location.trim();
  if (description !== undefined) branch.description = description.trim();
  if (isActive !== undefined) branch.isActive = Boolean(isActive);

  const updated = await branch.save();
  res.json(updated);
});

/**
 * @desc    Delete a transfer branch
 * @route   DELETE /api/stock-transfers/branches/:id
 * @access  Public
 */
const deleteBranch = asyncHandler(async (req, res) => {
  const branch = await TransferBranch.findById(req.params.id);

  if (!branch) {
    res.status(404);
    throw new Error('Branch not found');
  }

  // Check if branch is used in any transfers
  const transfersCount = await StockTransfer.countDocuments({
    toBranch: req.params.id
  });

  if (transfersCount > 0) {
    res.status(400);
    throw new Error(`Cannot delete branch. It is used in ${transfersCount} transfer(s).`);
  }

  // Check if branch has any stock
  if (branch.stock && branch.stock.length > 0) {
    const totalStock = branch.stock.reduce((sum, item) => sum + (item.quantity || 0), 0);
    if (totalStock > 0) {
      res.status(400);
      throw new Error(`Cannot delete branch. It has ${totalStock} items in stock. Please transfer or clear stock first.`);
    }
  }

  await TransferBranch.findByIdAndDelete(req.params.id);
  res.json({ message: 'Branch deleted successfully' });
});

/**
 * @desc    Create a new stock transfer (from central stock to branch)
 * @route   POST /api/stock-transfers
 * @access  Public
 */
const createStockTransfer = asyncHandler(async (req, res) => {
  const { items, toBranch, transferDate, isPaid, deductFromCentral, includeInRevenue, remarks, createdBy } = req.body;

  // Validate required fields
  if (!items || !Array.isArray(items) || items.length === 0) {
    res.status(400);
    throw new Error('At least one product item is required');
  }

  if (!toBranch) {
    res.status(400);
    throw new Error('Destination branch is required');
  }

  // Verify branch exists and is active
  const toBranchDoc = await TransferBranch.findById(toBranch);
  if (!toBranchDoc || !toBranchDoc.isActive) {
    res.status(404);
    throw new Error('Destination branch not found or inactive');
  }

  // Validate and verify products
  const productIds = items.map(item => item.product).filter(Boolean);
  if (productIds.length !== items.length) {
    res.status(400);
    throw new Error('All items must have a product ID');
  }

  const productDocs = await Product.find({ _id: { $in: productIds } });
  if (productDocs.length !== productIds.length) {
    res.status(404);
    throw new Error('One or more products not found');
  }

  const productMap = new Map(productDocs.map(p => [p._id.toString(), p]));

  // Validate quantities and check stock
  const transferItems = [];
  const shouldDeductStock = deductFromCentral !== undefined ? Boolean(deductFromCentral) : true;
  
  for (const item of items) {
    const quantity = Number(item.quantity);
    if (!quantity || quantity < 1) {
      res.status(400);
      throw new Error(`Invalid quantity for product ${item.product}`);
    }

    const product = productMap.get(item.product.toString());
    if (!product) {
      res.status(404);
      throw new Error(`Product ${item.product} not found`);
    }

    // Only check stock if we're going to deduct from central
    if (shouldDeductStock && product.stock < quantity) {
      res.status(400);
      throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${quantity}`);
    }

    transferItems.push({
      product: product._id,
      quantity,
    });
  }

  // Create transfer (status: pending)
  const stockTransfer = new StockTransfer({
    items: transferItems,
    toBranch,
    transferDate: transferDate ? new Date(transferDate) : new Date(),
    isPaid: isPaid !== undefined ? Boolean(isPaid) : false,
    deductFromCentral: deductFromCentral !== undefined ? Boolean(deductFromCentral) : true,
    includeInRevenue: includeInRevenue !== undefined ? Boolean(includeInRevenue) : true,
    remarks: remarks?.trim() || '',
    createdBy: createdBy?.trim() || 'System',
    status: 'pending',
  });

  const createdTransfer = await stockTransfer.save();

  // Populate the products and branch for response
  await createdTransfer.populate('items.product', 'name price stock category');
  await createdTransfer.populate('toBranch', 'name location');

  res.status(201).json(createdTransfer);
});

/**
 * @desc    Get all stock transfers
 * @route   GET /api/stock-transfers
 * @access  Public
 */
const getStockTransfers = asyncHandler(async (req, res) => {
  const { product, toBranch, status, isPaid, startDate, endDate } = req.query;
  const filter = {};

  if (product) filter['items.product'] = product;
  if (toBranch) filter.toBranch = toBranch;
  if (status) filter.status = status;
  if (isPaid !== undefined && isPaid !== '') filter.isPaid = isPaid === 'true';
  if (startDate || endDate) {
    filter.transferDate = {};
    if (startDate) filter.transferDate.$gte = new Date(startDate);
    if (endDate) filter.transferDate.$lte = new Date(endDate + 'T23:59:59');
  }

  const stockTransfers = await StockTransfer.find(filter)
    .populate('items.product', 'name price stock category')
    .populate('toBranch', 'name location')
    .populate('transactionId', 'transactionId totalAmount paymentMethod isPaid transactionType')
    .sort({ transferDate: -1, createdAt: -1 });

  res.json(stockTransfers);
});

/**
 * @desc    Get a single stock transfer by ID
 * @route   GET /api/stock-transfers/:id
 * @access  Public
 */
const getStockTransferById = asyncHandler(async (req, res) => {
  const stockTransfer = await StockTransfer.findById(req.params.id)
    .populate('items.product', 'name price stock category')
    .populate('toBranch', 'name location description')
    .populate('transactionId', 'transactionId totalAmount paymentMethod isPaid transactionType createdAt');

  if (!stockTransfer) {
    res.status(404);
    throw new Error('Stock transfer not found');
  }

  res.json(stockTransfer);
});

/**
 * @desc    Update a stock transfer (mark as completed or cancelled)
 * @route   PUT /api/stock-transfers/:id
 * @access  Public
 */
const updateStockTransfer = asyncHandler(async (req, res) => {
  const stockTransfer = await StockTransfer.findById(req.params.id);
  
  if (!stockTransfer) {
    res.status(404);
    throw new Error('Stock transfer not found');
  }

  const { status, isPaid, remarks, deductFromCentral, includeInRevenue } = req.body;

  // Validate status transitions - prevent invalid transitions
  if (status && ['pending', 'completed', 'cancelled'].includes(status)) {
    const oldStatus = stockTransfer.status;
    
    // Prevent invalid status transitions
    if (oldStatus === 'completed' && status === 'pending') {
      res.status(400);
      throw new Error('Cannot change status from completed to pending');
    }
    if (oldStatus === 'cancelled' && status === 'pending') {
      res.status(400);
      throw new Error('Cannot change status from cancelled to pending');
    }
    if (oldStatus === 'completed' && status === 'cancelled') {
      res.status(400);
      throw new Error('Cannot cancel a completed transfer');
    }
    
    stockTransfer.status = status;

    // Set completion or cancellation timestamp
    if (status === 'completed' && oldStatus !== 'completed') {
      stockTransfer.completedAt = new Date();
    } else if (status === 'cancelled' && oldStatus !== 'cancelled') {
      stockTransfer.cancelledAt = new Date();
    }

    // If completing a transfer, we can optionally update product stock here
    // For now, we'll just record the transfer status
    // Future enhancement: Implement branch-specific stock tracking
  }

  if (isPaid !== undefined) {
    stockTransfer.isPaid = Boolean(isPaid);
  }

  if (deductFromCentral !== undefined) {
    // Prevent changing deductFromCentral if transfer is already completed
    if (stockTransfer.status === 'completed') {
      res.status(400);
      throw new Error('Cannot modify deductFromCentral for completed transfers');
    }
    stockTransfer.deductFromCentral = Boolean(deductFromCentral);
  }

  if (includeInRevenue !== undefined) {
    // Prevent changing includeInRevenue if transfer is already completed
    if (stockTransfer.status === 'completed') {
      res.status(400);
      throw new Error('Cannot modify includeInRevenue for completed transfers');
    }
    stockTransfer.includeInRevenue = Boolean(includeInRevenue);
  }

  if (remarks !== undefined) {
    stockTransfer.remarks = remarks.trim();
  }

  const updated = await stockTransfer.save();
  await updated.populate('items.product', 'name price stock category');
  await updated.populate('toBranch', 'name location');
  await updated.populate('transactionId', 'transactionId totalAmount paymentMethod isPaid transactionType');

  res.json(updated);
});

/**
 * @desc    Delete a stock transfer and revert stock changes if completed
 * @route   DELETE /api/stock-transfers/:id
 * @access  Public
 */
const deleteStockTransfer = asyncHandler(async (req, res) => {
  const stockTransfer = await StockTransfer.findById(req.params.id)
    .populate('items.product')
    .populate('toBranch');
  
  if (!stockTransfer) {
    res.status(404);
    throw new Error('Stock transfer not found');
  }

  // If transfer is completed, revert stock changes
  if (stockTransfer.status === 'completed') {
    const shouldDeductStock = stockTransfer.deductFromCentral !== false; // Default to true if not set
    const toBranch = stockTransfer.toBranch;
    
    // Revert central stock (add back if it was deducted)
    if (shouldDeductStock && stockTransfer.items && stockTransfer.items.length > 0) {
      const stockReverts = [];
      
      for (const item of stockTransfer.items) {
        const product = item.product;
        const quantity = item.quantity;
        
        if (product && quantity > 0) {
          stockReverts.push({
            updateOne: {
              filter: { _id: product._id },
              update: { $inc: { stock: quantity } }, // Add back the stock
            },
          });
        }
      }
      
      if (stockReverts.length > 0) {
        await Product.bulkWrite(stockReverts);
      }
    }
    
    // Revert branch stock (remove if it was added)
    if (toBranch && toBranch.stock && stockTransfer.items && stockTransfer.items.length > 0) {
      const branchStock = toBranch.stock || [];
      const productStockMap = new Map();
      
      // Create a map of existing stock
      for (const stockItem of branchStock) {
        const productId = stockItem.product?.toString() || stockItem.product;
        if (productId) {
          productStockMap.set(productId, stockItem.quantity || 0);
        }
      }
      
      // Subtract the transferred quantities
      for (const item of stockTransfer.items) {
        const productId = item.product?._id?.toString() || item.product?.toString();
        if (productId) {
          const currentQty = productStockMap.get(productId) || 0;
          const newQty = Math.max(0, currentQty - item.quantity); // Ensure non-negative
          if (newQty > 0) {
            productStockMap.set(productId, newQty);
          } else {
            productStockMap.delete(productId); // Remove if quantity becomes 0
          }
        }
      }
      
      // Convert map back to array format
      const updatedBranchStock = Array.from(productStockMap.entries()).map(([productId, quantity]) => ({
        product: productId,
        quantity,
      }));
      
      toBranch.stock = updatedBranchStock;
      await toBranch.save();
    }
    
    // Delete associated transaction if exists
    if (stockTransfer.transactionId) {
      await Transaction.findByIdAndDelete(stockTransfer.transactionId);
    }
  }

  // Delete the transfer
  await StockTransfer.findByIdAndDelete(req.params.id);

  res.json({ message: 'Stock transfer deleted successfully. Stock changes have been reverted.' });
});

/**
 * @desc    Complete a stock transfer (deduct from central stock, create transaction)
 * @route   POST /api/stock-transfers/:id/complete
 * @access  Public
 */
const completeStockTransfer = asyncHandler(async (req, res) => {
  const stockTransfer = await StockTransfer.findById(req.params.id)
    .populate('items.product')
    .populate('toBranch');
  
  if (!stockTransfer) {
    res.status(404);
    throw new Error('Stock transfer not found');
  }

  if (stockTransfer.status !== 'pending') {
    res.status(400);
    throw new Error(`Transfer is already ${stockTransfer.status}`);
  }

  const toBranch = stockTransfer.toBranch;
  const shouldDeductStock = stockTransfer.deductFromCentral !== false; // Default to true if not set
  const shouldIncludeInRevenue = stockTransfer.includeInRevenue !== false; // Default to true if not set
  
  // Re-fetch products to get latest stock values (populated data might be stale)
  const productIds = stockTransfer.items.map(item => item.product._id || item.product);
  const currentProducts = await Product.find({ _id: { $in: productIds } });
  const productMap = new Map(currentProducts.map(p => [p._id.toString(), p]));
  
  // Validate stock for all items (only if deducting from central)
  const stockUpdates = [];
  const branchStockUpdates = [];
  const transactionItems = [];
  let totalAmount = 0;

  for (const item of stockTransfer.items) {
    const productId = item.product._id?.toString() || item.product?.toString();
    const product = productMap.get(productId);
    const quantity = item.quantity;

    if (!product) {
      res.status(404);
      throw new Error(`Product not found: ${productId}`);
    }

    // Check if stock is still sufficient (only if deducting from central)
    if (shouldDeductStock && product.stock < quantity) {
      res.status(400);
      throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}, Required: ${quantity}`);
    }

    // Prepare stock deduction with atomic operation to prevent race conditions
    // Using $inc with condition to ensure stock doesn't go negative
    if (shouldDeductStock) {
      stockUpdates.push({
        updateOne: {
          filter: { 
            _id: product._id,
            stock: { $gte: quantity } // Only update if stock is sufficient
          },
          update: { $inc: { stock: -quantity } },
        },
      });
    }

    // Prepare branch stock addition (always add to branch regardless)
    branchStockUpdates.push({
      productId: product._id.toString(),
      quantity,
    });

    // Prepare transaction item (always record for transaction history, regardless of revenue inclusion)
    const itemTotal = product.price * quantity;
    totalAmount += itemTotal;
    transactionItems.push({
      productId: product._id,
      name: product.name,
      quantity,
      price: product.price,
      total: itemTotal,
      isSet: false,
      status: 'fulfilled',
    });
  }

  // Deduct from central stock for all products (only if deducting from central)
  // Use atomic operations to prevent race conditions
  if (shouldDeductStock && stockUpdates.length > 0) {
    const bulkResult = await Product.bulkWrite(stockUpdates, { ordered: false });
    
    // Check if all updates were successful
    const failedUpdates = stockUpdates.length - (bulkResult.modifiedCount || 0);
    if (failedUpdates > 0) {
      // Some updates failed, likely due to insufficient stock (race condition)
      // Re-fetch products to get current stock levels
      const productIds = stockTransfer.items.map(item => item.product._id);
      const currentProducts = await Product.find({ _id: { $in: productIds } });
      const productMap = new Map(currentProducts.map(p => [p._id.toString(), p]));
      
      // Find which products have insufficient stock
      const insufficientStock = [];
      for (const item of stockTransfer.items) {
        const product = productMap.get(item.product._id.toString());
        if (product && product.stock < item.quantity) {
          insufficientStock.push(`${product.name} (Available: ${product.stock}, Required: ${item.quantity})`);
        }
      }
      
      res.status(400);
      throw new Error(`Insufficient stock detected. This may be due to concurrent transfers. ${insufficientStock.join(', ')}`);
    }
  }

  // Add stock to branch inventory
  // Ensure no duplicate products in branch stock array
  const branchStock = toBranch.stock || [];
  const productStockMap = new Map();
  
  // First, create a map of existing stock
  for (const stockItem of branchStock) {
    const productId = stockItem.product?.toString() || stockItem.product;
    if (productId) {
      productStockMap.set(productId, stockItem.quantity || 0);
    }
  }
  
  // Add or update stock quantities
  for (const update of branchStockUpdates) {
    const currentQty = productStockMap.get(update.productId) || 0;
    productStockMap.set(update.productId, currentQty + update.quantity);
  }
  
  // Convert map back to array format
  const updatedBranchStock = Array.from(productStockMap.entries()).map(([productId, quantity]) => ({
    product: productId,
    quantity,
  }));
  
  toBranch.stock = updatedBranchStock;
  await toBranch.save();

  // Always create transaction for the transfer (for record-keeping, regardless of revenue inclusion)
  let createdTransaction = null;
  if (transactionItems.length > 0) {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    const transactionId = `TXN-${timestamp}-${randomStr}`;
    
    const transaction = new Transaction({
      transactionId,
      transactionType: 'branch_transfer',
      branchTransfer: {
        branchId: toBranch._id,
        branchName: toBranch.name,
        branchLocation: toBranch.location || '',
      },
      items: transactionItems,
      totalAmount,
      paymentMethod: 'transfer',
      isPaid: stockTransfer.isPaid || false,
      paidAt: stockTransfer.isPaid ? new Date() : null,
      transactionDate: new Date(),
      remarks: `Stock transfer to ${toBranch.name}${stockTransfer.remarks ? ` - ${stockTransfer.remarks}` : ''}${shouldIncludeInRevenue ? '' : ' (Not included in revenue)'}`,
    });

    createdTransaction = await transaction.save();

    // Update transfer with transaction reference
    stockTransfer.transactionId = createdTransaction._id;
  }

  // Update transfer status and mark as completed
  stockTransfer.status = 'completed';
  stockTransfer.completedAt = new Date();
  
  const updated = await stockTransfer.save();
  await updated.populate('items.product', 'name price stock category');
  await updated.populate('toBranch', 'name location');
  if (createdTransaction) {
    await updated.populate('transactionId', 'transactionId totalAmount paymentMethod isPaid transactionType');
  }

  res.json(updated);
});

module.exports = {
  getBranches,
  createBranch,
  updateBranch,
  deleteBranch,
  getBranchStock,
  getBranchStockAll,
  createStockTransfer,
  getStockTransfers,
  getStockTransferById,
  updateStockTransfer,
  deleteStockTransfer,
  completeStockTransfer,
};
