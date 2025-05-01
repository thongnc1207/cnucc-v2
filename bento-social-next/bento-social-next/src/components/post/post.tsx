'use client';
import { deleteImages } from '@/apis/media';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

import {
  deletePost,
  likePost,
  savePost,
  unlikeAll,
  unlikePost,
  unsaveAll,
  unsavePost,
} from '@/apis/post';
import {
  deleteAllCommentsOfPost,
  getCommennts,
  deleteComment,
} from '@/apis/comment';
import { IChilrenComment, ICommment } from '@/interfaces/comment';
import { IPost } from '@/interfaces/post';
import { IUserProfile } from '@/interfaces/user';
import { useUserProfile } from '@/context/user-context';

import { cn } from '@/lib/utils';
import { relativeTime } from '@/utils/relative-time';

import { Avatar } from '../avatar';
import { BookmarkIcon, CommentIcon, HeartIcon, MoreIcon } from '../icons';
import UpdatePost from '../new-post/update-post';
import { Portal } from '../portal';
import { Typography } from '../typography';
import { MoreOptions } from './components/more-options';
import { ReactItem } from './react-item';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from '../alert-dialog';
import { Button } from '../button';

//-------------------------------------------------------------------------

interface PostProps {
  data: IPost | ICommment | IChilrenComment;
  className?: string;
  onUpdatePost?: (updatedPost: IPost) => void;
  setParentComment?: (parentComment: { id: string; fullname: string }) => void;
  onDeleteSuccess?: (isDeleted: boolean) => void;
  type?: string;
  openMoreOptionsId?: string | null;
  setOpenMoreOptionsId?: (id: string | null) => void;
}

