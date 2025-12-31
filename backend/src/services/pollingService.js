

import { Dish } from '../models/dish.models.js';
import { getTaskStatus } from './meshyService.js';

const activePolling = new Set();

export const startPollingForDish = async (dishId, meshyTaskId) => {
    
    if (activePolling.has(dishId)) {
        console.log(`Already polling for dish ${dishId}`);
        return;
    }

    activePolling.add(dishId);
    console.log(`🔄 Started polling for dish ${dishId} (task: ${meshyTaskId})`);

    try {
        await pollDishTask(dishId, meshyTaskId);
    } catch (error) {
        console.error(`Error in polling for dish ${dishId}:`, error);
    } finally {
        activePolling.delete(dishId);
    }
};

const pollDishTask = async (dishId, meshyTaskId, maxAttempts = 60) => {
    let attempts = 0;
    const intervalMs = 10000; 

    while (attempts < maxAttempts) {
        try {
            
            const taskStatus = await getTaskStatus(meshyTaskId);

            const dish = await Dish.findById(dishId);
            if (!dish) {
                console.error(`Dish ${dishId} not found, stopping polling`);
                return;
            }

            dish.modelStatus = taskStatus.status;

            if (taskStatus.status === 'completed' && taskStatus.modelUrls) {
                dish.modelUrls = taskStatus.modelUrls;
                await dish.save();
                console.log(`✅ Model completed for dish "${dish.name}"`);
                return; 
            }

            if (taskStatus.status === 'failed') {
                await dish.save();
                console.error(`❌ Model generation failed for dish "${dish.name}"`);
                return; 
            }

            await dish.save();
            console.log(`📊 Dish "${dish.name}": ${taskStatus.status} (${taskStatus.progress}%)`);

            await new Promise(resolve => setTimeout(resolve, intervalMs));
            attempts++;
        } catch (error) {
            console.error(`Error polling task ${meshyTaskId}:`, error);

            if (attempts > 5) {
                try {
                    await Dish.findByIdAndUpdate(dishId, { modelStatus: 'failed' });
                } catch (updateError) {
                    console.error('Failed to update dish status:', updateError);
                }
                throw error;
            }

            await new Promise(resolve => setTimeout(resolve, intervalMs));
            attempts++;
        }
    }

    console.error(`⏱️ Polling timeout for dish ${dishId}`);
    try {
        await Dish.findByIdAndUpdate(dishId, {
            modelStatus: 'failed'
        });
    } catch (error) {
        console.error('Failed to update dish status:', error);
    }
};

export const resumePendingPolls = async () => {
    try {
        const pendingDishes = await Dish.find({
            modelStatus: { $in: ['pending', 'processing'] },
            meshyTaskId: { $ne: null }
        });

        console.log(`📥 Found ${pendingDishes.length} dishes with pending models`);

        for (const dish of pendingDishes) {
            
            startPollingForDish(dish._id.toString(), dish.meshyTaskId);
        }
    } catch (error) {
        console.error('Error resuming pending polls:', error);
    }
};

export const getActivePollingCount = () => {
    return activePolling.size;
};
