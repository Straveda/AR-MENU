import { Plan } from '../models/plan.models.js';

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

    const plan = await Plan.findByIdAndUpdate(planId, req.body, { new: true });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found',
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

export { createPlan, getAllPlans, updatePlan };
