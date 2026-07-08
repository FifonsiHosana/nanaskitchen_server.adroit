import { eq } from "drizzle-orm";
import { product, review } from "../../db/schema";
import { db } from "../models/db_connection";
import { Request, Response } from "express";

export const getReviews = async (req: Request, res: Response) => {
  const { status } = req.query;
  // const condition = [];
  try {
    // const reviewStatus = ;
    const response = await db
      .select({
        sourceId: review.id,
        productName: product.title,
        productImage: product.image,
        name: review.name,
        comment: review.comment,
        status: review.status,
        rating: review.rating,
        date: review.createdAt,
      })
      .from(review)
      .where(status ? eq(review.status, String(status)) : undefined)
      .innerJoin(product, eq(review.productId, product.id));

    return res.status(200).json(response);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "status 500: Failed to fetch reviews" });
  }
};

export const updateReviewsApprove = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await db
      .update(review)
      .set({ status: "approved" })
      .where(eq(review.id, Number(id)));

    const response = await db
      .select({
        sourceId: review.id,
        productName: product.title,
        productImage: product.image,
        name: review.name,
        comment: review.comment,
        status: review.status,
        rating: review.rating,
        date: review.createdAt,
      })
      .from(review)
      .where(eq(review.id, Number(id)))
      .innerJoin(product, eq(review.productId, product.id));
    return res.status(200).json(response);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "status 500:  Failed to update reviews :approve" });
  }
};

export const updateReviewsReject = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await db
      .update(review)
      .set({ status: "rejected" })
      .where(eq(review.id, Number(id)));

    const response = await db
      .select({
        sourceId: review.id,
        productName: product.title,
        productImage: product.image,
        name: review.name,
        comment: review.comment,
        status: review.status,
        rating: review.rating,
        date: review.createdAt,
      })
      .from(review)
      .where(eq(review.id, Number(id)))
      .innerJoin(product, eq(review.productId, product.id));
    return res.status(200).json(response);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "status 500: Failed to update reviews :reject" });
  }
};