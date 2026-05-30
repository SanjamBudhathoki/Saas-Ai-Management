import express from "express";
import app from "./app.js";
import { dbConnect } from "./src/config/dbConnect.js";
import { connectRedis } from "./src/config/redis.js";

// assign a temporart port for development and production
const port=process.env.PORT;
//connect to database and redis before listing to the port
await dbConnect();
//connect redis
connectRedis();

// Attatch Socket.to the server
//make io accessible in controllers via req.io(set in app.js)
//Register All socket ecent handlers


app.listen(port,()=>{
    console.log(`Server listing to port :${port}`);
})
