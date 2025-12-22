import { NextResponse } from "next/server";

// Lightweight smoke-test endpoint to validate that POST and OPTIONS are allowed in production
const TEST_CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Accept, Origin",
};

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: TEST_CORS });
}

export async function POST(request) {
  try {
    // keep this handler minimal and fast - returns 201 JSON
    return NextResponse.json({ success: true, message: "Test apply POST accepted" }, { status: 201, headers: TEST_CORS });
  } catch (err) {
    console.error("/api/test-apply error:", err);
    return NextResponse.json({ success: false, error: "Internal test error" }, { status: 500, headers: TEST_CORS });
  }
}

export async function GET() {
  return NextResponse.json({ success: true, message: "Test apply GET ok" }, { status: 200, headers: TEST_CORS });
}
