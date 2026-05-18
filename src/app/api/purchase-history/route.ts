import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { phoneNumber } = await req.json();

    if (!phoneNumber || typeof phoneNumber !== "string") {
      return NextResponse.json(
        { error: "phoneNumber is required" },
        { status: 400 }
      );
    }

    const baseUrl = process.env.API_BASE_URL;
    const token = process.env.API_TOKEN;

    if (!baseUrl || !token) {
      return NextResponse.json(
        { error: "Server is not configured" },
        { status: 500 }
      );
    }

    const upstream = await fetch(`${baseUrl}/api/Payment/GetPurchaseHistory`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ PhoneNumber: phoneNumber }),
      cache: "no-store",
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      return NextResponse.json(
        { error: "Upstream API error", status: upstream.status, detail: text },
        { status: 502 }
      );
    }

    const data = await upstream.json();
    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
