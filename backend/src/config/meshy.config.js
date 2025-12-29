/**
 * Meshy API Configuration
 */

export const meshyConfig = {
    apiKey: process.env.MESHY_API_KEY,
    baseUrl: process.env.MESHY_API_BASE_URL || 'https://api.meshy.ai',

    // Model generation settings (matched to Meshy web interface for best quality)
    defaultSettings: {
        aiModel: 'latest', // Meshy 6 Preview - highest quality model
        enablePbr: true, // PBR Maps (metallic, roughness, normal)
        topology: 'triangle', // Triangle mesh for detailed food models
        targetPolycount: 300000, // High detail level (web interface uses ~1.3M faces)
        shouldRemesh: true, // Enable remesh phase
        shouldTexture: true, // Enable texture generation
        symmetryMode: 'off', // Disable for asymmetric food items
    },

    // Polling configuration
    polling: {
        intervalMs: 10000, // Check every 10 seconds
        maxAttempts: 60, // ~10 minutes total
        resumeOnStartup: true, // Resume polling for pending tasks on server restart
    },

    // Model URL expiration (Meshy URLs typically expire after 30 days)
    urlExpirationDays: 30,
};

/**
 * Validate Meshy configuration
 * @returns {boolean} true if configuration is valid
 */
export const validateMeshyConfig = () => {
    if (!meshyConfig.apiKey) {
        console.warn('⚠️  MESHY_API_KEY is not configured. 3D model generation will be disabled.');
        return false;
    }

    console.log('✅ Meshy configuration validated');
    return true;
};
