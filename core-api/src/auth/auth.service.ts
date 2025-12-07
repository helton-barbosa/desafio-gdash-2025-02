import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { JwtPayload, ValidatedUser } from './auth.dto'; // Importamos a nova interface

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  // MUDANÇA AQUI: Trocamos Promise<any> por Promise<ValidatedUser | null>
  async validateUser(
    email: string,
    pass: string,
  ): Promise<ValidatedUser | null> {
    const user = await this.usersService.findByEmail(email);

    if (user && (await bcrypt.compare(pass, user.password))) {
      // Em vez de delete, retornamos um objeto novo e limpo.
      // Isso garante a tipagem correta.
      return {
        _id: user._id.toString(),
        email: user.email,
        name: user.name,
      };
    }

    return null;
  }

  // Ajustamos o tipo de entrada aqui também
  login(user: ValidatedUser) {
    const payload: JwtPayload = {
      email: user.email,
      sub: user._id,
      name: user.name,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
