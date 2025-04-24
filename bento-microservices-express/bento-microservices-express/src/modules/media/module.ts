import { Router } from 'express';
import multer from 'multer';
import { MediaHttpService } from './infra/transport/http-service';

export const setupMediaModule = () => {
  const httpService = new MediaHttpService();
  const router = Router();

  const storage = multer.memoryStorage();
  const upload = multer({ 
    storage,
    limits: {
      fileSize: 1024 * 2048, // 2MB limit
      files: 10 // Maximum 10 files
    }
  });

  // Single file upload route
  router.post('/upload-file', upload.single('file'), httpService.uploadSingleFile.bind(httpService));
  
  // Multiple files upload route
  router.post('/upload-files', upload.array('files', 10), httpService.uploadMultipleFiles.bind(httpService));

  return router;
};
