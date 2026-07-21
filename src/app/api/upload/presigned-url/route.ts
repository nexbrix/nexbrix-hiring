import { NextRequest, NextResponse } from "next/server";
import { getUploadPresignedUrl } from "@/lib/s3";

// Allowed MIME types for candidate resumes
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { fileName, fileType } = body;

    if (!fileName || !fileType) {
      return NextResponse.json(
        { error: "fileName and fileType are required" },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(fileType)) {
      return NextResponse.json(
        {
          error: "Invalid file type. Only PDF, DOC, and DOCX documents are allowed.",
        },
        { status: 400 }
      );
    }

    const { uploadUrl, key } = await getUploadPresignedUrl(fileName, fileType);

    const bucketName = process.env.AWS_BUCKET_NAME;
    const region = process.env.AWS_REGION;
    
    // Construct the public S3 file URL that will be stored in our database
    const fileUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;

    return NextResponse.json({
      uploadUrl,
      key,
      fileUrl,
    });
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return NextResponse.json(
      { error: "Failed to generate presigned upload URL" },
      { status: 500 }
    );
  }
}
