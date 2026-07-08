import { Request, Response } from "express";
import { db } from "../../models/db_connection";
import { admin } from "../../../db";
import bcrypt from "bcrypt";
export const createAdmin = async (req: Request, res: Response) => {
  try {
    const { email, name, password } = req.body;

    const missingFields = [
      !email && "email",
      !name && "name",
      !password && "password",
    ].filter(Boolean);

    if (missingFields.length) {
      return res.status(400).json({
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }
    const hashedPassword = await bcrypt.hash(password, 11);
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");
    await db.insert(admin).values({
      password: hashedPassword,
      name,
      email,
      createdAt: now,
      updatedAt: now,
    });
    return res.status(201).json({ message: "201 admin created" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "500 internal server error" });
  }
};
