import { Currency } from "./email-service";



export const formatPrice = (price: number | string, currency: Currency) => {
  switch (currency) {
    case "USD":
      return `$${price}`;
    case "GHS":
      return `₵${price}`;
    default:
      return `€${price}`;
  }
};

type cartItem = {
  id: number;
  sourceId: string | null;
  orderId: number;
  title: string;
  quantity: number;
  price: string;
  totalPrice: string | null;
  weight: string | null;
  length: string | null;
  height: string | null;
  width: string | null;
  hasPackaging: boolean;
};

export const htmlBuyerGhana = (
  cartItems: cartItem[],
  totalPrice: number,
  sourceId: string,
  paymentRef: string,
  currency: Currency,
  deliveryFee: string,
  packagingFee: string,
  customerName: string,
  customerPhone: string,
  customerEmail: string,
  customerLocation: string,
  googleMapLink: string,
  orderDate: string,
): string => {
  const hasPackagingFee = Number(packagingFee) > 0;

  const itemRows = cartItems
    .map(
      (item) => `
        <tr>
          <td style="padding: 12px 16px; border: 1px solid #444; color: #ffffff; font-size: 15px;">
            ${item.title}
            ${item.hasPackaging ? `<br/><span style="color: #4ade80; font-size: 12px; font-weight: 600;">✓ NEEDS PACKAGING</span>` : ""}
          </td>
          <td style="padding: 12px 16px; border: 1px solid #444; color: #ffffff; font-size: 15px; text-align: center;">
            ${item.quantity}
          </td>
          <td style="padding: 12px 16px; border: 1px solid #444; color: #ffffff; font-size: 15px; text-align: right;">
            ${formatPrice((item.quantity * parseFloat(item.price)).toFixed(2), currency)}
          </td>
        </tr>
      `,
    )
    .join("");

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.quantity * parseFloat(item.price),
    0,
  );

  return `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Ghana-New Order:#${sourceId}</title>
      </head>
      <body style="margin: 0; padding: 24px; background-color: #1a1a1a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center">
              <table width="660" cellpadding="0" cellspacing="0" style="background-color: #2d2d2d; border-radius: 12px; overflow: hidden;">

                <!-- Red Header -->
                <tr>
                  <td style="background-color: #c0392b; padding: 20px 32px; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #2d2d2d;">Ghana-New Order:#${sourceId}</h1>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding: 32px;">

                    <p style="margin: 0 0 24px 0; font-size: 18px; font-weight: 700; color: #c0392b;">
                      [Order #${sourceId}] (${orderDate})
                    </p>

                    <!-- Items Table -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; border: 1px solid #444;">
                      <thead>
                        <tr style="background-color: #3a3a3a;">
                          <th style="padding: 12px 16px; border: 1px solid #444; font-size: 15px; font-weight: 700; color: #ffffff; text-align: left;">Product</th>
                          <th style="padding: 12px 16px; border: 1px solid #444; font-size: 15px; font-weight: 700; color: #ffffff; text-align: center;">Quantity</th>
                          <th style="padding: 12px 16px; border: 1px solid #444; font-size: 15px; font-weight: 700; color: #ffffff; text-align: right;">Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${itemRows}
                        <!-- Subtotal -->
                        <tr>
                          <td colspan="2" style="padding: 12px 16px; border: 1px solid #444; text-align: right; color: #cccccc; font-size: 15px;">Subtotal:</td>
                          <td style="padding: 12px 16px; border: 1px solid #444; text-align: right; color: #ffffff; font-size: 15px;">
                            ${formatPrice(subtotal.toFixed(2), currency)}
                          </td>
                        </tr>
                        <!-- Packaging Fee -->
                        ${
                          hasPackagingFee
                            ? `<tr style="background-color: #2d5a3d;">
                                <td colspan="2" style="padding: 12px 16px; border: 1px solid #444; text-align: right; font-size: 15px; font-weight: 700; color: #ffffff;">
                                  Packaging Fee: <span style="color: #4ade80; font-weight: 400; font-size: 13px;">(${cartItems.filter((item) => item.hasPackaging === true).length} item(s) need packaging)</span>
                                </td>
                                <td style="padding: 12px 16px; border: 1px solid #444; text-align: right; font-size: 15px; font-weight: 700; color: #ffffff;">
                                  ${formatPrice(Number(packagingFee).toFixed(2), currency)}
                                </td>
                              </tr>`
                            : ""
                        }
                        <!-- Delivery Fee -->
                        <tr>
                          <td colspan="2" style="padding: 12px 16px; border: 1px solid #444; text-align: right; color: #cccccc; font-size: 15px;">Delivery Fee:</td>
                          <td style="padding: 12px 16px; border: 1px solid #444; text-align: right; color: #ffffff; font-size: 15px;">
                            ${formatPrice(Number(deliveryFee).toFixed(2), currency)}
                          </td>
                        </tr>
                        <!-- Total -->
                        <tr>
                          <td colspan="2" style="padding: 12px 16px; border: 1px solid #444; text-align: right; font-size: 15px; font-weight: 700; color: #ffffff;">Total:</td>
                          <td style="padding: 12px 16px; border: 1px solid #444; text-align: right; font-size: 15px; font-weight: 700; color: #ffffff;">
                            ${formatPrice(totalPrice.toFixed(2), currency)}
                          </td>
                        </tr>
                        <!-- Payment Method -->
                        <tr>
                          <td colspan="2" style="padding: 12px 16px; border: 1px solid #444; text-align: right; color: #cccccc; font-size: 15px;">Payment method:</td>
                          <td style="padding: 12px 16px; border: 1px solid #444; text-align: right; color: #ffffff; font-size: 15px;">Paystack</td>
                        </tr>
                        <!-- Payment Ref -->
                        <tr>
                          <td colspan="2" style="padding: 12px 16px; border: 1px solid #444; text-align: right; color: #cccccc; font-size: 15px;">Payment Reference:</td>
                          <td style="padding: 12px 16px; border: 1px solid #444; text-align: right; color: #ffffff; font-size: 15px;">${paymentRef}</td>
                        </tr>
                      </tbody>
                    </table>

                    <!-- Delivery Details -->
                    <div style="margin-top: 32px;">
                      <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 700; color: #ffffff;">Delivery Details</h3>
                      <p style="margin: 0 0 8px 0; font-size: 14px; color: #cccccc;"><strong style="color: #ffffff;">Name:</strong> ${customerName}</p>
                      <p style="margin: 0 0 8px 0; font-size: 14px; color: #cccccc;"><strong style="color: #ffffff;">Phone:</strong> (${customerPhone} / )</p>
                      <p style="margin: 0 0 8px 0; font-size: 14px; color: #cccccc;"><strong style="color: #ffffff;">Email:</strong> <a href="mailto:${customerEmail}" style="color: #60a5fa;">${customerEmail}</a></p>
                      <p style="margin: 0 0 8px 0; font-size: 14px; color: #cccccc;"><strong style="color: #ffffff;">Location:</strong> ${customerLocation}</p>
                      <p style="margin: 0 0 8px 0; font-size: 14px; color: #cccccc;"><strong style="color: #ffffff;">Google Map Link:</strong> <a href="${googleMapLink}" style="color: #60a5fa;">${googleMapLink}</a></p>
                    </div>

                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 20px 32px; text-align: center; border-top: 1px solid #444;">
                    <p style="margin: 0; font-size: 12px; color: #6b7280;">© ${new Date().getFullYear()} Nana's Kitchen. All rights reserved.</p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
};

export const htmlVendorGhana = (
  cartItems: cartItem[],
  totalPrice: number,
  sourceId: string,
  paymentRef: string,
  currency: Currency,
  deliveryFee: string,
  packagingFee: string,
  customerName: string,
  customerPhone: string,
  customerEmail: string,
  customerLocation: string,
  googleMapLink: string,
  orderDate: string,
): string => {
  const hasPackaging = Number(packagingFee) > 0;

  const itemRows = cartItems
    .map(
      (item) => `
        <tr>
          <td style="padding: 12px 16px; border: 1px solid #444; color: #ffffff; font-size: 15px;">
            ${item.title}
            ${item.hasPackaging ? `<br/><span style="color: #4ade80; font-size: 12px; font-weight: 600;">✓ NEEDS PACKAGING</span>` : ""}
          </td>
          <td style="padding: 12px 16px; border: 1px solid #444; color: #ffffff; font-size: 15px; text-align: center;">
            ${item.quantity}
          </td>
          <td style="padding: 12px 16px; border: 1px solid #444; color: #ffffff; font-size: 15px; text-align: right;">
            ${formatPrice((item.quantity * parseFloat(item.price)).toFixed(2), currency)}
          </td>
        </tr>
      `,
    )
    .join("");

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.quantity * parseFloat(item.price),
    0,
  );

  return `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Ghana-New Order:#${sourceId}</title>
      </head>
      <body style="margin: 0; padding: 24px; background-color: #1a1a1a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center">
              <table width="660" cellpadding="0" cellspacing="0" style="background-color: #2d2d2d; border-radius: 12px; overflow: hidden;">

                <!-- Red Header -->
                <tr>
                  <td style="background-color: #c0392b; padding: 20px 32px; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #2d2d2d;">Ghana-New Order:#${sourceId}</h1>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding: 32px;">

                    <p style="margin: 0 0 8px 0; font-size: 18px; color: #cccccc;">
                      You've received the following order from <strong style="color: #ffffff;">${customerName}</strong>.
                    </p>

                    <p style="margin: 0 0 24px 0; font-size: 18px; font-weight: 700; color: #c0392b;">
                      [Order #${sourceId}] (${orderDate})
                    </p>

                    <!-- Items Table -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; border: 1px solid #444;">
                      <thead>
                        <tr style="background-color: #3a3a3a;">
                          <th style="padding: 12px 16px; border: 1px solid #444; font-size: 15px; font-weight: 700; color: #ffffff; text-align: left;">Product</th>
                          <th style="padding: 12px 16px; border: 1px solid #444; font-size: 15px; font-weight: 700; color: #ffffff; text-align: center;">Quantity</th>
                          <th style="padding: 12px 16px; border: 1px solid #444; font-size: 15px; font-weight: 700; color: #ffffff; text-align: right;">Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${itemRows}
                        <!-- Subtotal -->
                        <tr>
                          <td colspan="2" style="padding: 12px 16px; border: 1px solid #444; text-align: right; color: #cccccc; font-size: 15px;">Subtotal:</td>
                          <td style="padding: 12px 16px; border: 1px solid #444; text-align: right; color: #ffffff; font-size: 15px;">
                            ${formatPrice(subtotal.toFixed(2), currency)}
                          </td>
                        </tr>
                        <!-- Packaging Fee -->
                        ${
                          hasPackaging
                            ? `<tr style="background-color: #2d5a3d;">
                                <td colspan="2" style="padding: 12px 16px; border: 1px solid #444; text-align: right; font-size: 15px; font-weight: 700; color: #ffffff;">
                                  Packaging Fee: <span style="color: #4ade80; font-weight: 400; font-size: 13px;">(${cartItems.filter((item) => item.hasPackaging === true).length} item(s) need packaging)</span>
                                </td>
                                <td style="padding: 12px 16px; border: 1px solid #444; text-align: right; font-size: 15px; font-weight: 700; color: #ffffff;">
                                  ${formatPrice(Number(packagingFee).toFixed(2), currency)}
                                </td>
                              </tr>`
                            : ""
                        }
                        <!-- Delivery Fee -->
                        <tr>
                          <td colspan="2" style="padding: 12px 16px; border: 1px solid #444; text-align: right; color: #cccccc; font-size: 15px;">Delivery Fee:</td>
                          <td style="padding: 12px 16px; border: 1px solid #444; text-align: right; color: #ffffff; font-size: 15px;">
                            ${formatPrice(Number(deliveryFee).toFixed(2), currency)}
                          </td>
                        </tr>
                        <!-- Total -->
                        <tr>
                          <td colspan="2" style="padding: 12px 16px; border: 1px solid #444; text-align: right; font-size: 15px; font-weight: 700; color: #ffffff;">Total:</td>
                          <td style="padding: 12px 16px; border: 1px solid #444; text-align: right; font-size: 15px; font-weight: 700; color: #ffffff;">
                            ${formatPrice(totalPrice.toFixed(2), currency)}
                          </td>
                        </tr>
                        <!-- Payment Method -->
                        <tr>
                          <td colspan="2" style="padding: 12px 16px; border: 1px solid #444; text-align: right; color: #cccccc; font-size: 15px;">Payment method:</td>
                          <td style="padding: 12px 16px; border: 1px solid #444; text-align: right; color: #ffffff; font-size: 15px;">Paystack</td>
                        </tr>
                        <!-- Payment Ref -->
                        <tr>
                          <td colspan="2" style="padding: 12px 16px; border: 1px solid #444; text-align: right; color: #cccccc; font-size: 15px;">Payment Reference:</td>
                          <td style="padding: 12px 16px; border: 1px solid #444; text-align: right; color: #ffffff; font-size: 15px;">${paymentRef}</td>
                        </tr>
                      </tbody>
                    </table>

                    <!-- Delivery Details -->
                    <div style="margin-top: 32px;">
                      <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 700; color: #ffffff;">Delivery Details</h3>
                      <p style="margin: 0 0 8px 0; font-size: 14px; color: #cccccc;"><strong style="color: #ffffff;">Name:</strong> ${customerName}</p>
                      <p style="margin: 0 0 8px 0; font-size: 14px; color: #cccccc;"><strong style="color: #ffffff;">Phone:</strong> (${customerPhone} / )</p>
                      <p style="margin: 0 0 8px 0; font-size: 14px; color: #cccccc;"><strong style="color: #ffffff;">Email:</strong> <a href="mailto:${customerEmail}" style="color: #60a5fa;">${customerEmail}</a></p>
                      <p style="margin: 0 0 8px 0; font-size: 14px; color: #cccccc;"><strong style="color: #ffffff;">Location:</strong> ${customerLocation}</p>
                      <p style="margin: 0 0 8px 0; font-size: 14px; color: #cccccc;"><strong style="color: #ffffff;">Google Map Link:</strong> <a href="${googleMapLink}" style="color: #60a5fa;">${googleMapLink}</a></p>
                    </div>

                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 20px 32px; text-align: center; border-top: 1px solid #444;">
                    <p style="margin: 0; font-size: 12px; color: #6b7280;">© ${new Date().getFullYear()} Nana's Kitchen. All rights reserved.</p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
};

