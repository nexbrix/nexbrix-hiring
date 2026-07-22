import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { jobSchema } from "@/lib/validations";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        organization: {
          select: { name: true, logoUrl: true },
        },
        customFields: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ job });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch job" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await request.json().catch(() => ({}));

    const parsed = jobSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const {
      organizationId,
      title,
      description,
      department,
      location,
      type,
      status,
      customFields,
    } = parsed.data;

    const existingJob = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!existingJob) {
      return NextResponse.json(
        { error: "Job posting not found." },
        { status: 404 }
      );
    }

    const membership = await prisma.member.findUnique({
      where: {
        organizationId_userId: {
          organizationId: existingJob.organizationId,
          userId,
        },
      },
    });

    if (
      !membership ||
      (membership.role !== "OWNER" && membership.role !== "ADMIN")
    ) {
      return NextResponse.json(
        {
          error:
            "Forbidden. You do not have OWNER or ADMIN access to this organization.",
        },
        { status: 403 }
      );
    }

    const fieldsToCreate = customFields.map((field) => {
      const sanitizedName = field.name.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");
      return {
        name: sanitizedName,
        label: field.label.trim(),
        type: field.type,
        required: field.required,
        options: field.options,
        placeholder: field.placeholder || null,
        order: field.order,
      };
    });

    const updatedJob = await prisma.$transaction(async (tx) => {
      await tx.customField.deleteMany({
        where: { jobId },
      });

      return await tx.job.update({
        where: { id: jobId },
        data: {
          title: title.trim(),
          description: description.trim(),
          department: department ? department.trim() : null,
          location: location ? location.trim() : null,
          type: type.trim(),
          status: status,
          customFields: {
            create: fieldsToCreate,
          },
        },
        include: {
          customFields: {
            orderBy: {
              order: "asc",
            },
          },
        },
      });
    });

    return NextResponse.json({
      message: "Job updated successfully.",
      job: updatedJob,
    });
  } catch (error) {
    console.error("Error updating job:", error);
    return NextResponse.json(
      { error: "Failed to update job posting" },
      { status: 500 }
    );
  }
}
