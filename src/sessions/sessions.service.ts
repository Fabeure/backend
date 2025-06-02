import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Session } from './schemas/session.schema';

@Injectable()
export class SessionsService {
  constructor(
    @InjectModel(Session.name) private sessionModel: Model<Session>,
  ) {}

  async create(userId: string, content: string): Promise<Session> {
    const createdSession = new this.sessionModel({
      userId,
      content,
    });
    return createdSession.save();
  }

  async findAllByUserId(userId: string): Promise<Session[]> {
    return this.sessionModel.find({ userId }).exec();
  }
} 