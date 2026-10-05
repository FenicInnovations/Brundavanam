const { gcs: gcsConfig } = require("../config/env");

// Allowed mime types mapping
const ALLOWED_MIME_TYPES = {
  image: ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"],
  pdf: ["application/pdf"],
  document: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ],
  video: ["video/mp4", "video/webm", "video/quicktime"],
};

const MAX_FILE_SIZES = {
  image: 10 * 1024 * 1024, // 10MB
  pdf: 25 * 1024 * 1024, // 25MB
  document: 25 * 1024 * 1024, // 25MB
  video: 100 * 1024 * 1024, // 100MB
};

const path = require("path");
const fs = require("fs");

let storageClient = null;

// Initialize GCS client lazily if credentials exist
function getStorageClient() {
  if (storageClient) return storageClient;

  const keyFilePath = path.join(__dirname, "../config/gcp-service-account.json");
  const { Storage } = require("@google-cloud/storage");

  if (fs.existsSync(keyFilePath)) {
    try {
      storageClient = new Storage({
        keyFilename: keyFilePath,
        projectId: (gcsConfig.projectId || process.env.GCS_PROJECT_ID || "testingproject-510602").trim(),
      });
      console.log(`[gcsService] Initialized Google Cloud Storage client from keyFile: ${keyFilePath}`);
      return storageClient;
    } catch (err) {
      console.warn("[gcsService] Failed initializing from keyFile, falling back to credentials:", err.message);
    }
  }

  let rawKey = gcsConfig.privateKey || process.env.GCS_PRIVATE_KEY;
  if (rawKey) {
    rawKey = rawKey.trim();
    if (rawKey.endsWith(",")) {
      rawKey = rawKey.slice(0, -1).trim();
    }
    if (rawKey.startsWith('"') && rawKey.endsWith('"')) {
      rawKey = rawKey.slice(1, -1);
    }
    if (rawKey.startsWith("'") && rawKey.endsWith("'")) {
      rawKey = rawKey.slice(1, -1);
    }
    rawKey = rawKey.replace(/\\n/g, "\n").replace(/[\r\n]+/g, "\n").trim();
  }

  const clientEmail = (gcsConfig.clientEmail || process.env.GCS_CLIENT_EMAIL || "").trim();
  const projectId = (gcsConfig.projectId || process.env.GCS_PROJECT_ID || "").trim();

  if (clientEmail && rawKey) {
    try {
      storageClient = new Storage({
        projectId: projectId,
        credentials: {
          client_email: clientEmail,
          private_key: rawKey,
        },
      });
      console.log(`[gcsService] Initialized Google Cloud Storage client for project '${projectId}'`);
    } catch (err) {
      console.warn("[gcsService] Warning initializing @google-cloud/storage:", err.message);
    }
  }
  return storageClient;
}

/**
 * Validates file mime type and size against limits.
 */
function validateFile({ mimeType, size, fileType = "image" }) {
  const allowed = ALLOWED_MIME_TYPES[fileType] || ALLOWED_MIME_TYPES.image;
  const maxSize = MAX_FILE_SIZES[fileType] || MAX_FILE_SIZES.image;

  if (!allowed.includes(mimeType)) {
    const err = new Error(`Unsupported file type: '${mimeType}'. Allowed: ${allowed.join(", ")}`);
    err.statusCode = 400;
    throw err;
  }

  if (size > maxSize) {
    const err = new Error(`File size (${(size / (1024 * 1024)).toFixed(2)} MB) exceeds limit of ${maxSize / (1024 * 1024)} MB`);
    err.statusCode = 400;
    throw err;
  }

  return true;
}

/**
 * Generates V4 Signed Upload URL for direct client-to-GCS upload,
 * or constructs a signed upload metadata bundle.
 */
