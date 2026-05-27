import mongoose from "mongoose";
import dns from 'node:dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);

export const dbConnect=async()=>{
    try {
        await mongoose.connect(process.env.MONGO_URL||"");
        console.log("Database connected sucssefully")
    } catch (error) {
                console.log("DB Connection Failed");
                console.log(error.message);
    }
}