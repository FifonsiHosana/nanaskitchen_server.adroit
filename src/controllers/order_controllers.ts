import {
  desc,
  asc,
  eq,
  and,
  gte,
  lte,
  sql,
  count,
  inArray,
  like,
  or,
} from "drizzle-orm";
import {
  deliveryLocation,
  openCloseOrders,
  order,
  orderCartItem,
  orderUserDetail,
} from "../../db/schema";
import { db } from "../models/db_connection";
import { Request, Response } from "express";
import { buildDateFilter, formatDateReadable } from "../utils/period";
import { concat } from "drizzle-orm/mysql-core/expressions";
import {
  Currency,
  GHANA_RECEIPIENTS,
  INTERNATIONAL_RECEIPIENTS,
  sendMail,
} from "../utils/email-service";
import {
  htmlBuyerGhana,
  htmlBuyerInternational,
  htmlVendorGhana,
  htmlVendorInternational,
  text,
} from "../utils/html-template";
import { europeanCountries } from "../utils/country-currency";

export const getAllOrders = async (req: Request, res: Response) => {
  const { status } = req.params;
  try {
    const {
      country = "all",
      sort = "date",
      page = "1",
      pageSize = "20",
      minPrice,
      maxPrice,
      search,
      period = "this_month",
      from,
      to,
      pricingGroup,
    } = req.query as Record<string, string>;

    const PRICE_GROUP_IDS: Record<string, number> = {
      retailer: 1,
      wholesaler: 2,
      distributor: 3,
    };

    const dateCondition = buildDateFilter(
      {
        period,
        ...(from && { from }),
        ...(to && { to }),
      },
      order.createdAt,
    );

    const offset = (Number(page) - 1) * Number(pageSize);

    const conditions = [];
    if (dateCondition) conditions.push(dateCondition);

    if (search) {
      conditions.push(
        or(
          like(orderUserDetail.firstName, `%${search}%`),
          like(orderUserDetail.lastName, `%${search}%`),
          like(orderUserDetail.email, `%${search}%`),
          like(order.id, `%${search}%`),
          like(
            sql`CONCAT(${orderUserDetail.firstName}, ' ', ${orderUserDetail.lastName})`,
            `%${search}%`,
          ),
          like(
            sql`CONCAT(${orderUserDetail.lastName}, ' ', ${orderUserDetail.firstName})`,
            `%${search}%`,
          ),
        ),
      );
    }

    if (status === "trash") {
      conditions.push(eq(order.deletedMode, true));
    } else {
      conditions.push(eq(order.deletedMode, false));
      if (status && status !== "all") {
        conditions.push(eq(order.status, status as typeof order.status._.data));
      }
    }

    const pgId = pricingGroup ? PRICE_GROUP_IDS[pricingGroup] : undefined;
    if (pgId) conditions.push(eq(order.pricingGroupId, pgId));
    //for the filter if any odd country -incoming
    const countryToDb: Record<string, string[]> = {
      GH: ["GH", "ghana", "Ghana"],
      US: ["US", "UNITED STATES", "United States of America (the)"],
      EU: europeanCountries,
    };
    //any country with weird (unwanted) denoms will be transformed here --born anew -outgoing
    const normalizedCountry = sql<string>`
  CASE
    WHEN LOWER(${orderUserDetail.country}) IN ('us','usa','united states','united states of america','united states of america (the)')
      THEN 'United States'
    WHEN LOWER(${orderUserDetail.country}) IN ('gh','ghana')
      THEN 'Ghana'
          WHEN LOWER(${orderUserDetail.country}) IN ('no')
      THEN 'Norway'
          WHEN LOWER(${orderUserDetail.country}) IN ('de','ger')
      THEN 'Germany'
    ELSE ${orderUserDetail.country}
  END
`;
    if (country && country !== "all") {
      const dbValues = countryToDb[country] ?? [country];
      conditions.push(
        dbValues.length > 1
          ? inArray(orderUserDetail.country, dbValues)
          : eq(
              orderUserDetail.country,
              dbValues[0] as typeof orderUserDetail.country._.data,
            ),
      );
    }

    if (minPrice) {
      conditions.push(
        gte(
          sql<number>`CAST(${order.totalAmount} AS DECIMAL)`,
          Number(minPrice),
        ),
      );
    }
    if (maxPrice) {
      conditions.push(
        lte(
          sql<number>`CAST(${order.totalAmount} AS DECIMAL)`,
          Number(maxPrice),
        ),
      );
    }

    const orderBy =
      sort === "country"
        ? [asc(orderUserDetail.country), desc(order.createdAt)]
        : [desc(order.createdAt)];

    const [rows, countResult] = await Promise.all([
      db
        .select({
          id: order.id,
          orderId: order.sourceId,
          firstName: orderUserDetail.firstName,
          lastName: orderUserDetail.lastName,
          total: order.totalAmount,
          location: orderUserDetail.location,
          date: order.createdAt,
          country_code: normalizedCountry,
          currency: order.currency,
          status: order.status,
          email: orderUserDetail.email,
          phone: orderUserDetail.phone,
          zip_code: orderUserDetail.zip,
          subtotal: order.subtotal,
          shipping: order.shippingCost,
          delivery: order.deliveryFee,
          trackingNumber: order.trackingNumber,
          label: order.labelUrl,
          packagingFee: order.packagingFee,
          paymentMethod: order.paymentMethod,
          deliveryLocation: deliveryLocation.location,
          orderItems: sql<string>`JSON_ARRAYAGG(
            JSON_OBJECT(
              'itemPrice', ${orderCartItem.price},
              'itemQuantity', ${orderCartItem.quantity},
              'itemName', ${orderCartItem.title}
            )
          )`,
        })
        .from(order)
        .innerJoin(orderUserDetail, eq(order.id, orderUserDetail.orderId))
        .innerJoin(orderCartItem, eq(order.id, orderCartItem.orderId))
        .leftJoin(
          deliveryLocation,
          eq(orderUserDetail.deliveryLocationId, deliveryLocation.id),
        )
        .where(conditions.length ? and(...conditions) : undefined)
        .groupBy(
          order.id,
          order.sourceId,
          orderUserDetail.firstName,
          orderUserDetail.lastName,
          order.totalAmount,
          orderUserDetail.location,
          order.createdAt,
          normalizedCountry,
          order.status,
          order.currency,
          orderUserDetail.email,
          orderUserDetail.phone,
          orderUserDetail.zip,
          deliveryLocation.location,
          order.subtotal,
          order.shippingCost,
          order.deliveryFee,
          order.trackingNumber,
          order.labelUrl,
          order.packagingFee,
          order.paymentMethod,
        )
        .orderBy(...orderBy)
        .limit(Number(pageSize))
        .offset(offset),

      db
        .select({ count: sql<number>`count(*)` })
        .from(order)
        .innerJoin(orderUserDetail, eq(order.id, orderUserDetail.orderId))
        .where(conditions.length ? and(...conditions) : undefined),
    ]);

    const total = Number(countResult[0]?.count ?? 0);

    const shaped = rows.map((row) => ({
      ...row,
      orderItems:
        typeof row.orderItems === "string"
          ? JSON.parse(row.orderItems)
          : row.orderItems,
    }));

    return res.status(200).json({ orders: shaped, total });
  } catch (error) {
    console.error("getAllOrders error:", error);
    return res
      .status(500)
      .json({ message: "status:500 Failed to fetch orders" });
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { newStatus } = req.body;
    if (!id || !newStatus) {
      return res.status(400).json({ message: "id and newStatus are required" });
    }
    // if (newStatus === "recover") {
    //   await db
    //     .update(order)
    //     .set({ deletedMode: false })
    //     .where(eq(order.id, Number(id)));
    //   const updated = await db
    //     .select()
    //     .from(order)
    //     .where(eq(order.id, Number(id)))
    //     .limit(1);
    //   if (!updated.length)
    //     return res.status(404).json({ message: "Order not found" });
    //   return res.status(200).json({ updatedOrderStatus: updated[0] });
    // }
    const existing = await db
      .select()
      .from(order)
      .where(eq(order.sourceId, id as string))
      .limit(1);

    const currentOrder = existing[0];

    // if (currentOrder?.status === "completed") return;

    const result = await db
      .update(order)
      .set({ status: newStatus, updatedAt: sql`now()` })
      .where(eq(order.id, currentOrder?.id as number));

    const updated = await db
      .select()
      .from(order)
      .where(eq(order.sourceId, id as string))
      .limit(1);

    if (!updated.length) {
      return res.status(404).json({ message: "Order not found" });
    }

    // if (newStatus === "completed") {
    //   sendMail(updated[0]);
    // }
    // console.log("updated orders",updated[0]);
    const cartItems = await db
      .select()
      .from(orderCartItem)
      .where(eq(orderCartItem.sourceId, currentOrder?.sourceId as string));

    const [userDetails] = await db
      .select()
      .from(orderUserDetail)
      .where(eq(orderUserDetail.orderId, currentOrder!.id))
      .limit(1);

    const [deliveryLoc] = await db
      .select()
      .from(deliveryLocation)
      .where(eq(deliveryLocation.id, userDetails!.deliveryLocationId as number))
      .limit(1);

    const totalPrice = Number(currentOrder!.totalAmount);
    if (newStatus === "completed") {
      if (result) {
        if (currentOrder?.currency === "GHS") {
          // user mail
          await sendMail(
            userDetails?.email as string,
            "Order Confirmation",
            text(
              cartItems,
              totalPrice,
              currentOrder.sourceId,
              currentOrder?.ref as string,
              currentOrder?.currency as Currency,
            ),
            htmlBuyerGhana(
              cartItems,
              totalPrice,
              currentOrder.sourceId,
              currentOrder?.ref as string,
              currentOrder?.currency as Currency,
              currentOrder?.deliveryFee as string,
              currentOrder?.packagingFee as string,
              userDetails?.firstName + " " + userDetails?.lastName,
              userDetails?.phone as string,
              userDetails?.email as string,
              deliveryLoc?.location as string,
              userDetails?.location as string,
              formatDateReadable(currentOrder.createdAt),
            ),
            `Nanashito`,
          );

          // vendor mail
          await sendMail(
            GHANA_RECEIPIENTS.to,
            "New Order",
            text(
              cartItems,
              totalPrice,
              currentOrder.sourceId,
              currentOrder?.ref as string,
              currentOrder?.currency as Currency,
            ),
            htmlVendorGhana(
              cartItems,
              totalPrice,
              currentOrder.sourceId,
              currentOrder?.ref as string,
              currentOrder?.currency as Currency,
              currentOrder?.deliveryFee as string,
              currentOrder?.packagingFee as string,
              userDetails?.firstName + " " + userDetails?.lastName,
              userDetails?.phone as string,
              userDetails?.email as string,
              deliveryLoc?.location as string,
              userDetails?.location as string,
              formatDateReadable(currentOrder.createdAt),
            ),
            "Nanashito",
            GHANA_RECEIPIENTS.cc,
          );
        } else {
          await sendMail(
            userDetails?.email as string,
            "Order Confirmation",
            text(
              cartItems,
              totalPrice,
              currentOrder!.sourceId,
              currentOrder?.ref as string,
              currentOrder?.currency as Currency,
            ),
            htmlBuyerInternational(
              cartItems,
              totalPrice,
              currentOrder!.sourceId,
              currentOrder?.ref as string,
              currentOrder?.currency as Currency,
              currentOrder?.shippingCost as string,
              userDetails?.firstName + " " + userDetails?.lastName,
              userDetails?.phone as string,
              userDetails?.email as string,
              "N/A",
              "N/A",
              deliveryLoc?.location ?? "N/A",
              userDetails?.zip ?? "N/A",
              formatDateReadable(currentOrder!.createdAt),
            ),
            "Nanashito",
          );

          // vendor mail
          await sendMail(
            INTERNATIONAL_RECEIPIENTS.to,
            "New Order",
            text(
              cartItems,
              totalPrice,
              currentOrder!.sourceId,
              currentOrder?.ref as string,
              currentOrder?.currency as Currency,
            ),
            htmlVendorInternational(
              cartItems,
              totalPrice,
              currentOrder!.sourceId,
              currentOrder?.ref as string,
              currentOrder?.currency as Currency,
              currentOrder?.shippingCost as string,
              userDetails?.firstName + " " + userDetails?.lastName,
              userDetails?.phone as string,
              userDetails?.email as string,
              // shippingAddress?.address ?? "N/A",
              // shippingAddress?.state ?? "N/A",
              "N/A",
              "N/A",
              deliveryLoc?.location ?? "N/A",
              userDetails?.zip ?? "N/A",
              formatDateReadable(currentOrder!.createdAt),
            ),
            "Nanashito",
            INTERNATIONAL_RECEIPIENTS.cc,
          );
        }
      }
    }

    return res.status(200).json({ updatedOrderStatus: updated[0] });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "status:500 Failed to update status" });
  }
};

