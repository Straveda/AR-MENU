import { UpsellRule } from '../models/upsellRule.model.js';
import { GeneratedRecommendation } from '../models/generatedRecommendation.model.js';
import { DishStats } from '../models/dishStats.model.js';
import { DishPairStats } from '../models/dishPairStats.model.js';
import { Dish } from '../models/dish.models.js';
import { Order } from '../models/order.models.js';
import mongoose from 'mongoose';

// Get dashboard stats
export const getStats = async (req, res) => {
    try {
        const restaurantId = req.restaurant._id;

        // Count active rules
        const activeRulesCount = await UpsellRule.countDocuments({
            restaurantId,
            isActive: true,
        });

        // Calculate real revenue generated from upsell recommendations
        const upsellRevenueData = await Order.aggregate([
            { $match: { restaurantId } },
            { $unwind: '$orderItems' },
            { $match: { 'orderItems.source': 'UPSELL' } },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$orderItems.lineTotal' },
                    totalAccepted: { $sum: 1 }
                }
            }
        ]);

        const revenueGenerated = upsellRevenueData.length > 0 ? upsellRevenueData[0].totalRevenue : 0;
        const totalAccepted = upsellRevenueData.length > 0 ? upsellRevenueData[0].totalAccepted : 0;

        // Calculate conversion rate based on orders
        // Total orders where any recommendation could have been shown
        const totalPossibleRecommendations = await Order.countDocuments({ restaurantId });
        const avgConversion = totalPossibleRecommendations > 0
            ? ((totalAccepted / totalPossibleRecommendations) * 100).toFixed(1)
            : 0;

        // Calculate average bill increase from dish stats
        const dishStats = await DishStats.find({ restaurantId }).limit(100);
        const avgBillIncrease = dishStats.length > 0
            ? Math.round(dishStats.reduce((sum, stat) => sum + stat.avgOrderValue, 0) / dishStats.length)
            : 0;

        const stats = {
            revenueGenerated: Math.round(revenueGenerated),
            avgConversion: parseFloat(avgConversion),
            avgBillIncrease,
            activeRules: activeRulesCount,
        };

        return res.status(200).json({
            success: true,
            data: stats,
        });
    } catch (error) {
        console.error('Error in getStats:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch stats',
            error: error.message,
        });
    }
};

// Get all rules with optional filters
export const getRules = async (req, res) => {
    try {
        const restaurantId = req.restaurant._id;
        const { ruleType, isActive } = req.query;

        const filter = { restaurantId };

        if (ruleType) {
            filter.ruleType = ruleType;
        }

        if (isActive !== undefined) {
            filter.isActive = isActive === 'true';
        }

        const rules = await UpsellRule.find(filter)
            .populate('mainDishId', 'name price category')
            .populate('secondaryDishId', 'name price category')
            .sort({ createdAt: -1 });

        // Calculate real stats for each rule
        const rulesWithStats = await Promise.all(rules.map(async (rule) => {
            const ruleId = rule._id;

            // Calculate real revenue from successful upsells
            const ordersWithUpsell = await Order.aggregate([
                { $match: { restaurantId, 'orderItems.upsellRuleId': ruleId } },
                { $unwind: '$orderItems' },
                { $match: { 'orderItems.upsellRuleId': ruleId } },
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: '$orderItems.lineTotal' },
                        count: { $sum: 1 }
                    }
                }
            ]);

            const revenue = ordersWithUpsell.length > 0 ? ordersWithUpsell[0].totalRevenue : 0;
            const acceptedCount = ordersWithUpsell.length > 0 ? ordersWithUpsell[0].count : 0;

            // Simplified conversion: How often this rule is accepted when the main dish is ordered
            let conversion = 0;
            if (rule.mainDishId) {
                const totalMainDishOrders = await Order.countDocuments({
                    restaurantId,
                    'orderItems.dishId': rule.mainDishId._id
                });
                conversion = totalMainDishOrders > 0 ? (acceptedCount / totalMainDishOrders) * 100 : 0;
            }

            return {
                ...rule.toObject(),
                conversion: parseFloat(conversion.toFixed(1)),
                revenue: Math.round(revenue),
            };
        }));

        return res.status(200).json({
            success: true,
            data: rulesWithStats,
        });
    } catch (error) {
        console.error('Error in getRules:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch rules',
            error: error.message,
        });
    }
};

