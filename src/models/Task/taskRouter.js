import express from "express";
import { isAdmin, isMember, isUser } from "../../middleware/auth.js";
import { checkProjectRole, verifyJWT } from "../../middleware/checkProjectRole.js";
import { Task } from "./taskModule.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import Joi from "joi";
import { Project } from "../Projects/projectModule.js";
import { taskAdd, taskGet } from "./taskServices.js";
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
// taskRoute.get("/:projectId/:taskId/get",checkProjectRole("admin","member","viewer"),asyncHandler(async(req,res)=>{

//   const task = await Task.findById(req.params.taskId)
//     .populate("assignee", "name email avatar")
//     .populate("createdBy", "name email avatar")

//   if (!task) throw new ApiError(404, "Task not found")



//   res.status(200).json(new ApiResponse(200, { task, comments }, "Task fetched"))
// })
// );

//* Update Task
taskRoute.put("/editTask/:taskId",asyncHandler(async(req,res)=>{
    //extract params and body
    const { taskId } = req.params;
    // console.log(taskId)
    const newValues=req.body;
    //validate mongoId for validity
    const isValidMongoId=mongoose.Types.ObjectId.isValid(taskId);
    if(!isValidMongoId) return res.status(400).send({message:"Invalid MongoId"})
    //validate newValues
 const editTaskValidSchema = Joi.object({
      title: Joi.string().trim().min(2).max(100).required(),
      description: Joi.string().trim().max(1000).allow(""),
      priority: Joi.string()
        .valid("low", "medium", "high")
        .default("medium"),
      dueDate: Joi.date(),
      tags: Joi.array().items(Joi.string().trim()),
      status: Joi.string()
        .valid("todo", "in-progress", "done")
        .default("todo"),
    });
    //validate newValues 
    try {
      await editTaskValidSchema.validateAsync(newValues);
    } catch (error) {
      return res.status(400).send({ message: error.message });
    }
    //check for task existence usind taskId
    const task=await Task.findOne({_id:taskId});
    //if no task throw error
     if (!task) 
    return res.status(404).send({ message: "Task does not exist." });
    
    await Task.updateOne({_id:taskId},newValues);
     

return res.status(200).send({message:"Task Updated Successfully"});
}))

//*Delete Task
taskRoute.delete("/deleteTask/:taskId",isUser,asyncHandler(async(req,res)=>{
    //extract params
    // const taskId=req.params,id alternative
    const { taskId } = req.params;

    //validate mongoId for validity
    const isValidMongoId=mongoose.Types.ObjectId.isValid(taskId);
    if(!isValidMongoId) return res.status(400).send({message:"Invalid MongoId"})
  
    //check for task existence usind taskId
    const task=await Task.findOne({_id:taskId});
    //if no task throw error
     if (!task) 
    return res.status(404).send({ message: "Task does not exist." });
    
       // check for project ownership
  // loggedInUser id must match with project's sellerId
  const isOwnerOftask = task.createdBy.equals(req.loggedInUser._id);
     // if no match, not allowed to delete
  if (!isOwnerOftask) {
    return res
      .status(403)
      .send({ message: "You are not owner of this task module." });
  }
    await Task.deleteOne({_id:taskId});
    await Project.findByIdAndUpdate(task.project||req.loggedInUser, { $inc: { taskCount: -1 } })
  
return res.status(200).send({message:"Task deleted Successfully"});


}))

//* Reorder Task


//* Comments on Task
taskRoute.post("/:projectId/:taskId/comments",isUser,checkProjectRole("admin","member","viewer"),asyncHandler(async(req,res)=>{
    //req.body for comments
    // const commentsValues=req.body;
    const {body,mentions=[]}=req.body;
    //extract taskId from Params 
    const {taskId}=req.params;

     // req.params.projectId = task.project.toString();
    //find task if ! throw error
   const task = await Task.findById(taskId);
//if no task
if (!task) {
   return res.status(404).send({
      message: "Task not found"
   });
}
// create comment
  const comments=await Comment.create({
    body:body,
    task:taskId,
    author:req.loggedInUser._id,
    mentions
  });

  //return appropriate resonse
  return res.status(201).send({message:"Comment added successfully"})

}))
export default taskRoute;