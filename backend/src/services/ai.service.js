import { GoogleGenerativeAI } from '@google/generative-ai';
import NodeCache from 'node-cache';
import { Order } from '../models/order.models.js';
import { Dish } from '../models/dish.models.js';
import Restaurant from '../models/restaurant.models.js';
import { Ingredient } from '../models/ingredient.model.js';
import Expense from '../models/expense.model.js';
import * as analyticsService from './analytics.service.js';
import mongoose from 'mongoose';

// Initialize Cache (Std TTL 5 mins, Check period 60s)
const aiCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

// Initialize Gemini
let genAI;
let model;

try {
    console.log('Initializing Gemini AI Service...');
    console.log('GEMINI_API_KEY Environment Variable Present:', !!process.env.GEMINI_API_KEY);

    if (process.env.GEMINI_API_KEY) {
        genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // Using gemini-flash-latest which is confirmed available in the list
        model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
        console.log('Gemini model initialized successfully');
    } else {
        console.warn('GEMINI_API_KEY is not set. AI features will be disabled.');
    }
} catch (error) {
    console.error('Failed to initialize Gemini:', error);
}

/**
 * Builds a comprehensive context object for the AI with full access to restaurant analytics
 * Includes sales, revenue, expenses, inventory, menu performance, and operational metrics
 */
const buildContext = async (restaurantId) => {
    try {
        const cacheKey = `context_${restaurantId}`;
        const cachedContext = aiCache.get(cacheKey);
        if (cachedContext) return cachedContext;

        const rId = new mongoose.Types.ObjectId(restaurantId);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        // 1. Fetch Restaurant Details
        const restaurant = await Restaurant.findById(restaurantId).select('name cuisine status openingTime closingTime');

        // 2. Fetch Comprehensive Dashboard Analytics
        const dashboardAnalytics = await analyticsService.getDashboardAnalytics(restaurantId);

        // 3. Fetch Active Orders with details
        const activeOrders = await Order.find({
            restaurantId,
            orderStatus: { $in: ['Pending', 'Preparing', 'Ready'] },
        })
            .select('orderCode orderStatus total tableNumber createdAt')
            .sort({ createdAt: -1 })
            .limit(10);

        // 4. Fetch Low Stock Items
        const lowStockItems = await Ingredient.find({
            restaurantId,
            $expr: { $lte: ['$currentStock', '$minStockLevel'] },
        })
            .select('name currentStock minStockLevel costPerUnit')
            .limit(5);

        // 5. Fetch Recent Expenses
        const recentExpenses = await Expense.find({
            restaurantId,
            expenseDate: { $gte: startOfMonth },
        })
            .select('expenseType amount description expenseDate')
            .sort({ expenseDate: -1 })
            .limit(5);

        // 6. Fetch Top and Bottom Performing Dishes
        const topDish = await Dish.findOne({ restaurantId })
            .sort({ orderCount: -1 })
            .select('name orderCount');
        const bottomDish = await Dish.findOne({ restaurantId })
            .sort({ orderCount: 1 })
            .select('name orderCount');

        // 7. Get Pending Orders Count (for KDS alerting)
        const pendingOrdersCount = await Order.countDocuments({
            restaurantId,
            orderStatus: 'Pending',
        });

        const contextData = {
            // Restaurant Info
            restaurantName: restaurant?.name || 'Your Restaurant',
            cuisine: restaurant?.cuisine || 'N/A',
            status: restaurant?.status,
            hours: `${restaurant?.openingTime} - ${restaurant?.closingTime}`,

            // Sales & Revenue Data
            sales: {
                todayOrders: dashboardAnalytics.sales.ordersToday,
                todayRevenue: dashboardAnalytics.sales.revenueToday.toFixed(2),
                monthOrders: dashboardAnalytics.sales.ordersThisMonth,
                monthRevenue: dashboardAnalytics.sales.revenueThisMonth.toFixed(2),
                avgOrderValue: dashboardAnalytics.sales.avgOrderValue,
            },

            // Operations Data
            operations: {
                activeOrders: activeOrders.length,
                inProgress: dashboardAnalytics.operations.inProgress,
                completedToday: dashboardAnalytics.operations.completedToday,
                cancelledToday: dashboardAnalytics.operations.cancelledToday,
                pendingOrders: pendingOrdersCount,
                activeOrdersList: activeOrders
                    .map(o => `#${o.orderCode} (${o.orderStatus}) - $${o.total.toFixed(2)}`)
                    .join(', ') || 'None',
            },

            // Inventory Data
            inventory: {
                lowStockCount: dashboardAnalytics.inventory.lowStockCount,
                deadStockCount: dashboardAnalytics.inventory.deadStockCount,
                totalValue: dashboardAnalytics.inventory.totalValue,
                lowStockItems: lowStockItems
                    .map(i => `${i.name} (${i.currentStock}/${i.minStockLevel})`)
                    .join(', ') || 'None',
            },

            // Expense Data
            expenses: {
                monthlyTotal: dashboardAnalytics.expenses.monthlyTotal,
                topCategory: dashboardAnalytics.expenses.topCategory,
                recentExpenses: recentExpenses
                    .map(e => `${e.expenseType}: $${e.amount.toFixed(2)}`)
                    .join(', ') || 'None',
            },

            // Menu Performance Data
            menu: {
                topSelling: {
                    name: topDish?.name || 'N/A',
                    orders: topDish?.orderCount || 0,
                },
                leastSelling: {
                    name: bottomDish?.name || 'N/A',
                    orders: bottomDish?.orderCount || 0,
                },
                arReadyCount: dashboardAnalytics.menu.arReadyCount,
                nonArCount: dashboardAnalytics.menu.nonArCount,
            },
        };

        // Cache context for 2 minutes
        aiCache.set(cacheKey, contextData, 120);

        return contextData;
    } catch (error) {
        console.error('Error building AI context:', error);
        return null;
    }
};

