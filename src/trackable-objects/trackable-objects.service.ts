import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TrackableObjects } from './schemas/trackable-object.schema';

@Injectable()
export class TrackableObjectsService {
  constructor(
    @InjectModel(TrackableObjects.name) private trackableObjectsModel: Model<TrackableObjects>,
  ) {}

  async create(userId: string, content: string): Promise<TrackableObjects> {
    const trackableObjects = new this.trackableObjectsModel({
      userId,
      content,
    });
    return trackableObjects.save();
  }

  async findAllByUserId(userId: string): Promise<TrackableObjects[]> {
    return this.trackableObjectsModel.find({ userId }).exec();
  }
} 