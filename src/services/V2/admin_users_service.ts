import {
  deleteAdmin,
  findAdminById,
  findAdminByNumericId,
  insertAdmin,
  selectAllAdmins,
  updateAdmin,
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

export const UpdateAdmins = async (
  id: number,
  input: { name?: string; password?: string },
) => {
  if (!Number.isFinite(id)) {
    throw new ValidationError("Valid admin id is required");
  }

  const name = input.name?.trim();
  const password = input.password?.trim();

  if (name !== undefined && name.length < 2) {
    throw new ValidationError("Name must be at least 2 characters");
  }
  if (password !== undefined && password.length > 0 && password.length < 6) {
    throw new ValidationError("Password must be at least 6 characters");
  }

  const updates: { name?: string; password?: string } = {};
  if (name) updates.name = name;
  // Empty password means "don't change it"
  if (password) updates.password = password;

  if (Object.keys(updates).length === 0) {
    throw new ValidationError("Nothing to update");
  }

  const existing = await findAdminByNumericId(id);
  if (!existing) {
    throw new ValidationError("Admin not found");
  }

  return updateAdmin(id, updates);
};

export const DeleteAdmins = async (id: number, currentAdminId?: number) => {
  if (!Number.isFinite(id)) {
    throw new ValidationError("Valid admin id is required");
  }
  if (currentAdminId != null && Number(currentAdminId) === Number(id)) {
    throw new ValidationError("You cannot delete your own account");
  }

  const existing = await findAdminByNumericId(id);
  if (!existing) {
    throw new ValidationError("Admin not found");
  }

  return deleteAdmin(id);
};
