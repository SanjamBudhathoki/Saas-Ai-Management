import express, { Router } from "express";
import { User } from "./user.module.js";
import Joi from "joi";
import bcrypt from "bcrypt";
import jwt  from "jsonwebtoken";
import { asyncHandler } from "../../utils/asyncHandler.js";


//* Register Service
export const registerUser=asyncHandler(async (req, res) => {
   // extract req.body
  const newUser = req.body;
   // console.log(newUser);
   // validate userData with joi
  const schema = Joi.object({
    email: Joi.string().email().required().trim().min(5).max(40).lowercase(),
    password: Joi.string().required().trim().min(4).max(20),
    location: Joi.string().required().trim().min(2).max(55),
    gender: Joi.string().required().valid("male", "female", "preferNotToSay"),
    firstName: Joi.string().required().trim().min(3).max(30),
    lastName: Joi.string().required().trim().min(3).max(30),
    role: Joi.string().valid("admin", "member","viewer").trim().required(),
    plan: Joi.string().valid("free", "pro","team").trim().required(),
  });;
  try {
    await schema.validateAsync(newUser);
  } catch (error) {
     // if !valid,terminate
    return res.status(400).send({ message: error.message });
  }
   //check if user email already exists
  const user = await User.findOne({ email: newUser.email });
   //if yes,terminate
  if (user) {
    return res
      .status(401)
      .send({ message: "User with this Email already exists" });
  }
   // hash password using bcrypt.hash()
  const hashedPassword = await bcrypt.hash(newUser.password, 10);
   // replace password with hash
  newUser.password = hashedPassword;
   // create user
  await User.create(newUser);
   // send response
  return res.status(201).send({ message: "User has been added to server" });

})

//* Login Service
export const loginUser=asyncHandler(async (req, res) => {
  //   extract login credentials from req.body
  const loginCredentials = req.body;
  console.log(loginCredentials);
  //   validate login credentials
  const schemaLog =  Joi.object({
    email: Joi.string().email().required().trim().min(5).max(40).lowercase(),
    password: Joi.string().required().trim().min(4).max(20),
  });
  
  try {
    await schemaLog.validateAsync(loginCredentials);
  } catch (error) {
    // if error, throw error
    return res.status(400).send({ message: error.message });
  }
  //   find user by email
  const user = await User.findOne({ email: loginCredentials.email });

  // if not user, throw error
  if (!user) {
    return res.status(400).send({ message: "User Not Found" });
  }
  // password match check
  const passwordMatch = await bcrypt.compare(
    loginCredentials.password, //plain_password
    user.password, //hashed password
  );
  //   if not password match, throw error
  if (!passwordMatch) {
  return res.status(400).send({ message: "Invalid credentials." });
}
  //   generate a token
  const token = jwt.sign(
    { email: user.email },
    process.env.JWT_ACCESS_TOKEN_SECRET_KEY,
  )

  console.log(token);
  //   hide password
  user.password = undefined;
  // send appropriate response
  return res.status(200).send({ user, token });
  
})

//* Update Service
export const editUser=asyncHandler(async (req, res) => {
  // extract new values from req.body
  const updatedValues = req.body;

  const schema = Joi.object({
    gender: Joi.string().valid("male","female","preferNotToSay"),
    firstName: Joi.string().trim().min(3).max(30),
    lastName: Joi.string().trim().min(3).max(30),
    password: Joi.string().trim().min(4).max(20),
    location: Joi.string().trim().min(2).max(55),
    role: Joi.string().valid("member","viewer").trim(),
    plan: Joi.string().valid("free", "pro","team").trim(),
  });
  

  // validate new values
  try {
    await schema.validateAsync(updatedValues);
  } catch (error) {
    // if validation fails, terminate
    return res.status(400).send({ message: error.message });
  }

  // extract logged in user id from req.loggedInUser._id
  const userId = req.loggedInUser._id;

  //   hashPassword
let hashedPassword;
if (updatedValues.password) {
  hashedPassword = await bcrypt.hash(updatedValues.password, 10);
}
  //   update user data
  await User.updateOne(
    { _id: userId },
    {
      $set: {
        password: hashedPassword,
        gender: updatedValues.gender,
        firstName: updatedValues.firstName,
        lastName: updatedValues.lastName,
        location: updatedValues.location,
        role:updatedValues.role,
        plan:updatedValues.plan,
      },
    },
  );

  // return res
  return res.status(200).send({ message: "Profile is updated successfully." });
})

//* Delete services
export const deleteUser= asyncHandler(async (req, res) => {
  try {
    
    if (!req.loggedInUser) {
      return res.status(401).send({ message: "Unauthorized" });
    }

    const user = req.loggedInUser;

    const result = await User.deleteOne({ _id: user._id });

    if (result.deletedCount === 0) {
      return res.status(404).send({ message: "User not found" });
    }

    return res.status(200).send({
      message: "Your account has been permanently deleted.",
    });

  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
}
)

