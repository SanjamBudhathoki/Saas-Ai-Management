import express from "express";
import ApiError from "../utils/ApiError.js";
import { Project } from "../models/Projects/projectModule.js";
import { User } from "../models/User/user.module.js";

//* Set Restrictions on Plan
const PLAN_LIMITS=User.PLAN_LIMITS || {
    free:  { projects: 3,         members: 2,         ai: false, uploads: false },
    pro:   { projects: Infinity,  members: 10,        ai: true,  uploads: true  },
    team:  { projects: Infinity,  members: Infinity,  ai: true,  uploads: true  },
};

const checkPlanLimit=(feature)=>{
  return async(req,res,next)=>{
    try{
    const plan = req.loggedInUser.getActivePlan
  ? req.loggedInUser.getActivePlan()
  : req.loggedInUser.plan;
    const limits=PLAN_LIMITS[plan];
    switch(feature){
            case "projects": {
          if (req.loggedInUser.projectsCount >= limits.projects) {
            throw new ApiError(
              403,
              `Project limit reached (${limits.projects}). Upgrade your plan to create more projects.`
            )
          }
          break
        }

        case "members": {
          const projectId = req.params.id || req.params.projectId
          const project = await Project.findById(projectId)
          if (!project) throw new ApiError(404, "Project not found")

          if (project.members.length >= limits.members) {
            throw new ApiError(
              403,
              `Member limit reached (${limits.members}). Upgrade your plan to add more members.`
            )
          }
          break
        }

        case "ai": {
          if (!limits.ai) {
            throw new ApiError(
              403,
              "AI features are available on Pro and Team plans. Please upgrade."
            )
          }
          break
        }

        case "uploads": {
          if (!limits.uploads) {
            throw new ApiError(
              403,
              "File uploads are available on Pro and Team plans. Please upgrade."
            )
          }
          break
        }

        default:
          break
      }

      next()
    } catch (error) {
      next(error)
    }
  }
}

export default checkPlanLimit;