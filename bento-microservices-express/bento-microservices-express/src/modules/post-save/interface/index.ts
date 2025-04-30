import { Paginated, PagingDTO } from "@shared/model";
import { ActionDTO, PostSave } from "../model";
import { Topic } from "../model/topic";

export interface IPostSaveUseCase {
  save(dto: ActionDTO): Promise<boolean>;
  unsave(dto: ActionDTO): Promise<boolean>;
  unsaveAll(postId: string): Promise<boolean>; // Add this
}

export interface IPostSaveRepository {
  get(data: ActionDTO): Promise<PostSave | null>;
  insert(data: PostSave): Promise<boolean>;
  delete(data: ActionDTO): Promise<boolean>;
  deleteByPostId(postId: string): Promise<boolean>;  // Add this
  list(userId: string, paging: PagingDTO): Promise<Paginated<PostSave>>;
  listPostIdsSaved(userId: string, postIds: string[]): Promise<string[]>;
}

export interface ITopicQueryRPC {
  findByIds(ids: string[]): Promise<Array<Topic>>;
}

