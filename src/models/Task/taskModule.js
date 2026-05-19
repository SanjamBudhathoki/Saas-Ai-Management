import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
      minlength: [2, "Title must be at least 2 characters"],
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
      default: "",
    },

    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },

    // Set from req.user — never trust client-provided value
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Must be a member of the project
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    status: {
      type: String,
      enum: ["todo", "in-progress", "in-review", "done"],
      default: "todo",
      index: true,
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },

    dueDate: {
      type: Date,
      default: null,
    },

    // Position within the status column (for drag-and-drop)
    order: {
      type: Number,
      default: 0,
    },

    tags: {
      type: [String],
      validate: {
        validator: (arr) => arr.length <= 10,
        message: "Maximum 10 tags allowed",
      },
    },

    // attachments: [attachmentSchema],

    // Cached AI summary — saves re-calling API
    // aiSummary: {
    //   type: String,
    //   default: null,
    // },
    // aiSummaryGeneratedAt: {
    //   type: Date,
    //   default: null,
    // },

    // Soft delete / archive
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
)

export const Task = mongoose.model("Task", taskSchema);