import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { organizationSchema } from "@/lib/validations";

export async function GET() {
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

    const memberships = await prisma.member.findMany({
      where: { userId: session.user.id },
      include: { organization: true },
    });

    return NextResponse.json({
      organizations: memberships.map((m) => m.organization),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch organizations" },
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

    const parsed = organizationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, slug, logoUrl } = parsed.data;

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

    const result = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name,
          slug,
          logoUrl,
        },
      });

      await tx.member.create({
        data: {
          organizationId: org.id,
          userId,
          role: "OWNER",
        },
      });

      return { org };
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
