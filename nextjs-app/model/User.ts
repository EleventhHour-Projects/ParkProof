import mongoose, { Schema, Model, models } from "mongoose";
import type { User } from "@/lib/types/user";

const UserSchema: Schema<User> = new Schema(
  {
    role: {
      type: String,
      enum: ["PARKER", "ATTENDANT", "ADMIN"],
      required: true,
      default: "PARKER",
    },

    phone: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      select: false, // never return password by default
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

/**
 * Prevent model overwrite in Next.js hot reload
 */
const UserModel: Model<User> =
  models.User || mongoose.model<User>("User", UserSchema, "users"); // third parameter is collection name

export default UserModel;
