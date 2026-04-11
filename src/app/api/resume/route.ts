import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { resumeConfig } from "@/config/resumeConfig";

export async function GET() {
  const filePath = path.join(
    process.cwd(),
    "app_data",
    "resume",
    resumeConfig.storedFileName,
  );

  try {
    const fileBuffer = await fs.readFile(filePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${resumeConfig.downloadFileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { ok: false, errorMessage: "Resume file not found." },
      { status: 404 },
    );
  }
}

