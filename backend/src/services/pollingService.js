/**
 * Background Polling Service
 * Checks Meshy task statuses for pending dishes and updates the database
 */

import { Dish } from '../models/dish.models.js';
import { getTaskStatus } from './meshyService.js';

// Track active polling to prevent duplicates
const activePolling = new Set();

/**
 * Start polling for a specific dish's Meshy task
 * @param {string} dishId - MongoDB dish ID
 * @param {string} meshyTaskId - Meshy task ID
 */
export const startPollingForDish = async (dishId, meshyTaskId) => {
    // Prevent duplicate polling for the same dish
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

/**
 * Poll a single dish's task status
 * @param {string} dishId - MongoDB dish ID
 * @param {string} meshyTaskId - Meshy task ID
 */
const pollDishTask = async (dishId, meshyTaskId, maxAttempts = 60) => {
    let attempts = 0;
    const intervalMs = 10000; // 10 seconds

    while (attempts < maxAttempts) {
        try {
            // Get current task status from Meshy
            const taskStatus = await getTaskStatus(meshyTaskId);

            // Update dish in database
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
                return; // Stop polling
            }

            if (taskStatus.status === 'failed') {
                await dish.save();
                console.error(`❌ Model generation failed for dish "${dish.name}"`);
                return; // Stop polling
            }

            // Save progress update
            await dish.save();
            console.log(`📊 Dish "${dish.name}": ${taskStatus.status} (${taskStatus.progress}%)`);

            // Wait before next poll
            await new Promise(resolve => setTimeout(resolve, intervalMs));
            attempts++;
        } catch (error) {
            console.error(`Error polling task ${meshyTaskId}:`, error);

            // On error, mark as failed after a few retries
            if (attempts > 5) {
                try {
                    await Dish.findByIdAndUpdate(dishId, { modelStatus: 'failed' });
                } catch (updateError) {
                    console.error('Failed to update dish status:', updateError);
                }
                throw error;
            }

            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, intervalMs));
            attempts++;
        }
    }

    // If we reach here, we've exceeded max attempts
    console.error(`⏱️ Polling timeout for dish ${dishId}`);
    try {
        await Dish.findByIdAndUpdate(dishId, {
            modelStatus: 'failed'
        });
    } catch (error) {
        console.error('Failed to update dish status:', error);
    }
};

/**
 * Check all pending/processing dishes on server startup
 * Resume polling for any that are still in progress
 */
export const resumePendingPolls = async () => {
    try {
        const pendingDishes = await Dish.find({
            modelStatus: { $in: ['pending', 'processing'] },
            meshyTaskId: { $ne: null }
        });

        console.log(`📥 Found ${pendingDishes.length} dishes with pending models`);

        for (const dish of pendingDishes) {
            // Start polling in background (don't await)
            startPollingForDish(dish._id.toString(), dish.meshyTaskId);
        }
    } catch (error) {
        console.error('Error resuming pending polls:', error);
    }
};

/**
 * Get count of active polling tasks
 */
export const getActivePollingCount = () => {
    return activePolling.size;
};
