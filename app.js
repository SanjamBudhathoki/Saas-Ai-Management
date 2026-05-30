import express from "express";
import cors from "cors";
import userRoute from "./src/models/User/userRouter.js";
import projectRoute from "./src/models/Projects/projectRouter.js";
import taskRoute from "./src/models/Task/taskRouter.js";


const app=express();

app.use(express.json());

//User cors for security and to allow cross-origin requests from frontend applications
app.use(cors());

//Attach Socket.to every request in server.js

//Routes
app.use("/user",userRoute);
app.use("/project",projectRoute);
//TODO! :LEFT?  maintail nested route for task
app.use("/task",taskRoute);

//Error Handeler

export default app;