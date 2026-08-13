import { User } from "../../entities/User.entity";
import { UserStatus, UserType } from "./user.types";

export interface UserDto {
    id: string;
    userType: UserType;
    name: string;
    email: string;
    phone: string | null;
    status: UserStatus;
    createdAt: string;
}

export function toUserDto(user: User): UserDto {
    return {
        id: user.id,
        userType: user.userType,
        name: user.name,
        email: user.email,
        phone: user.phone,
        status: user.status,
        createdAt: user.createdAt.toISOString(),
    };
}

export interface RegisterResponseDto {
    user: UserDto;
    message: string;
}