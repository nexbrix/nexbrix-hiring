import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export interface PresignedUrlResponse {
  uploadUrl: string;
  key: string;
}

/**
 * Generates a presigned URL for uploading a file to AWS S3.
 * @param fileName Original name of the file
 * @param fileType MIME type of the file (e.g. application/pdf)
 * @param expirationSeconds Expiration time in seconds (default is 1 hour)
 */
export async function getUploadPresignedUrl(
  fileName: string,
  fileType: string,
  expirationSeconds = 3600,
): Promise<PresignedUrlResponse> {
  const bucketName = process.env.AWS_BUCKET_NAME;
  if (!bucketName) {
    throw new Error("AWS_BUCKET_NAME environment variable is not defined");
  }

  // Sanitize fileName to prevent path traversal or weird character issues in S3 keys
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  const uniqueKey = `resumes/${Date.now()}_${Math.random()
    .toString(36)
    .substring(2, 8)}_${sanitizedFileName}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: uniqueKey,
    ContentType: fileType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, {
    expiresIn: expirationSeconds,
  });

  return {
    uploadUrl,
    key: uniqueKey,
  };
}

export { s3Client };
