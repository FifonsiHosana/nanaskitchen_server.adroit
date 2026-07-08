import { NextFunction, Response, Request } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

export interface CustomJwtPayload extends JwtPayload {
  id: string;
}

// const authMiddleware = async (
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ) => {
//   const rawHeader = req.headers["authorization"];
//   const accessToken = rawHeader?.startsWith("Bearer")
//     ? rawHeader.split(" ")[1]
//     : rawHeader;
//   const refreshToken = req.cookies["refreshToken"];

//   if (!accessToken) {
//     return res.status(401).send("Access Denied.No token provided");
//   }
//   try {
//     const decoded = jwt.verify(
//       accessToken,
//       process.env.JWT_SECRET as string,
//     ) as CustomJwtPayload;
//     req.userId = decoded.id;
//     next();
//   } catch (error) {
//     if (!refreshToken) {
//       return res.status(401).send("Access Denied. No refresh token provided.");
//     }
//     try {
//       const decoded = jwt.verify(
//         refreshToken,
//         process.env.JWT_SECRET as string,
//       ) as CustomJwtPayload;
//       const accessToken = jwt.sign(
//         { id: decoded.id },
//         process.env.JWT_SECRET as string,
//         { expiresIn: "3d" },
//       );
//       req.userId = decoded.id;
//       res
//         .cookie("refreshToken", refreshToken, {
//           httpOnly: true,
//           sameSite: "strict",
//         })
//         .header("Authorization", accessToken);
//       next();
//     } catch {
//       return res.status(400).send("Invalid Token.");
//     }
//   }
// };
const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const rawHeader = req.headers["authorization"];
  const accessToken = rawHeader?.startsWith("Bearer")
    ? rawHeader.split(" ")[1]
    : rawHeader;

  if (!accessToken) {
    return res.status(401).send("Access Denied. No token provided");
  }

  try {
    const decoded = jwt.verify(
      accessToken,
      process.env.JWT_SECRET as string,
    ) as CustomJwtPayload;
    req.userId = decoded.id;
    next();
  } catch {
    return res.status(401).send("Invalid or expired access token."); // 401 triggers the axios interceptor
  }
};
export default authMiddleware;
