import { prisma } from "../../lib/prisma";
import { ICreatePostPayload } from "./post.interface";

const createPostIntoDB = async (
  payload: ICreatePostPayload,
  userId: string,
) => {
  const result = await prisma.post.create({
    data: {
      ...payload,
      authorId: userId,
    },
  });
  return result;
};

const getAllPostsFromDB = async () => {
  const posts = await prisma.post.findMany({
    include: {
      author: {
        omit: {
          password: true,
        },
      },
      comments: true,
    },
  });
  return posts;
};

const getPostByIdFromDB = async () => {};
const getMyPostsFromDB = async () => {};
const getPostStatsFromDb = async () => {};
const updatePostInDB = async () => {};
const deletePostFromDB = async () => {};

export const postService = {
  createPostIntoDB,
  getAllPostsFromDB,
  getPostByIdFromDB,
  getMyPostsFromDB,
  getPostStatsFromDb,
  updatePostInDB,
  deletePostFromDB,
};
