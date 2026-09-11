import { Request, Response } from "express";
import { Currency } from "../../utils/orders-insight/orders-insight.types";
import { OrdersInsightsService } from "../../services/V2/orders_insight_service";

const ordersInsightsService = new OrdersInsightsService();

export const getOrdersInsights = async (req: Request, res: Response) => {
  try {
    const result = await ordersInsightsService.getOrdersInsights({
      from: req.query.from as string | undefined,
      to: req.query.to as string | undefined,
      currency: req.query.currency as Currency,
      includeItems: req.query.includeItems === "true",
      includeCustomer: req.query.includeCustomer === "true",
      includeAttribution: req.query.includeAttribution === "true",
      cursor: req.query.cursor as string | undefined,
      limit: req.query.limit ? Number(req.query.limit) : 100,
      summaryOnly: req.query.summaryOnly === "true",
    });

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch orders insights",
      error: String(error),
    });
  }
};
