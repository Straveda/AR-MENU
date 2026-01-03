import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { DB_Name } from '../constants.js';

dotenv.config();

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_Name}`);
    console.log('MongoDB Connection Successfull || DB Host: ', connectionInstance.connection.host);
  } catch (error) {
    console.log('MongoDB Connection Error: ', error);
    process.exit(1);
  }
};

export default connectDB;
