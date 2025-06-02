import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class TrackableObjects extends Document {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  content: string;
}

export const TrackableObjectsSchema = SchemaFactory.createForClass(TrackableObjects); 