// import jwt from "jsonwebtoken";

// export const verifyJWT = async (req, res, next) => {
//   try {
//     const token = req.headers.authorization?.split(" ")[1];

//     if (!token) {
//       throw new Error("Token missing");
//     }

//     const decoded = JsonWebTokenError.verify(token, process.env.JWT_SECRET);

//     const user = await User.findOne({
//       email: decoded.email,
//     });

//     req.loggedInUser = user;

//     next();

//   } catch (error) {
//     return res.status(401).send({
//       message: "Unauthorized",
//     });
//   }
// };