export const deleteOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "id is required" });
    }

    const response = await db
      .update(order)
      .set({ deletedMode: true })
      .where(eq(order.id, Number(id)));

    return res.status(200).json({ deletedOrder: response });
  } catch (error) {
    // console.log(eror);
    return res
      .status(500)
      .json({ message: "status:500 Failed to delete order" });
  }
};

export const toggleOrderslock = async (req: Request, res: Response) => {
  try {
    const [lockNow] = await db
      .select({ active: openCloseOrders.active })
      .from(openCloseOrders)
      .where(eq(openCloseOrders.event, "lock now"))
      .limit(1);

    const isLocked = lockNow?.active === true;

    await db
      .update(openCloseOrders)
      .set({ active: isLocked ? false : true })
      .where(eq(openCloseOrders.event, "lock now"));

    await db
      .update(openCloseOrders)
      .set({ active: isLocked ? true : false })
      .where(eq(openCloseOrders.event, "default"));

    return res.status(200).json({ locked: !isLocked });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "status:500 Failed to toggle order lock!" });
  }
};

export const OrdersLockCheck = async (req: Request, res: Response) => {
  try {
    const [lockNow] = await db
      .select({ active: openCloseOrders.active })
      .from(openCloseOrders)
      .where(eq(openCloseOrders.event, "lock now"))
      .limit(1);
    return res.status(200).json({ locked: lockNow?.active === true });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "status:500 Failed to check order lock!" });
  }
};
