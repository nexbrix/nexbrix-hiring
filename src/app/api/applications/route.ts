import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getDownloadPresignedUrl } from "@/lib/s3";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");

    if (!organizationId) {
      return NextResponse.json(
        { error: "organizationId is required" },
        { status: 400 }
      );
    }

    const membership = await prisma.member.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId: session.user.id,
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const applications = await prisma.application.findMany({
      where: {
        job: { organizationId },
      },
      include: {
        job: {
          select: { title: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Generate signed download URLs for private S3 resume access
    const applicationsWithSignedUrls = await Promise.all(
      applications.map(async (app) => {
        if (!app.resumeUrl) return app;
        try {
          const signedResumeUrl = await getDownloadPresignedUrl(app.resumeUrl, 3600);
          return { ...app, resumeUrl: signedResumeUrl };
        } catch (err) {
          console.error("Failed to generate signed resume URL for app:", app.id, err);
          return app;
        }
      })
    );

    return NextResponse.json({ applications: applicationsWithSignedUrls });
  } catch (error) {
    console.error("Failed to fetch applications:", error);
    return NextResponse.json(
      { error: "Failed to fetch applications" },
      { status: 500 }
    );
  }
}
