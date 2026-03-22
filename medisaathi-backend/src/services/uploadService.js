import { imagekit } from '../config/imagekit.js';

/**
 * Upload a single file buffer to ImageKit.
 *
 * @param {Buffer} fileBuffer   - File buffer from multer (req.file.buffer)
 * @param {string} fileName     - Original filename
 * @param {string} folder       - ImageKit folder path e.g. '/hospitals' or '/branches'
 *
 * @returns {{ url, fileId, name }}
 */
export const uploadImage = async (fileBuffer, fileName, folder = '/medisaathi') => {
  const response = await imagekit.upload({
    file:              fileBuffer.toString('base64'),
    fileName,
    folder,
    useUniqueFileName: true,
  });

  return {
    url:    response.url,
    fileId: response.fileId,
    name:   response.name,
  };
};

/**
 * Upload multiple images at once.
 * Returns array of { url, fileId, name }
 */
export const uploadMultipleImages = async (files, folder = '/medisaathi') => {
  const uploads = files.map((file) =>
    uploadImage(file.buffer, file.originalname, folder)
  );
  return Promise.all(uploads);
};

/**
 * Delete an image from ImageKit by its fileId.
 * Called when admin removes an image or hospital/branch is deleted.
 */
export const deleteImage = async (fileId) => {
  try {
    await imagekit.deleteFile(fileId);
  } catch (err) {
    // Log but don't throw — a failed delete shouldn't crash the request
    console.error('[Upload] deleteImage failed for fileId:', fileId, err.message);
  }
};

/**
 * Delete multiple images by fileId array.
 */
export const deleteMultipleImages = async (fileIds = []) => {
  await Promise.allSettled(fileIds.map((id) => deleteImage(id)));
};