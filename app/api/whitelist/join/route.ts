import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { address, ref_code } = body;

    // diotsrh mode: Always return success
    if (process.env.NEXT_PUBLIC_diotsrh_MODE === "true") {
      return NextResponse.json({
        success: true,
        address: address,
        diotsrh: true,
        message: "Successfully joined whitelist (diotsrh mode)"
      });
    }

    // In production, you would add the address to your whitelist contract or database
    // For now, return error
    return NextResponse.json(
      { 
        success: false, 
        error: "Whitelist joining not implemented in production mode" 
      },
      { status: 501 }
    );

  } catch (error) {
    console.error("Error joining whitelist:", error);
    return NextResponse.json(
      { success: false, error: "Failed to join whitelist" },
      { status: 500 }
    );
  }
}
