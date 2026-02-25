import Restaurant from '../models/restaurant.models.js';
import { generateTheme } from '../services/ai.service.js';


const DEFAULT_THEME = {
    preset: 'holoplate-classic',
    colors: {
        primary: '#f59e0b',
        secondary: '#1e293b',
        accent: '#d97706',
        background: '#ffffff',
    },
    typography: {
        fontFamily: 'Inter',
        fontSize: 'medium',
    },
    layout: {
        cardStyle: 'list',
        glassmorphism: false,
    },
};

// GET /api/appearance
// Public: ?slug=xxx  |  Authed admin: uses req.restaurant (set by resolveRestaurantFromUser)
export const getTheme = async (req, res) => {
    try {
        let restaurant;

        if (req.restaurant) {
            // Authenticated admin path
            restaurant = await Restaurant.findById(req.restaurant._id).select('menuTheme');
        } else if (req.query.slug) {
            // Public customer path
            restaurant = await Restaurant.findOne({ slug: req.query.slug }).select('menuTheme');
        } else {
            return res.status(400).json({ message: 'Missing slug or authentication' });
        }

        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        // Return theme, falling back to defaults for any missing fields
        const theme = restaurant.menuTheme?.preset
            ? restaurant.menuTheme
            : DEFAULT_THEME;

        return res.status(200).json({ theme });
    } catch (err) {
        console.error('[appearance.getTheme]', err);
        return res.status(500).json({ message: 'Server error' });
    }
};

// PUT /api/appearance
// Authed admin only
export const saveTheme = async (req, res) => {
    try {
        const { preset, colors, typography, layout } = req.body;

        const update = {};
        if (preset) update['menuTheme.preset'] = preset;
        if (colors) {
            if (colors.primary) update['menuTheme.colors.primary'] = colors.primary;
            if (colors.secondary) update['menuTheme.colors.secondary'] = colors.secondary;
            if (colors.accent) update['menuTheme.colors.accent'] = colors.accent;
            if (colors.background) update['menuTheme.colors.background'] = colors.background;
        }
        if (typography) {
            if (typography.fontFamily) update['menuTheme.typography.fontFamily'] = typography.fontFamily;
            if (typography.fontSize) update['menuTheme.typography.fontSize'] = typography.fontSize;
        }
        if (layout) {
            if (layout.cardStyle !== undefined) update['menuTheme.layout.cardStyle'] = layout.cardStyle;
            if (layout.glassmorphism !== undefined) update['menuTheme.layout.glassmorphism'] = layout.glassmorphism;
        }

        const restaurant = await Restaurant.findByIdAndUpdate(
            req.restaurant._id,
            { $set: update },
            { new: true, select: 'menuTheme' }
        );

        return res.status(200).json({ message: 'Theme saved', theme: restaurant.menuTheme });
    } catch (err) {
        console.error('[appearance.saveTheme]', err);
        return res.status(500).json({ message: 'Server error' });
    }
};

// POST /api/appearance/reset
// Resets to Holoplate Classic defaults
export const resetTheme = async (req, res) => {
    try {
        const restaurant = await Restaurant.findByIdAndUpdate(
            req.restaurant._id,
            { $set: { menuTheme: DEFAULT_THEME } },
            { new: true, select: 'menuTheme' }
        );

        return res.status(200).json({ message: 'Theme reset to default', theme: restaurant.menuTheme });
    } catch (err) {
        console.error('[appearance.resetTheme]', err);
        return res.status(500).json({ message: 'Server error' });
    }
};

// POST /api/appearance/ai-generate
// Uses Gemini to generate a theme from a vibe description
export const aiGenerateTheme = async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 5) {
            return res.status(400).json({ message: 'Please provide a restaurant vibe description (at least 5 characters).' });
        }

        if (prompt.trim().length > 500) {
            return res.status(400).json({ message: 'Description is too long (max 500 characters).' });
        }

        const theme = await generateTheme(prompt.trim());
        return res.status(200).json({ theme });
    } catch (err) {
        console.error('[appearance.aiGenerateTheme]', err);
        return res.status(500).json({ message: err.message || 'Failed to generate theme. Please try again.' });
    }
};