export const htmlBuyerInternational = (
  cartItems: cartItem[],
  totalPrice: number,
  sourceId: string,
  paymentRef: string,
  currency: Currency,
  shippingCost: string,
  customerName: string,
  customerPhone: string,
  customerEmail: string,
  customerAddress: string,
  customerState: string,
  customerCity: string,
  customerZip: string,
  orderDate: string,
): string => {
  const itemRows = cartItems
    .map(
      (item) => `
        <tr>
          <td style="padding: 12px 16px; border: 1px solid #e5e7eb; color: #374151; font-size: 15px;">
            ${item.title}
          </td>
          <td style="padding: 12px 16px; border: 1px solid #e5e7eb; color: #374151; font-size: 15px; text-align: center;">
            ${item.quantity}
          </td>
          <td style="padding: 12px 16px; border: 1px solid #e5e7eb; color: #374151; font-size: 15px; text-align: right;">
            ${formatPrice((item.quantity * parseFloat(item.price)).toFixed(2), currency)}
          </td>
        </tr>
      `,
    )
    .join("");

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.quantity * parseFloat(item.price),
    0,
  );

  return `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>New Order:#${sourceId}</title>
      </head>
      <body style="margin: 0; padding: 24px; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center">
              <table width="660" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden;">

                <!-- Red Header -->
                <tr>
                  <td style="background-color: #c0392b; padding: 20px 32px; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff;">New Order:#${sourceId}</h1>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding: 32px;">

                    <p style="margin: 0 0 24px 0; font-size: 18px; font-weight: 700; color: #c0392b;">
                      [Order #${sourceId}] (${orderDate})
                    </p>

                    <!-- Items Table -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; border: 1px solid #e5e7eb;">
                      <thead>
                        <tr style="background-color: #f9fafb;">
                          <th style="padding: 12px 16px; border: 1px solid #e5e7eb; font-size: 15px; font-weight: 700; color: #374151; text-align: left;">Product</th>
                          <th style="padding: 12px 16px; border: 1px solid #e5e7eb; font-size: 15px; font-weight: 700; color: #374151; text-align: center;">Quantity</th>
                          <th style="padding: 12px 16px; border: 1px solid #e5e7eb; font-size: 15px; font-weight: 700; color: #374151; text-align: right;">Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${itemRows}
                        <!-- Subtotal -->
                        <tr>
                          <td colspan="2" style="padding: 12px 16px; border: 1px solid #e5e7eb; text-align: right; color: #374151; font-size: 15px;">Subtotal:</td>
                          <td style="padding: 12px 16px; border: 1px solid #e5e7eb; text-align: right; color: #374151; font-size: 15px;">
                            ${formatPrice(subtotal.toFixed(2), currency)}
                          </td>
                        </tr>
                        <!-- Shipping -->
                        <tr>
                          <td colspan="2" style="padding: 12px 16px; border: 1px solid #e5e7eb; text-align: right; color: #374151; font-size: 15px;">Shipping:</td>
                          <td style="padding: 12px 16px; border: 1px solid #e5e7eb; text-align: right; color: #374151; font-size: 15px;">
                            ${formatPrice(Number(shippingCost).toFixed(2), currency)}
                          </td>
                        </tr>
                        <!-- Total -->
                        <tr>
                          <td colspan="2" style="padding: 12px 16px; border: 1px solid #e5e7eb; text-align: right; color: #374151; font-size: 15px;">Total:</td>
                          <td style="padding: 12px 16px; border: 1px solid #e5e7eb; text-align: right; color: #374151; font-size: 15px;">
                            ${formatPrice(totalPrice.toFixed(2), currency)}
                          </td>
                        </tr>
                        <!-- Payment Method -->
                        <tr>
                          <td colspan="2" style="padding: 12px 16px; border: 1px solid #e5e7eb; text-align: right; color: #374151; font-size: 15px;">Payment method:</td>
                          <td style="padding: 12px 16px; border: 1px solid #e5e7eb; text-align: right; color: #374151; font-size: 15px;">Stripe</td>
                        </tr>
                        <!-- Payment Ref -->
                        <tr>
                          <td colspan="2" style="padding: 12px 16px; border: 1px solid #e5e7eb; text-align: right; color: #374151; font-size: 15px;">Payment Reference:</td>
                          <td style="padding: 12px 16px; border: 1px solid #e5e7eb; text-align: right; color: #374151; font-size: 15px;">${paymentRef}</td>
                        </tr>
                      </tbody>
                    </table>

                    <!-- Delivery Details -->
                    <div style="margin-top: 32px;">
                      <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 700; color: #111827;">Delivery Details</h3>
                      <p style="margin: 0 0 8px 0; font-size: 14px; color: #374151;"><strong>Name:</strong> ${customerName}</p>
                      <p style="margin: 0 0 8px 0; font-size: 14px; color: #374151;"><strong>Address:</strong> ${customerAddress}</p>
                      <p style="margin: 0 0 8px 0; font-size: 14px; color: #374151;"><strong>City:</strong> ${customerCity}</p>
                      <p style="margin: 0 0 8px 0; font-size: 14px; color: #374151;"><strong>State:</strong> ${customerState}</p>
                      <p style="margin: 0 0 8px 0; font-size: 14px; color: #374151;"><strong>Zip:</strong> ${customerZip}</p>
                      <p style="margin: 0 0 8px 0; font-size: 14px; color: #374151;"><strong>Phone:</strong> ${customerPhone}</p>
                      <p style="margin: 0 0 8px 0; font-size: 14px; color: #374151;"><strong>Email:</strong> <a href="mailto:${customerEmail}" style="color: #2563eb;">${customerEmail}</a></p>
                      
                    </div>

                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 20px 32px; text-align: center; border-top: 1px solid #f3f4f6;">
                    <p style="margin: 0; font-size: 12px; color: #9ca3af;">© ${new Date().getFullYear()} Nana's Kitchen. All rights reserved.</p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
};

export const htmlVendorInternational = (
  cartItems: cartItem[],
  totalPrice: number,
  sourceId: string,
  paymentRef: string,
  currency: Currency,
  shippingCost: string,
  customerName: string,
  customerPhone: string,
  customerEmail: string,
  customerAddress: string,
  customerState: string,
  customerCity: string,
  customerZip: string,
  orderDate: string,
): string => {
  const itemRows = cartItems
    .map(
      (item) => `
        <tr>
          <td style="padding: 12px 16px; border: 1px solid #e5e7eb; color: #374151; font-size: 15px;">
            ${item.title}
          </td>
          <td style="padding: 12px 16px; border: 1px solid #e5e7eb; color: #374151; font-size: 15px; text-align: center;">
            ${item.quantity}
          </td>
          <td style="padding: 12px 16px; border: 1px solid #e5e7eb; color: #374151; font-size: 15px; text-align: right;">
            ${formatPrice((item.quantity * parseFloat(item.price)).toFixed(2), currency)}
          </td>
        </tr>
      `,
    )
    .join("");

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.quantity * parseFloat(item.price),
    0,
  );

  return `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>New Order:#${sourceId}</title>
      </head>
      <body style="margin: 0; padding: 24px; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center">
              <table width="660" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden;">

                <!-- Red Header -->
                <tr>
                  <td style="background-color: #c0392b; padding: 20px 32px; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff;">New Order:#${sourceId}</h1>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding: 32px;">

                    <p style="margin: 0 0 8px 0; font-size: 18px; color: #374151;">
                      You've received the following order from <strong>${customerName}</strong>.
                    </p>

                    <p style="margin: 0 0 24px 0; font-size: 18px; font-weight: 700; color: #c0392b;">
                      [Order #${sourceId}] (${orderDate})
                    </p>

                    <!-- Items Table -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; border: 1px solid #e5e7eb;">
                      <thead>
                        <tr style="background-color: #f9fafb;">
                          <th style="padding: 12px 16px; border: 1px solid #e5e7eb; font-size: 15px; font-weight: 700; color: #374151; text-align: left;">Product</th>
                          <th style="padding: 12px 16px; border: 1px solid #e5e7eb; font-size: 15px; font-weight: 700; color: #374151; text-align: center;">Quantity</th>
                          <th style="padding: 12px 16px; border: 1px solid #e5e7eb; font-size: 15px; font-weight: 700; color: #374151; text-align: right;">Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${itemRows}
                        <!-- Subtotal -->
                        <tr>
                          <td colspan="2" style="padding: 12px 16px; border: 1px solid #e5e7eb; text-align: right; color: #374151; font-size: 15px;">Subtotal:</td>
                          <td style="padding: 12px 16px; border: 1px solid #e5e7eb; text-align: right; color: #374151; font-size: 15px;">
                            ${formatPrice(subtotal.toFixed(2), currency)}
                          </td>
                        </tr>
                        <!-- Shipping -->
                        <tr>
                          <td colspan="2" style="padding: 12px 16px; border: 1px solid #e5e7eb; text-align: right; color: #374151; font-size: 15px;">Shipping:</td>
                          <td style="padding: 12px 16px; border: 1px solid #e5e7eb; text-align: right; color: #374151; font-size: 15px;">
                            ${formatPrice(Number(shippingCost).toFixed(2), currency)}
                          </td>
                        </tr>
                        <!-- Total -->
                        <tr>
                          <td colspan="2" style="padding: 12px 16px; border: 1px solid #e5e7eb; text-align: right; color: #374151; font-size: 15px;">Total:</td>
                          <td style="padding: 12px 16px; border: 1px solid #e5e7eb; text-align: right; color: #374151; font-size: 15px;">
                            ${formatPrice(totalPrice.toFixed(2), currency)}
                          </td>
                        </tr>
                        <!-- Payment Method -->
                        <tr>
                          <td colspan="2" style="padding: 12px 16px; border: 1px solid #e5e7eb; text-align: right; color: #374151; font-size: 15px;">Payment method:</td>
                          <td style="padding: 12px 16px; border: 1px solid #e5e7eb; text-align: right; color: #374151; font-size: 15px;">Stripe</td>
                        </tr>
                        <!-- Payment Ref -->
                        <tr>
                          <td colspan="2" style="padding: 12px 16px; border: 1px solid #e5e7eb; text-align: right; color: #374151; font-size: 15px;">Payment Reference:</td>
                          <td style="padding: 12px 16px; border: 1px solid #e5e7eb; text-align: right; color: #374151; font-size: 15px;">${paymentRef}</td>
                        </tr>
                      </tbody>
                    </table>

                    <!-- Delivery Details -->
                    <div style="margin-top: 32px;">
                      <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 700; color: #111827;">Delivery Details</h3>
                      <p style="margin: 0 0 8px 0; font-size: 14px; color: #374151;"><strong>Name:</strong> ${customerName}</p>
                      <p style="margin: 0 0 8px 0; font-size: 14px; color: #374151;"><strong>Address:</strong> ${customerAddress}</p>
                      <p style="margin: 0 0 8px 0; font-size: 14px; color: #374151;"><strong>City:</strong> ${customerCity}</p>
                      <p style="margin: 0 0 8px 0; font-size: 14px; color: #374151;"><strong>State:</strong> ${customerState}</p>
                      <p style="margin: 0 0 8px 0; font-size: 14px; color: #374151;"><strong>Zip:</strong> ${customerZip}</p>
                      <p style="margin: 0 0 8px 0; font-size: 14px; color: #374151;"><strong>Phone:</strong> ${customerPhone}</p>
                      <p style="margin: 0 0 8px 0; font-size: 14px; color: #374151;"><strong>Email:</strong> <a href="mailto:${customerEmail}" style="color: #2563eb;">${customerEmail}</a></p>
                    </div>

                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 20px 32px; text-align: center; border-top: 1px solid #f3f4f6;">
                    <p style="margin: 0; font-size: 12px; color: #9ca3af;">© ${new Date().getFullYear()} Nana's Kitchen. All rights reserved.</p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
};

export const text = (
  cartItems: cartItem[],
  totalPrice: number,
  sourceId: string,
  paymentRef: string,
  currency: Currency,
): string => {
  return `
    Order Confirmed — Thank you for your purchase!

    Order ID: ${sourceId}
    Payment Ref: ${paymentRef}

    Order Summary:
    ${cartItems.map((item) => `- ${item.title} x${item.quantity} ${formatPrice((item.quantity * parseFloat(item.price)).toFixed(2), currency)}`).join("\n")}

    Total: ${formatPrice(totalPrice.toFixed(2), currency)}

    Questions? Contact our support team.
  `;
};
