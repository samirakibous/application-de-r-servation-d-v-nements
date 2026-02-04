import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }),
    UserModule,
     AuthModule,
  MongooseModule.forRoot(process.env.MONGODB_URI || '')],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
