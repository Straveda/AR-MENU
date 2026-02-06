import * as expensesService from '../services/expenses.service.js';

export const createVendor = async (req, res) => {
  try {
    const { name, category, phone, email } = req.body;
    const vendor = await expensesService.createVendor({
      name,
      category,
      phone,
      email,
      restaurantId: req.restaurant._id,
    });

    res.status(201).json({
      success: true,
      data: vendor,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Vendor name must be unique within a restaurant',
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating vendor',
    });
  }
};

export const getVendors = async (req, res) => {
  try {
    const vendors = await expensesService.getVendors(req.restaurant._id);
    res.status(200).json({
      success: true,
      data: vendors,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching vendors',
    });
  }
};

export const updateVendor = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, phone, email, status } = req.body;
    const vendor = await expensesService.updateVendor(id, req.restaurant._id, {
      name,
      category,
      phone,
      email,
      status,
    });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found',
      });
    }

    res.status(200).json({
      success: true,
      data: vendor,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating vendor',
    });
  }
};

export const createExpense = async (req, res) => {
  try {
    const { expenseType, amount, vendorId, paymentMode, notes, expenseDate } = req.body;
    const expense = await expensesService.createExpense({
      expenseType,
      amount,
      vendorId,
      paymentMode,
      notes,
      expenseDate,
      createdBy: req.user._id,
      restaurantId: req.restaurant._id,
    });

    res.status(201).json({
      success: true,
      data: expense,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating expense',
    });
  }
};

export const getExpenses = async (req, res) => {
  try {
    const { page, limit, vendorId, paymentMode, month, year } = req.query;
    const result = await expensesService.getExpenses(
      req.restaurant._id,
      { vendorId, paymentMode, month, year },
      { page, limit },
    );

    const monthlyTotal = await expensesService.getMonthlyTotal(
      req.restaurant._id,
      month,
      year
    );

    res.status(200).json({
      success: true,
      data: {
        ...result,
        monthlyTotal,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching expenses',
    });
  }
};
