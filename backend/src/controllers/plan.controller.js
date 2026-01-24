import { Plan } from '../models/plan.models.js';
import { Restaurant } from '../models/restaurant.models.js';
import { triggerPendingModelsForRestaurant } from '../services/meshyService.js';

const createPlan = async (req, res) => {
  try {
    const { name, description, price, interval, features, limits } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Plan name is required',
      });
    }

    const existingPlan = await Plan.findOne({ name: name.toUpperCase() });
    if (existingPlan) {
      return res.status(400).json({
        success: false,
        message: 'Plan already exists',
      });
    }

    const plan = await Plan.create({
      name,
      description,
      price,
      interval,
      features,
      limits,
    });

    return res.status(201).json({
      success: true,
      message: 'Plan created successfully',
      data: plan,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

const getAllPlans = async (req, res) => {
  try {
    const plans = await Plan.find({});

    return res.status(200).json({
      success: true,
      data: plans,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};



const updatePlan = async (req, res) => {
  try {
    const { planId } = req.params;

    const oldPlan = await Plan.findById(planId);
    if (!oldPlan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found',
      });
    }

    const plan = await Plan.findByIdAndUpdate(planId, req.body, { new: true });

    // Check if AR models feature was turned ON
    if (!oldPlan.features?.arModels && plan.features?.arModels) {
      console.log(`✨ AR Models feature enabled for plan ${plan.name}. Triggering auto-conversion...`);

      const restaurants = await Restaurant.find({ planId: plan._id });
      console.log(`Found ${restaurants.length} restaurants to update.`);

      // Process in background to avoid blocking response
      restaurants.forEach(restaurant => {
        triggerPendingModelsForRestaurant(restaurant._id, plan._id);
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Plan updated successfully',
      data: plan,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

const deletePlan = async (req, res) => {
  try {
    const { planId } = req.params;

    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }

    const usageCount = await Restaurant.countDocuments({ planId });
    if (usageCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete plan: It is currently assigned to ${usageCount} restaurant(s).`,
      });
    }

    await Plan.findByIdAndDelete(planId);

    return res.status(200).json({
      success: true,
      message: 'Plan deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

export { createPlan, getAllPlans, updatePlan, deletePlan };
