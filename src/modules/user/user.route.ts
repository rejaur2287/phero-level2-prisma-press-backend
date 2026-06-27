import { Router } from "express";
import { userController } from "./user.controller";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middlewares/auth";

const router = Router();

router.post("/register", userController.registerUser);

router.get(
  "/me",

  // (req: Request, res: Response, next: NextFunction) => {
  //   console.log(req.cookies);

  //   const { accessToken } = req.cookies;
  //   console.log("Access Token:", accessToken);

  //   const verifiedToken = jwtUtils.verifyToken(
  //     accessToken,
  //     config.jwt_access_secret,
  //   );

  //   if (!verifiedToken.success) {
  //     throw new Error(verifiedToken.error);
  //   }

  //   const { id, email, name, role } = verifiedToken.data as JwtPayload;

  //   // const requiredRoles = ["ADMIN", "USER", "AUTHOR"];
  //   const requiredRoles = [Role.ADMIN, Role.USER, Role.AUTHOR];

  //   if (!requiredRoles.includes(role)) {
  //     return res.status(403).json({
  //       success: false,
  //       statusCode: httpStatus.FORBIDDEN,
  //       message:
  //         "Forbidden: You do not have permission to access this resource",
  //     });
  //   }
  //   req.user = { id, email, name, role };
  //   next();
  // },

  auth(Role.ADMIN, Role.USER, Role.AUTHOR),
  userController.getMyProfile,
);

router.put(
  "/my-profile",
  auth(Role.ADMIN, Role.USER, Role.AUTHOR),
  userController.updateMyProfile,
);

export const userRoutes = router;
