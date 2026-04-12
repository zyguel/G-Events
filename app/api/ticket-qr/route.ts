import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { verifySignedTicketQrPayload } from "@/lib/ticketQrEmailImage";

export const runtime = "nodejs";

/**
 * Public signed PNG for e-ticket QR codes embedded in emails (not for auth).
 */
export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams.get("p");
  const s = request.nextUrl.searchParams.get("s");
  const ticketUrl = verifySignedTicketQrPayload(p, s);
  if (!ticketUrl || !/^https?:\/\//i.test(ticketUrl)) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const png = await QRCode.toBuffer(ticketUrl, {
      type: "png",
      width: 280,
      margin: 2,
      errorCorrectionLevel: "M",
    });
    return new NextResponse(new Uint8Array(png), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=604800, immutable",
      },
    });
  } catch {
    return new NextResponse("Bad request", { status: 400 });
  }
}
