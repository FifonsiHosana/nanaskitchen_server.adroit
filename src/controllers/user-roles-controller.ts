// import { and, eq } from "drizzle-orm";
// import { db } from "../models/db_connection";
// import { Request, Response } from "express";
// import {
//   product,
//   // productUserRolePrices, roles,
//   userRoles,
// } from "../../db";

// export const getUserRoles = async (req: Request, res: Response) => {
//   try {
//     const userRolesData = await db.select().from(roles);

//     return res.status(200).json(userRolesData);
//   } catch (error) {
//     console.error("getUserRoles error:", error);
//     return res
//       .status(500)
//       .json({ message: "status 500: Failed to fetch user roles" });
//   }
// };

// export const addUserRoleProduct = async (req: Request, res: Response) => {
//   try {
//     const {
//       productId,
//       roleId,
//       dollarDiscount,
//       cediDiscount,
//       euroDiscount,
//       minQuantity = 1,
//     } = req.body;

//     // check if row already exists first
//     const existing = await db
//       .select()
//       .from(productUserRolePrices)
//       .where(
//         and(
//           eq(productUserRolePrices.productId, productId),
//           eq(productUserRolePrices.roleId, roleId),
//         ),
//       )
//       .limit(1);

//     if (existing.length) {
//       return res
//         .status(409)
//         .json({ message: "Product already assigned to this role" });
//     }

//     await db.insert(productUserRolePrices).values({
//       productId,
//       roleId,
//       dollarDiscount,
//       cediDiscount,
//       euroDiscount,
//       minQuantity,
//     });
//     return res.status(201).json({
//       message: "User role product added successfully",
//       productId,
//       roleId,
//       dollarDiscount,
//       cediDiscount,
//       euroDiscount,
//       minQuantity,
//     });
//   } catch (error) {
//     console.error("addUserRoleProduct error:", error);
//     return res
//       .status(500)
//       .json({ message: "status 500: Failed to add user role product" });
//   }
// };

// export const getUserRoleProducts = async (req: Request, res: Response) => {
//   try {
//     const { roleId } = req.params;

//     const userRoleProducts = await db
//       .select({
//         id: productUserRolePrices.id,
//         productId: product.id,
//         productName: product.title,
//         productImage: product.image,
//         minQuantity: productUserRolePrices.minQuantity,
//         dollarDiscount: productUserRolePrices.dollarDiscount,
//         cediDiscount: productUserRolePrices.cediDiscount,
//         euroDiscount: productUserRolePrices.euroDiscount,
//       })
//       .from(productUserRolePrices)
//       .where(eq(productUserRolePrices.roleId, Number(roleId)))
//       .innerJoin(product, eq(product.id, productUserRolePrices.productId));

//     return res.status(200).json(userRoleProducts);
//   } catch (error) {
//     console.error("getUserRoleProducts error:", error);
//     return res
//       .status(500)
//       .json({ message: "status 500: Failed to fetch user role products" });
//   }
// };

// export const getProductUserRole = async (req: Request, res: Response) => {
//   try {
//     if (!req.params.id) {
//       return res
//         .status(400)
//         .json({ message: "Product user role id is required" });
//     }
//     if (Number(req.params.id) > 2)
//       return res.status(404).json({ message: "User role not found" }); //This is a temporary check until we have more roles in the database to prevent errors when fetching non-existent roles

//     const productUserRole = await db
//       .select({ role: roles.roleName })
//       .from(roles)
//       .where(eq(roles.id, Number(req.params.id)))
//       .limit(1);
//     return res.status(200).json(productUserRole[0]);
//   } catch (error) {
//     console.error("getProductUserRole error:", error);
//     return res
//       .status(500)
//       .json({ message: "status 500: Failed to fetch product user role" });
//   }
// };

// export const editUserRolesPrices = async (req: Request, res: Response) => {
//   try {
//     const { id } = req.params;

//     if (!id) {
//       return res.status(400).json({ message: "Product id is required" });
//     }

//     const allowedFields = [
//       "minQuantity",
//       "cediDiscount",
//       "dollarDiscount",
//       "euroDiscount",
//     ] as const;

//     const updates = allowedFields.reduce<Record<string, unknown>>(
//       (acc, field) => {
//         if (req.body[field] !== undefined) acc[field] = req.body[field];
//         return acc;
//       },
//       {},
//     );

