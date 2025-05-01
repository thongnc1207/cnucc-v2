import { IPostRepository } from "@modules/post/interfaces";
import { Post, PostCondDTO, Type } from "@modules/post/model";
import { UpdatePostDTO } from "@modules/post/model/dto";
import prisma from "@shared/components/prisma";
import { Paginated, PagingDTO } from "@shared/model";

export class MysqlPostRepository implements IPostRepository {
  async get(id: string): Promise<Post | null> {
    const result = await prisma.posts.findFirst({ where: { id } });
    if (!result) return null;
    return {
      ...result,
      image: Array.isArray(result.image)
        ? result.image
        : result.image
        ? [result.image]
        : [],
      isFeatured: result.isFeatured ?? false,
      commentCount: result.commentCount ?? 0,
      likedCount: result.likedCount ?? 0,
      type: result.type as Type,
    } as Post;
  }

  async list(cond: PostCondDTO, paging: PagingDTO): Promise<Paginated<Post>> {
    const { str, userId, ...rest } = cond;
    let where = { ...rest };
    if (userId) where = { ...where, authorId: userId } as PostCondDTO;
    if (str) where = { ...where, content: { contains: str } } as PostCondDTO;

    const total = await prisma.posts.count({ where });
    const skip = (paging.page - 1) * paging.limit;
    const result = await prisma.posts.findMany({
      where,
      take: paging.limit,
      skip,
      orderBy: { id: 'desc' }
    });

    return {
      data: result.map((item) => ({
        ...item,
        image: Array.isArray(item.image)
          ? item.image
          : item.image
          ? [item.image]
          : [],
        isFeatured: item.isFeatured ?? false,
        commentCount: item.commentCount ?? 0,
        likedCount: item.likedCount ?? 0,
        type: item.type as Type,
      } as Post)),
      paging,
      total
    };
  }

  async insert(data: Post): Promise<boolean> {
    const postData = {
      ...data,
      image: Array.isArray(data.image)
        ? data.image
        : data.image
        ? [data.image]
        : [],
    };
    await prisma.posts.create({ data: postData });
    return true;
  }

  async update(id: string, dto: UpdatePostDTO): Promise<boolean> {
    const updateData = {
      ...dto,
      image: dto.image
        ? Array.isArray(dto.image)
          ? dto.image
          : [dto.image]
        : undefined,
    };
    await prisma.posts.update({ where: { id }, data: updateData });
    return true;
  }

  async delete(id: string): Promise<boolean> {
    await prisma.posts.delete({ where: { id } });
    return true;
  }

  async listByIds(ids: string[]): Promise<Post[]> {
    const result = await prisma.posts.findMany({ where: { id: { in: ids } } });
    return result.map((item) => ({
      ...item,
      image: Array.isArray(item.image)
        ? item.image
        : item.image
        ? [item.image]
        : [],
      isFeatured: item.isFeatured ?? false,
      commentCount: item.commentCount ?? 0,
      likedCount: item.likedCount ?? 0,
      type: item.type as Type,
    } as Post));
  }

  async increaseCount(id: string, field: string, step: number): Promise<boolean> {
    let retries = 3;
    while (retries > 0) {
      try {
        await prisma.posts.update({ 
          where: { id },
          data: { [field]: { increment: step } }
        });
        return true;
      } catch (error) {
        if (retries === 1) throw error;
        retries--;
        // Add small delay before retry
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    return false;
  }

  async decreaseCount(id: string, field: string, step: number): Promise<boolean> {
    let retries = 3;
    while (retries > 0) {
      try {
        await prisma.posts.update({
          where: { id },
          data: { [field]: { decrement: step } }
        });
        return true;
      } catch (error) {
        if (retries === 1) throw error;
        retries--;
        // Add small delay before retry
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    return false;
  }
}
