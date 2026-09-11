import { Request, Response } from "express";
import {
  CreateAdmins,
  DeleteAdmins,
  ListAdmins,
  UpdateAdmins,
} from "../../services/V2/admin_users_service";
import { ValidationError } from "../../services/V2/flavor_service";

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
    if (error instanceof ValidationError) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Failed to create Admin" });
  }
};

export const updateAdmin = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { name, password } = req.body;
    const admin = await UpdateAdmins(id, { name, password });
    res.status(200).json({ admin });
  } catch (error) {
    if (error instanceof ValidationError) {
      const status = error.message === "Admin not found" ? 404 : 400;
      return res.status(status).json({ message: error.message });
    }
    res.status(500).json({ message: "Failed to update Admin" });
  }
};

export const deleteAdmin = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    // auth_middleware attaches the JWT payload as req.userId / req.roleId.
    const currentAdminId = (req as any).userId ?? undefined;
    const admin = await DeleteAdmins(id, currentAdminId);
    res.status(200).json({ admin });
  } catch (error) {
    if (error instanceof ValidationError) {
      const status = error.message === "Admin not found" ? 404 : 400;
      return res.status(status).json({ message: error.message });
    }
    res.status(500).json({ message: "Failed to delete Admin" });
  }
};
