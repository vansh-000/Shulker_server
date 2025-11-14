import mongoose, { Schema } from "mongoose";

const memberSubSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    leftAt: {
      type: Date,
    },
  },
  { _id: false }
);

const meetingSchema = new Schema(
  {
    meetingId: {
      type: String,
      required: true,
      unique: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [memberSubSchema],
    invitedParticipants: [
      {
        type: String,
      },
    ],
    scheduledTime: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["scheduled", "ongoing", "ended","personal"],
      default: "scheduled",
    },
    endedAt: {
      type: Date,
    },
    endedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    recordingUrl:[
      {
        type: String,
      }
    ]
  },
  { timestamps: true }
);

export const Meeting = mongoose.model("Meeting", meetingSchema);
