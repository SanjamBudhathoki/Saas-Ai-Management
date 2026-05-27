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

//?  Invite Member to project
export const inviteMember= asyncHandler(async (req, res) => {
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
});

//? Change Member Role 
export const changeMemberRole=asyncHandler(async(req,res)=>{
  // req from body : user id and role
  const editMemberRole=req.body; 


const changeMemberRoleSchema = Joi.object({
  userId: Joi.string().hex().length(24).required(),
  role: Joi.string().valid("member", "viewer").required(),
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
const updateProjectMemberRole = await Project.findOneAndUpdate(
  {
    _id: project._id,
    "members.user": new mongoose.Types.ObjectId(userId),
  },
  {
    $set: {
      "members.$.role": role,
    },
  },
  {
    new: true,
  }
);

if (!updateProjectMemberRole) {
  return res.status(404).send({ message: "Member Not Found" });
}

//send Response
return res.status(200).send({
  message: "Role updated Successfully",
});

});

//? Remove Member from project
export const removeMember=asyncHandler(async (req, res) => {

    const { userId } = req.params;

    const project = req.project;

    // Prevent owner removal
    if (project.owner.equals(userId)) {
      throw new Error(
        400,
        "Can't remove the owner"
      );
    }

    const updatedProject =
      await Project.findOneAndUpdate(
        {
          _id: project._id,
        },
        {
          $pull: {
            members: {
              user: userId,
            },
          },
        },
        { new: true }
      );

    if (!updatedProject) {
      throw new ApiError(
        404,
        "Project not found or member not in project"
      );
    }

    res.status(200).send({message:"Member removed successfully"});

  })