//!  L
//!  E
//!  F
//!  T



// //ref -https://redis.io/docs/latest/develop/clients/nodejs/
// import Redis from "Redis";

// //starts a new redis client instance
// const redis = new Redis();

// // Using async/await
// //redis.set = store and retrive simple key value pair
// await redis.set('mykey', 'value');
// // Retrieve the value
// const value = await redis.get('mykey');
// console.log(value); // 'value'

// // Disconnect when done
// redis.disconnect();   


// //redis is not a typical data base its a cashData basae 
// // dosent store data in table or json it uses "key" "value" pair
// // it works in ram - very volitile / temporary
// // speeds up the data fetch time
// // speed computition and reduce time complexity by  many times


import Redis from "redis";

let redisClient=null;

export const connectRedis=()=>{
    console.log("redis connection is successful");
}