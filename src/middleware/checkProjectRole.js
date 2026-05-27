import ApiError from "../utils/ApiError.js";
import { Project } from "../models/Projects/projectModule.js";


export const checkProjectRole = (...allowedRoles) => {

  return async (req, res, next) => {
//     console.log("AUTH DEBUG:", {
//   loggedInUser: req.loggedInUser,
//   authHeader: req.headers.authorization
// });

    try {
//        console.log("AUTH DEBUG:", {
//   loggedInUser: req.loggedInUser,
//   authHeader: req.headers.authorization
// });
        
      // Auth check
      if (!req.loggedInUser) {
        throw new ApiError(401, "Unauthorized");
      }

      // Get project ID
      const projectId =
        req.params.projectId || req.params.id;

      if (!projectId) {
        throw new ApiError(
          400,
          "Project ID required"
        );
      }

      // Find project
      const project = await Project.findById(projectId);

      if (!project) {
        throw new ApiError(
          404,
          "Project not found"
        );
      }

      // Owner has full access
const userId = req.loggedInUser?.id || req.loggedInUser?._id || req.loggedInUser?.email; 
// console.log("hi",userId)
if (!userId) 
  { throw new ApiError(401, "Unauthorized"); } 

if (!project.owner) { 
  throw new ApiError(500, "Invalid project data");
 }

if (String(project.owner) === String(userId)) {
  req.project = project;
  req.projectRole = "owner";
  return next();
}

      // Find member
      const memberEntry = project.members.find(
        (member) =>
          member.user.toString() ===userId.toString()
      );

      // Not member
      if (!memberEntry) {
        throw new ApiError(
          403,
          "You are not a member of this project"
        );
      }

      // Role validation
      if (
        !allowedRoles.includes(memberEntry.role)
      ) {
        throw new ApiError(
          403,
          `Your role (${memberEntry.role}) does not have permission`
        );
      }

      req.project = project;
      req.projectRole = memberEntry.role;

      next();

    } catch (error) {
      next(error);
    }
  };
};

// Special middleware — owner only (e.g. delete project)

export const ownerOnly = async (req, res, next) => {
  try {

    const projectId =
      req.params.id || req.params.projectId;

    const project = await Project.findById(projectId);

    if (!project) {
      throw new ApiError(404, "Project not found");
    }

    if (
      !project.isOwner(req.loggedInUser._id)
    ) {
      throw new ApiError(
        403,
        "Only the project owner can perform this action"
      );
    }

    req.project = project;

    next();

  } catch (error) {
    next(error);
  }
};

export const verifyJWT = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return next(new ApiError(401, "No token"));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_TOKEN_SECRET_KEY);

    req.loggedInUser = decoded; // now correct shape
    next();
  } catch (err) {
    next(new ApiError(401, "Invalid token"));
  }
};