// Create new rule
export const createRule = async (req, res) => {
    try {
        const restaurantId = req.restaurant._id;
        const {
            ruleType,
            ruleName,
            mainDishId,
            secondaryDishId,
            minMainOrders,
            maxSecondaryOrders,
            minPairPercentage,
            discountPercentage,
            cartMinValue,
        } = req.body;

        // Validation
        if (!ruleType || !ruleName) {
            return res.status(400).json({
                success: false,
                message: 'Rule type and name are required',
            });
        }

        // Create rule
        const rule = new UpsellRule({
            restaurantId,
            ruleType,
            ruleName,
            mainDishId: mainDishId || null,
            secondaryDishId: secondaryDishId || null,
            minMainOrders: minMainOrders || null,
            maxSecondaryOrders: maxSecondaryOrders || null,
            minPairPercentage: minPairPercentage || null,
            discountPercentage: discountPercentage || 0,
            cartMinValue: cartMinValue || null,
            isActive: true,
        });

        await rule.save();

        // Populate dish details
        await rule.populate('mainDishId', 'name price category');
        await rule.populate('secondaryDishId', 'name price category');

        return res.status(201).json({
            success: true,
            message: 'Rule created successfully',
            data: rule,
        });
    } catch (error) {
        console.error('Error in createRule:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create rule',
            error: error.message,
        });
    }
};

// Update rule
export const updateRule = async (req, res) => {
    try {
        const { id } = req.params;
        const restaurantId = req.restaurant._id;

        const rule = await UpsellRule.findOne({ _id: id, restaurantId });

        if (!rule) {
            return res.status(404).json({
                success: false,
                message: 'Rule not found',
            });
        }

        // Update fields
        const allowedUpdates = [
            'ruleName',
            'mainDishId',
            'secondaryDishId',
            'minMainOrders',
            'maxSecondaryOrders',
            'minPairPercentage',
            'discountPercentage',
            'cartMinValue',
            'isActive',
        ];

        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                rule[field] = req.body[field];
            }
        });

        await rule.save();
        await rule.populate('mainDishId', 'name price category');
        await rule.populate('secondaryDishId', 'name price category');

        return res.status(200).json({
            success: true,
            message: 'Rule updated successfully',
            data: rule,
        });
    } catch (error) {
        console.error('Error in updateRule:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update rule',
            error: error.message,
        });
    }
};

// Delete rule
export const deleteRule = async (req, res) => {
    try {
        const { id } = req.params;
        const restaurantId = req.restaurant._id;

        const rule = await UpsellRule.findOneAndDelete({ _id: id, restaurantId });

        if (!rule) {
            return res.status(404).json({
                success: false,
                message: 'Rule not found',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Rule deleted successfully',
        });
    } catch (error) {
        console.error('Error in deleteRule:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete rule',
            error: error.message,
        });
    }
};

// Toggle rule active status
export const toggleRule = async (req, res) => {
    try {
        const { id } = req.params;
        const restaurantId = req.restaurant._id;

        const rule = await UpsellRule.findOne({ _id: id, restaurantId });

        if (!rule) {
            return res.status(404).json({
                success: false,
                message: 'Rule not found',
            });
        }

        rule.isActive = !rule.isActive;
        await rule.save();

        return res.status(200).json({
            success: true,
            message: `Rule ${rule.isActive ? 'activated' : 'deactivated'} successfully`,
            data: { isActive: rule.isActive },
        });
    } catch (error) {
        console.error('Error in toggleRule:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to toggle rule',
            error: error.message,
        });
    }
};