async function generateSignedUploadUrl({ fileName, fileType = "image", mimeType, size }) {
  validateFile({ mimeType, size, fileType });

  const fileId = `file_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  const datePrefix = new Date().toISOString().slice(0, 7); // YYYY-MM
  const storagePath = `products/${datePrefix}/${fileId}-${cleanFileName}`;
  const bucketName = (gcsConfig.bucketName || process.env.GCS_BUCKET_NAME || "radhakrishnan").trim();

  const storage = getStorageClient();

  if (storage && gcsConfig.clientEmail) {
    try {
      const bucket = storage.bucket(bucketName);
      const file = bucket.file(storagePath);

      const [uploadUrl] = await file.generateSignedUrl({
        version: "v4",
        action: "write",
        expires: Date.now() + 15 * 60 * 1000, // 15 minutes
        contentType: mimeType,
      });

      const publicUrl = `https://storage.googleapis.com/${bucketName}/${storagePath}`;

      return {
        fileId,
        fileName,
        fileType,
        mimeType,
        size,
        bucketName,
        storagePath,
        publicUrl,
        uploadUrl,
        isDirectGcs: true,
      };
    } catch (err) {
      console.warn("[gcsService] Signed URL generation failed, falling back to managed URL:", err.message);
    }
  }

  // Fallback / standard cloud reference format
  const publicUrl = `https://storage.googleapis.com/${bucketName}/${storagePath}`;
  return {
    fileId,
    fileName,
    fileType,
    mimeType,
    size,
    bucketName,
    storagePath,
    publicUrl,
    uploadUrl: publicUrl, // frontend upload handler fallback
    isDirectGcs: false,
  };
}

/**
 * Deletes a file from Google Cloud Storage bucket safely.
 */
async function deleteFile(storagePath) {
  if (!storagePath) return false;

  const storage = getStorageClient();
  if (storage) {
    try {
      const bucketName = (gcsConfig.bucketName || process.env.GCS_BUCKET_NAME || "radhakrishnan").trim();
      const bucket = storage.bucket(bucketName);
      await bucket.file(storagePath).delete({ ignoreNotFound: true });
      console.log(`[gcsService] Successfully deleted file from GCS: ${storagePath}`);
      return true;
    } catch (err) {
      console.error(`[gcsService] Failed to delete file ${storagePath} from GCS:`, err.message);
      return false;
    }
  } else {
    console.log(`[gcsService] Mock deletion for path: ${storagePath}`);
    return true;
  }
}

/**
 * Uploads a file buffer directly to Google Cloud Storage bucket using authenticated Node SDK.
 */
async function uploadFileDirect({ buffer, fileName, mimeType, fileType = "image" }) {
  validateFile({ mimeType, size: buffer.length, fileType });

  const fileId = `file_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  const datePrefix = new Date().toISOString().slice(0, 7); // YYYY-MM
  const storagePath = `products/${datePrefix}/${fileId}-${cleanFileName}`;
  const bucketName = (gcsConfig.bucketName || process.env.GCS_BUCKET_NAME || "radhakrishnan").trim();

  const storage = getStorageClient();
  if (!storage) {
    throw new Error("Google Cloud Storage client not initialized. Check GCS credentials in backend/.env.");
  }

  try {
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(storagePath);

    await file.save(buffer, {
      metadata: {
        contentType: mimeType,
        cacheControl: "public, max-age=31536000",
      },
      resumable: false,
    });

    try {
      await file.makePublic();
    } catch (err) {
      // Bucket policy governs access if uniform access is enabled
    }

    const publicUrl = `https://storage.googleapis.com/${bucketName}/${storagePath}`;
    console.log(`[gcsService] Successfully saved file to bucket '${bucketName}': ${storagePath}`);

    return {
      fileId,
      fileName,
      fileType,
      mimeType,
      size: buffer.length,
      bucketName,
      storagePath,
      publicUrl,
    };
  } catch (err) {
    console.error(`[gcsService] GCS upload error for file '${fileName}' in bucket '${bucketName}':`, err.message);
    throw err;
  }
}

/**
 * Deletes multiple files from GCS.
 */
async function deleteMultipleFiles(storagePaths = []) {
  if (!Array.isArray(storagePaths) || storagePaths.length === 0) return [];
  const results = await Promise.allSettled(storagePaths.map((path) => deleteFile(path)));
  return results;
}

module.exports = {
  validateFile,
  generateSignedUploadUrl,
  uploadFileDirect,
  deleteFile,
  deleteMultipleFiles,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZES,
};

