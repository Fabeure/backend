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
    const savedSession = await createdSession.save();
    
    // Extract scene name from the content
    const lines = content.split('\n');
    const metadataLines = lines.slice(0, 11);
    const metadataJson = metadataLines
      .map(line => line.replace('#SESSION', '').trim())
      .join('\n');
    const metadata = JSON.parse(metadataJson);
    const sceneName = metadata.SceneName;

    if (sceneName) {
      await this.updateSceneSession(userId, sceneName, content);
    }

    return savedSession;
  }

  async findAllByUserId(userId: string): Promise<Session[]> {
    return this.sessionModel.find({ userId }).exec();
  }

  private async updateSceneSession(userId: string, sceneName: string, newContent: string): Promise<void> {
    const sceneSessionName = `#SCENENAMESESSION`;
    
    // Find the scene session that matches both the scene name and the special session name
    const existingSceneSession = await this.sessionModel.findOne({
      userId,
      content: { 
        $regex: `"SessionName": "${sceneSessionName}".*"SceneName": "${sceneName}"`,
        $options: 's' // This allows the regex to match across multiple lines
      }
    });

    if (existingSceneSession) {
      // Extract data entries from both existing and new content
      const existingLines = existingSceneSession.content.split('\n');
      const newLines = newContent.split('\n');
      
      // Get metadata from existing session
      const metadataLines = existingLines.slice(0, 11);
      
      // Get data entries from both sessions
      const existingDataEntries = existingLines.slice(11).filter(line => line.trim() !== '');
      const newDataEntries = newLines.slice(11).filter(line => line.trim() !== '');
      
      // Combine all data entries
      const combinedDataEntries = [...existingDataEntries, ...newDataEntries];
      
      // Create new content with original metadata and combined data entries
      const updatedContent = [
        ...metadataLines,
        ...combinedDataEntries
      ].join('\n');

      existingSceneSession.content = updatedContent;
      await existingSceneSession.save();
    } else {
      // Create new scene session
      const lines = newContent.split('\n');
      const metadataLines = lines.slice(0, 11);
      const metadataJson = metadataLines
        .map(line => line.replace('#SESSION', '').trim())
        .join('\n');
      const metadata = JSON.parse(metadataJson);
      
      // Update metadata for scene session
      metadata.SessionName = sceneSessionName;
      const updatedMetadata = `#SESSION ${JSON.stringify(metadata, null, 2)}`;
      
      // Get data entries from the new session
      const dataEntries = lines.slice(11).filter(line => line.trim() !== '');
      
      // Create new content with updated metadata and data entries
      const combinedContent = [updatedMetadata, ...dataEntries].join('\n');

      const newSceneSession = new this.sessionModel({
        userId,
        content: combinedContent
      });
      await newSceneSession.save();
    }
  }
} 