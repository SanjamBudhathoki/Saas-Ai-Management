import express, { Router } from "express";
import { User } from "./user.module.js";
import Joi from "joi";
import bcrypt from "bcrypt";
import jwt  from "jsonwebtoken";
import { deleteUser, editUser, loginUser, registerUser } from "./user.Services.js";
import { isUser } from "../../middleware/auth.js";

const userRoute=express.Router();

console.log("Active Server");
//* Register User
userRoute.post("/register",registerUser);

//* LogIn User
userRoute.post("/login",loginUser);

//* Edit User
userRoute.put("/edit",isUser,editUser);

// Delete //!left User
userRoute.delete("/delete",isUser,deleteUser);

//* Forgot Password

//*Reset Password

export default userRoute;