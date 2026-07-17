import express from "express";
import Joi from "joi";
import { isAdmin, isMember, isUser } from "../../middleware/auth.js";
import { Project } from "./projectModule.js";
import { User } from "../User/user.module.js";
import mongoose from "mongoose";
import { asyncHandler } from "../../utils/asyncHandler.js";

//* Create / Add project 
export const createProject=asyncHandler(async(req,res)=>{
  //   extract product from req.body
  const neWProject=req.body;
  //   validate product using Joi
  const addProjectSchema=Joi.object({
    name: Joi.string().required().trim().min(2).max(100),
    description: Joi.string().required().trim().max(500).default(" "),
    status: Joi.string().valid("active","archived").trim(),
    ownerPlanAtCreation: Joi.string().valid("free", "pro","team").trim(),

  });
  
    try {
        await addProjectSchema.validateAsync(neWProject);
    } catch (error) {
     //   if validation fail, terminate   
     return res.status(400).send({message:error.message});
    };
  //   add owner id
  const user=req.loggedInUser;
    neWProject.owner=user._id;
    neWProject.members=[{
      user: user._id,
      role: "admin",
    },
    ];

    neWProject.ownerPlanAtCreation = user.plan;
    await Project.create(neWProject);
    await User.findByIdAndUpdate(req.loggedInUser._id, { $inc: { projectsCount: 1 } });

    // send response
  return res.status(201).send({ message: "Project is added successfully." });
})

//*Edit Project
export const editProject =asyncHandler(async (req, res) => {
  const projectId = req.params.id;
  const newValues = req.body;

  // validate id for mongo id validity
  const isValidMongoId = mongoose.Types.ObjectId.isValid(projectId);

  if (!isValidMongoId) {
    return res.status(400).send({ message: "Invalid mongo id." });
  }

  // validate newValues from req.body
const addProjectValidationSchema=Joi.object({
  name: Joi.string().trim().min(2).max(55),
  description: Joi.string().trim().min(200).max(1000),
  status: Joi.string().valid("active","archived").trim(),
  ownerPlanAtCreation: Joi.string().valid("free", "pro","team").trim(),

})
  try {
    await addProjectValidationSchema.validateAsync(newValues);
  } catch (error) {
    return res.status(400).send({ message: error.message });
  }

  // check for product existence using projectId
  const projects = await Project.findOne({ _id: projectId });

  if (!projects) {
    return res.status(404).send({ message: "Projects does not exist." });
  }

  // check if logged in user is owner of projects
  const isOwnerOfProjects = projects.owner.equals(req.loggedInUser._id);

  if (!isOwnerOfProjects) {
    return res
      .status(403)
      .send({ message: "You are not owner of this projects." });
  }

  // update projects
  await Project.updateOne({ _id: projectId }, newValues);

  return res.status(200).send({ message: "Projects updated successfully." });
}
)
//*Delete Project
export const deleteProject=asyncHandler(async (req, res) => {
  // extract id from params
  const projectId = req.params.id;

  // validate id for mongo id validity
  const isValidMongoId = mongoose.Types.ObjectId.isValid(projectId);

  // if not valid mongo id, terminate
  if (!isValidMongoId) {
    return res.status(400).send({ message: "Invalid mongo id." });
  }

  // find project
  const project = await Project.findOne({ _id: projectId });

  // if, not project, terminate

  if (!project) {
    return res.status(404).send({ message: "Project does not exist." });
  }

  // check for project ownership
  // loggedInUser id must match with project's ownerId
  const isOwnerOfProject = project.owner.equals(req.loggedInUser._id);

  // if no match, not allowed to delete
  if (!isOwnerOfProject) {
    return res
      .status(403)
      .send({ message: "You are not owner of this project." });
  }

  // delete project
  await Project.deleteOne({ _id: projectId });
  await User.findByIdAndUpdate(req.loggedInUser._id, { $inc: { projectsCount: 1 } });


  // send response
  return res.status(200).send({ message: "Project deleted successfully." });
})

//* Archive Project 
export const archiveProject=asyncHandler(async (req, res) => {
  const project = await Project.findByIdAndUpdate(
    req.params.id,
    { status: "archived" },
    { new: true }
  );
  res.status(200).send(project, "Project archived");
})
//* Project get all for all user
export const userGetAll=asyncHandler(async(req,res)=>{
  // extract pagination details from req.body
  const input = req.body;
  //make joi schema
  const userViewProjectListValidationSchema= Joi.object({
    page: Joi.number().integer().required().min(1),
    limit: Joi.number().integer().required().min(1),
    searchText: Joi.string().trim().allow("")
});
  //validate pagination details
  try {
    await userViewProjectListValidationSchema.validateAsync(input);
  } catch (error) {
    // if not valid, terminate
    return res.status(400).send({ message: error.message });
  }

  // calculate skip
  // skip=(page-1)* limit
  const skip = (input.page - 1) * input.limit;

  // extract searchText
  let searchText = input?.searchText;
 
  let match = {};

  if (searchText) {
    match.name = { $regex: searchText, $options: "i" };
  }



  const projects = await Project.aggregate([
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
        name: 1,
        description: 1,
        owner: 1,
        members: 1,
        status: 1,
        ownersPlanAtCreation: 1,
      },
    },
  ]);

  // calculate total page
  const totalProjects = await Project.find(match);

const totalPage = Math.ceil(totalProjects.length / input.limit);

  return res.status(200).send({ projects, totalPage });
})

//*Project get loggindUser
 export const getLogUser=asyncHandler(async (req, res) => {
  // extract pagination details
  const paginationDetails = req.body;

  // validation schema
  const paginationDetailValidationSchema = Joi.object({
    page: Joi.number().integer().required().min(1),
    limit: Joi.number().integer().required().min(1),
    searchText: Joi.string().trim().allow(""),
  });

  // validate
  try {
    await paginationDetailValidationSchema.validateAsync(
      paginationDetails
    );
  } catch (error) {
    return res.status(400).send({
      message: error.message,
    });
  }

  // calculate skip
  const skip =
    (paginationDetails.page - 1) *
    paginationDetails.limit;

  const searchText = paginationDetails?.searchText;

  let match = {};

match.owner=req.loggedInUser._id;

  // optional search
  if (searchText) {
    match.name = {
      $regex: searchText,
      $options: "i",
    };
  }

  // aggregate
  const project = await Project.aggregate([
    {
      $match: match,
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $skip: skip,
    },
    {
      $limit: paginationDetails.limit,
    },
    {
      $project: {
        name: 1,
        description: 1,
        owner: 1,
        members: 1,
        status: 1,
        ownersPlanAtCreation: 1,
      },
    },
  ]);
  return res.status(200).send( project, "Projects fetched successfully" );
})

