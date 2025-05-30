import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { randomUUID } from 'crypto'

// S3 client configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
})

const bucketName = process.env.S3_BUCKET_NAME || 'twitter-clone-images'

// Image types
export enum ImageType {
  PROFILE = 'profile',
  POST = 'post'
}

// Function to generate a unique S3 key
export const generateS3Key = (type: ImageType, userId: string, filename?: string): string => {
  const uuid = randomUUID()
  const extension = filename ? filename.split('.').pop() : 'jpg'
  return `${type}/${userId}/${uuid}.${extension}`
}

// Generate a pre-signed URL for uploading an image to S3
export const generatePresignedUploadUrl = async (
  key: string,
  contentType: string,
  expiresIn = 300 // 5 minutes
): Promise<{ url: string, key: string }> => {
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: contentType,
  })

  const url = await getSignedUrl(s3Client, command, { expiresIn })
  return { url, key }
}

// Generate a pre-signed URL for downloading an image from S3
export const generatePresignedDownloadUrl = async (
  key: string,
  expiresIn = 3600 // 1 hour
): Promise<string> => {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  })

  return await getSignedUrl(s3Client, command, { expiresIn })
}

// Get the public URL for an image
export const getPublicImageUrl = (key: string): string => {
  if (!key) return ''
  return `https://${bucketName}.s3.amazonaws.com/${key}`
}

// Delete an image from S3
export const deleteImage = async (key: string): Promise<void> => {
  if (!key) return

  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  })

  await s3Client.send(command)
}

// Types for S3 service
export interface S3Service {
  generatePresignedUploadUrl: (key: string, contentType: string, expiresIn?: number) => Promise<{ url: string, key: string }>
  generatePresignedDownloadUrl: (key: string, expiresIn?: number) => Promise<string>
  getPublicImageUrl: (key: string) => string
  deleteImage: (key: string) => Promise<void>
  generateS3Key: (type: ImageType, userId: string, filename?: string) => string
}

// Create S3 service instance
export const s3Service: S3Service = {
  generatePresignedUploadUrl,
  generatePresignedDownloadUrl,
  getPublicImageUrl,
  deleteImage,
  generateS3Key,
} 