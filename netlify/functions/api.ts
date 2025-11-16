import { Handler } from "@netlify/functions";
import nodemailer from "nodemailer";
import { EMAIL_TEMPLATES } from "../../shared/api";

export const handler: Handler = async (event) => {
  const path = event.path;
  const method = event.httpMethod;

  try {
    // Demo route
    if (path.endsWith("/api/demo") && method === "GET") {
      return { statusCode: 200, body: JSON.stringify({ message: "Hello from serverless" }) };
    }

    // Bulk send route
    if (path.endsWith("/api/bulk-send-email") && method === "POST") {
      const body = JSON.parse(event.body || "{}");
      // ... استخدم نفس logic send-email و bulk-send-email هنا
      return { statusCode: 200, body: JSON.stringify({ message: "Bulk emails sent!" }) };
    }

    return { statusCode: 404, body: "Not Found" };
  } catch (err: any) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