export default function Post({
  data,
  className,
  onUpdatePost,
  setParentComment,
  onDeleteSuccess,
  openMoreOptionsId,
  setOpenMoreOptionsId,
}: PostProps) {
  const { userProfile } = useUserProfile();
  const [localData, setLocalData] = React.useState(data);
  const [isEdit, setIsEdit] = React.useState<boolean>(false);
  const [isConfirm, setIsConfirm] = React.useState<boolean>(false);
  const [isLikeLoading, setIsLikeLoading] = React.useState(false);
  const [isBookmarkLoading, setIsBookmarkLoading] = React.useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = React.useState(false);

  const isPostType = 'isFeatured' in data || 'hasSaved' in data;

  const handleLikeClick = async () => {
    if (!isPostType || isLikeLoading) return;
    setIsLikeLoading(true);

    const newLikedCount =
      localData.likedCount + ((localData as IPost).hasLiked ? -1 : 1);
    const updatedData = {
      ...localData,
      hasLiked: !(localData as IPost).hasLiked,
      likedCount: newLikedCount,
    } as IPost;

    setLocalData(updatedData);
    if (onUpdatePost) {
      onUpdatePost(updatedData);
    }

    try {
      if ((localData as IPost).hasLiked) {
        await unlikePost(localData.id);
      } else {
        await likePost(localData.id);
      }
    } catch (error) {
      console.error('Failed to update like status:', error);
      setLocalData(localData);
      if (onUpdatePost) {
        onUpdatePost(localData as IPost);
      }
    } finally {
      setIsLikeLoading(false);
    }
  };

  const handleMoreOptions = () => {
    console.log(openMoreOptionsId);
    console.log(data.id);
    setOpenMoreOptionsId?.(openMoreOptionsId === data.id ? null : data.id);
  };

  const handleBookmarkClick = async () => {
    if (!isPostType || isBookmarkLoading) return;
    setIsBookmarkLoading(true);

    const updatedData = {
      ...localData,
      hasSaved: !(localData as IPost).hasSaved,
    } as IPost;

    setLocalData(updatedData);
    if (onUpdatePost) {
      onUpdatePost(updatedData);
    }

    try {
      if ((localData as IPost).hasSaved) {
        await unsavePost(localData.id);
      } else {
        await savePost(localData.id);
      }
    } catch (error) {
      console.error('Failed to update bookmark status:', error);
      setLocalData(localData);
      if (onUpdatePost) {
        onUpdatePost(localData as IPost);
      }
    } finally {
      setIsBookmarkLoading(false);
    }
  };

  const handleReplyComment = () => {
    if (isPostType) return;
    setParentComment?.({
      id: data.id,
      fullname: `${data.author.firstName} ${data.author.lastName}`,
    });
  };

  const handleUpdatePost = (updatedPost: IPost) => {
    setLocalData(updatedPost);
    onUpdatePost?.(updatedPost);
    setIsEdit(false);
    handleMoreOptions();
  };

  const handleDeletePost = async () => {
    setIsDeleteLoading(true);
    try {
      // Delete images first if they exist
      if (
        isPostType &&
        (localData as IPost).image &&
        Array.isArray((localData as IPost).image)
      ) {
        const images = (localData as IPost).image;
        if (images.length > 0) {
          try {
            await deleteImages(Array.isArray(images) ? images : [images]);
          } catch (error) {
            console.error('Failed to delete post images:', error);
          }
        }
      }

      // Remove from bookmark if bookmarked
      if (isPostType && (localData as IPost).hasSaved) {
        try {
          await unsaveAll(localData.id);
        } catch (error) {
          console.error('Failed to unsave post before delete:', error);
        }
      }

      // Remove from like if liked
      if (isPostType && (localData as IPost).hasLiked) {
        try {
          await unlikeAll(localData.id);
        } catch (error) {
          console.error('Failed to unlike post before delete:', error);
        }
      }

      // Delete all comments if any
      if (
        isPostType &&
        (localData as IPost).commentCount &&
        (localData as IPost).commentCount > 0
      ) {
        try {
          // // Fetch all comments of the post
          // const commentsRes = await getCommennts(localData.id);
          // console.log(commentsRes);
          // const comments = commentsRes.data || [];
          // // Delete each comment individually
          // for (const comment of comments) {
          //   try {
          //     console.log(comment.id);
          //     await deleteComment(comment.id);
          //   } catch (error) {
          //     console.error(`Failed to delete comment ${comment.id}:`, error);
          //   }
          // }
          await deleteAllCommentsOfPost(localData.id);
        } catch (error) {
          console.error(
            'Failed to delete comments before deleting post:',
            error
          );
        }
      }

      // Then delete the post
      await deletePost(data.id);
      onDeleteSuccess?.(true);
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
    setIsConfirm(false);
    setIsDeleteLoading(false);
  };

  const handleDeleteComment = async () => {
    setIsDeleteLoading(true);
    try {


      // // Remove from like if liked
      // if (isPostType && (localData as IPost).hasLiked) {
      //   try {
      //     await unlikeAll(localData.id);
      //   } catch (error) {
      //     console.error('Failed to unlike post before delete:', error);
      //   }
      // }

      // Delete all comments if any
      if (
        !isPostType &&
        (localData as ICommment).id
      ) {
        try {
          // // Fetch all comments of the post
          // const commentsRes = await getCommennts(localData.id);
          // console.log(commentsRes);
          // const comments = commentsRes.data || [];
          // // Delete each comment individually
          // for (const comment of comments) {
          //   try {
          //     console.log(comment.id);
          //     await deleteComment(comment.id);
          //   } catch (error) {
          //     console.error(`Failed to delete comment ${comment.id}:`, error);
          //   }
          // }
          await deleteComment(localData.id);
        } catch (error) {
          console.error(
            'Failed to delete comments before deleting post:',
            error
          );
        }
      }

      onDeleteSuccess?.(true);
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
    setIsConfirm(false);
    setIsDeleteLoading(false);
  };

  const handleConfirmDelete = () => {
    setIsConfirm(true);
  };

  const handleCancelDelete = () => {
    setIsConfirm(false);
  };

  React.useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isEdit) {
        setIsEdit(false);
      }
    };

    document.addEventListener('keydown', handleEsc);

    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isEdit]);

  return (
    <div
      className={cn(
        'relative w-full h-fit flex flex-col rounded-[1.25rem] p-3 bg-neutral2-2 gap-3 [transition:background_.2s] hover:bg-neutral2-5',
        className
      )}
    >
      <div className="flex items-start gap-5">
        <Link
          href={`/profile/${localData.author.id}`}
          className="cursor-pointer"
        >
          <Avatar alt="avatar" src={localData.author.avatar || ''} size={44} />
        </Link>
        <div className="w-full flex flex-col gap-2">
          <div className="relative z-0 flex justify-items-auto items-center">
            <Link
              href={`/profile/${localData.author.id}`}
              className="cursor-pointer"
            >
              <Typography
                level="base2m"
                className="text-primary font-bold justify-self-start opacity-80 mr-4"
              >
                {localData.author?.firstName} {localData.author?.lastName}
              </Typography>
            </Link>
            <Typography
              level="captionr"
              className="text-tertiary justify-self-start grow opacity-45"
            >
              {relativeTime(new Date(localData.createdAt))}
            </Typography>

            {data.author.id === (userProfile as IUserProfile).id && (
              <MoreIcon onClick={handleMoreOptions} />
            )}
          </div>
          <Link href={`/posts/${'postId' in localData ? localData.postId : localData.id}`} className="cursor-pointer">
            <Typography level="body2r" className="text-secondary opacity-80">
              {localData.content}
            </Typography>
          </Link>

          {isPostType && (localData as IPost).image && (
            <Link href={`/posts/${localData.id}`}>
              <div className="grid grid-cols-2 gap-2">
                {Array.isArray((localData as IPost).image) &&
                (localData as IPost).image[0] ? (
                  <div className="col-span-2">
                    <Image
                      width={400}
                      height={400}
                      src={(localData as IPost).image[0] as string}
                      alt="post-image"
                      quality={100}
                      loading="lazy"
                      className="max-h-[600px] w-full rounded-[1.5rem] object-cover"
                    />
                  </div>
                ) : (
                  <></>
                )}
              </div>
            </Link>
          )}
        </div>
        {openMoreOptionsId === data.id && (
          <MoreOptions
            onEdit={() => setIsEdit(true)}
            onDelete={handleConfirmDelete}
          />
        )}
      </div>

      <div className="flex justify-end items-center md:justify-start md:pl-[48px]">
        <div className="relative">
          <ReactItem
            value={localData.likedCount}
            icon={
              <HeartIcon
                isActive={isPostType && (localData as IPost).hasLiked}
              />
            }
            onClick={isLikeLoading ? undefined : handleLikeClick}
            className={isLikeLoading ? 'pointer-events-none opacity-60' : ''}
          />
          {isLikeLoading && (
            <span className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
          )}
        </div>

        {isPostType ? (
          <ReactItem
            value={(localData as IPost).commentCount || 0}
            icon={<CommentIcon />}
          />
        ) : (
          <button onClick={handleReplyComment}>
            <CommentIcon />
          </button>
        )}

        {isPostType && (
          <div className="flex items-center md:grow justify-end gap-4">
            <button
              type="button"
              className={`size-[40px] flex justify-center items-center rounded-full hover:bg-neutral2-5 relative ${isBookmarkLoading ? 'pointer-events-none opacity-60' : ''}`}
              onClick={handleBookmarkClick}
              disabled={isBookmarkLoading}
            >
              <BookmarkIcon
                height={24}
                width={24}
                isActive={(localData as IPost).hasSaved}
              />
              {isBookmarkLoading && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
              )}
            </button>
          </div>
        )}
      </div>

      {isEdit && (
        <Portal>
          <UpdatePost
            postId={data.id}
            onUpdateSuccess={handleUpdatePost}
            onClose={() => setIsEdit(false)}
          />
        </Portal>
      )}

      <AlertDialog open={isConfirm} onOpenChange={handleCancelDelete}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete post</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>
            <Typography level="base2sm" className="text-tertiary">
              Are you sure you want to delete this {isPostType ? 'post' : 'comment'}? This action cannot be undone.
            </Typography>
          </AlertDialogDescription>

          <AlertDialogFooter>
            <Button
              onClick={handleCancelDelete}
              className="w-full sm:w-auto"
              child={
                <Typography level="base2sm" className="p-3 text-tertiary">
                  Cancel
                </Typography>
              }
            />

            <Button
              onClick={isPostType ? handleDeletePost : handleDeleteComment}
              className="w-full sm:w-auto"
              disabled={isDeleteLoading}
              child={
                <Typography level="base2sm" className="p-3 text-tertiary">
                  {isDeleteLoading ? 'Deleting...' : 'Confirm'}
                </Typography>
              }
            />
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
