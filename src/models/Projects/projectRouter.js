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
projectRoute.post("/:projectId/invite",isUser,checkProjectRole("admin"),checkPlanLimit("member"),  asyncHandler(async (req, res) => {
  const { email, role = "member" } = req.body;

//    const schemaLog =  Joi.object({
//     email: Joi.string().email().required().trim().min(5).max(40).lowercase(),
//   });
// try {
//   await schemaLog.validateAsync()
// } catch (error) {
//   return res.status(400).send({ message: error.message });
// }
  const project = req.project;

  // Find user in database
  const invitee = await User.findOne({ email });

  if (!invitee) {
    return res.status(404).send({message:"User not found"});
  }

  // Check if already member
  const existingMember = project.members.some(
    (m) => m.user.toString() === invitee._id.toString()
  );

  if (existingMember) {
    return res.status(409).send({message:"User is already a project member"});
   
  }

  // Add member
  project.members.push({
    user: invitee._id,
    role,
  });

await project.save();

  return res.status(200).send({
    success: true,
    message: "Member added successfully",
    project,
  });
})
);

//? Change Member Role 
projectRoute.put("/:projectId/members/role",isUser,checkProjectRole("admin"),asyncHandler(async(req,res)=>{
  // req from body : user id and role
  const editMemberRole=req.body; 


const changeMemberRoleSchema = Joi.object({
  userId: Joi.string().hex().length(24).required(),
  role: Joi.string().valid("admin", "member", "viewer").required(),
});

  const { error, value } = changeMemberRoleSchema.validate(req.body);
if (error)  return res.status(400).send({ message: error.message });

  // req from body : user id and role
const {userId,role}=value;
  //req. project 
  const project=req.project;
  //Cant change owner's role
  if(project.owner.equals(userId)){
    return res.status(400).send({message:"No access to change role into Owner"});
  }
  //Cant change your own role
  if(userId===req.loggedInUser._id.toString()){
    return res.status(400).send({message:"You cant change your own role"});
  }
  //check if your memeber and userId matches and is in project
  const updateProjectMemberRole=await Project.findOneAndUpdate({
      _id: project._id,
      "members.user": userId,
    },
    {
      $set: {
        "members.$.role": role,
      },
    },
    {
      new: true,
    });
  if(updateProjectMemberRole){
    return res.status(404).send({message:"Member Not Found"});
  }

  //return response
    return res.status(200).send({message:"Role updated Successfully"});

}));

//? Remove Member 
//! left
// projectRoute.delete(
//   "/:projectId/member/:userId",
//   verifyJWT,
//   checkProjectRole("admin"),

//   asyncHandler(async (req, res) => {

//     const { userId } = req.params;

//     const project = req.project;

//     // Prevent owner removal
//     if (project.owner.equals(userId)) {
//       throw new ApiError(
//         400,
//         "Can't remove the owner"
//       );
//     }

//     const updatedProject =
//       await Project.findOneAndUpdate(
//         {
//           _id: project._id,
//         },
//         {
//           $pull: {
//             members: {
//               user: userId,
//             },
//           },
//         },
//         { new: true }
//       );

//     if (!updatedProject) {
//       throw new ApiError(
//         404,
//         "Project not found or member not in project"
//       );
//     }

//     res.status(200).json(
//       new ApiResponse(
//         200,
//         null,
//         "Member removed successfully"
//       )
//     );
//   })
// );


export default projectRoute;