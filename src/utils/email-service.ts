import nodemailer from "nodemailer";

// export const sendMail = async (orders) => {
//   // Create a transporter using SMTP
//   const transporter = nodemailer.createTransport({
//     host: "smtp.gmail.com",
//     port: 587,
//     secure: false, // use STARTTLS (upgrade connection to TLS after connecting)
//     auth: {
//       user: process.env.SMTP_USER,
//       pass: process.env.SMTP_PASS,
//     },
//   });

//   try {
//     await transporter.verify();
//     console.log("Server is ready to take our messages");
//   } catch (err) {
//     console.error("Verification failed:", err);
//   }
//   try {
//     const info = await transporter.sendMail({
//       from: '"Nana\'s Kitchen" <nana@mail.com>', // sender address
//       to: " donaldFifonsi@gmail.com", // list of recipients
//       subject: "Order Completed details", // subject line
//       text: "Order completed!", // plain text body
//       html: `<b>Hello ${orders.OrderUserDetail.firstName}!</b>`, // HTML body
//     });

//     console.log("Message sent: %s", info.messageId);
//     // Preview URL is only available when using an Ethereal test account
//     console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
//   } catch (err) {
//     console.error("Error while sending mail:", err);
//   }
// };

export type Currency = "GHS" | "USD" | "EUR";

export const INTERNATIONAL_RECEIPIENTS = {
  to: "eric.elewokor@gmail.com",
  cc: [
    "lisawokor79@yahoo.com",
    "eric.elewokor@gmail.com",
    "ernestaryee11@gmail.com",
    "gustav@ghmagic.com",
    "nanasinthekitchen2022@gmail.com",
    "nunanaashong@gmail.com",
  ],
};

export const GHANA_RECEIPIENTS = {
  to: "eric.elewokor@gmail.com",
  cc: [
    "lisawokor79@yahoo.com",
    "eric.elewokor@gmail.com",
    "ernest@adroit360.com",
    "gustav@ghmagic.com",
    "nanasinthekitchen2022@gmail.com",
    "nunanaashong@gmail.com",
  ],
};

export const CONTACT_US_RECEIPIENTS = {
  to: "eric.elewokor@gmail.com",
  cc: [
    "lisawokor79@yahoo.com",
    "eric.elewokor@gmail.com",
    "ernestaryee11@gmail.com",
    "gustav@ghmagic.com",
    "nanasinthekitchen2022@gmail.com",
    "nunanaashong@gmail.com",
  ],
};

export async function sendMail(
  to: string,
  subject: string,
  text: string,
  html: string,
  from?: string,
  cc?: string | string[],
) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    connectionTimeout: 5000,
  });

  const mailOptions = {
    from: process.env.SMTP_USER,
    to,
    subject,
    text,
    html,
    replyTo: from,
    cc,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:" + JSON.stringify(info.response));
  } catch (error) {
    console.error("Error occured: " + error);
    throw error;
  }
}

export async function ContactUsEmail(payload: {
  name: string;
  email: string;
  message: string;
}): Promise<void> {
  await sendMail(
    CONTACT_US_RECEIPIENTS.to,
    "Contact Us",
    `Name: ${payload.name}\nEmail: ${payload.email}\nMessage: ${payload.message}`,
    `<!DOCTYPE html>
      <html>
        <head>
          <style>
            .container { font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 16px; border: 1px solid #e4e4e7; border-radius: 8px; }
            .header { border-bottom: 2px solid #f4f4f5; padding-bottom: 10px; margin-bottom: 20px; }
            .label { font-weight: bold; color: #71717a; font-size: 12px; text-transform: uppercase; margin-bottom: 4px; }
            .value { color: #18181b; font-size: 16px; margin-bottom: 20px; }
            .message-box { background-color: #f9fafb; padding: 16px; border-radius: 6px; white-space: pre-wrap; overflow-wrap: break-word; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2 style="margin: 0; color: #18181b;">New Contact Inquiry</h2>
            </div>
            
            <div>
              <div class="label">From</div>
              <div class="value">${payload.name}</div>
            </div>

            <div>
              <div class="label">Email Address</div>
              <div class="value">${payload.email}</div>
            </div>

            <div>
              <div class="label">Message</div>
              <div class="message-box">
                ${payload.message}
              </div>
            </div>

            <div style="margin-top: 30px; font-size: 12px; color: #a1a1aa; text-align: center;">
              This email was sent from the Nana's Kitchen contact form.
            </div>
          </div>
        </body>
      </html>
      `,
    payload.email,
    CONTACT_US_RECEIPIENTS.cc,
  );
}
