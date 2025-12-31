

const MESHY_API_BASE_URL = process.env.MESHY_API_BASE_URL || 'https://api.meshy.ai';
const MESHY_API_KEY = process.env.MESHY_API_KEY;

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
                enable_pbr: true, 
                ai_model: 'latest', 
                topology: 'triangle', 
                target_polycount: 300000, 
                should_remesh: true, 
                should_texture: true, 
                texture_image_url: imageUrl, 
                symmetry_mode: 'off', 
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

            await new Promise(resolve => setTimeout(resolve, intervalMs));
            attempts++;
        } catch (error) {
            console.error(`Error polling task ${taskId}:`, error);
            throw error;
        }
    }

    throw new Error(`Task ${taskId} exceeded maximum polling attempts`);
};

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
