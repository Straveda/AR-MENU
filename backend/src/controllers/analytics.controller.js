import * as analyticsService from '../services/analytics.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export const getDashboardAnalytics = asyncHandler(async (req, res) => {
  const restaurantId = req.restaurant._id;

  const analytics = await analyticsService.getDashboardAnalytics(restaurantId);

  return res
    .status(200)
    .json(new ApiResponse(200, analytics, 'Dashboard analytics fetched successfully'));
});

export const getDetailedAnalytics = asyncHandler(async (req, res) => {
  const restaurantId = req.restaurant._id;
  const { timeRange } = req.query;

  const analytics = await analyticsService.getDetailedAnalytics(restaurantId, timeRange);

  return res
    .status(200)
    .json(new ApiResponse(200, analytics, 'Detailed analytics fetched successfully'));
});
