import { Paginated, PagingDTO } from "@shared/model";
import { ActionDTO, PostLike } from "../model";

export interface IPostLikeUseCase {
  like(data: ActionDTO): Promise<boolean>;
  unlike(data: ActionDTO): Promise<boolean>;
  unlikeAll(postId: string): Promise<boolean>;
}

export interface IPostLikeRepository {
  get(data: ActionDTO): Promise<PostLike | null>;
  insert(data: PostLike): Promise<boolean>;
  delete(data: ActionDTO): Promise<boolean>;
  deleteAll(postId: string): Promise<boolean>;
  list(postId: string, paging: PagingDTO): Promise<Paginated<PostLike>>;
  listPostIdsLiked(userId: string, postIds: string[]): Promise<Array<string>>;
}

export interface IPostQueryRepository {
  existed(postId: string): Promise<boolean>;
}

