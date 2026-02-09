import { GoogleGenerativeAI } from '@google/generative-ai';
import NodeCache from 'node-cache';
import { Order } from '../models/order.models.js';
import { Dish } from '../models/dish.models.js';
import Restaurant from '../models/restaurant.models.js';

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
 * Builds a context object for the AI based on current restaurant data
 */
const buildContext = async (restaurantId) => {
    try {
        const cacheKey = `context_${restaurantId}`;
        const cachedContext = aiCache.get(cacheKey);
        if (cachedContext) return cachedContext;

        // 1. Fetch Restaurant Details
        const restaurant = await Restaurant.findById(restaurantId).select('name cuisine status openingTime closingTime');

        // 2. Fetch Active Orders
        const activeOrders = await Order.find({
            restaurantId,
            orderStatus: { $in: ['Pending', 'Preparing', 'Ready'] },
        })
            .select('orderCode orderStatus total tableNumber createdAt')
            .sort({ createdAt: -1 })
            .limit(5);

        // 3. Fetch Today's Stats (Simple Aggregation)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todaysOrders = await Order.find({
            restaurantId,
            createdAt: { $gte: today },
        }).select('total orderStatus');

        const revenue = todaysOrders.reduce((acc, order) => acc + (order.total || 0), 0);
        const orderCount = todaysOrders.length;

        // 4. Fetch Top Menu Items (by availability)
        const lowStockItems = await Dish.find({
            restaurantId,
            available: true, // Assuming available means in stock for now, or add logic if quantity exists
        }).limit(5).select('name price category');

        const contextData = {
            restaurantName: restaurant?.name || 'Your Restaurant',
            status: restaurant?.status,
            hours: `${restaurant?.openingTime} - ${restaurant?.closingTime}`,
            activeOrdersCount: activeOrders.length,
            latestOrders: activeOrders.map(o => `#${o.orderCode} (${o.orderStatus}) - $${o.total}`).join(', '),
            todayStats: `Orders: ${orderCount}, Revenue: $${revenue.toFixed(2)}`,
            menuSnippet: lowStockItems.map(d => d.name).join(', ')
        };

        // Cache context for 2 minutes to serve frequent chats
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

        if (lowerMsg.includes('how to add dish') || lowerMsg.includes('add menu item')) {
            return "To add a new dish, go to the **Menu** tab in the sidebar and click the **'Add Dish'** button in the top right corner.";
        }

        if (lowerMsg.includes('change status') || lowerMsg.includes('open restaurant')) {
            return "You can change your restaurant status (Open/Closed) from the toggle switch in the active dashboard header.";
        }

        // --- LEVEL 2: AI Reasoning with Context ---

        // 1. Get Context
        const context = await buildContext(restaurantId);

        if (!context) {
            return "I'm having trouble accessing your restaurant data right now. Please try again later.";
        }

        // 2. Construct Prompt
        const prompt = `
      You are a helpful restaurant assistant for ${context.restaurantName}.
      
      Current Data:
      - Status: ${context.status}
      - Hours: ${context.hours}
      - Today's Performance: ${context.todayStats}
      - Active Orders (${context.activeOrdersCount}): ${context.latestOrders || 'None'}
      - Key Menu Items: ${context.menuSnippet}

      User Query: "${userMessage}"

      Instructions:
      - Answer briefly and professionally.
      - Use the provided data to give specific answers.
      - If the user asks for data you don't have, say "I don't have access to that specific data yet."
      - Format key numbers or terms in **bold**.
    `;

        console.log('AI Service - Constructed Prompt:', prompt);

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
