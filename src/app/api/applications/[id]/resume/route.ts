import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getDownloadPresignedUrl } from "@/lib/s3";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        job: {
          select: { organizationId: true },
        },
      },
    });

    if (!application || !application.resumeUrl) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    // Verify membership
    const membership = await prisma.member.findUnique({
      where: {
        organizationId_userId: {
          organizationId: application.job.organizationId,
          userId: session.user.id,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const signedUrl = await getDownloadPresignedUrl(
      application.resumeUrl,
      3600,
    );

    // Redirect directly to the signed S3 URL
    return NextResponse.redirect(signedUrl);
  } catch (error) {
    console.error("Failed to generate resume download link:", error);
    return NextResponse.json(
      { error: "Failed to generate resume download link" },
      { status: 500 },
    );
  }
}
