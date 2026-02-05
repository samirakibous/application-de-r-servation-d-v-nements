import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  JsonWebTokenError,
  TokenExpiredError,
  NotBeforeError,
} from 'jsonwebtoken';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    // Check if Authorization header exists and is properly formatted
    if (!authHeader) {
      throw new UnauthorizedException(
        'Access token is required. Please log in to access this resource.',
      );
    }

    if (!authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Invalid authorization header format. Use "Bearer <token>" format.',
      );
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix
    if (!token || token.trim() === '') {
      throw new UnauthorizedException(
        'Access token is required. Please log in to access this resource.',
      );
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      if (info instanceof TokenExpiredError) {
        throw new UnauthorizedException(
          'Access token has expired. Please log in again.',
        );
      } else if (info instanceof NotBeforeError) {
        throw new UnauthorizedException(
          'Access token is not yet valid. Please wait and try again.',
        );
      } else if (info instanceof JsonWebTokenError) {
        // Handle specific JWT errors
        if (info.message.includes('invalid signature')) {
          throw new UnauthorizedException(
            'Access token has an invalid signature. Please log in again.',
          );
        } else if (
          info.message.includes('malformed') ||
          info.message.includes('invalid token')
        ) {
          throw new UnauthorizedException(
            'Access token is malformed. Please provide a valid token.',
          );
        } else if (info.message.includes('jwt audience invalid')) {
          throw new UnauthorizedException(
            'Access token has invalid audience. Please log in again.',
          );
        } else if (info.message.includes('jwt issuer invalid')) {
          throw new UnauthorizedException(
            'Access token has invalid issuer. Please log in again.',
          );
        } else {
          throw new UnauthorizedException(
            'Invalid access token. Please provide a valid token.',
          );
        }
      } else if (err) {
        throw err;
      } else {
        throw new UnauthorizedException(
          'Access token is required. Please log in to access this resource.',
        );
      }
    }
    return user;
  }
}
