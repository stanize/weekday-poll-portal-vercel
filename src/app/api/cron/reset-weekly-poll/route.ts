import { NextResponse } from "next/server";
import { resetWeeklyPoll } from "@/lib/resetWeeklyPoll";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await resetWeeklyPoll();
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error("Weekly poll reset failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
