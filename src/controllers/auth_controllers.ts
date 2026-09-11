import { NextFunction, Request, Response } from "express";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import jwt, { JwtPayload } from "jsonwebtoken";
import { db } from "../models/db_connection";
import { admin } from "../../db/schema";

export interface CustomJwtPayload extends JwtPayload {
  id: string;
  roleId: number;
}

export const adminLogin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { email, password } = req.body;

  try {
    const existingUser = await db
      .select()
      .from(admin)
      .where(eq(admin.email, email))
      .limit(1);

    if (existingUser.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    const user = existingUser[0];

    if (!user) {
      return res.status(401).json({ message: "nonexisting user!" });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid password!" });
    }
    //create token
    const accessToken = jwt.sign(
      { id: user.id, roleId: user.roleId },
      process.env.JWT_SECRET as string,
      { expiresIn: "3d" }, // short-lived
    );

    const refreshToken = jwt.sign(
      { id: user.id, roleId: user.roleId },
      process.env.JWT_REFRESH_SECRET as string,
      { expiresIn: "14d" }, // long-lived
    );

    return (
      res
        .cookie("refreshToken", refreshToken, {
          httpOnly: true,
          sameSite: "strict",
        })
        // .header("Authorization", accessToken)
        .status(200)
        .json({
          user: { name: user.name, email: user.email, roleId: user.roleId },
          accessToken,
        })
    );
  } catch (error) {
    next(error);
    return res.status(500).json({
      error: String(error),
      message: (error as Error).message,
    });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  const token = req.cookies["refreshToken"];
  if (!token) return res.status(401).send("No refresh token.");

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_REFRESH_SECRET as string,
    ) as CustomJwtPayload;

    const accessToken = jwt.sign(
      { id: decoded.id, roleId: decoded.roleId },
      process.env.JWT_SECRET as string,
      { expiresIn: "3d" },
    );

    res.json({ accessToken });
  } catch {
    res.clearCookie("refreshToken");
    return res.status(401).send("Invalid or expired refresh token.");
  }
};
