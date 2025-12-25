import mongoose from "mongoose";
import dotenv from "dotenv";
import { Restaurant } from "../models/restaurant.models.js";

dotenv.config();

const seedRestaurant = async () => {
  try {
    await mongoose.connect(`mongodb+srv://SumitRaskar:darkKnight01@cluster0.s0ts6ml.mongodb.net/restaurantDB-development`);

    const existing = await Restaurant.findOne({ name: "Demo Restaurant" });

    if (existing) {
      let updated = false;
      if (!existing.slug) {
        existing.slug = "demo-restaurant";
        updated = true;
      }
      if (!existing.subscriptionStatus) {
        existing.subscriptionStatus = "ACTIVE";
        existing.subscriptionEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        updated = true;
      }
      
      if (updated) {
        await existing.save();
        console.log("Restaurant fields updated successfully");
      } else {
        console.log("Restaurant already exists with all fields");
      }
      process.exit(0);
    }

    await Restaurant.create({
      name: "Demo Restaurant",
      slug: "demo-restaurant",
      status: "Active",
      subscriptionStatus: "ACTIVE",
      subscriptionEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    });

    console.log("Restaurant seeded successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding restaurant:", error);
    process.exit(1);
  }
};

seedRestaurant();
