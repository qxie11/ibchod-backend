import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RegisterDto } from './dto/register.dto';
import { PrismaClient } from '../../generated/prisma/client';
import { hash, verify } from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { Request, Response } from 'express';
import { isDev } from '@/utils/is-dev.util';
import { convertToMilliseconds } from '@/utils/convert-to-milliseconds.util';

@Injectable()
export class AuthService {
  private prisma = new PrismaClient();

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  private readonly jwtExpirationTime = this.configService.get(
    'JWT_ACCESS_TOKEN_TTL',
  );
  private readonly jwtRefreshTokenExpirationTime = this.configService.get(
    'JWT_REFRESH_TOKEN_TTL',
  );

  private readonly cookieDomain = this.configService.get('COOKIE_DOMAIN');

  async register(res: Response, dto: RegisterDto) {
    const { email, password } = dto;

    const isUserExists = await this.prisma.user.findUnique({
      where: { email },
    });

    if (isUserExists) {
      throw new BadRequestException('User already exists');
    }

    const user = await this.prisma.user.create({
      data: {
        email,
        password: await hash(password),
      },
    });

    return this.authenticate(res, user.id);
  }

  async login(res: Response, dto: LoginDto) {
    const { email, password } = dto;

    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        password: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await verify(user.password, password);

    if (!isPasswordValid) {
      throw new NotFoundException('Invalid password');
    }

    return this.authenticate(res, user.id);
  }

  async refreshToken(req: Request, res: Response) {
    const refreshToken = req.cookies['refreshToken'];

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const decoded = await this.jwtService.verifyAsync(refreshToken);

    const user = await this.prisma.user.findUnique({
      where: { id: decoded.sub },
      select: {
        id: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.authenticate(res, decoded.sub as string);
  }

  logout(res: Response) {
    res.clearCookie('refreshToken');

    return {
      message: 'Logged out successfully',
    };
  }

  private async authenticate(res: Response, userId: string) {
    const { accessToken, refreshToken } = await this.generateToken(userId);
    this.saveCookie(res, refreshToken);

    return {
      accessToken,
    };
  }

  private async generateToken(userId: string) {
    const payload = { sub: userId };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: this.jwtExpirationTime,
      }),
      this.jwtService.signAsync(payload, {
        expiresIn: this.jwtRefreshTokenExpirationTime,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  private saveCookie(res: Response, token: string) {
    res.cookie('refreshToken', token, {
      httpOnly: true,
      domain: this.cookieDomain,
      secure: !isDev(this.configService),
      maxAge: convertToMilliseconds(
        this.jwtRefreshTokenExpirationTime as string,
      ),
      sameSite: isDev(this.configService) ? 'none' : 'lax',
    });
  }
}
