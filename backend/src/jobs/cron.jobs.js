import cron from 'node-cron';
import { runNightlyAggregation } from '../services/analytics.service.js';

/**
 * Initialize all cron jobs for the application
 */
export const initializeCronJobs = () => {
    console.log('[Cron] Initializing cron jobs...');

    // Run analytics aggregation every night at 2 AM
    cron.schedule('0 2 * * *', async () => {
        console.log('[Cron] Starting nightly analytics aggregation...');
        try {
            await runNightlyAggregation();
            console.log('[Cron] Nightly aggregation completed successfully');
        } catch (error) {
            console.error('[Cron] Nightly aggregation failed:', error);
        }
    }, {
        timezone: 'Asia/Kolkata' // Adjust to your timezone
    });

    console.log('[Cron] Cron jobs initialized successfully');
    console.log('[Cron] - Analytics aggregation: Every day at 2:00 AM IST');
};
