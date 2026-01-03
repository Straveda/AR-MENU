

import { Dish } from '../models/dish.models.js';
import { getTaskStatus } from './meshyService.js';
import { storageService } from './storage/StorageService.js';
import fetch from 'node-fetch';

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
                console.log(`✅ Meshy task completed for dish "${dish.name}". Downloading models...`);

                try {
                    const newModelUrls = { glb: null, usdz: null };

                    // 1. Download and Upload GLB
                    if (taskStatus.modelUrls.glb) {
                        console.log(`Downloading GLB: ${taskStatus.modelUrls.glb}`);
                        const response = await fetch(taskStatus.modelUrls.glb);
                        if (!response.ok) throw new Error(`Failed to download GLB: ${response.statusText}`);
                        const buffer = Buffer.from(await response.arrayBuffer());
                        
                        const fileName = `${dish.name.replace(/\s+/g, '_')}_${meshyTaskId}.glb`;
                        const uploadResult = await storageService.uploadFile(buffer, fileName, "menu-ar/models");
                        newModelUrls.glb = uploadResult.url;
                        console.log(`✅ Uploaded GLB to ImageKit: ${uploadResult.url}`);
                    }

                    // 2. Download and Upload USDZ
                    if (taskStatus.modelUrls.usdz) {
                         console.log(`Downloading USDZ: ${taskStatus.modelUrls.usdz}`);
                        const response = await fetch(taskStatus.modelUrls.usdz);
                         if (!response.ok) throw new Error(`Failed to download USDZ: ${response.statusText}`);
                        const buffer = Buffer.from(await response.arrayBuffer());
                        
                        const fileName = `${dish.name.replace(/\s+/g, '_')}_${meshyTaskId}.usdz`;
                        const uploadResult = await storageService.uploadFile(buffer, fileName, "menu-ar/models");
                        newModelUrls.usdz = uploadResult.url;
                         console.log(`✅ Uploaded USDZ to ImageKit: ${uploadResult.url}`);
                    }

                    // 3. Update Dish with NEW URLs
                    dish.modelUrls = newModelUrls;
                    await dish.save();
                    console.log(`✅ Dish "${dish.name}" updated with ImageKit model URLs`);
                    return;

                } catch (uploadError) {
                     console.error("❌ Error persisting models to ImageKit:", uploadError);
                     // Fallback: save Meshy URLs temporarily or mark as failed? 
                     // For now, let's keep it as is (so frontend might still try Meshy URLs if we didn't save)
                     // Or better: Fail the process so we can retry?
                     // Let's log it and NOT save 'completed' status if we failed to persist?
                     // Actually, if we fail here, we might want to retry model persistence.
                     // But for now, let's rely on the outer try/catch loop.
                     throw uploadError;
                }
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
