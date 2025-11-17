import { NextRequest, NextResponse } from 'next/server';
import { connection } from 'next/server';
import { logger } from '@/lib/logger';
import { fileUploadService, ALLOWED_MEDICAL_TYPES, MAX_FILE_SIZE } from '@/lib/file-upload';

/**
 * @swagger
 * /api/upload:
 *   post:
 *     summary: Upload medical documents
 *     description: Upload medical documents, images, or PDFs
 *     tags: [File Upload]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: File to upload
 *               folder:
 *                 type: string
 *                 description: Folder to upload to
 *                 example: "patient-documents"
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 url:
 *                   type: string
 *                   example: "https://example.com/uploads/file.pdf"
 *                 publicId:
 *                   type: string
 *                 size:
 *                   type: number
 *       400:
 *         description: Invalid file or missing data
 *       413:
 *         description: File too large
 *       500:
 *         description: Upload failed
 */
export async function POST(request: NextRequest) {
  await connection();

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = formData.get('folder') as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Log upload attempt
    logger.info('File upload requested', {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      folder,
    });

    // Upload file
    const result = await fileUploadService.uploadFile(file, {
      folder: folder || 'medical-documents',
      maxSize: MAX_FILE_SIZE,
      allowedTypes: ALLOWED_MEDICAL_TYPES,
      publicAccess: false,
    });

    if (!result.success) {
      logger.warn('File upload failed', { error: result.error });
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    // TODO: Save file metadata to database
    // await prisma.document.create({
    //   data: {
    //     fileName: file.name,
    //     fileUrl: result.url,
    //     fileType: file.type,
    //     fileSize: result.size,
    //     publicId: result.publicId,
    //     folder: folder || 'medical-documents',
    //     userId: userId, // from auth
    //   },
    // });

    logger.info('File uploaded successfully', {
      url: result.url,
      publicId: result.publicId,
    });

    return NextResponse.json({
      success: true,
      url: result.url,
      publicId: result.publicId,
      size: result.size,
      format: result.format,
    });
  } catch (error) {
    logger.error('File upload error', error as Error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
