import mongoose from "mongoose";

const memberSchema= new mongoose.Schema(
      {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Per-project role (separate from (UserModule)system-level role on User model)
    role: {
      type: String,
      enum: ["admin", "member", "viewer"],
      default: "member",
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Project name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
      default: "",
    },
 
    // The creator — has full ownership rights, cannot be removed
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
 
    // All project members including the owner
    members: [memberSchema],
 
    status: {
      type: String,
      enum: ["active", "archived"],
      default: "active",
    },
 
    // Cached task count
    taskCount: {
      type: Number,
      default: 0,
    },

    // Owner's plan at creation — used for enforcing member limits
    ownerPlanAtCreation: {
      type: String,
      enum: ["free", "pro", "team"],
      default: "free",
    },
  },
  { timestamps: true }
)

export const MemberS = mongoose.model("Member", memberSchema);
export const Project = mongoose.model("Project", projectSchema);
