import express from "express";
import app from "./app.js";
import { dbConnect } from "./src/config/dbConnect.js";

await dbConnect();
const port=process.env.PORT;

app.listen(port,()=>{
    console.log(`Server listing to port :${port}`);
})
