import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../src/models/user.models.js';

dotenv.config();

const migrateDepartments = async () => {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        console.log('Running migration...');

        // Update Finance -> Cashier
        const financeResult = await User.updateMany(
            { department: 'Finance' },
            { $set: { department: 'Cashier' } }
        );
        console.log(`Updated ${financeResult.modifiedCount} users from Finance to Cashier.`);

        // Update Operations -> Waiter
        const opsResult = await User.updateMany(
            { department: 'Operations' },
            { $set: { department: 'Waiter' } }
        );
        console.log(`Updated ${opsResult.modifiedCount} users from Operations to Waiter.`);

        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrateDepartments();
