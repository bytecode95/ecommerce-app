import { Router } from "express";
import { AuthController } from "../controller/auth.controller";
import { Routes } from "../../../application/routes.v1";
import { AuthService } from "../service/auth.service";
import { registerSchema } from "../validators/auth.validator";
import { validate } from "../../../application/validators/validate";
import { asyncHandler } from "../../../application/middleware/asyncHandler";

const authService = new AuthService();
const authController = new AuthController(authService);

export const authRouter = Router();


authRouter.post(Routes.auth.signIn, validate({ body: registerSchema }), asyncHandler(authController.register));