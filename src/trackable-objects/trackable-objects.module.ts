import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TrackableObjectsController } from './trackable-objects.controller';
import { TrackableObjectsService } from './trackable-objects.service';
import { TrackableObjects, TrackableObjectsSchema } from './schemas/trackable-object.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TrackableObjects.name, schema: TrackableObjectsSchema }
    ])
  ],
  controllers: [TrackableObjectsController],
  providers: [TrackableObjectsService],
  exports: [TrackableObjectsService]
})
export class TrackableObjectsModule {} 