/**
 * Processes a user message and returns an AI response
 */
export const processMessage = async (restaurantId, userMessage, userId) => {
    try {
        if (!model) {
            return "I'm currently unable to connect to my brain (API Key missing). Please contact support.";
        }

        // --- LEVEL 1: Static / FAQ Routing (Cost Optimization) ---
        const lowerMsg = userMessage.toLowerCase();

        // FAQ for common questions
        if (lowerMsg.includes('how to add dish') || lowerMsg.includes('add menu item')) {
            return "To add a new dish, go to the **Menu** tab in the sidebar and click the **'Add Dish'** button in the top right corner.";
        }

        if (lowerMsg.includes('change status') || lowerMsg.includes('open restaurant') || lowerMsg.includes('close restaurant')) {
            return "You can change your restaurant status (Open/Closed) from the toggle switch in the active dashboard header.";
        }

        if (lowerMsg.includes('how to manage inventory') || lowerMsg.includes('stock')) {
            return "Go to the **Inventory** tab to manage your ingredients, set minimum stock levels, and track stock movements.";
        }

        if (lowerMsg.includes('how to view analytics') || lowerMsg.includes('reports')) {
            return "Visit the **Analytics** dashboard to view sales trends, revenue reports, order patterns, and detailed performance metrics.";
        }

        // --- LEVEL 2: AI Reasoning with Full Context ---

        // 1. Get Comprehensive Context
        const context = await buildContext(restaurantId);

        if (!context) {
            return "I'm having trouble accessing your restaurant data right now. Please try again later.";
        }

        // 2. Construct Enhanced Prompt with Full Access
        const prompt = `
You are an intelligent restaurant business assistant with full access to all restaurant analytics and operations data. Your role is to help restaurant administrators make data-driven decisions.

RESTAURANT INFORMATION:
- Name: ${context.restaurantName}
- Cuisine: ${context.cuisine}
- Status: ${context.status}
- Operating Hours: ${context.hours}

TODAY'S SALES & REVENUE:
- Orders Today: ${context.sales.todayOrders}
- Revenue Today: $${context.sales.todayRevenue}
- Average Order Value: $${context.sales.avgOrderValue}

THIS MONTH'S PERFORMANCE:
- Total Orders: ${context.sales.monthOrders}
- Total Revenue: $${context.sales.monthRevenue}

CURRENT OPERATIONS:
- Active Orders: ${context.operations.activeOrders}
- In Progress: ${context.operations.inProgress}
- Pending Orders: ${context.operations.pendingOrders}
- Completed Today: ${context.operations.completedToday}
- Cancelled Today: ${context.operations.cancelledToday}
- Active Orders List: ${context.operations.activeOrdersList}

INVENTORY STATUS:
- Low Stock Items: ${context.inventory.lowStockCount}
- Dead Stock (Zero Qty): ${context.inventory.deadStockCount}
- Total Inventory Value: $${context.inventory.totalValue}
- Critical Items: ${context.inventory.lowStockItems}

EXPENSES (This Month):
- Monthly Total: $${context.expenses.monthlyTotal}
- Top Category: ${context.expenses.topCategory}
- Recent Expenses: ${context.expenses.recentExpenses}

MENU PERFORMANCE:
- Top Selling: ${context.menu.topSelling.name} (${context.menu.topSelling.orders} orders)
- Least Selling: ${context.menu.leastSelling.name} (${context.menu.leastSelling.orders} orders)
- AR Models Ready: ${context.menu.arReadyCount} out of ${context.menu.arReadyCount + context.menu.nonArCount}

USER QUESTION: "${userMessage}"

INSTRUCTIONS:
1. Use the provided data to give specific, data-backed answers.
2. Be professional, concise, and actionable.
3. Provide insights and recommendations when applicable.
4. If asked about metrics, quote accurate numbers from the data provided.
5. Format important numbers in **bold**.
6. If asked about something you don't have data for, offer to help with what you do have.
7. Provide business insights and suggestions for improvement.
8. If the question involves trends or comparisons, use the available metrics intelligently.
    `;

        console.log('AI Service - Constructed Enhanced Prompt with full data access');

        // 3. Generate Response
        try {
            const result = await model.generateContent(prompt);
            console.log('AI Service - Gemini result received');
            const response = await result.response;
            console.log('AI Service - Gemini response received');
            const text = response.text();
            console.log('AI Service - Generated Text:', text);

            return text;
        } catch (genError) {
            console.error('AI Service - Generation Error:', genError);
            throw genError;
        }

    } catch (error) {
        console.error('AI Service Error:', error);
        if (error.response) {
            console.error('Gemini API Error Detail:', JSON.stringify(error.response, null, 2));
        }
        return "I encountered an error processing your request. Please try again.";
    }
};

