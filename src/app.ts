import cookieParser from "cookie-parser";
import express, { Application, NextFunction, Request, Response } from "express";
import cors from "cors";
import config from "./config";
import { userRoutes } from "./modules/user/user.route";
import { authRoutes } from "./modules/auth/auth.routes";
import { postsRoutes } from "./modules/post/post.route";
import { commentsRoutes } from "./modules/comment/comment.route";
import { notFound } from "./middlewares/notFound";
import httpStatus from "http-status";
import { globalErrorHandler } from "./middlewares/globalErrorHandler";

const app: Application = express();

app.use(
  cors({
    origin: config.app_url,
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (req: Request, res: Response) => {
  res.send("Hello, World!");
});

// app.post();
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/posts", postsRoutes);
app.use("/api/comments", commentsRoutes);

// app.use((req: Request, res: Response) => {
//   res.status(404).json({
//     message: "Route not found",
//     path: req.originalUrl,
//     date: Date(),
//   });
// });

app.use(notFound);

// app.use((err: any, req: Request, res: Response, next: NextFunction) => {
//   console.log(err);
//   res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
//     success: false,
//     statusCode: httpStatus.INTERNAL_SERVER_ERROR,
//     message: err.message,
//     error: err.stack,
//   });
// });

app.use(globalErrorHandler);

export default app;
