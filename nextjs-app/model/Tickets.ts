import mongoose, { Schema, Model, models } from "mongoose";
import type { Ticket } from "@/lib/types/ticket";

const ONE_HOUR_TEN_MINUTES_MS = (60 + 10) * 60 * 1000;

const TicketSchema = new Schema<Ticket>(
  {
    parkingLotId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "ParkingLot",
      index: true,
    },

    vehicleNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },

    vehicleType: {
      type: String,
      enum: ['4w', '2w', '3w'],
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ["CREATED", "USED", "EXPIRED"],
      default: "CREATED",
      index: true,
    },

    validTill: {
      type: Date,
      required: true,
      index: true,
      default: () =>
        new Date(Date.now() + ONE_HOUR_TEN_MINUTES_MS),
    },

    usedAt: {
      type: Date,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);
const TicketModel: Model<Ticket> =
  models.Ticket ||
  mongoose.model<Ticket>("Ticket", TicketSchema, "tickets");

export default TicketModel;