//     if (Object.keys(updates).length === 0) {
//       return res
//         .status(400)
//         .json({ message: "No valid fields provided to update" });
//     }
//     await db
//       .update(productUserRolePrices)
//       .set(updates)
//       .where(eq(productUserRolePrices.id, Number(id)));

//     // fetch and return the updated product
//     const updated = await db
//       .select()
//       .from(productUserRolePrices)
//       .where(eq(productUserRolePrices.id, Number(id)))
//       .limit(1);

//     if (!updated.length) {
//       return res.status(404).json({ message: "Product not found" });
//     }

//     return res.status(200).json({ product: updated[0] });
//   } catch (error) {
//     console.error("updateProduct error:", error);
//     return res.status(500).json({
//       message: "status 500: Failed to update user role product prices",
//     });
//   }
// };

// export const getUserRolesProductPrices = async (
//   req: Request,
//   res: Response,
// ) => {
//   try {
//     const { roleId, productId } = req.params;

//     const userRoleProducts = await db
//       .select({
//         id: productUserRolePrices.id,
//         productId: product.id,
//         productName: product.title,
//         minQuantity: productUserRolePrices.minQuantity,
//         // cediPrice: product.cediPrice,
//         // dollarPrice: product.dollarPrice,
//         // euroPrice: product.euroPrice,
//         dollarDiscount: productUserRolePrices.dollarDiscount,
//         cediDiscount: productUserRolePrices.cediDiscount,
//         euroDiscount: productUserRolePrices.euroDiscount,
//       })
//       .from(productUserRolePrices)
//       .where(
//         and(
//           eq(productUserRolePrices.roleId, Number(roleId)),
//           eq(productUserRolePrices.productId, Number(productId)),
//         ),
//       )
//       .innerJoin(product, eq(product.id, productUserRolePrices.productId));

//     return res.status(200).json(userRoleProducts);
//   } catch (error) {
//     console.error("getUserRolesProductPrices error:", error);
//     return res.status(500).json({
//       message: "status 500: Failed to fetch user role product prices",
//     });
//   }
// };

// export const deleteUserRole = async (req: Request, res: Response) => {
//   try {
//     const { id } = req.params;

//     if (!id) {
//       return res.status(400).json({ message: "User role id is required" });
//     }

//     // confirm user role exists before deleting
//     const existing = await db
//       .select({ id: roles.id, title: roles.roleName })
//       .from(roles)
//       .where(eq(roles.id, Number(id)))
//       .limit(1);

//     if (!existing.length) {
//       return res.status(404).json({ message: "User role not found" });
//     }

//     await db.delete(roles).where(eq(roles.id, Number(id)));
//     await db
//       .delete(productUserRolePrices)
//       .where(eq(productUserRolePrices.roleId, Number(id)));

//     // clean up UserRoles assignments for this role
//     // await db.delete(userRoles).where(eq(userRoles.roleId, Number(id)));

//     return res.status(200).json({
//       message: `User role "${existing[0]?.title ?? "Unknown"}" deleted successfully`,
//     });
//   } catch (error) {
//     console.error("deleteUserRole error:", error);
//     return res
//       .status(500)
//       .json({ message: "status 500: Failed to delete user role" });
//   }
// };

// export const deleteUserRoleProduct = async (req: Request, res: Response) => {
//   try {
//     const { id } = req.params;

//     if (!id) {
//       return res
//         .status(400)
//         .json({ message: "User role product id is required" });
//     }

//     // confirm user role product exists before deleting
//     const existing = await db
//       .select({ id: productUserRolePrices.id, title: product.title })
//       .from(productUserRolePrices)
//       .innerJoin(product, eq(product.id, productUserRolePrices.productId))
//       .where(eq(productUserRolePrices.id, Number(id)))
//       .limit(1);

//     if (!existing.length) {
//       return res.status(404).json({ message: "User role product not found" });
//     }

//     await db
//       .delete(productUserRolePrices)
//       .where(eq(productUserRolePrices.id, Number(id)));

//     return res.status(200).json({
//       message: `User role product "${existing[0]?.title ?? "Unknown"}" deleted successfully`,
//     });
//   } catch (error) {
//     console.error("deleteUserRoleProduct error:", error);
//     return res
//       .status(500)
//       .json({ message: "status 500: Failed to delete user role product" });
//   }
// };

