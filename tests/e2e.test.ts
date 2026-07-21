import * as fs from "fs";
import * as path from "path";
import { prisma } from "@/lib/prisma";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getUploadPresignedUrl, s3Client } from "@/lib/s3";

describe("End-to-End Integration Test: S3 Upload & Database Flow", () => {
  let userId: string;
  let organizationId: string;
  let jobId: string;
  let applicationId: string;
  let s3Key: string;
  let createdMockPdf = false;

  const testPdfName = "test_resume.pdf";
  const testPdfPath = path.join(process.cwd(), testPdfName);

  beforeAll(async () => {
    // 1. Ensure test_resume.pdf exists. If not, create a dummy one
    if (!fs.existsSync(testPdfPath)) {
      console.log("Generating dummy test_resume.pdf for test...");
      fs.writeFileSync(
        testPdfPath,
        "%PDF-1.4 dummy pdf content for testing S3 presigned url upload",
      );
      createdMockPdf = true;
    }
  });

  afterAll(async () => {
    // 1. S3 Cleanup: Delete the uploaded resume from S3
    if (s3Key) {
      console.log(`Cleaning up S3 object: ${s3Key}`);
      try {
        const deleteCommand = new DeleteObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: s3Key,
        });
        await s3Client.send(deleteCommand);
        console.log("Successfully deleted test resume from S3.");
      } catch (err) {
        console.error("Failed to delete S3 test object:", err);
      }
    }

    // 2. Database Cleanup: Delete records in reverse dependency order
    console.log("Cleaning up database test records...");

    if (applicationId) {
      await prisma.application
        .deleteMany({ where: { id: applicationId } })
        .catch(console.error);
    }
    if (jobId) {
      // CustomFields are cascade deleted automatically with Job
      await prisma.job
        .deleteMany({ where: { id: jobId } })
        .catch(console.error);
    }
    if (organizationId) {
      await prisma.member
        .deleteMany({ where: { organizationId } })
        .catch(console.error);
      await prisma.organization
        .deleteMany({ where: { id: organizationId } })
        .catch(console.error);
    }
    if (userId) {
      await prisma.user
        .deleteMany({ where: { id: userId } })
        .catch(console.error);
    }

    // 3. File Cleanup: Remove the mock PDF if we created it
    if (createdMockPdf && fs.existsSync(testPdfPath)) {
      console.log("Cleaning up temporary test_resume.pdf...");
      fs.unlinkSync(testPdfPath);
    }

    // Disconnect Prisma Client
    await prisma.$disconnect();
  });

  test("Should execute the E2E lifecycle (create user/org/job, upload resume to S3, submit application, verify & clean up)", async () => {
    const timestamp = Date.now();

    // STEP 1: Create dummy User
    const user = await prisma.user.create({
      data: {
        id: `test-e2e-user-${timestamp}`,
        name: "Test E2E Recruiter",
        email: `e2e.recruiter.${timestamp}@example.com`,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    userId = user.id;
    expect(userId).toBeDefined();
    console.log(`Created test User: ${user.name}`);

    // STEP 2: Create Organization & Member OWNER
    const org = await prisma.organization.create({
      data: {
        name: `Test E2E Corp ${timestamp}`,
        slug: `e2e-corp-${timestamp}`,
      },
    });
    organizationId = org.id;
    expect(organizationId).toBeDefined();
    console.log(`Created test Organization: ${org.name} (${org.slug})`);

    const member = await prisma.member.create({
      data: {
        organizationId: org.id,
        userId: user.id,
        role: "OWNER",
      },
    });
    expect(member.id).toBeDefined();
    console.log(`Created Member link (OWNER)`);

    // STEP 3: Create Job with CustomFields
    const job = await prisma.job.create({
      data: {
        organizationId: org.id,
        creatorId: user.id,
        title: "E2E Senior Developer",
        description: "Testing S3 & DB integration",
        type: "Full-time",
        status: "ACTIVE",
        customFields: {
          create: [
            {
              name: "years_experience",
              label: "Years of Experience",
              type: "NUMBER",
              required: true,
              order: 1,
            },
            {
              name: "github_profile",
              label: "GitHub Profile URL",
              type: "TEXT",
              required: false,
              order: 2,
            },
          ],
        },
      },
      include: {
        customFields: true,
      },
    });
    jobId = job.id;
    expect(jobId).toBeDefined();
    expect(job.customFields.length).toBe(2);
    console.log(`Created test Job: ${job.title} with custom fields`);

    // STEP 4: Request Presigned URL and upload test_resume.pdf to S3
    const fileBuffer = fs.readFileSync(testPdfPath);
    const { uploadUrl, key } = await getUploadPresignedUrl(
      testPdfName,
      "application/pdf",
    );
    s3Key = key;
    expect(uploadUrl).toBeDefined();
    expect(s3Key).toBeDefined();
    console.log(`Generated S3 Key: ${s3Key}`);

    // Upload to S3
    console.log("Uploading test_resume.pdf to S3 via presigned URL...");
    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      body: fileBuffer,
      headers: {
        "Content-Type": "application/pdf",
      },
    });

    expect(uploadRes.status).toBe(200);
    console.log("S3 upload returned 200 OK!");

    // STEP 5: Create Candidate Application
    const resumeUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;
    const customAnswers = {
      years_experience: 6,
      github_profile: "https://github.com/jeetdas-mock-e2e",
    };

    const application = await prisma.application.create({
      data: {
        jobId: job.id,
        candidateName: "Jeet E2E Applicant",
        candidateEmail: `jeet.e2e.${timestamp}@example.com`,
        candidatePhone: "+91 9999988888",
        resumeUrl,
        customAnswers,
      },
    });
    applicationId = application.id;
    expect(applicationId).toBeDefined();
    console.log(`Created Candidate Application: ${application.candidateName}`);

    // STEP 6: Query and Verify Database Entry
    const savedApp = await prisma.application.findUnique({
      where: { id: applicationId },
    });

    expect(savedApp).not.toBeNull();
    expect(savedApp?.candidateName).toBe("Jeet E2E Applicant");
    expect(savedApp?.resumeUrl).toBe(resumeUrl);
    expect(savedApp?.customAnswers).toEqual(customAnswers);
    console.log("Successfully verified S3 URL and JSONB customAnswers in DB!");
  });
});
