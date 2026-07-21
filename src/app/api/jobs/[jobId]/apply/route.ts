import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { applicationSchema } from "@/lib/validations";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { customFields: true },
    });

    if (!job) {
      return NextResponse.json(
        { error: "Job posting not found." },
        { status: 404 }
      );
    }

    if (job.status !== "ACTIVE") {
      return NextResponse.json(
        {
          error:
            "This job posting is no longer active or accepting applications.",
        },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));

    const parsed = applicationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const {
      candidateName,
      candidateEmail,
      candidatePhone,
      resumeUrl,
      coverLetter,
      customAnswers,
    } = parsed.data;

    const validatedAnswers: Record<string, any> = {};

    for (const field of job.customFields) {
      const answer = customAnswers[field.name];

      if (
        field.required &&
        (answer === undefined || answer === null || answer === "")
      ) {
        return NextResponse.json(
          { error: `The custom field '${field.label}' is required.` },
          { status: 400 }
        );
      }

      if (answer !== undefined && answer !== null && answer !== "") {
        if (field.type === "NUMBER") {
          const num = Number(answer);
          if (isNaN(num)) {
            return NextResponse.json(
              {
                error: `The custom field '${field.label}' must be a valid number.`,
              },
              { status: 400 }
            );
          }
          validatedAnswers[field.name] = num;
        } else if (field.type === "BOOLEAN") {
          if (
            typeof answer !== "boolean" &&
            answer !== "true" &&
            answer !== "false"
          ) {
            return NextResponse.json(
              {
                error: `The custom field '${field.label}' must be a boolean (true/false).`,
              },
              { status: 400 }
            );
          }
          validatedAnswers[field.name] = answer === true || answer === "true";
        } else if (field.type === "SELECT" || field.type === "MULTI_SELECT") {
          if (field.options && field.options.length > 0) {
            if (field.type === "SELECT") {
              const selectedValue = String(answer);
              if (!field.options.includes(selectedValue)) {
                return NextResponse.json(
                  {
                    error: `Value '${selectedValue}' is not a valid option for '${field.label}'.`,
                  },
                  { status: 400 }
                );
              }
              validatedAnswers[field.name] = selectedValue;
            } else {
              const answersArray = Array.isArray(answer)
                ? answer.map(String)
                : [String(answer)];
              for (const val of answersArray) {
                if (!field.options.includes(val)) {
                  return NextResponse.json(
                    {
                      error: `Value '${val}' is not a valid option for '${field.label}'.`,
                    },
                    { status: 400 }
                  );
                }
              }
              validatedAnswers[field.name] = answersArray;
            }
          } else {
            validatedAnswers[field.name] = answer;
          }
        } else {
          validatedAnswers[field.name] = answer;
        }
      }
    }

    const application = await prisma.application.create({
      data: {
        jobId,
        candidateName: candidateName.trim(),
        candidateEmail: candidateEmail.trim(),
        candidatePhone: candidatePhone ? candidatePhone.trim() : null,
        resumeUrl: resumeUrl.trim(),
        coverLetter: coverLetter ? coverLetter.trim() : null,
        customAnswers: validatedAnswers,
      },
    });

    return NextResponse.json(
      {
        message: "Application submitted successfully.",
        application,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error submitting job application:", error);
    return NextResponse.json(
      { error: "Failed to submit job application" },
      { status: 500 }
    );
  }
}
