'use client';
import { uploadImage } from '@/apis/media';
import { Media } from '@/interfaces/media'; // Add this import
import Image from 'next/image';
import React, { useEffect, useRef } from 'react';
import { z } from 'zod';

import { createComment } from '@/apis/comment';
import { createPost } from '@/apis/post';
import { getTopics } from '@/apis/topic';
import { usePost } from '@/context/post-context';
import { useUserProfile } from '@/context/user-context';
import { IPost } from '@/interfaces/post';
import { ITopic } from '@/interfaces/topic';
import { CreatePost, createPostSchema } from '@/schema/posts-schema';

import { Avatar } from '@/components/avatar';
import { UploadImgButton } from '@/components/new-post/post-control';
import { Typography } from '@/components/typography';

import { cn } from '@/lib';

import { Button } from '../button';
import { Dropdown } from '../dropdown';
import { CloseIcon } from '../icons';
import { SplashScreen } from '../loading-screen';

//----------------------------------------------------------------------------------

interface PostContentProps {
  usedBy: 'post' | 'reply';
  className?: string;
  onCreated?: (isCreate: boolean) => void;
  postId?: string;
  parentComment?: { id: string; fullname: string };
}

export default function ComposerInput({
  usedBy,
  className,
  onCreated,
  postId,
  parentComment,
}: PostContentProps) {
  const { userProfile } = useUserProfile();
  const { addPost } = usePost();
  const [isInputFocused, setInputFocused] = React.useState<boolean>(false);

  const [selectedTopic, setSelectedTopic] = React.useState<string>('');
  const [topics, setTopics] = React.useState<ITopic[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string>('');

  const [previewUrls, setPreviewUrls] = React.useState<string[]>([]);
  const [uploadedImages, setUploadedImages] = React.useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]); // New state for files
  const [isUploading, setIsUploading] = React.useState(false);

  const [content, setContent] = React.useState<string>('');
  const inputRef = React.useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current && 
        !containerRef.current.contains(event.target as Node) &&
        isInputFocused
      ) {
        setInputFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isInputFocused]);

  React.useEffect(() => {
    getTopics()
      .then((response) => {
        console.log(response);
        setTopics(response.data);
        if (response.data.length > 0) {
          console.log(response);
          setSelectedTopic(response.data[0].id);
        }
      })
      .catch((error) => {
        console.error('Error fetching topics:', error);
        setError('Failed load topics.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      // First upload images if there are any
      let uploadedImageUrls: string[] = [];
      if (selectedFiles.length > 0) {
        setIsUploading(true);
        const response = await uploadImage(selectedFiles);
        const mediaArray = Array.isArray(response.data)
          ? response.data
          : [response.data];
        uploadedImageUrls = mediaArray.map((item: Media) => item.url);
        setIsUploading(false);
      }

      const postData: CreatePost = {
        content: content.trim(),
        image: uploadedImageUrls.length > 0 ? uploadedImageUrls : null,
        topicId: selectedTopic,
      };

      const validatedData = createPostSchema.parse(postData);

      const tempId = Math.random().toString(36).substring(2, 15);

      const newPost: IPost = {
        id: tempId,
        content: content.trim(),
        image: uploadedImageUrls, // Use the newly uploaded URLs
        topic: topics.find((topic) => topic.id === selectedTopic) || {
          id: '',
          name: '',
          color: '',
          postCount: 0,
          createdAt: '',
          updatedAt: '',
        },
        author: {
          id: userProfile?.id || '',
          username: userProfile?.username || '',
          firstName: userProfile?.firstName || '',
          lastName: userProfile?.lastName || '',
          avatar: userProfile?.avatar || null,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isFeatured: false,
        commentCount: 0,
        likedCount: 0,
        type: uploadedImageUrls.length > 0 ? 'media' : 'text',
        hasLiked: false,
        hasSaved: false,
      };

      if (usedBy !== 'post') {
        setContent('');
        setInputFocused(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        const commentData = {
          id: postId as string,
          parentId: parentComment?.id ?? null,
          content: validatedData.content,
        };

        await createComment(
          parentComment?.id ? commentData : { ...commentData, parentId: null }
        );
        onCreated?.(true);
        return;
      }

      addPost(newPost);

      await createPost(validatedData);

      setContent('');
      setPreviewUrls([]);
      setSelectedFiles([]); // Clear selected files
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.errors.map((err) => err.message).join(', ');
        console.log(`Validation error: ${errorMessage}`);
      } else {
        console.log('Failed to create post. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    // Only clear the file input if we're removing the last image
    if (previewUrls.length <= 1 && fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  React.useEffect(() => {
    if (parentComment?.fullname) {
      setContent(`@${parentComment.fullname} `);
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.selectionStart = inputRef.current.value.length;
        inputRef.current.selectionEnd = inputRef.current.value.length;
      }
    }
  }, [parentComment]);

  if (loading) return <SplashScreen />;
  if (error) return <div>{error}</div>;

  return (
    <div
      ref={containerRef}
      className={cn(
        `w-full flex gap-3 h-[64px] z-10 overflow-hidden items-center justify-between p-3 absolute left-0 bottom-0 rounded-[1.25rem] ${isInputFocused ? ' h-fit flex-col justify-start bg-neutral3-70 hover:bg-neutral2-5' : 'flex-row bg-neutral2-2'} transition-all duration-[0.2s]`,
        className
      )}
    >
      <div
        className={`w-full flex justify-between items-start gap-3 grow ${isInputFocused ? 'items-start' : 'items-center'}`}
      >
        <Avatar
          className="rounded-full"
          alt="avatar"
          size={40}
          src={userProfile?.avatar}
        />

        <div className="flex-1">
          <textarea
            ref={inputRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              usedBy === 'post' ? 'Start a post...' : 'Post your reply...'
            }
            className={`min-w-full p-0 text-left min-h-fit max-h-fit !bg-transparent text-tertiary placeholder:text-tertiary grow opacity-50 focus:outline-none focus:bg-transparent focus:opacity-100 ${isInputFocused ? 'pt-[0px]' : ' pt-[30px]'}`}
            onFocus={() => setInputFocused(true)}
          />
          {previewUrls.length > 0 && (
            <div className="relative mt-2 max-h-[400px] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-2 p-2">
                {previewUrls.map((url, index) => (
                  <div
                    key={index}
                    className="relative bg-neutral2-1 rounded-lg group aspect-[3/4]"
                  >
                    <Image
                      src={url}
                      alt={`Preview ${index + 1}`}
                      fill
                      className="object-cover rounded-lg"
                      sizes="(max-width: 300px) 50vw, 300px"
                    />
                    {isUploading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                    <button
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-4 right-4 p-1 rounded-full bg-black bg-opacity-50 hover:bg-opacity-70 transition-opacity opacity-0 group-hover:opacity-100"
                      disabled={isUploading}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div
        className={`${isInputFocused ? 'w-full' : 'hidden'} flex items-center mt-3`}
      >
        {isInputFocused && usedBy === 'post' ? (
          <div id="tool-reply" className="flex gap-1 items-center mt-3">
            {/* <EmojiButton /> */}

            <UploadImgButton
              fileInputRef={fileInputRef}
              setPreviewUrl={setPreviewUrls}
              setSelectedFiles={setSelectedFiles}
            />

            {/* <GifButton /> */}

            <Dropdown
              options={topics.map((topic) => ({
                label: topic.name,
                value: topic.id,
                color: topic.color,
              }))}
              value={selectedTopic}
              onChange={setSelectedTopic}
              placeholder="Select an topic"
            />
          </div>
        ) : (
          ''
        )}

        <Button
          disabled={!content.trim() || isUploading || isSubmitting}
          className="px-[1.5rem] py-[0.75rem] ml-auto"
          onClick={handleSubmit}
          child={
            <Typography className="text-secondary" level="base2sm">
              {isSubmitting
                ? 'Posting...'
                : usedBy === 'post'
                  ? 'Post'
                  : 'Reply'}
            </Typography>
          }
        />
      </div>
    </div>
  );
}