// Generate AI explanation for a rule
export const updateRuleExplanation = async (req, res) => {
    try {
        const { id } = req.params;
        const restaurantId = req.restaurant._id;

        const rule = await UpsellRule.findOne({ _id: id, restaurantId })
            .populate('mainDishId', 'name description')
            .populate('secondaryDishId', 'name description');

        if (!rule) {
            return res.status(404).json({
                success: false,
                message: 'Rule not found',
            });
        }

        if (!rule.mainDishId || !rule.secondaryDishId) {
            return res.status(400).json({
                success: false,
                message: 'Rule must have both main and secondary dishes to generate explanation',
            });
        }

        // Dynamically import AI service
        const { generateUpsellExplanation } = await import('../services/ai.service.js');

        // Generate explanation
        const explanation = await generateUpsellExplanation(
            rule.mainDishId,
            rule.secondaryDishId,
            rule.ruleType
        );

        // Update rule
        rule.aiExplanation = explanation;
        await rule.save();

        return res.status(200).json({
            success: true,
            data: { aiExplanation: explanation },
        });

    } catch (error) {
        console.error('Error in updateRuleExplanation:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to generate explanation',
            error: error.message,
        });
    }
};

// Get AI-powered suggestions based on data
export const getSuggestions = async (req, res) => {
    try {
        const restaurantId = req.restaurant._id;

        // 1. Get High Potential Pairings (from DishPairStats)
        const topPairs = await DishPairStats.find({ restaurantId })
            .populate('mainDishId', 'name price')
            .populate('pairedDishId', 'name price')
            .sort({ pairPercentage: -1 })
            .limit(2);

        // 2. Get popular dishes that don't have many active rules
        const popularDishes = await Dish.find({ restaurantId, available: true })
            .sort({ orderCount: -1 })
            .limit(5);

        const activeRules = await UpsellRule.find({ restaurantId }).select('mainDishId');
        const activeRuleDishIds = new Set(activeRules.map(r => r.mainDishId?.toString()));

        const underservedPopularDish = popularDishes.find(d => !activeRuleDishIds.has(d._id.toString()));

        const suggestions = [];

        // Add suggestion based on pairing data
        if (topPairs.length > 0) {
            topPairs.forEach((pair, index) => {
                if (pair.mainDishId && pair.pairedDishId) {
                    suggestions.push({
                        id: `pair_${index}`,
                        type: 'FREQUENT_PAIR',
                        title: 'Popular Pairing Found',
                        description: `${pair.pairPercentage}% of people who order ${pair.mainDishId.name} also add ${pair.pairedDishId.name}! Create a rule to automate this recommendation.`,
                        icon: '🔥',
                        prefillData: {
                            ruleType: 'FREQUENT_PAIR',
                            ruleName: `${pair.mainDishId.name} + ${pair.pairedDishId.name} Pairing`,
                            mainDishId: pair.mainDishId._id,
                            secondaryDishId: pair.pairedDishId._id,
                            minPairPercentage: pair.pairPercentage
                        }
                    });
                }
            });
        }

        // Add suggestion for low attachment pairings (if we have enough data)
        const lowAttachmentPairs = await DishPairStats.find({
            restaurantId,
            pairPercentage: { $lt: 10, $gt: 0 }
        })
            .populate('mainDishId', 'name price')
            .populate('pairedDishId', 'name price')
            .limit(1);

        if (lowAttachmentPairs.length > 0) {
            const pair = lowAttachmentPairs[0];
            suggestions.push({
                id: 'low_attach_1',
                type: 'LOW_ATTACHMENT',
                title: 'Opportunity: Low Attachment',
                description: `${pair.mainDishId.name} and ${pair.pairedDishId.name} are rarely ordered together (only ${pair.pairPercentage}%). Offer a combo to increase attachment!`,
                icon: '📈',
                prefillData: {
                    ruleType: 'LOW_ATTACHMENT',
                    ruleName: `${pair.mainDishId.name} Meal Boost`,
                    mainDishId: pair.mainDishId._id,
                    secondaryDishId: pair.pairedDishId._id,
                    discountPercentage: 10
                }
            });
        }

        // Add suggestion for cart threshold if underserved popular dish found
        if (underservedPopularDish) {
            suggestions.push({
                id: 'cart_1',
                type: 'CART_THRESHOLD',
                title: 'Boost Order Value',
                description: `${underservedPopularDish.name} is one of your top sellers. Recommend it as a cart upsell for orders above ₹500 to boost ticket size.`,
                icon: '🍰',
                prefillData: {
                    ruleType: 'CART_THRESHOLD',
                    ruleName: `Premium Add-on: ${underservedPopularDish.name}`,
                    secondaryDishId: underservedPopularDish._id,
                    cartMinValue: 500,
                    discountPercentage: 5
                }
            });
        }

        // Fallback or fill to 3 suggestions
        if (suggestions.length < 3 && popularDishes.length >= 2) {
            const d1 = popularDishes[0];
            const d2 = popularDishes[1];
            if (!suggestions.some(s => s.id === 'cart_1')) {
                suggestions.push({
                    id: 'fallback_1',
                    type: 'FREQUENT_PAIR',
                    title: 'Smart Recommendation',
                    description: `Pair your best seller ${d1.name} with ${d2.name} to see if they sell better together.`,
                    icon: '💡',
                    prefillData: {
                        ruleType: 'FREQUENT_PAIR',
                        ruleName: `${d1.name} Duo`,
                        mainDishId: d1._id,
                        secondaryDishId: d2._id
                    }
                });
            }
        }

        return res.status(200).json({
            success: true,
            data: suggestions.slice(0, 3),
        });
    } catch (error) {
        console.error('Error in getSuggestions:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch suggestions',
            error: error.message,
        });
    }
};

