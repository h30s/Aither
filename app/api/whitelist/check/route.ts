import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { address } = body;

    // diotsrh mode: Always return whitelisted
    if (process.env.NEXT_PUBLIC_diotsrh_MODE === "true") {
      return NextResponse.json({
        isWhitelisted: true,
        address: address,
        diotsrh: true
      });
    }

    // In production, you would check against your whitelist contract or database
    // For now, return false
    return NextResponse.json({
      isWhitelisted: false,
      address: address
    });

  } catch (error) {
    console.error("Error checking whitelist:", error);
    return NextResponse.json(
      { error: "Failed to check whitelist", isWhitelisted: false },
      { status: 500 }
    );
  }
}
