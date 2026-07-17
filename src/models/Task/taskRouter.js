import express from "express";
import { isAdmin, isMember, isUser } from "../../middleware/auth.js";
import { checkProjectRole, verifyJWT } from "../../middleware/checkProjectRole.js";
import { Task } from "./taskModule.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import Joi from "joi";
import { Project } from "../Projects/projectModule.js";
import { commentTask, taskAdd, taskDelete, taskGet, taskUpdate } from "./taskServices.js";
import ApiError from "../../utils/ApiError.js";
import mongoose from "mongoose";
import { Comment } from "./commentModel.js";

const taskRoute=express.Router();
console.log("Task Router Running...");


//* create Task nested under project
taskRoute.post("/:projectId/add",isUser,checkProjectRole("admin", "member"),taskAdd)

//* Gets tasks with filtering +pagination
taskRoute.get("/:projectId/get",isUser,checkProjectRole("admin","member","viewer"),taskGet)

//! Get Single task /:taskId
taskRoute.get(
  "/:projectId/:taskId/get",
  isUser,
  checkProjectRole("admin", "member", "viewer"),
  asyncHandler(async (req, res) => {
    const { taskId } = req.params;

    const task = await Task.findById(taskId)
      .populate("assignee")
      .populate("createdBy");

    if (!task) {
      throw new ApiError(404, "Task not found");
    }

    const comments = await Comment.find({ task: taskId })
  .populate("author")
  .populate("mentions");

    return res.status(200).json({
      success: true,
      message: "Task fetched successfully",
      data: {
        task,
        comments,
      },
    });
  })
);

//* Update Task
taskRoute.put("/editTask/:taskId",taskUpdate)

//*Delete Task
taskRoute.delete("/deleteTask/:taskId",isUser,taskDelete)

//* Reorder Task
//! Left

//* Comments on Task
taskRoute.post("/:projectId/:taskId/comments",isUser,checkProjectRole("admin","member","viewer"),commentTask)



export default taskRoute;