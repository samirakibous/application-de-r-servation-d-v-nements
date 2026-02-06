import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

import { User } from 'src/user/entities/user.entity';
import { Role } from '../common/enums/role.enum';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { use } from 'passport';

const BCRYPT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<{
    message: string;
    accessToken: string;
    refreshToken: string;
    user: Partial<User>;
  }> {
    const existingUser = await this.userModel.findOne({ email: registerDto.email });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Premier utilisateur = ADMIN automatique
    const userCount = await this.userModel.countDocuments();
    let role: Role;
    if (userCount === 0) {
      role = Role.ADMIN;
    } else {
      role = registerDto.role || Role.PARTICIPANT;
      if (role === Role.ADMIN) {
        throw new ConflictException('Cannot register as admin');
      }
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, BCRYPT_ROUNDS);

    const user = new this.userModel({
      ...registerDto,
      password: hashedPassword,
      role,
    });

    await user.save();

    const tokens = await this.getTokens(user._id.toString(), user.email, user.role);
    await this.updateRefreshToken(user._id.toString(), tokens.refreshToken);

    return {
      message: 'Registration successful',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.userModel.findOne({ email: loginDto.email });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.getTokens(user._id.toString(), user.email, user.role);
    await this.updateRefreshToken(user._id.toString(), tokens.refreshToken);

    return {
      message: 'Login successful',
      accessToken: tokens.accessToken,
      user: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  async getTokens(userId: string, email: string, role: Role) {
    const payload = { sub: userId, email, role };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '59m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    return { accessToken, refreshToken };
  }

  async updateRefreshToken(userId: string, refreshToken: string) {
    const hashedToken = await bcrypt.hash(refreshToken, BCRYPT_ROUNDS);
    await this.userModel.findByIdAndUpdate(userId, { currentHashedRefreshToken: hashedToken });
  }
  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.userModel.findById(userId);
    if (!user || !user.currentHashedRefreshToken) {
      throw new UnauthorizedException('Access denied');
    }

    const isRefreshTokenValid = await bcrypt.compare(refreshToken, user.currentHashedRefreshToken);
    if (!isRefreshTokenValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokens = await this.getTokens(user._id.toString(), user.email, user.role);
    await this.updateRefreshToken(user._id.toString(), tokens.refreshToken);

    return tokens;
  }
}
