import Vendor from '../models/vendor.model.js';
import Expense from '../models/expense.model.js';
import mongoose from 'mongoose';

export const createVendor = async (vendorData) => {
  return await Vendor.create(vendorData);
};

export const getVendors = async (restaurantId, query = {}) => {
  const filter = { restaurantId, ...query };
  return await Vendor.find(filter).sort({ name: 1 });
};

export const updateVendor = async (vendorId, restaurantId, updateData) => {
  return await Vendor.findOneAndUpdate({ _id: vendorId, restaurantId }, updateData, { new: true });
};

export const createExpense = async (expenseData) => {
  return await Expense.create(expenseData);
};

export const getExpenses = async (restaurantId, filters = {}, pagination = {}) => {
  const { page = 1, limit = 10 } = pagination;
  const skip = (page - 1) * limit;

  const mongoFilter = { restaurantId };

  if (filters.vendorId) mongoFilter.vendorId = filters.vendorId;
  if (filters.paymentMode) mongoFilter.paymentMode = filters.paymentMode;
  if (filters.month && filters.year) {
    const startDate = new Date(filters.year, filters.month - 1, 1);
    const endDate = new Date(filters.year, filters.month, 0, 23, 59, 59);
    mongoFilter.expenseDate = { $gte: startDate, $lte: endDate };
  }

  const [expenses, totalCount] = await Promise.all([
    Expense.find(mongoFilter)
      .populate('vendorId', 'name')
      .sort({ expenseDate: -1 })
      .skip(skip)
      .limit(limit),
    Expense.countDocuments(mongoFilter),
  ]);

  return {
    expenses,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: Number(page),
  };
};

export const getMonthlyTotal = async (restaurantId, month = null, year = null) => {
  const now = new Date();
  const targetMonth = month ? parseInt(month) - 1 : now.getMonth();
  const targetYear = year ? parseInt(year) : now.getFullYear();

  const startOfMonth = new Date(targetYear, targetMonth, 1);
  const endOfMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

  const result = await Expense.aggregate([
    {
      $match: {
        restaurantId: new mongoose.Types.ObjectId(restaurantId),
        expenseDate: { $gte: startOfMonth, $lte: endOfMonth },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' },
      },
    },
  ]);

  return result.length > 0 ? result[0].total : 0;
};
