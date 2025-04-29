import { config } from '@shared/components/config';
import { AppError } from '@shared/utils/error';
import { Request, Response } from 'express';
import { v2 as cloudinary } from 'cloudinary';

const ErrImageTooBig = AppError.from(new Error('image too big, max size is 512KB'), 400);
const ErrMediaNotFound = AppError.from(new Error('media not found'), 400);
const ErrUploadFailed = AppError.from(new Error('failed to upload to cloudinary'), 500);
const ErrDeleteFailed = AppError.from(new Error('failed to delete from cloudinary'), 500);

export class MediaHttpService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });
  }

  private async uploadToCloudinary(file: Express.Multer.File) {
    if (file.size > 1024 * 2048) {
      throw ErrImageTooBig;
    }

    const b64 = Buffer.from(file.buffer).toString('base64');
    const dataURI = `data:${file.mimetype};base64,${b64}`;
    
    const result = await cloudinary.uploader.upload(dataURI, {
      upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET,
      resource_type: 'auto'
    });

    return {
      filename: file.originalname,
      url: result.secure_url,
      ext: file.originalname.split('.').pop() || '',
      contentType: file.mimetype,
      size: file.size,
      public_id: result.public_id
    };
  }

  private getPublicIdFromUrl(url: string): string {
    const urlParts = url.split('/');
    const publicIdWithExt = urlParts[urlParts.length - 1];
    return publicIdWithExt.split('.')[0]; // Remove file extension
  }

  async uploadSingleFile(req: Request, res: Response) {
    const file = req.file;
    if (!file) {
      throw ErrMediaNotFound;
    }

    try {
      const result = await this.uploadToCloudinary(file);
      res.status(200).json({ data: result });
    } catch (error) {
      console.error('Cloudinary upload failed:', error);
      throw ErrUploadFailed;
    }
  }

  async uploadMultipleFiles(req: Request, res: Response) {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      throw ErrMediaNotFound;
    }

    try {
      const uploadPromises = files.map(file => this.uploadToCloudinary(file));
      const uploadedFiles = await Promise.all(uploadPromises);
      res.status(200).json({ data: uploadedFiles });
    } catch (error) {
      console.error('Cloudinary upload failed:', error);
      throw ErrUploadFailed;
    }
  }

  async deleteFiles(req: Request, res: Response) {
    const { urls } = req.body as { urls: string[] };
    
    if (!urls || urls.length === 0) {
      throw AppError.from(new Error('No URLs provided'), 400);
    }

    try {
      const deletePromises = urls.map(async (url) => {
        const publicId = this.getPublicIdFromUrl(url);
        return cloudinary.uploader.destroy(publicId);
      });

      const results = await Promise.all(deletePromises);
      
      const success = results.every(result => result.result === 'ok');
      if (!success) {
        throw ErrDeleteFailed;
      }

      res.status(200).json({ 
        message: 'Files deleted successfully',
        data: results 
      });
    } catch (error) {
      console.error('Cloudinary delete failed:', error);
      throw ErrDeleteFailed;
    }
  }
}