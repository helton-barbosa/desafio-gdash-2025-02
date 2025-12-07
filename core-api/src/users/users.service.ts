import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './users.schema';
import { CreateUserDto } from './users.dto';

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);

  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async onModuleInit() {
    const adminEmail = 'admin@example.com';
    const exists = await this.userModel.findOne({ email: adminEmail });

    if (!exists) {
      const hashedPassword = await bcrypt.hash('123456', 10);
      await this.userModel.create({
        name: 'Admin GDASH',
        email: adminEmail,
        password: hashedPassword,
      });
      this.logger.log('👤 Usuário Admin criado: admin@example.com / 123456');
    }
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email });
  }

  async create(user: CreateUserDto): Promise<User> {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    return this.userModel.create({ ...user, password: hashedPassword });
  }

  async findAll() {
    return this.userModel.find().select('-password');
  }
}