/**
 * Generate a persuasive upsell explanation using Gemini
 * @param {Object} mainDish - The main dish object
 * @param {Object} secondaryDish - The recommended dish object
 * @param {String} ruleType - Type of rule (PAIRING, COMBO, etc.)
 * @returns {Promise<String>} - Generated explanation text
 */
export const generateUpsellExplanation = async (mainDish, secondaryDish, ruleType) => {
    try {
        if (!process.env.GEMINI_API_KEY) {
            console.warn('[AI Service] GEMINI_API_KEY not found. Returning default message.');
            return getDefaultMessage(secondaryDish.name);
        }

        console.log(`[AI Service] Generating explanation for ${mainDish.name} + ${secondaryDish.name}`);

        const prompt = createUpsellPrompt(mainDish, secondaryDish, ruleType);

        // Use the existing model instance
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim();

        // Ensure the response isn't too long (max 120 chars for UI)
        if (text.length > 120) {
            return text.substring(0, 117) + '...';
        }

        return text;
    } catch (error) {
        console.error('[AI Service] Error generating explanation:', error);
        return getDefaultMessage(secondaryDish.name);
    }
};

/**
 * Create a context-aware prompt based on dish details and rule type
 */
const createUpsellPrompt = (mainDish, secondaryDish, ruleType) => {
    const mainDesc = mainDish.description ? `(Description: ${mainDish.description})` : '';
    const secDesc = secondaryDish.description ? `(Description: ${secondaryDish.description})` : '';

    let specificInstruction = '';

    switch (ruleType) {
        case 'FREQUENT_PAIR':
        case 'LOW_ATTACHMENT':
            specificInstruction = `Explain why ${secondaryDish.name} pairs well with ${mainDish.name} based on their flavors.`;
            break;
        case 'COMBO_DISCOUNT':
            specificInstruction = `Highlight the value of ordering ${secondaryDish.name} with ${mainDish.name} as a combo.`;
            break;
        case 'CART_THRESHOLD':
            specificInstruction = `Suggest adding ${secondaryDish.name} to complete the meal.`;
            break;
        default:
            specificInstruction = `Recommend ${secondaryDish.name} as a great addition to ${mainDish.name}.`;
    }

    return `
    Act as a digital waiter recommending a dish.
    Main Dish: ${mainDish.name} ${mainDesc}
    Recommended Dish: ${secondaryDish.name} ${secDesc}
    
    Task: ${specificInstruction}
    
    Constraints:
    - Keep it very short, under 15 words.
    - Be persuasive and appetizing.
    - Do not use quotes.
    - Direct address to the customer (e.g., "Try...", "Pair with...").
    `;
};

/**
 * Fallback message if AI generation fails
 */
const getDefaultMessage = (dishName) => {
    return `Try adding ${dishName} to your order!`;
};
