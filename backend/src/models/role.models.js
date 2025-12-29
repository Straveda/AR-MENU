import mongoose from "mongoose";
import { PERMISSIONS } from "../constants/permissions.js";

const roleSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    permissions: [
      {
        type: String,
        enum: Object.values(PERMISSIONS),
      },
    ],
    isSystemRole: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Compound index to ensure role names are unique per restaurant
roleSchema.index({ restaurantId: 1, name: 1 }, { unique: true });

export const Role = mongoose.model("Role", roleSchema);
