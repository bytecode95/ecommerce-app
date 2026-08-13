import { Request, Response } from 'express';
import { RegisterResponseDto, toUserDto } from '../domain/model/auth.dto';
import { AuthService } from '../service/auth.service';
import { RegisterInput } from '../validators/auth.validator';

export class AuthController {
    constructor(private readonly authService: AuthService) { }

    register = async (
        req: Request,
        res: Response
    ): Promise<void> => {
        const input = req.body as RegisterInput;

        const user = await this.authService.register(input);

        const response: RegisterResponseDto = {
            user: toUserDto(user),
            message:
                'Registration successful. Please verify your account with the code we sent you.',
        };

        res.status(201).json(response);
    };
}