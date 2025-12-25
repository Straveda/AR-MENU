/**
 * Meshy AI Service
 * Handles all interactions with the Meshy API for 3D model generation
 */

const MESHY_API_BASE_URL = process.env.MESHY_API_BASE_URL || 'https://api.meshy.ai';
const MESHY_API_KEY = process.env.MESHY_API_KEY;

/**
 * Create a new image-to-3D task on Meshy
 * @param {string} imageUrl - URL of the image to convert to 3D
 * @param {string} dishName - Name of the dish (optional, for reference)
 * @returns {Promise<{taskId: string}>}
 */
export const createImageTo3DTask = async (imageUrl, dishName = '') => {
    try {
        if (!MESHY_API_KEY) {
            throw new Error('MESHY_API_KEY is not configured');
        }

        const response = await fetch(`${MESHY_API_BASE_URL}/v1/image-to-3d`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${MESHY_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                image_url: imageUrl,
                enable_pbr: true, // Enable PBR Maps (metallic, roughness, normal)
                ai_model: 'latest', // Meshy 6 Preview - highest quality model
                topology: 'triangle', // Triangle mesh - matches web interface
                target_polycount: 300000, // High detail level for food models (~1.3M faces on web)
                should_remesh: true, // Enable remesh phase
                should_texture: true, // Enable texture generation
                texture_image_url: imageUrl, // Use original image for texture guidance
                symmetry_mode: 'off', // Disable symmetry for food (asymmetric items)
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Meshy API error: ${errorData.message || response.statusText}`);
        }

        const data = await response.json();
        console.log(`✅ Meshy task created for "${dishName}": ${data.result}`);

        return {
            taskId: data.result,
        };
    } catch (error) {
        console.error('Error creating Meshy task:', error);
        throw error;
    }
};

/**
 * Get the status of a Meshy task
 * @param {string} taskId - The task ID from Meshy
 * @returns {Promise<{status: string, modelUrls?: {glb: string, usdz: string}, progress?: number}>}
 */
export const getTaskStatus = async (taskId) => {
    try {
        if (!MESHY_API_KEY) {
            throw new Error('MESHY_API_KEY is not configured');
        }

        const response = await fetch(`${MESHY_API_BASE_URL}/v1/image-to-3d/${taskId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${MESHY_API_KEY}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Meshy API error: ${errorData.message || response.statusText}`);
        }

        const data = await response.json();

        // Map Meshy status to our internal status
        const statusMap = {
            'PENDING': 'pending',
            'IN_PROGRESS': 'processing',
            'SUCCEEDED': 'completed',
            'FAILED': 'failed',
            'EXPIRED': 'failed',
        };

        const mappedStatus = statusMap[data.status] || 'pending';

        const result = {
            status: mappedStatus,
            progress: data.progress || 0,
        };

        // If completed, extract model URLs
        if (mappedStatus === 'completed' && data.model_urls) {
            result.modelUrls = {
                glb: data.model_urls.glb || null,
                usdz: data.model_urls.usdz || null,
            };
        }

        return result;
    } catch (error) {
        console.error('Error getting Meshy task status:', error);
        throw error;
    }
};

/**
 * Poll a task until it completes or fails
 * @param {string} taskId - The task ID from Meshy
 * @param {number} maxAttempts - Maximum number of polling attempts (default 60 = ~10 minutes)
 * @param {number} intervalMs - Interval between polls in milliseconds (default 10 seconds)
 * @returns {Promise<{status: string, modelUrls?: {glb: string, usdz: string}}>}
 */
export const pollTaskUntilComplete = async (taskId, maxAttempts = 60, intervalMs = 10000) => {
    let attempts = 0;

    while (attempts < maxAttempts) {
        try {
            const taskStatus = await getTaskStatus(taskId);

            console.log(`📊 Task ${taskId} status: ${taskStatus.status} (${taskStatus.progress}%)`);

            if (taskStatus.status === 'completed') {
                console.log(`✅ Task ${taskId} completed successfully`);
                return taskStatus;
            }

            if (taskStatus.status === 'failed') {
                throw new Error(`Task ${taskId} failed`);
            }

            // Wait before next poll
            await new Promise(resolve => setTimeout(resolve, intervalMs));
            attempts++;
        } catch (error) {
            console.error(`Error polling task ${taskId}:`, error);
            throw error;
        }
    }

    throw new Error(`Task ${taskId} exceeded maximum polling attempts`);
};

/**
 * Refine/regenerate a 3D model (if needed in the future)
 * @param {string} taskId - Original task ID
 * @returns {Promise<{taskId: string}>}
 */
export const refineModel = async (taskId) => {
    try {
        if (!MESHY_API_KEY) {
            throw new Error('MESHY_API_KEY is not configured');
        }

        const response = await fetch(`${MESHY_API_BASE_URL}/v1/image-to-3d/${taskId}/refine`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${MESHY_API_KEY}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Meshy API error: ${errorData.message || response.statusText}`);
        }

        const data = await response.json();
        return {
            taskId: data.result,
        };
    } catch (error) {
        console.error('Error refining Meshy model:', error);
        throw error;
    }
};