// export const getUnassignedProducts = async (req: Request, res: Response) => {
//   try {
//     const { roleId } = req.params;

//     // get productIds already assigned to this role
//     const assigned = await db
//       .select({ productId: productUserRolePrices.productId })
//       .from(productUserRolePrices)
//       .where(eq(productUserRolePrices.roleId, Number(roleId)));

//     const assignedIds = assigned
//       .map((r) => r.productId)
//       .filter(Boolean) as number[];

//     // get all products then filter out assigned ones

//     const allProducts = await db
//       .select({
//         id: product.id,
//         title: product.title,
//         image: product.image,
//         // cediPrice: product.cediPrice,
//         // dollarPrice: product.dollarPrice,
//         // euroPrice: product.euroPrice,
//       })
//       .from(product);

//     const unassigned = assignedIds.length
//       ? allProducts.filter((p) => !assignedIds.includes(p.id))
//       : allProducts;

//     return res.status(200).json(unassigned);
//   } catch (error) {
//     console.error("getUnassignedProducts error:", error);
//     return res
//       .status(500)
//       .json({ message: "status 500: Failed to fetch unassigned products" });
//   }
// };

// export const addUnassignedProduct = async (req: Request, res: Response) => {
//   try {
//     const { roleId, productId } = req.params;
//     // const {
//     //   dollarDiscount = "0.00",
//     //   cediDiscount = "0.00",
//     //   euroDiscount = "0.00",
//     //   minQuantity = 1,
//     // } = req.body;

//     // required fields
//     if (!productId || !roleId) {
//       return res
//         .status(400)
//         .json({ message: "productId and roleId are required" });
//     }

//     // Check if product exists
//     const existingProduct = await db
//       .select({ id: product.id })
//       .from(product)
//       .where(eq(product.id, Number(productId)))
//       .limit(1);

//     if (!existingProduct.length) {
//       return res.status(404).json({ message: "Product not found" });
//     }

//     // Check if role exists
//     const existingRole = await db
//       .select({ id: roles.id })
//       .from(roles)
//       .where(eq(roles.id, Number(roleId)))
//       .limit(1);

//     if (!existingRole.length) {
//       return res.status(404).json({ message: "Role not found" });
//     }

//     // Check if product is already assigned to this role
//     const existingAssignment = await db
//       .select()
//       .from(productUserRolePrices)
//       .where(
//         and(
//           eq(productUserRolePrices.productId, Number(productId)),
//           eq(productUserRolePrices.roleId, Number(roleId)),
//         ),
//       )
//       .limit(1);

//     if (existingAssignment.length) {
//       return res
//         .status(409)
//         .json({ message: "Product is already assigned to this role" });
//     }

//     // Insert the new assignment
//     const [insertResult] = await db.insert(productUserRolePrices).values({
//       productId: Number(productId),
//       roleId: Number(roleId),
//       dollarDiscount: "0.00",
//       cediDiscount: "0.00",
//       euroDiscount: "0.00",
//       minQuantity: 1,
//     });

//     // Fetch using the inserted row's id
//     const newAssignment = await db
//       .select({
//         productId: product.id,
//         productName: product.title,
//         productImage: product.image,
//         minQuantity: productUserRolePrices.minQuantity,
//         dollarDiscount: productUserRolePrices.dollarDiscount,
//         cediDiscount: productUserRolePrices.cediDiscount,
//         euroDiscount: productUserRolePrices.euroDiscount,
//       })
//       .from(productUserRolePrices)
//       .where(eq(productUserRolePrices.id, insertResult.insertId))
//       .innerJoin(product, eq(product.id, productUserRolePrices.productId))
//       .limit(1);

//     if (!newAssignment.length) {
//       return res
//         .status(404)
//         .json({ message: "Failed to retrieve new assignment" });
//     }

//     return res.status(201).json({
//       message: "Product successfully assigned to role",
//       assignment: newAssignment[0],
//     });
//   } catch (error) {
//     console.error("addUnassignedProduct error:", error);
//     return res
//       .status(500)
//       .json({ message: "status 500: Failed to assign product to role" });
//   }
// };
