import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      trim: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: [
        "SUPER_ADMIN",
        "PLATFORM_ADMIN",
        "RESTAURANT_ADMIN",
        "KDS",
        "CUSTOMER",
      ],
      required: true,
    },

    department: {
      type: String,
      enum: ["KDS", "Finance", "Operations"],
      default: null,
    },

    roleTitle: {
      type: String,
      trim: true,
      maxlength: 100,
      default: null,
    },

    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", function (next) {
  
  const platformRoles = ["SUPER_ADMIN", "PLATFORM_ADMIN"];
  
  if (platformRoles.includes(this.role) && this.restaurantId !== null) {
    return next(
      new Error(`${this.role} must not be associated with a restaurant`)
    );
  }

  if (!platformRoles.includes(this.role) && !this.restaurantId) {
    return next(
      new Error("Non-platform users must belong to a restaurant")
    );
  }

  next();
});

export const User = mongoose.model("User", userSchema);
