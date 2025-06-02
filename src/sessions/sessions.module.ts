import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SessionsController } from './sessions.controller';
import { TrackableObjectsController } from './trackable-objects.controller';
import { SessionsService } from './sessions.service';
import { Session, SessionSchema } from './schemas/session.schema';
import { TrackableObjects, TrackableObjectsSchema } from './schemas/trackable-object.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Session.name, schema: SessionSchema },
      { name: TrackableObjects.name, schema: TrackableObjectsSchema }
    ])
  ],
  controllers: [SessionsController, TrackableObjectsController],
  providers: [SessionsService],
})
export class SessionsModule {} 