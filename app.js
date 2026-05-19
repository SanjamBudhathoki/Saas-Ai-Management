import express from "express";
import cors from "cors";
import userRoute from "./src/models/User/userRouter.js";
import projectRoute from "./src/models/Projects/projectRouter.js";
import taskRoute from "./src/models/Task/taskRouter.js";


const app=express();

app.use(express.json());

app.use(cors());

app.use("/user",userRoute);
app.use("/project",projectRoute);
app.use("/task",taskRoute);


export default app;