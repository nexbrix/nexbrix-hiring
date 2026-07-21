import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    // 1. Get the authenticated session
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
    const { name, slug, logoUrl } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: "Organization name and slug are required." },
        { status: 400 }
      );
    }

    // Slug validation: lowercase letters, numbers, hyphens, and underscores
    const slugRegex = /^[a-z0-9-_]+$/;
    if (!slugRegex.test(slug)) {
      return NextResponse.json(
        {
          error:
            "Slug can only contain lowercase letters, numbers, hyphens, and underscores.",
        },
        { status: 400 }
      );
    }

    // 3. Check if slug is unique
    const existingOrg = await prisma.organization.findUnique({
      where: { slug },
    });

    if (existingOrg) {
      return NextResponse.json(
        {
          error:
            "Organization slug is already taken. Please choose another one.",
        },
        { status: 409 }
      );
    }

    // 4. Create the Organization and Member linkage within a transaction
    const result = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name,
          slug,
          logoUrl,
        },
      });

      const member = await tx.member.create({
        data: {
          organizationId: org.id,
          userId,
          role: "OWNER",
        },
      });

      return { org, member };
    });

    return NextResponse.json(
      {
        message: "Organization created successfully.",
        organization: result.org,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating organization:", error);
    return NextResponse.json(
      { error: "Failed to create organization" },
      { status: 500 }
    );
  }
}
