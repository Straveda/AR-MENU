import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User } from "../models/user.models.js";
import { Restaurant } from "../models/restaurant.models.js";

const seedUsers = async () => {
  try {
    await mongoose.connect(`mongodb+srv://SumitRaskar:darkKnight01@cluster0.s0ts6ml.mongodb.net/restaurantDB-development`);
    console.log("MongoDB connected");

    // 1. Get Demo Restaurant
    const restaurant = await Restaurant.findOne({ name: "Demo Restaurant" });

    if (!restaurant) {
      throw new Error("Demo Restaurant not found. Seed restaurant first.");
    }

    // 2. Clear existing users (ONLY in dev)
    await User.deleteMany();

    // 3. Hash password
    const passwordHash = await bcrypt.hash("password123", 10);

    // 4. Create users
    const users = [
      {
        username: "Platform Super Admin",
        email: "superadmin@platform.com",
        password: passwordHash,
        role: "SUPER_ADMIN",
        restaurantId: null,
      },
      {
        username: "Demo Restaurant Admin",
        email: "admin@demo.com",
        password: passwordHash,
        role: "RESTAURANT_ADMIN",
        restaurantId: restaurant._id,
      },
    ];

    await User.insertMany(users);

    console.log("Users seeded successfully");
    process.exit(0);
  } catch (error) {
    console.error("User seeding failed:", error.message);
    process.exit(1);
  }
};

seedUsers();