// Get dishes for dropdown (simplified)
export const getDishes = async (req, res) => {
    try {
        const restaurantId = req.restaurant._id;

        const dishes = await Dish.find({ restaurantId, available: true })
            .select('name price category')
            .sort({ name: 1 });

        return res.status(200).json({
            success: true,
            data: dishes,
        });
    } catch (error) {
        console.error('Error in getDishes:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch dishes',
            error: error.message,
        });
    }
};

// Get recommendations for a specific dish (customer-facing)
export const getRecommendationsForDish = async (req, res) => {
    try {
        const { dishId } = req.params;
        const { context = 'VIEW_DISH' } = req.query;
        const restaurantId = req.restaurant._id;

        // Validate dishId
        if (!mongoose.Types.ObjectId.isValid(dishId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid dish ID',
            });
        }

        // Find active rules for this dish
        const rules = await UpsellRule.find({
            restaurantId,
            mainDishId: dishId,
            isActive: true,
        })
            .populate('secondaryDishId', 'name price imageUrl category available')
            .sort({ createdAt: -1 })
            .limit(5);

        // Filter out rules where secondary dish is unavailable
        const availableRules = rules.filter(
            rule => rule.secondaryDishId && rule.secondaryDishId.available !== false
        );

        // Transform to recommendation format
        const recommendations = availableRules.map(rule => {
            const message = generateRecommendationMessage(rule);

            return {
                _id: rule._id,
                ruleId: rule._id,
                ruleName: rule.ruleName,
                ruleType: rule.ruleType,
                recommendedDish: rule.secondaryDishId,
                message: rule.aiExplanation || message,
                discountPercentage: rule.discountPercentage || 0,
                priority: 1,
            };
        });

        return res.status(200).json({
            success: true,
            data: recommendations,
        });
    } catch (error) {
        console.error('Error in getRecommendationsForDish:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch recommendations',
            error: error.message,
        });
    }
};

