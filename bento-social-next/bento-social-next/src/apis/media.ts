import axiosInstance from '@/utils/axios';
import { endpoints } from '@/utils/axios';
import { Media } from '@/interfaces/media';
import { IApiResponse } from '@/interfaces/api-response';

//--------------------------------------------------------------------------------------------

export const uploadImage = async (file: File | File[]): Promise<IApiResponse<Media | Media[]>> => {
  const form = new FormData();
  
  if (Array.isArray(file)) {
    file.forEach((f, index) => {
      form.append(`files`, f); // Changed to 'files' for consistency
    });
    const response = await axiosInstance.post(endpoints.media.uploadMultiple, form);
    return response.data;
  } 
  
  form.append('file', file as File);
  console.log("In uploadimage: "+ file.name);
  const response = await axiosInstance.post(endpoints.media.upload, form);
  console.log("response: "+ response.data);
  return response.data;
};