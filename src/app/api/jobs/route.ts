import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const VALID_FIELD_TYPES = [
  "TEXT",
  "TEXTAREA",
  "NUMBER",
  "SELECT",
  "MULTI_SELECT",
  "BOOLEAN",
  "FILE",
];

const VALID_JOB_STATUSES = ["DRAFT", "ACTIVE", "CLOSED"];

export async function POST(request: NextRequest) {
  try {
    // 1. Get current authenticated user session
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

    // 2. Parse and validate the request body
    const body = await request.json().catch(() => ({}));
    const {
      organizationId,
      title,
      description,
      department,
      location,
      type,
      status,
      customFields,
    } = body;

    if (!organizationId || !title || !description || !type) {
      return NextResponse.json(
        {
          error:
            "organizationId, title, description, and type are required fields.",
        },
        { status: 400 }
      );
    }

    // Validate job status if provided
    if (status && !VALID_JOB_STATUSES.includes(status)) {
      return NextResponse.json(
        {
          error: `Invalid job status. Must be one of: ${VALID_JOB_STATUSES.join(
            ", "
          )}`,
        },
        { status: 400 }
      );
    }

    // 3. Confirm authorization (User must be OWNER or ADMIN in target organization)
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

    // 4. Validate custom fields definitions
    if (customFields && !Array.isArray(customFields)) {
      return NextResponse.json(
        { error: "customFields must be an array of field configurations." },
        { status: 400 }
      );
    }

    const fieldsToCreate = [];
    const fieldNames = new Set<string>();

    for (const field of customFields || []) {
      const { name, label, type: fieldType, required, options, placeholder, order } = field;

      if (!name || !label || !fieldType) {
        return NextResponse.json(
          {
            error:
              "Each custom field configuration requires 'name', 'label', and 'type'.",
          },
          { status: 400 }
        );
      }

      // Format name to underscore separated lowercase key (e.g. "github_url")
      const sanitizedName = name.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");

      if (fieldNames.has(sanitizedName)) {
        return NextResponse.json(
          { error: `Duplicate custom field name key: '${sanitizedName}'.` },
          { status: 400 }
        );
      }
      fieldNames.add(sanitizedName);

      if (!VALID_FIELD_TYPES.includes(fieldType)) {
        return NextResponse.json(
          {
            error: `Invalid custom field type '${fieldType}'. Must be one of: ${VALID_FIELD_TYPES.join(
              ", "
            )}`,
          },
          { status: 400 }
        );
      }

      fieldsToCreate.push({
        name: sanitizedName,
        label: label.trim(),
        type: fieldType,
        required: !!required,
        options: Array.isArray(options) ? options.map(String) : [],
        placeholder: placeholder ? placeholder.trim() : null,
        order: typeof order === "number" ? order : 0,
      });
    }

    // 5. Create Job and CustomFields in database
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
