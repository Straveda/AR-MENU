import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "./src/models/user.models.js";
import { Role } from "./src/models/role.models.js";
import { PERMISSIONS } from "./src/constants/permissions.js";

dotenv.config();

import { DB_Name } from "./src/constants.js";

const checkPermissions = async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_Name}`);
    console.log(`Connected to ${DB_Name}`);

    const email = "admin@demo.com"; 
    const user = await User.findOne({ email }).populate("roleId");

    if (!user) {
      console.log(`User ${email} not found`);
      return;
    }

    console.log(`\nUser: ${user.email}`);
    console.log(`Is Active: ${user.isActive}`);
    
    if (user.isActive === false) {
        console.log("User is inactive. Activating...");
        user.isActive = true;
        await user.save();
        console.log("User activated.");
    }
    console.log(`Restaurant ID: ${user.restaurantId}`);
    console.log(`Role ID: ${user.roleId?._id}`);
    console.log(`Role Name: ${user.roleId?.name}`);
    console.log(`Role IsSystem: ${user.roleId?.isSystemRole}`);
    
    console.log("\nAssigned Permissions:");
    console.log(user.roleId?.permissions);

    console.log("\nRequired Permission for getDishes:");
    console.log(`PERMISSIONS.VIEW_DISHES = '${PERMISSIONS.VIEW_DISHES}'`);

    const hasPermission = user.roleId?.permissions.includes(PERMISSIONS.VIEW_DISHES);
    console.log(`\nHas Permission? ${hasPermission ? "YES" : "NO"}`);

    if (user.roleId) {
        // Double check raw document in case populate is weird
        const rawRole = await Role.findById(user.roleId._id);
        console.log("\nRaw Role Permissions from DB:");
        console.log(rawRole.permissions);
    }

  } catch (error) {
    console.error(error);
  } finally {
    await mongoose.disconnect();
  }
};

checkPermissions();
