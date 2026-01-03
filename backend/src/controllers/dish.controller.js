import mongoose from 'mongoose';
import { Dish } from "../models/dish.models.js";
import { Order } from "../models/order.models.js";
import { storageService } from "../services/storage/StorageService.js";
import { subscriptionService } from "../services/subscriptionService.js";
import { createImageTo3DTask, getTaskStatus } from "../services/meshyService.js";
import { startPollingForDish } from "../services/pollingService.js";
import fetch from 'node-fetch';
import { pipeline } from 'stream';
import { promisify } from 'util';
import { logAudit } from "../utils/logger.js";

const streamPipeline = promisify(pipeline);

const addDish = async (req, res) => {
  try {
    const restaurantId = req.restaurant._id;
    // Check plan limits for ACTIVE dishes
    const limitCheck = await subscriptionService.checkActiveLimit(
      restaurantId,
      "maxDishes"
    );
    const shouldBeActive = limitCheck.allowed;

    let {
      name,
      description,
      price,
      category,
      tags,
      available,
      ingredients,
      nutritionalInfo,
      portionSize,
      isChefSpecial,
    } = req.body;

    if (typeof tags === "string") {
      try {
        tags = JSON.parse(tags);
      } catch (e) {
        tags = [];
      }
    }
    if (typeof ingredients === "string") {
      try {
        ingredients = JSON.parse(ingredients);
      } catch (e) {
        ingredients = [];
      }
    }
    if (typeof nutritionalInfo === "string") {
      try {
        nutritionalInfo = JSON.parse(nutritionalInfo);
      } catch (e) {
        nutritionalInfo = {};
      }
    }
    if (typeof available === "string") {
      available = available === "true";
    }
    if (typeof isChefSpecial === "string") {
      isChefSpecial = isChefSpecial === "true";
    }

    if (
      !name ||
      !description ||
      !price ||
      !category ||
      !tags ||
      available === undefined ||
      !ingredients ||
      !nutritionalInfo ||
      !portionSize
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Dish image is required",
      });
    }

    const { url: cloudImageUrl } = await storageService.uploadFile(
      req.file.buffer,
      req.file.originalname || "dish_image"
    );

    const dish = new Dish({
      restaurantId,
      name,
      description,
      price,
      category,
      imageUrl: cloudImageUrl,
      modelStatus: "pending",
      meshyTaskId: null,
      modelUrls: { glb: null, usdz: null },
      tags,
      available,
      ingredients,
      nutritionalInfo,
      portionSize,
      isActive: shouldBeActive, // Set based on limit
      isChefSpecial,
    });

    await dish.save();

    try {
      if (req.restaurant.planId) {
        const { taskId } = await createImageTo3DTask(cloudImageUrl, name, dish._id);

        dish.meshyTaskId = taskId;
        dish.modelStatus = "processing";
        await dish.save();

        startPollingForDish(dish._id.toString(), taskId);

        console.log(
          `🚀 Started 3D model generation for "${name}" (task: ${taskId})`
        );
      }
    } catch (meshyError) {
      console.error("Meshy generation error:", meshyError);

      dish.modelStatus = "failed";
      await dish.save();
    }

    await logAudit({
      req,
      action: "DISH_CREATED",
      targetId: dish._id,
      targetModel: "Dish",
      changes: { name, price, category },
    });

    return res.status(201).json({
      success: true,
      message: shouldBeActive
        ? "Dish added successfully. 3D model generation started."
        : `Dish added as INACTIVE. Plan limit of ${limitCheck.limit} active dishes reached.`,
      data: { dish },
      warning: !shouldBeActive,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const getDishes = async (req, res) => {
  try {
    const { sort } = req.query;

    let sortOption = {};

    if (sort === "most_ordered") {
      sortOption = { orderCount: -1 };
    }

    if (sort === "budget") {
      sortOption = { price: 1 };
    }

    if (sort === "chef_special") {
      sortOption = { isChefSpecial: -1 };
    }

    const restaurant = req.restaurant;

    const filter = {};
    if (restaurant) {
      filter.restaurantId = restaurant._id;
    }
    
    if (!req.user) {
      filter.available = true;
    }

    const dishes = await Dish.find(filter).sort(sortOption);

    return res.status(200).json({
      success: true,
      message: "Dishes fetched successfully",
      data: { 
        dishes,
        restaurant: restaurant ? {
          name: restaurant.name,
          slug: restaurant.slug
        } : null
      },
    });

  } catch (error) {
    console.log("Error in getDishes:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

const getDishById = async (req, res) => {
  try {
    const id = req.params.id.trim();

    const restaurant = req.restaurant;

    const filter = { _id: id };
    if (restaurant) {
      filter.restaurantId = restaurant._id;
    }

    const dish = await Dish.findOne(filter);

    if (!dish) {
      return res.status(404).json({
        success: false,
        message: "Dish not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Dish fetched successfully",
      data: { dish },
    });

  } catch (error) {
    console.log("Error in getDishById:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

const updateDish = async (req, res) => {
  try {
    const id = req.params.id;
    const { name, description, price, category, imageUrl, ingredients, tags, available, portionSize, nutritionalInfo } = req.body;
    if (!name && !description && !price && !category && !imageUrl && !ingredients && !tags && available === undefined && !portionSize && !nutritionalInfo) {
      return res.status(400).json({
        success: false,
        message: "Please provide at least one field to update",
      });
    }

    const dish = await Dish.findOne({ _id: id, restaurantId: req.restaurant._id });

    if (!dish) {
      return res.status(404).json({
        success: false,
        message: "Dish not found",
      });
    }

    // If activating, check limit
    if (isActive === true && dish.isActive !== true) {
      // Validate limit
       await subscriptionService.validateActivation(req.restaurant._id, 'maxDishes');
    }

    if (name) dish.name = name;
    if (description) dish.description = description;
    if (price) dish.price = price;
    if (category) dish.category = category;
    if (imageUrl) dish.imageUrl = imageUrl;
    if (ingredients) dish.ingredients = ingredients;
    if (tags) dish.tags = tags;
    if (available !== undefined) dish.available = available;
    if (isActive !== undefined) dish.isActive = isActive;
    if (portionSize) dish.portionSize = portionSize;
    if (nutritionalInfo) dish.nutritionalInfo = nutritionalInfo;
    if (isChefSpecial !== undefined) dish.isChefSpecial = isChefSpecial;

    const updatedDish = await dish.save();

    await logAudit({
        req,
        action: 'DISH_UPDATED',
        targetId: updatedDish._id,
        targetModel: 'Dish',
        changes: { name: updatedDish.name, price: updatedDish.price } 
    });

    return res.status(200).json({
      success: true,
      message: "Dish updated successfully",
      data: { dish: updatedDish },
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update dish",
      error: error.message,
    });
  }
};

const deleteDish = async (req, res) => {
  try {
    const id = req.params.id;

    const restaurant = req.restaurant;

    const query = { _id: id };
    if (restaurant) {
      query.restaurantId = restaurant._id;
    }

    const dish = await Dish.findOne(query);

    if (!dish) {
      return res.status(404).json({
        success: false,
        message: "Dish not found",
      });
    }

    const dishName = dish.name;
    await Dish.deleteOne(query);

    await logAudit({
        req,
        action: 'DISH_DELETED',
        targetId: id,
        targetModel: 'Dish',
        changes: { name: dishName }
    });

    return res.status(200).json({
      success: true,
      message: "Dish deleted successfully",
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete dish",
      error: error.message,
    });
  }
};

const peopleAlsoOrdered = async (req, res) => {
  try {

    const restaurant = req.restaurant;

if (!restaurant) {
  return res.status(500).json({
    success: false,
    message: "Restaurant not found",
  });
}

    const { dishId } = req.params;

const results = await Order.aggregate([
  {
    $match: {
      restaurantId: restaurant._id,
      "orderItems.dishId": new mongoose.Types.ObjectId(dishId),
    },
  },
  { $unwind: "$orderItems" },
  {
    $match: {
      "orderItems.dishId": {
        $ne: new mongoose.Types.ObjectId(dishId),
      },
    },
  },
  {
    $group: {
      _id: "$orderItems.dishId",
      count: { $sum: 1 },
    },
  },
  { $sort: { count: -1 } },
  { $limit: 5 },
]);

    const dishIds = results.map(r => r._id);
    const dishes = await Dish.find({ _id: { $in: dishIds }, restaurantId: restaurant._id });

    return res.status(200).json({
      success: true,
      data: dishes,
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: "Failed to fetch recommendations",
      error: error.message,
    });
  }
};

const getModelStatus = async (req, res) => {
  try {
    const id = req.params.id;

    const restaurant = req.restaurant;
    if (!restaurant) {
      return res.status(500).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    const dish = await Dish.findOne({ _id: id, restaurantId: restaurant._id });
    if (!dish) {
      return res.status(404).json({
        success: false,
        message: "Dish not found",
      });
    }

    if (dish.meshyTaskId && dish.modelStatus === 'processing') {
      try {
        const taskStatus = await getTaskStatus(dish.meshyTaskId);

        dish.modelStatus = taskStatus.status;
        if (taskStatus.modelUrls) {
          dish.modelUrls = taskStatus.modelUrls;
        }
        await dish.save();
      } catch (error) {
        console.error('Error fetching task status:', error);
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        modelStatus: dish.modelStatus,
        modelUrls: dish.modelUrls,
        meshyTaskId: dish.meshyTaskId,
      },
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to get model status",
      error: error.message,
    });
  }
};

const generateModel = async (req, res) => {
  try {
    const id = req.params.id;

    const restaurant = req.restaurant;

    if (!restaurant) {
      return res.status(500).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    const dish = await Dish.findOne({ _id: id, restaurantId: restaurant._id });
    if (!dish) {
      return res.status(404).json({
        success: false,
        message: "Dish not found",
      });
    }

    if (!dish.imageUrl) {
      return res.status(400).json({
        success: false,
        message: "Dish must have an image to generate 3D model",
      });
    }

    const { taskId } = await createImageTo3DTask(dish.imageUrl, dish.name);

    dish.meshyTaskId = taskId;
    dish.modelStatus = "processing";
    dish.modelUrls = { glb: null, usdz: null };
    await dish.save();

    startPollingForDish(dish._id.toString(), taskId);

    return res.status(200).json({
      success: true,
      message: "3D model generation started",
      data: {
        dish,
        taskId,
      },
    });

  } catch (error) {
    console.error("GenerateModel Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate model",
      error: error.message,
    });
  }
};

const retryModelGeneration = async (req, res) => {
  try {
    const id = req.params.id;

    const restaurant = req.restaurant;
    if (!restaurant) {
      return res.status(500).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    const dish = await Dish.findOne({ _id: id, restaurantId: restaurant._id });
    if (!dish) {
      return res.status(404).json({
        success: false,
        message: "Dish not found",
      });
    }

    if (dish.modelStatus === 'processing') {
      return res.status(400).json({
        success: false,
        message: "Model generation already in progress",
      });
    }

    if (!dish.imageUrl) {
      return res.status(400).json({
        success: false,
        message: "Dish must have an image to generate 3D model",
      });
    }

    const { taskId } = await createImageTo3DTask(dish.imageUrl, dish.name);

    dish.meshyTaskId = taskId;
    dish.modelStatus = "processing";
    dish.modelUrls = { glb: null, usdz: null };
    await dish.save();

    startPollingForDish(dish._id.toString(), taskId);

    return res.status(200).json({
      success: true,
      message: "Model generation retry started",
      data: { dish },
    });

  } catch (error) {
    console.error("RetryModel Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retry model generation",
      error: error.message,
    });
  }
};

const proxyModel = async (req, res) => {
  try {
    const { id, format } = req.params;

    if (!['glb', 'usdz'].includes(format)) {
      return res.status(400).send('Invalid format');
    }

    const restaurant = req.restaurant;

    if (!restaurant) {
      return res.status(500).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    const dish = await Dish.findOne({ _id: id, restaurantId: restaurant._id });
    if (!dish || !dish.modelUrls || !dish.modelUrls[format]) {
      return res.status(404).send('Model not found');
    }

    const modelUrl = dish.modelUrls[format];

    const response = await fetch(modelUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch model: ${response.statusText}`);
    }


    // Explicitly set Content-Type based on format for iOS compatibility
    const contentTypes = {
      'glb': 'model/gltf-binary',
      'usdz': 'model/vnd.usdz+zip'
    };
    
    // Fallback to upstream content-type if not in our map (though we validate format above)
    const contentType = contentTypes[format] || response.headers.get('content-type');
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', response.headers.get('content-length'));
    res.setHeader('Cache-Control', 'public, max-age=31536000'); 

    await streamPipeline(response.body, res);

  } catch (error) {
    console.error("Proxy error:", error);
    if (!res.headersSent) {
      res.status(500).send('Failed to proxy model');
    }
  }
};

export {
  addDish,
  getDishes,
  getDishById,
  updateDish,
  deleteDish,
  getModelStatus,
  generateModel,
  retryModelGeneration,
  proxyModel,
  peopleAlsoOrdered,
};
