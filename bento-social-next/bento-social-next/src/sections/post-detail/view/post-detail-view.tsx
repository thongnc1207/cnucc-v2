'use client';

import React from 'react';

import { ICommment } from '@/interfaces/comment';
import { IPost } from '@/interfaces/post';

import { getCommennts } from '@/apis/comment';
import { getPostDetail } from '@/apis/post';
import { usePost } from '@/context/post-context';

import { ComposerInput } from '@/components/new-post';
import { PostDetail } from '@/components/post-detail';

import eventBus from '@/utils/event-emitter';
import CommentList from '../comment-list';

import Header from '../header';

import styles from '@/styles/post-detail.module.css';

//-------------------------------------------------------------------------

export default function PostDetailView({ id }: { id: string }) {
  const { posts } = usePost();
  const post = posts.find((post) => post.id === id);

  const [data, setData] = React.useState<IPost | null>(null);
  const [comments, setComments] = React.useState<ICommment[]>([]);
  const [isViewFull, setIsViewFull] = React.useState(false);
  const [isCreated, setIsCreated] = React.useState(false);
  const [isDeleted, setIsDeleted] = React.useState<boolean>(false);
  const [parentComment, setParentComment] = React.useState<{
    id: string;
    fullname: string;
  }>({ id: '', fullname: '' });
  const [openMoreOptionsId, setOpenMoreOptionsId] = React.useState<
    string | null
  >(null);

  const handleViewFullPost = () => {
    const newIsViewFull = !isViewFull;
    setIsViewFull(newIsViewFull);
  };

  React.useEffect(() => {
    // Hide sidebar when component mounts
    eventBus.emit('toggleSidebarRight', true);

    // Show sidebar when component unmounts
    return () => {
      eventBus.emit('toggleSidebarRight', false);
    };
  }, []);

  React.useEffect(() => {
    getPostDetail(id)
      .then((response) => {
        setData(response.data);
        return response.data;
      })
      .then((res) => {
        getCommennts(res.id).then((response) => {
          const cmts = response.data.reverse().map((comment) => {
            return {
              ...comment,
              author: comment.user,
              children:
                comment.children.length > 0
                  ? comment.children.map((child) => {
                      return {
                        ...child,
                        author: child.user,
                      };
                    })
                  : [],
            };
          });

          setComments(cmts);
        });
      })
      .catch((error) => {
        console.error('Error fetching post detail:', error);
      });
  }, [id, isCreated, isDeleted]);

  return (
    <>
      {post && (
        <section className="relative min-h-screen max-h-fit bg-surface p-3 transition-all duration-[0.5s] no-scrollbar">
          <Header onViewFullPost={handleViewFullPost} />

          <div
            className={`${isViewFull ? `${styles.viewFull}` : ''} w-full h-[calc(100svh-155px)] overflow-y-scroll no-scrollbar [mask-image:linear-gradient(180deg,#000_85%,transparent)]`}
          >
            <PostDetail
              data={(data as IPost) ?? post}
              onDeleteSuccess={setIsDeleted}
              openMoreOptionsId={openMoreOptionsId}
              setOpenMoreOptionsId={setOpenMoreOptionsId}
              className="bg-neutral2-5"
            />

            <div className="max-w-md w-full h-fit relative">
              {isViewFull && (
                <ComposerInput
                  className={`bg-neutral3-70 relative top-0 right-0`}
                  usedBy="reply"
                  postId={data?.id}
                  onCreated={setIsCreated}
                  parentComment={parentComment}
                />
              )}
              <CommentList
                className={` ${isViewFull ? '[mask-image:linear-gradient(0deg,#000_90%,transparent)]' : ''}`}
                comments={comments}
                setParentComment={setParentComment}
                onDeleteSuccess={setIsDeleted}
              />
            </div>
          </div>
          {!isViewFull && (
            <ComposerInput
              className="bg-neutral3-70 relative bottom-0"
              usedBy="reply"
              postId={data?.id}
              onCreated={setIsCreated}
              parentComment={parentComment}
            />
          )}
        </section>
      )}
    </>
  );
}
