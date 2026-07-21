import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { jobSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");

    if (organizationId) {
      const session = await auth.api.getSession({
        headers: await headers(),
      });

      if (!session || !session.user) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
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

      const jobs = await prisma.job.findMany({
        where: { organizationId },
        include: { customFields: true },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({ jobs });
    } else {
      const jobs = await prisma.job.findMany({
        where: { status: "ACTIVE" },
        include: {
          organization: {
            select: { name: true, logoUrl: true },
          },
          customFields: true,
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({ jobs });
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
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

    const membership = await prisma.member.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
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

    const job = await prisma.job.create({
      data: {
        organizationId,
        creatorId: userId,
        title: title.trim(),
        description: description.trim(),
        department: department ? department.trim() : null,
        location: location ? location.trim() : null,
        type: type.trim(),
        status: status || "DRAFT",
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

    return NextResponse.json(
      {
        message: "Job created successfully.",
        job,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating job:", error);
    return NextResponse.json(
      { error: "Failed to create job posting" },
      { status: 500 }
    );
  }
}