// Get recommendations based on cart contents
export const getRecommendationsForCart = async (req, res) => {
    try {
        const { cartItems, cartTotal } = req.body; // Expects { cartItems: [dishId1, dishId2], cartTotal: number }
        const restaurantId = req.restaurant._id;

        if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
            return res.status(200).json({ success: true, data: [] });
        }

        // 1. Find rules triggered by items in cart (Specific pairings)
        const itemRules = await UpsellRule.find({
            restaurantId,
            mainDishId: { $in: cartItems },
            isActive: true,
        }).populate('secondaryDishId', 'name price imageUrl category available');

        // 2. Find rules triggered by cart value (Thresholds)
        let thresholdRules = [];
        if (cartTotal > 0) {
            thresholdRules = await UpsellRule.find({
                restaurantId,
                ruleType: 'CART_THRESHOLD',
                cartMinValue: { $lte: cartTotal },
                isActive: true,
            }).populate('secondaryDishId', 'name price imageUrl category available');
        }

        // Combine and Filter
        const allRules = [...itemRules, ...thresholdRules];

        // Filter out unavailable dishes and items ALREADY in cart
        const filteredRules = allRules.filter(rule => {
            if (!rule.secondaryDishId || rule.secondaryDishId.available === false) return false;
            // Exclude if the recommended dish is already in the cart
            if (cartItems.includes(rule.secondaryDishId._id.toString())) return false;
            return true;
        });

        // Deduplicate by recommended dish (Pick best rule per dish)
        const uniqueRecommendations = [];
        const seenDishes = new Set();

        for (const rule of filteredRules) {
            const dishId = rule.secondaryDishId._id.toString();
            if (!seenDishes.has(dishId)) {

                const message = generateRecommendationMessage(rule);

                uniqueRecommendations.push({
                    _id: rule._id,
                    ruleId: rule._id,
                    ruleName: rule.ruleName,
                    ruleType: rule.ruleType,
                    recommendedDish: rule.secondaryDishId,
                    message: rule.aiExplanation || message,
                    discountPercentage: rule.discountPercentage || 0,
                    priority: rule.ruleType === 'CART_THRESHOLD' ? 2 : 1, // Prioritize specific pairings
                });
                seenDishes.add(dishId);
            }
        }

        // Sort by priority and limit
        uniqueRecommendations.sort((a, b) => a.priority - b.priority);

        return res.status(200).json({
            success: true,
            data: uniqueRecommendations.slice(0, 3), // Return top 3
        });
    } catch (error) {
        console.error('Error in getRecommendationsForCart:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch cart recommendations',
            error: error.message,
        });
    }
};

// Helper function to generate recommendation messages
const generateRecommendationMessage = (rule) => {
    const dishName = rule.secondaryDishId?.name || 'this item';
    const discount = rule.discountPercentage;

    switch (rule.ruleType) {
        case 'FREQUENT_PAIR':
            if (discount > 0) {
                return `Most people also add ${dishName} with this! Get ${discount}% off when you add both.`;
            }
            return `Most people also add ${dishName} with this!`;

        case 'LOW_ATTACHMENT':
            if (discount > 0) {
                return `Complete your meal with ${dishName}! ${discount}% off when ordered together.`;
            }
            return `Complete your meal with ${dishName}!`;

        case 'COMBO_DISCOUNT':
            return `Save ${discount}% when you order this combo with ${dishName}!`;

        case 'CART_THRESHOLD':
            if (discount > 0) {
                return `Add ${dishName} to unlock ${discount}% off your order!`;
            }
            return `Add ${dishName} to complete your order!`;

        default:
            return `Try ${dishName} with your order!`;
    }
};

// Manual trigger for analytics aggregation (for testing)
export const triggerAnalytics = async (req, res) => {
    try {
        const restaurantId = req.restaurant._id;

        console.log(`[Manual Trigger] Starting analytics aggregation for restaurant: ${restaurantId}`);

        // Import aggregation functions
        const { aggregateDishStats, aggregateDishPairStats } = await import('../services/analytics.service.js');

        // Run aggregation for this restaurant
        await aggregateDishStats(restaurantId);
        await aggregateDishPairStats(restaurantId);

        console.log(`[Manual Trigger] Analytics aggregation completed successfully`);

        return res.status(200).json({
            success: true,
            message: 'Analytics aggregation completed successfully',
        });
    } catch (error) {
        console.error('[Manual Trigger] Error triggering analytics:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to trigger analytics aggregation',
            error: error.message,
        });
    }
};

