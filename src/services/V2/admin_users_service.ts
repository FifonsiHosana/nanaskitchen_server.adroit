import {
  findAdminById,
  insertAdmin,
  selectAllAdmins,
} from "../../db/queries/admin_users_queries";
import { ValidationError } from "./flavor_service";

export const ListAdmins = async () => {
  const admins = selectAllAdmins();
  
  return admins;
};

export const CreateAdmins = async (
  email: string,
  password: string,
  name: string,
  roleId: number,
) => {
  if (!email) {
    throw new ValidationError("Email is required");
  }
  if (!password) {
    throw new ValidationError("Password is required");
  }

  const existing = await findAdminById(email);
  if (existing) {
    throw new ValidationError("An admin with this email already exists");
  }

  return insertAdmin(name, email, password, roleId);
};

export const GetAllAdmins = async () => {
  const admins = await selectAllAdmins();
  return admins;
};
