import { z } from 'zod';

const postsType = z.enum(['text', 'media']);

export const postsSchema = z.object({
  id: z.string(),
  content: z.string(),
  image: z.union([z.string().array(), z.string(), z.null()]), // Updated to handle array of strings
  authorId: z.string(),
  topicId: z.string(),
  isFeatured: z.boolean().optional(),
  commentCount: z.number().optional(),
  likedCount: z.number().optional(),
  type: postsType,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Post = z.infer<typeof postsSchema>;

export const createPostSchema = z.object({
  content: z.string(),
  image: z.union([z.string().array(), z.string(), z.null()]), // Updated to handle array of strings
  topicId: z.string(),
});

export type CreatePost = z.infer<typeof createPostSchema>;

export const updatePostSchema = z.object({
  id: z.string(),
  content: z.string().optional(),
  image: z.union([z.string().array(), z.string(), z.null()]), // Updated to handle array of strings
  topicId: z.string().optional(),
}).partial();

export type UpdatePost = z.infer<typeof updatePostSchema>;
