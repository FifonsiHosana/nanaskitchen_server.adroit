import { and, count, desc, eq, sql } from "drizzle-orm";
import { feedBackAnswers, feedBackQuestions } from "../../db/schema";
import { db } from "../models/db_connection";
import { Request, Response } from "express";

// GET /feedback-questions
export const listQuestions = async (req: Request, res: Response) => {
  try {
    const rows = await db
      .select({
        id: feedBackQuestions.id,
        question: feedBackQuestions.question,
        questionType: feedBackQuestions.questionType,
        isActive: feedBackQuestions.isActive,
        createdAt: feedBackQuestions.createdAt,
        answerCount: sql<number>`COUNT(${feedBackAnswers.id})`,
      })
      .from(feedBackQuestions)
      .leftJoin(feedBackAnswers, eq(feedBackAnswers.questionId, feedBackQuestions.id))
      .groupBy(feedBackQuestions.id)
      .orderBy(desc(feedBackQuestions.createdAt));

    return res.status(200).json({ data: rows });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch questions", error: String(error) });
  }
};

// POST /feedback-questions
export const createQuestion = async (req: Request, res: Response) => {
  try {
    const { question, questionType } = req.body as {
      question: string;
      questionType: "rating" | "comment" | "yes_no";
    };
    if (!question || !questionType) {
      return res.status(400).json({ message: "question and questionType are required" });
    }
    await db.insert(feedBackQuestions).values({ question, questionType, isActive: false });
    const [created] = await db
      .select()
      .from(feedBackQuestions)
      .where(eq(feedBackQuestions.question, question))
      .limit(1);
    return res.status(201).json({ data: created });
  } catch (error: any) {
    if (String(error).includes("Duplicate")) {
      return res.status(409).json({ message: "A question with that text already exists" });
    }
    return res.status(500).json({ message: "Failed to create question", error: String(error) });
  }
};

// PATCH /feedback-questions/:id
export const updateQuestion = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { question, isActive } = req.body as { question?: string; isActive?: boolean };
    const updates: Record<string, unknown> = { updatedAt: sql`now()` };
    if (question !== undefined) updates.question = question;
    if (isActive !== undefined) updates.isActive = isActive;
    await db.update(feedBackQuestions).set(updates).where(eq(feedBackQuestions.id, Number(id)));
    const [updated] = await db
      .select()
      .from(feedBackQuestions)
      .where(eq(feedBackQuestions.id, Number(id)))
      .limit(1);
    return res.status(200).json({ data: updated });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update question", error: String(error) });
  }
};

// DELETE /feedback-questions/:id
export const deleteQuestion = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await db.delete(feedBackQuestions).where(eq(feedBackQuestions.id, Number(id)));
    return res.status(200).json({ message: "Deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete question", error: String(error) });
  }
};

// GET /feedback-questions/analytics
// Aggregates feedBackAnswers by question for the analytics page
export const getFeedbackAnswersAnalytics = async (req: Request, res: Response) => {
  try {
    const rows = await db
      .select({
        questionId: feedBackQuestions.id,
        question: feedBackQuestions.question,
        questionType: feedBackQuestions.questionType,
        answer: feedBackAnswers.answer,
        answerCount: sql<number>`COUNT(*)`,
      })
      .from(feedBackQuestions)
      .innerJoin(feedBackAnswers, eq(feedBackAnswers.questionId, feedBackQuestions.id))
      .where(eq(feedBackQuestions.isActive, true))
      .groupBy(feedBackQuestions.id, feedBackQuestions.question, feedBackQuestions.questionType, feedBackAnswers.answer)
      .orderBy(feedBackQuestions.id, desc(sql`COUNT(*)`));

    // Group into per-question shape
    const map = new Map<
      number,
      {
        questionId: number;
        question: string;
        questionType: "rating" | "comment" | "yes_no";
        totalAnswers: number;
        breakdown: { answer: string; count: number }[];
      }
    >();

    for (const row of rows) {
      if (!map.has(row.questionId)) {
        map.set(row.questionId, {
          questionId: row.questionId,
          question: row.question,
          questionType: row.questionType as "rating" | "comment" | "yes_no",
          totalAnswers: 0,
          breakdown: [],
        });
      }
      const entry = map.get(row.questionId)!;
      const cnt = Number(row.answerCount);
      entry.totalAnswers += cnt;
      entry.breakdown.push({ answer: row.answer, count: cnt });
    }

    return res.status(200).json({ data: Array.from(map.values()) });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch answers analytics", error: String(error) });
  }
};
