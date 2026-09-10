import { Request, Response } from "express";
import {
  CreateAdmins,
  ListAdmins,
} from "../../services/V2/admin_users_service";

export const getAdmins = async (req: Request, res: Response) => {
  try {
    // const locations = await listDeliveryLocations();
    const admins = await ListAdmins();
    // console.log("Admins fetched from controller:", admins);
    res.status(200).json({ admins });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch Admins" });
  }
};

export const createAdmin = async (req: Request, res: Response) => {
  try {
    // const locations = await listDeliveryLocations();
    const { email, password, name, roleId } = req.body;
    const admin = await CreateAdmins(email, password, name, roleId);
    res.status(200).json({ admin });
  } catch (error) {
    res.status(500).json({ message: "Failed to create Admin" });
  }
};
