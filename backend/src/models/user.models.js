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
        "RESTAURANT_ADMIN",
        "KDS",
        "WAITER",
        "CASHIER",
      ],
      required: true,
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
  if (this.role === "SUPER_ADMIN" && this.restaurantId !== null) {
    return next(
      new Error("SUPER_ADMIN must not be associated with a restaurant")
    );
  }

  if (this.role !== "SUPER_ADMIN" && !this.restaurantId) {
    return next(
      new Error("Non-super-admin users must belong to a restaurant")
    );
  }

  next();
});

export const User = mongoose.model("User", userSchema);
