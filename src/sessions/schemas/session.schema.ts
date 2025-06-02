import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Session extends Document {
  @Prop({ required: true })
  content: string;
}

export const SessionSchema = SchemaFactory.createForClass(Session); 