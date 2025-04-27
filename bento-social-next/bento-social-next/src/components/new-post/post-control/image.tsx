'use client';
import React from 'react';

interface ButtonUploadImgProps {
  setPreviewUrl: (value: string[] | ((prev: string[]) => string[])) => void;
  setSelectedFiles: (files: File[] | ((prev: File[]) => File[])) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

export default function ButtonUploadImg({
  setPreviewUrl,
  setSelectedFiles,
  fileInputRef,
}: ButtonUploadImgProps) {
  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);

    if (files.length > 0) {
      try {
        // Validate files
        for (const file of files) {
          if (!file.type.startsWith('image/')) {
            throw new Error(`File ${file.name} is not supported`);
          }
          if (file.size > 1024 * 2048) {
            throw new Error(`File ${file.name} is too large`);
          }
        }

        // Create and set previews
        const previews = await Promise.all(
          files.map(
            (file) =>
              new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(file);
              })
          )
        );

        // Update previews and files using functional updates to preserve previous state
        setPreviewUrl((prev) => [...prev, ...previews]);
        setSelectedFiles((prev) => [...prev, ...files]);

      } catch (error) {
        console.error('File validation failed:', error);
        // Don't clear existing files on error, just skip adding new ones
      }
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleButtonClick}
        className="p-2.5 rounded-[0.75rem] group bg-neutral2-1"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
        >
          <g opacity="0.8" className="group-hover:opacity-100">
            <path
              d="M5.87868 14.1213L6.40901 14.6517L6.40901 14.6517L5.87868 14.1213ZM6.75 4.5H17.25V3H6.75V4.5ZM19.5 6.75V17.25H21V6.75H19.5ZM4.28033 16.7803L6.40901 14.6517L5.34835 13.591L3.21967 15.7197L4.28033 16.7803ZM4.5 17.25V16.25H3V17.25H4.5ZM4.5 16.25V6.75H3V16.25H4.5ZM9.59099 14.6517L15.7197 20.7803L16.7803 19.7197L10.6517 13.591L9.59099 14.6517ZM17.25 19.5H16.25V21H17.25V19.5ZM16.25 19.5H6.75V21H16.25V19.5ZM6.40901 14.6517C7.28769 13.773 8.71231 13.773 9.59099 14.6517L10.6517 13.591C9.18718 12.1265 6.81282 12.1265 5.34835 13.591L6.40901 14.6517ZM3 17.25C3 19.3211 4.67893 21 6.75 21V19.5C5.50736 19.5 4.5 18.4926 4.5 17.25H3ZM19.5 17.25C19.5 18.4926 18.4926 19.5 17.25 19.5V21C19.3211 21 21 19.3211 21 17.25H19.5ZM17.25 4.5C18.4926 4.5 19.5 5.50736 19.5 6.75H21C21 4.67893 19.3211 3 17.25 3V4.5ZM6.75 3C4.67893 3 3 4.67893 3 6.75H4.5C4.5 5.50736 5.50736 4.5 6.75 4.5V3Z"
              fill="#F8F8F8"
              fillOpacity="0.5"
            />
          </g>
        </svg>
      </button>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        multiple
        className="hidden"
      />
    </>
  );
}
