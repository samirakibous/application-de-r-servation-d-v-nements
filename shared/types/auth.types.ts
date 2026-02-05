import  { Role }  from "../enums/role.enum";
export interface RegisterDto {
    email: string; 
    password: string;
    firstName: string;
    lastName: string;
    role?: Role;
}

export interface LoginDto {
    email: string;
    password: string;
}

export interface AuthResponse {
    message: string;
    accessToken: string;
    refreshToken?: string;
    user: {
        email: string;
        firstName: string;
        lastName: string;
        role: Role;
    };
}