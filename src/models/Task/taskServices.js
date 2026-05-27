import express from "express";
import { Task } from "./taskModule.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import Joi from "joi";
import { Project } from "../Projects/projectModule.js";

//* Add Task on reference to ProjectId
export const taskAdd=asyncHandler(async (req, res) => {

    const newTask = req.body;
// console.log(newTask)
    const addTaskValidSchema = Joi.object({
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

      assignee: Joi.string().hex().length(24).allow(null, ""),
    });

    try {
      await addTaskValidSchema.validateAsync(newTask);
    } catch (error) {
      return res.status(400).send({ message: error.message });
    }

    const {
      title,
      description,
      priority,
      dueDate,
      tags,
      status,
      assignee,
    } = newTask;

console.log(newTask);
    //const projectId =req.params.projectId || req.params.id || req.body.projectId;
    const project = req.project;

console.log(project._id);
    
    // Validate assignee
    if (assignee) {

      const isMember = project.members.some(
        (m) => m.user.toString() === assignee.toString()
      );

      if (!project.isOwner(assignee) && !isMember) {
        throw new ApiError(
          400,
          "Assignee must be a member of this project"
        );
      }
    }

    // Find order
    const lastTask = await Task.findOne({
      project: project._id,
      status,
    }).sort({ order: -1 });

    const order = lastTask ? lastTask.order + 1 : 0;

    // Create task
    const task = await Task.create({
      title,
      description,
      project: project._id,
      createdBy: req.loggedInUser._id,
      assignee: assignee || null,
      priority,
      dueDate,
      tags,
      status,
      order,
    });

    // Increment task count
    await Project.findByIdAndUpdate(
      project._id,
      { $inc: { taskCount: 1 } }
    );

    // Populate
    const populated = await task.populate([
      {
        path: "createdBy",
        select: "name email avatar",
      },
      {
        path: "assignee",
        select: "name email avatar",
      },
    ]);

    res.status(201).json({
  message: "Task added successfully",
  task: populated
});
  }
)

//* Get Searched task with pageiganation
export const taskGet=asyncHandler(async(req,res)=>{
  // extract pagination details from req.body4
  const input=req.body;

  //make joi schema
const taskGetSchema= Joi.object({
    page: Joi.number().integer().required().min(1),
    limit: Joi.number().integer().required().min(1),
    searchText: Joi.string().trim().allow("")
});
 //validate pagination details
  try {
    await taskGetSchema.validateAsync(input);
  } catch (error) {
    // if not valid, terminate
    return res.status(400).send({ message: error.message });
  }
   // calculate skip
  // skip=(page-1)* limit
  const skip=(input?.page-1)*input?.limit;

  //extract searchText
  let searchTask=input.searchText;
   let match={
    project:req.project?._id
   };
   
   if(searchTask){
    match.title={$regex:searchTask,$options:"i"};
   };

   const tasks=await Task.aggregate([
     {
      $match: match,
    },
    {
      $skip: skip,
    },
    {
      $limit: input.limit,
    },
    {
      $project: {
        title: 1,
        description: 1,
        owncreatedBy: 1,
        assignee: 1,
        status: 1,
        dueDate: 1,
        tags:1,
        priority:1,
      },
    },
]);
  const totalTasks= await Task.find(match);
  const totalPage = Math.ceil(totalTasks.length / input.limit);
  return res.status(200).send({ tasks,totalTasks, totalPage });

})
