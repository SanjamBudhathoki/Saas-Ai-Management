import mongoose from "mongoose";

// set rule(schema)
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    minlength: 5,
    maxlength: 40,
    unique: true,
    lowercase: true,
  },

  password: {
    type: String,
    required: true,
    trim: true,
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 55,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 55,
  },
  location: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 55,
  },

  gender: {
    type: String,
    required: true,
    enum: ["male", "female", "preferNotToSay"],
  },
  role: {
    type: String,
    required: true,
    trim: true,
    enum: ["admin", "member","viewer"],
  },
  plan: {
    type: String,
    required: true,
    trim: true,
    enum: ["free", "pro","team"],
  },
});

// create table(model)
export const User = mongoose.model("User", userSchema);


