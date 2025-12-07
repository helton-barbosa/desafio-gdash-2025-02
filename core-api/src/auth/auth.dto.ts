import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Formato de e-mail inválido' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres' })
  password: string;
}

export interface JwtPayload {
  email: string;
  sub: string;
  name: string;
}

export interface ValidatedUser {
  _id: string;
  email: string;
  name: string;
}
