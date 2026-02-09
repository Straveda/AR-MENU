import { processMessage } from '../services/ai.service.js';

export const handleChatMessage = async (req, res) => {
    try {
        const { message } = req.body;
        console.log('Chat Controller - Request Body:', req.body);
        console.log('Chat Controller - Restaurant Context:', req.restaurant?._id);
        console.log('Chat Controller - User Context:', req.user?.id);

        const restaurantId = req.restaurant?._id;
        const userId = req.user?.id;

        if (!message) {
            console.error('Chat Controller - Missing Message');
            return res.status(400).json({ success: false, message: 'Message is required' });
        }

        if (!restaurantId) {
            console.error('Chat Controller - Missing Restaurant Context');
            return res.status(403).json({ success: false, message: 'Restaurant context not found' });
        }

        const response = await processMessage(restaurantId, message, userId);

        return res.status(200).json({
            success: true,
            message: response,
        });
    } catch (error) {
        console.error('Chat Controller Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error processing chat message',
        });
    }
};
