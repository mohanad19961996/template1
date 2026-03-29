import { NextRequest, NextResponse } from "next/server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return NextResponse.json(null, { status: 204, headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, subject, message } = body;

    // Validate required fields
    const missing: string[] = [];
    if (!name?.trim()) missing.push("name");
    if (!email?.trim()) missing.push("email");
    if (!subject?.trim()) missing.push("subject");
    if (!message?.trim()) missing.push("message");

    if (missing.length > 0) {
      return NextResponse.json(
        { success: false, error: `Missing required fields: ${missing.join(", ")}` },
        { status: 400, headers: corsHeaders }
      );
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { success: false, error: "Invalid email address" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Log the contact form submission
    console.log("=== Contact Form Submission ===");
    console.log("Name:", name.trim());
    console.log("Email:", email.trim());
    console.log("Subject:", subject.trim());
    console.log("Message:", message.trim());
    if (body.phone) console.log("Phone:", body.phone.trim());
    if (body.service) console.log("Service:", body.service);
    if (body.budget) console.log("Budget:", body.budget);
    console.log("Timestamp:", new Date().toISOString());
    console.log("===============================");

    return NextResponse.json(
      { success: true, message: "Message received successfully" },
      { status: 200, headers: corsHeaders }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400, headers: corsHeaders }
    );
  }
}
