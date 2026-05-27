import express from "express";
import Joi from "joi";
import { isAdmin, isMember, isUser } from "../../middleware/auth.js";
import { Project } from "./projectModule.js";
import { User } from "../User/user.module.js";
import mongoose from "mongoose";
import { archiveProject, createProject, deleteProject, editProject, getLogUser, userGetAll } from "./projectService.js";
import checkPlanLimit from "../../middleware/checkPlanLimit.js";
import { checkProjectRole, verifyJWT } from "../../middleware/checkProjectRole.js";
import ApiError from "../../utils/ApiError.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { changeMemberRole, inviteMember, removeMember } from "./memberService.js";




const projectRoute=express.Router();
console.log("ProjeT Router running");

//* Create / Add project 
projectRoute.post(
  "/add",
  isAdmin,
  checkPlanLimit("projects"),
  createProject
);

//* Get All projects for All User
projectRoute.get("/get",async(req,res)=>{
  try {
  //Fetch all project of loginUser
 const projects=await Project.find({});
return res.status(201).send(projects,"All project fetched");
  } catch (error) {
    return res.status(500).send({message:error.message});
  }
});

//* Get all projects of loginUser
projectRoute.get("/all", isUser,getLogUser); 
//* Get all project for general user
projectRoute.get("/user/all",isUser,userGetAll);

//* Edit Project details
projectRoute.put("/edit/:id",isAdmin, checkPlanLimit("admin"), editProject);

//*Delete Project
projectRoute.delete("/delete/:id",isAdmin,checkPlanLimit("admin"),deleteProject);

//* Archive Projects
projectRoute.patch("/:id/archived",isAdmin,checkPlanLimit("admin"),archiveProject);

//!---------------------------------------------------------------------------------------------------------------------------------------------------------
//?  Invite Member to project
projectRoute.post("/:projectId/invite",isUser,checkProjectRole("admin"),checkPlanLimit("member"),inviteMember);

//? Change Member Role 
projectRoute.put("/:projectId/members/role",isUser,checkProjectRole("admin"),changeMemberRole);

//? Remove Member 
projectRoute.delete(  "/:projectId/member/:userId",isUser,checkProjectRole("admin"),removeMember);


export default projectRoute;