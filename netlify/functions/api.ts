import { Handler } from "@netlify/functions";
import nodemailer from "nodemailer";
import { EMAIL_TEMPLATES } from "../../shared/api";

// Helper function لإرسال إيميل واحد
const sendEmail = async ({
  to,
  subject,
  html,
  gmailEmail,
  appPassword,
}: {
  to: string;
  subject: string;
  html: string;
  gmailEmail: string;
  appPassword: string;
}) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: gmailEmail, pass: appPassword },
  });

  await transporter.sendMail({
    from: gmailEmail,
    to,
    subject,
    html,
  });
};

export const handler: Handler = async (event) => {
  const path = event.path;
  const method = event.httpMethod;

  try {
    // Demo route
    if (path.endsWith("/api/demo") && method === "GET") {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "Hello from serverless" }),
      };
    }

    // Bulk send route
    if (path.endsWith("/api/bulk-send-email") && method === "POST") {
      const payload = JSON.parse(event.body || "{}");

      if (!payload.recipients?.length)
        return {
          statusCode: 400,
          body: JSON.stringify({ success: false, message: "No recipients provided" }),
        };

      if (!payload.subject || !payload.content || !payload.gmailEmail || !payload.appPassword)
        return {
          statusCode: 400,
          body: JSON.stringify({ success: false, message: "Missing required fields" }),
        };

      const template = EMAIL_TEMPLATES.find((t) => t.id === payload.templateId);

      if (!template)
        return {
          statusCode: 400,
          body: JSON.stringify({ success: false, message: "Template not found" }),
        };

      const results: any[] = [];
      let successCount = 0;
      let failureCount = 0;

      for (const recipient of payload.recipients) {
        try {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(recipient.email)) {
            results.push({ email: recipient.email, success: false, error: "Invalid email format" });
            failureCount++;
            continue;
          }

          // استبدال الـ placeholders
          const personalizedContent = payload.content.replace(/\[([^\]]+)\]/g, (_, key) => {
            const normalizedKey = key.trim().toLowerCase().replace(/\s+/g, "");
            const matchKey = Object.keys(recipient).find(
              (k) => k.toLowerCase().replace(/\s+/g, "") === normalizedKey
            );
            return matchKey ? String(recipient[matchKey as keyof typeof recipient]) : `[${key}]`;
          });

          await sendEmail({
            to: recipient.email,
            subject: payload.subject,
            html: personalizedContent,
            gmailEmail: payload.gmailEmail,
            appPassword: payload.appPassword,
          });

          results.push({ email: recipient.email, success: true });
          successCount++;
        } catch (error: any) {
          results.push({
            email: recipient.email,
            success: false,
            error: error.message || "Unknown error",
          });
          failureCount++;
        }
      }

      return {
        statusCode: 200,
        body: JSON.stringify({
          success: successCount > 0,
          message: `Sent ${successCount} emails, ${failureCount} failed`,
          totalSent: successCount,
          totalFailed: failureCount,
          results,
        }),
      };
    }

    return { statusCode: 404, body: "Not Found" };
  } catch (err: any) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
