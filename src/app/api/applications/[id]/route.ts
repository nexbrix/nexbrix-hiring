import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const VALID_STATUSES = [
  "APPLIED",
  "SCREENING",
  "INTERVIEWING",
  "OFFERED",
  "REJECTED",
  "HIRED",
] as const;

type ApplicationStatus = (typeof VALID_STATUSES)[number];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status || !VALID_STATUSES.includes(status as ApplicationStatus)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }

    // Fetch application to get its org
    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        job: {
          select: { organizationId: true },
        },
      },
    });

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    // Verify the caller is a member of the org
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

    const updated = await prisma.application.update({
      where: { id },
      data: { status: status as ApplicationStatus },
    });

    return NextResponse.json({ application: updated });
  } catch (error) {
    console.error("Failed to update application status:", error);
    return NextResponse.json(
      { error: "Failed to update application status" },
      { status: 500 }
    );
  }
}
