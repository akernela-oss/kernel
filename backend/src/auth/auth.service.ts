import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { createHash, randomUUID } from 'crypto';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { ROLE_LABELS, ROLE_PAGES } from '../domain/constants';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService, PublicUser } from '../users/users.service';
import { JwtPayload } from './strategies/jwt.strategy';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface SessionResponse extends TokenPair {
  user: PublicUser & { roleLabel: string; allowedPages: string[] };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  private static hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private buildSession(user: User, tokens: TokenPair): SessionResponse {
    const role = user.role.toLowerCase();
    return {
      ...tokens,
      user: {
        ...UsersService.toPublic(user),
        roleLabel: ROLE_LABELS[role] ?? role,
        allowedPages: ROLE_PAGES[role] ?? [],
      },
    };
  }

  private async issueTokens(user: User): Promise<TokenPair> {
    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      role: user.role,
      name: user.name,
    };
    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.get<string>('jwt.accessSecret'),
      expiresIn: this.config.get<string>('jwt.accessTtl'),
    });
    const refreshToken = await this.jwt.signAsync(
      // `jti` guarantees a unique token even for rapid/concurrent logins by the
      // same user (JWT iat/exp are second-granularity and would otherwise clash).
      { sub: user.id, jti: randomUUID() },
      {
        secret: this.config.get<string>('jwt.refreshSecret'),
        expiresIn: this.config.get<string>('jwt.refreshTtl'),
      },
    );

    const decoded = this.jwt.decode(refreshToken) as { exp?: number } | null;
    const expiresAt = decoded?.exp
      ? new Date(decoded.exp * 1000)
      : new Date(Date.now() + 7 * 24 * 3600 * 1000);

    await this.prisma.refreshToken.create({
      data: { userId: user.id, tokenHash: AuthService.hashToken(refreshToken), expiresAt },
    });
    // Opportunistic cleanup of expired tokens for this user.
    await this.prisma.refreshToken.deleteMany({
      where: { userId: user.id, expiresAt: { lt: new Date() } },
    });

    return { accessToken, refreshToken };
  }

  async login(username: string, password: string): Promise<SessionResponse> {
    const user = await this.users.findByUsername(username);
    if (!user || !user.active) {
      throw new UnauthorizedException('نام کاربری یا رمز عبور اشتباه است.');
    }
    const ok = await this.users.verify(password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('نام کاربری یا رمز عبور اشتباه است.');
    }
    const tokens = await this.issueTokens(user);
    return this.buildSession(user, tokens);
  }

  async refresh(refreshToken: string): Promise<SessionResponse> {
    let payload: { sub: string };
    try {
      payload = await this.jwt.verifyAsync(refreshToken, {
        secret: this.config.get<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('نشست منقضی شده است. دوباره وارد شوید.');
    }

    const hash = AuthService.hashToken(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash: hash } });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('نشست نامعتبر است.');
    }

    const user = await this.users.findRawById(payload.sub);
    if (!user || !user.active) {
      throw new UnauthorizedException('کاربر غیرفعال است.');
    }

    // Rotate: revoke the used token, issue a fresh pair.
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });
    const tokens = await this.issueTokens(user);
    return this.buildSession(user, tokens);
  }

  async logout(refreshToken: string): Promise<{ success: true }> {
    const hash = AuthService.hashToken(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: hash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { success: true };
  }

  async me(authUser: AuthUser): Promise<SessionResponse['user']> {
    const user = await this.users.findRawById(authUser.id);
    if (!user) throw new UnauthorizedException();
    const role = user.role.toLowerCase();
    return {
      ...UsersService.toPublic(user),
      roleLabel: ROLE_LABELS[role] ?? role,
      allowedPages: ROLE_PAGES[role] ?? [],
    };
  }
}
