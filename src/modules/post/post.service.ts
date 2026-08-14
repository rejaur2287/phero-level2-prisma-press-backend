import { prisma } from "../../lib/prisma";
import {
  ICreatePostPayload,
  IPostQuery,
  IUpdatePostPayload,
} from "./post.interface";
import { CommentStatus, PostStatus } from "../../../generated/prisma/enums";

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

const getAllPostsFromDB = async (query: IPostQuery) => {
  const limit = query.limit ? Number(query.limit) : 10;
  const page = query.page ? Number(query.page) : 1;
  const skip = (page - 1) * limit;

  const sortBy = query.sortBy ? query.sortBy : "createdAt";
  const sortOrder = query.sortOrder ? query.sortOrder : "desc";

  const posts = await prisma.post.findMany({
    // filtering / exact match without AND operator

    // where: {
    //   title: "My Third Post",
    //   content: "Ronaldo",
    // },

    // filtering / exact match with AND operator

    // where: {
    //   AND: [
    //     {
    //       title: "My Third Post",
    //     },
    //     {
    //       content: "Ronaldo",
    //     },
    //     {
    //       tags: {
    //         equals: ["typescript", "prisma", "express"],
    //       },
    //     },
    //   ],
    // },

    // searching / partial match

    // where: {
    //   title: {
    //     contains: "Ronaldo",
    //     mode: "insensitive",
    //   },
    //   // x -> not ideal for partial match
    //   content: {
    //     contains: "Ronaldo",
    //     mode: "insensitive",
    //   },
    // },

    // search / partial match with OR operator
    // where: {
    //   OR: [
    //     {
    //       title: {
    //         contains: "Ronaldo",
    //         mode: "insensitive",
    //       },
    //     },
    //     {
    //       content: {
    //         contains: "Ronaldo",
    //         mode: "insensitive",
    //       },
    //     },
    //   ],
    // },

    // Combining search(OR Operator) and filtering(AND operator)

    // where: {
    //   // filter and searching combined
    //   AND: [
    //     {
    //       // searching
    //       OR: [
    //         {
    //           title: {
    //             contains: "Ron",
    //             mode: "insensitive",
    //           },
    //         },
    //         {
    //           content: {
    //             contains: "Ron",
    //             mode: "insensitive",
    //           },
    //         },
    //       ],
    //     },
    //     // filtering
    //     {
    //       title: "Ronaldo Nazario",
    //     },
    //     {
    //       content: "Ronaldo",
    //     },
    //   ],
    // },

    // pagination with limit/take and skip
    // take: 2,
    // for first page skip is 0
    // skip: 1, // visiting second page
    // skip: 2, // visiting third page
    // skip: 2, // visiting fourth page
    // page = 4, limit / take = 1, skip = (page - 1) * limit => 1
    // page = 3, limit / take = 10, skip = (page - 1) * limit => (3-1)*10 = 20

    // sorting in ascending or descending order on specific field
    // orderBy: {
    //   createdAt: "desc",
    //   title: "asc",
    // },

    where: {
      AND: [
        query.searchTerm
          ? {
              OR: [
                {
                  title: {
                    contains: query.searchTerm,
                    mode: "insensitive",
                  },
                },
                {
                  content: {
                    contains: query.searchTerm,
                    mode: "insensitive",
                  },
                },
              ],
            }
          : {},

        // title filtering
        // {
        //   title: query.title,
        // },

        query.title ? { title: query.title } : {},

        // content filtering
        query.content ? { content: query.content } : {},
      ],
    },

    take: limit,
    skip: skip,

    orderBy: {
      // sortBy : sortOrder
      [sortBy]: sortOrder,
    },

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

const getPostByIdFromDB = async (postId: string) => {
  // await prisma.post.update({
  //   where: {
  //     id: postId,
  //   },
  //   data: {
  //     views: {
  //       increment: 1,
  //     },
  //   },
  // });

  // throw new Error("Fake Error");

  // const post = await prisma.post.findFirstOrThrow({
  //   where: {
  //     id: postId,
  //   },
  //   include: {
  //     author: {
  //       omit: {
  //         password: true,
  //       },
  //     },
  //     comments: {
  //       where: {
  //         status: CommentStatus.APPROVED,
  //       },
  //       orderBy: {
  //         createdAt: "desc",
  //       },
  //     },
  //     _count: {
  //       select: {
  //         comments: true,
  //       },
  //     },
  //   },
  // });
  // return post;

  const transactionResult = await prisma.$transaction(async (tx) => {
    prisma.post.update({
      where: {
        id: postId,
      },
      data: {
        views: {
          increment: 1,
        },
      },
    });

    // throw new Error("fake error");

    const post = await tx.post.findUniqueOrThrow({
      where: {
        id: postId,
      },

      include: {
        author: {
          omit: {
            password: true,
          },
        },

        comments: {
          where: {
            status: CommentStatus.APPROVED,
          },

          orderBy: {
            createdAt: "desc",
          },
        },

        _count: {
          select: {
            comments: true,
          },
        },
      },
    });
    return post;
  });

  return transactionResult;
};

const getMyPostsFromDB = async (authorId: string) => {
  const result = await prisma.post.findMany({
    where: {
      authorId,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      comments: true,
      author: {
        omit: {
          password: true,
        },
      },

      _count: {
        select: {
          comments: true,
        },
      },
    },
  });
  return result;
};

const getPostStatsFromDB = async () => {
  const transactionResult = await prisma.$transaction(async (tx) => {
    //   const totalPosts = await tx.post.count();
    //   const totalPublishedPosts = await tx.post.count({
    //     where: {
    //       status: PostStatus.PUBLISHED,
    //     },
    //   });
    //   const totalDraftPosts = await tx.post.count({
    //     where: {
    //       status: PostStatus.DRAFT,
    //     },
    //   });
    //   const totalArchivedPosts = await tx.post.count({
    //     where: {
    //       status: PostStatus.ARCHIVED,
    //     },
    //   });
    //   const totalComments = await tx.comment.count();
    //   const totalApprovedComments = await tx.comment.count({
    //     where: {
    //       status: CommentStatus.APPROVED,
    //     },
    //   });
    //   const totalRejectedComments = await tx.comment.count({
    //     where: {
    //       status: CommentStatus.REJECTED,
    //     },
    //   });
    //   //Not a good approach
    //   // const allPosts = await tx.post.findMany();
    //   // let totalPostViews = 0;
    //   // allPosts.forEach((post) => {
    //   //   totalPostViews = totalPostViews + post.views;
    //   // });
    //   //Good Approach
    //   const totalPostViewsAggregate = await tx.post.aggregate({
    //     _sum: {
    //       views: true,
    //     },
    //   });
    //   const totalPostViews = totalPostViewsAggregate._sum.views;
    //   return {
    //     totalPosts,
    //     totalPublishedPosts,
    //     totalDraftPosts,
    //     totalArchivedPosts,
    //     totalComments,
    //     totalApprovedComments,
    //     totalRejectedComments,
    //     totalPostViews,
    //   };

    const [
      totalPosts,
      totalPublishedPosts,
      totalDraftPosts,
      totalArchivedPosts,
      totalComments,
      totalApprovedComments,
      totalRejectedComments,
      totalPostViewsAggregate,
    ] = await Promise.all([
      prisma.post.count(),
      prisma.post.count({
        where: {
          status: PostStatus.PUBLISHED,
        },
      }),
      prisma.post.count({
        where: {
          status: PostStatus.DRAFT,
        },
      }),
      prisma.post.count({
        where: {
          status: PostStatus.ARCHIVED,
        },
      }),
      prisma.comment.count(),
      prisma.comment.count({
        where: {
          status: CommentStatus.APPROVED,
        },
      }),
      prisma.comment.count({
        where: {
          status: CommentStatus.REJECTED,
        },
      }),
      prisma.post.aggregate({
        _sum: {
          views: true,
        },
      }),
    ]);
    return {
      totalPosts,
      totalPublishedPosts,
      totalDraftPosts,
      totalArchivedPosts,
      totalComments,
      totalApprovedComments,
      totalRejectedComments,
      totalPostViews: totalPostViewsAggregate._sum.views,
    };
  });
  return transactionResult;
};

const updatePostInDB = async (
  postId: string,
  payload: IUpdatePostPayload,
  authorId: string,
  isAdmin: boolean,
) => {
  const post = await prisma.post.findUniqueOrThrow({
    where: {
      id: postId,
    },
  });

  if (!isAdmin && post.authorId !== authorId) {
    throw new Error("You are not the owner of this post!");
  }

  const result = await prisma.post.update({
    where: {
      id: postId,
    },
    data: payload,
    include: {
      comments: true,
      author: {
        omit: {
          password: true,
        },
      },

      _count: {
        select: {
          comments: true,
        },
      },
    },
  });
  return result;
};

const deletePostFromDB = async (
  postId: string,
  authorId: string,
  isAdmin: boolean,
) => {
  const post = await prisma.post.findUniqueOrThrow({
    where: {
      id: postId,
    },
  });

  if (!isAdmin && post.authorId !== authorId) {
    throw new Error("You are not the owner of this post!");
  }

  await prisma.post.delete({
    where: {
      id: postId,
    },
  });
};

export const postService = {
  createPostIntoDB,
  getAllPostsFromDB,
  getPostByIdFromDB,
  getMyPostsFromDB,
  getPostStatsFromDB,
  updatePostInDB,
  deletePostFromDB,
};
