import { Ingredient } from '../models/ingredient.model.js';
import { StockMovement } from '../models/stockMovement.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import mongoose from 'mongoose';

export const createIngredient = asyncHandler(async (req, res) => {
  const { name, unit, minStockLevel, costPerUnit, supplier, currentStock, category } = req.body;
  const restaurantId = req.restaurant?._id;

  if (!name || !unit) {
    throw new ApiError(400, 'Name and unit are required');
  }

  const existing = await Ingredient.findOne({ restaurantId, name });
  if (existing) {
    throw new ApiError(400, 'Ingredient with this name already exists in this restaurant');
  }

  const ingredient = await Ingredient.create({
    name,
    unit,
    category: category || 'General',
    minStockLevel: minStockLevel || 0,
    costPerUnit: costPerUnit || 0,
    supplier,
    restaurantId,
    currentStock: currentStock || 0,
  });

  // Track initial stock in movements
  if (currentStock > 0) {
    await StockMovement.create({
      ingredientId: ingredient._id,
      action: 'ADD',
      quantity: Number(currentStock),
      reason: 'PURCHASE',
      performedBy: req.user?._id,
      restaurantId,
    });
  }

  return res.status(201).json(new ApiResponse(201, ingredient, 'Ingredient created successfully'));
});

export const getIngredients = asyncHandler(async (req, res) => {
  const restaurantId = req.restaurant?._id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const [ingredients, totalItems] = await Promise.all([
    Ingredient.find({ restaurantId }).sort({ name: 1 }).skip(skip).limit(limit),
    Ingredient.countDocuments({ restaurantId }),
  ]);

  const totalPages = Math.ceil(totalItems / limit);

  const allIngredients = await Ingredient.find({ restaurantId });

  const topConsumedRes = await StockMovement.aggregate([
    {
      $match: {
        restaurantId: new mongoose.Types.ObjectId(restaurantId),
        action: 'DEDUCT',
        reason: 'ORDER',
      },
    },
    { $group: { _id: '$ingredientId', total: { $sum: '$quantity' } } },
    { $sort: { total: -1 } },
    { $limit: 1 },
  ]);

  let topConsumed = 'N/A';
  if (topConsumedRes.length > 0) {
    const topIng = allIngredients.find(
      (i) => i._id.toString() === topConsumedRes[0]._id.toString(),
    );
    if (topIng) topConsumed = topIng.name;
  }

  const summary = {
    totalStockValue: allIngredients.reduce(
      (acc, curr) => acc + curr.currentStock * curr.costPerUnit,
      0,
    ),
    lowStockCount: allIngredients.filter(
      (i) => i.currentStock <= i.minStockLevel && i.currentStock > 0,
    ).length,
    deadStockCount: allIngredients.filter((i) => i.currentStock === 0).length,
    topConsumed,
  };

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        ingredients,
        summary,
        meta: {
          page,
          limit,
          totalItems,
          totalPages,
        },
      },
      'Ingredients fetched successfully',
    ),
  );
});

export const updateIngredient = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const restaurantId = req.restaurant?._id;
  const { name, unit, minStockLevel, costPerUnit, supplier, category } = req.body;

  const ingredient = await Ingredient.findOneAndUpdate(
    { _id: id, restaurantId },
    { name, unit, minStockLevel, costPerUnit, supplier, category },
    { new: true, runValidators: true },
  );

  if (!ingredient) {
    throw new ApiError(404, 'Ingredient not found');
  }

  return res.status(200).json(new ApiResponse(200, ingredient, 'Ingredient updated successfully'));
});

export const adjustStock = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { action, quantity, reason } = req.body;
  const restaurantId = req.restaurant?._id;
  const userId = req.user?._id;

  if (!action || !quantity || !reason) {
    throw new ApiError(400, 'Action, quantity, and reason are required');
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const ingredient = await Ingredient.findOne({ _id: id, restaurantId }).session(session);

    if (!ingredient) {
      throw new ApiError(404, 'Ingredient not found');
    }

    let newStock = ingredient.currentStock;
    if (action === 'ADD') {
      newStock += Number(quantity);
    } else if (action === 'DEDUCT') {
      if (ingredient.currentStock < Number(quantity)) {
        throw new ApiError(400, 'Insufficient stock for deduction');
      }
      newStock -= Number(quantity);
    } else {
      throw new ApiError(400, 'Invalid action. Must be ADD or DEDUCT');
    }

    await StockMovement.create(
      [
        {
          ingredientId: id,
          action,
          quantity: Number(quantity),
          reason,
          performedBy: userId,
          restaurantId,
        },
      ],
      { session },
    );

    ingredient.currentStock = newStock;
    await ingredient.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json(new ApiResponse(200, ingredient, 'Stock adjusted successfully'));
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
});

export const getStockMovements = asyncHandler(async (req, res) => {
  const restaurantId = req.restaurant?._id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const [movements, totalItems] = await Promise.all([
    StockMovement.find({ restaurantId })
      .populate('ingredientId', 'name unit')
      .populate('performedBy', 'username email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    StockMovement.countDocuments({ restaurantId }),
  ]);

  const totalPages = Math.ceil(totalItems / limit);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        movements,
        meta: {
          page,
          limit,
          totalItems,
          totalPages,
        },
      },
      'Stock movements fetched successfully',
    ),
  );
});
