import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Session } from './schemas/session.schema';
import { use } from 'passport';

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

    // Get all data entries
    const dataEntries = lines.slice(11).filter(line => line.trim() !== '');
    if (dataEntries.length > 0) {
      // Update scene session if there's a scene name
      if (sceneName) {
        await this.updateSceneSession(userId, sceneName, content);
      }

      // Get unique stimulus types and emotion labels from all entries
      const stimulusTypes = new Set<number>();
      const emotionLabels = new Set<number>();
      const featureNames = new Set<string>();
      
      dataEntries.forEach(entry => {
        try {
          const parsedEntry = JSON.parse(entry);
          if (parsedEntry.StimulusType !== undefined) {
            stimulusTypes.add(parsedEntry.StimulusType);
          }
          if (parsedEntry.Emotion?.Label !== undefined) {
            emotionLabels.add(parsedEntry.Emotion.Label);
          }
          if (parsedEntry.FeatureName !== undefined) {
            featureNames.add(parsedEntry.FeatureName);
          }
        } catch (e) {
          console.error('Error parsing data entry:', e);
        }
      });
      
      // Update stimulus type sessions for each unique stimulus type
      for (const stimulusType of stimulusTypes) {
        await this.updateStimulusTypeSession(userId, stimulusType, content);
      }

      // Update emotion label sessions for each unique emotion label
      for (const emotionLabel of emotionLabels) {
        await this.updateEmotionLabelSession(userId, emotionLabel, content);
      }

      // Update feature name sessions for each unique feature name
      for (const featureName of featureNames) {
        await this.updateFeatureNameSession(userId, featureName, content);
      }
    }

    return savedSession;
  }

  async findAllByUserId(userId: string): Promise<Session[]> {
    console.log('Searching for userId:', userId); // Debug log
    try {
      const sessions = await this.sessionModel.find({ userId }).exec();
      console.log('Found sessions:', sessions); // Debug log
      return sessions;
    } catch (error) {
      console.error('Error finding sessions:', error);
      throw error;
    }
  }

  private async updateSceneSession(userId: string, sceneName: string, newContent: string): Promise<void> {
    const sceneSessionName = `#SCENENAMESESSION`;
    
    // Find the scene session that matches scene name and special session name
    const existingSceneSession = await this.sessionModel.findOne({
      userId,
      content: { 
        $regex: `^#SESSION\\s*{[\\s\\S]*?"SessionName":\\s*"${sceneSessionName}"[\\s\\S]*?"SceneName":\\s*"${sceneName}"`,
        $options: 'm'
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

  private async updateStimulusTypeSession(userId: string, stimulusType: number, newContent: string): Promise<void> {
    const stimulusSessionName = `#STIMULUSTYPESESSION`;
    
    // Find the stimulus type session that matches stimulus type and special session name
    const existingStimulusSession = await this.sessionModel.findOne({
      userId,
      content: { 
        $regex: `"SessionName": "${stimulusSessionName}".*"StimulusType":${stimulusType}`,
        $options: 's'
      }
    });

    if (existingStimulusSession) {
      // Extract data entries from both existing and new content
      const existingLines = existingStimulusSession.content.split('\n');
      const newLines = newContent.split('\n');
      
      // Get metadata from existing session
      const metadataLines = existingLines.slice(0, 11);
      
      // Get data entries from both sessions
      const existingDataEntries = existingLines.slice(11).filter(line => line.trim() !== '');
      const newDataEntries = newLines.slice(11)
        .filter(line => line.trim() !== '')
        .filter(line => {
          try {
            const entry = JSON.parse(line);
            return entry.StimulusType === stimulusType;
          } catch (e) {
            return false;
          }
        });
      
      // Combine all data entries
      const combinedDataEntries = [...existingDataEntries, ...newDataEntries];
      
      // Create new content with original metadata and combined data entries
      const updatedContent = [
        ...metadataLines,
        ...combinedDataEntries
      ].join('\n');

      existingStimulusSession.content = updatedContent;
      await existingStimulusSession.save();
    } else {
      // Create new stimulus type session
      const lines = newContent.split('\n');
      const metadataLines = lines.slice(0, 11);
      const metadataJson = metadataLines
        .map(line => line.replace('#SESSION', '').trim())
        .join('\n');
      const metadata = JSON.parse(metadataJson);
      
      // Update metadata for stimulus type session
      metadata.SessionName = stimulusSessionName;
      const updatedMetadata = `#SESSION ${JSON.stringify(metadata, null, 2)}`;
      
      // Get data entries from the new session that match this stimulus type
      const dataEntries = lines.slice(11)
        .filter(line => line.trim() !== '')
        .filter(line => {
          try {
            const entry = JSON.parse(line);
            return entry.StimulusType === stimulusType;
          } catch (e) {
            return false;
          }
        });
      
      // Create new content with updated metadata and filtered data entries
      const combinedContent = [updatedMetadata, ...dataEntries].join('\n');

      const newStimulusSession = new this.sessionModel({
        userId,
        content: combinedContent
      });
      await newStimulusSession.save();
    }
  }

  private async updateEmotionLabelSession(userId: string, emotionLabel: number, newContent: string): Promise<void> {
    const emotionSessionName = `#EMOTIONLABELSESSION`;
    
    // Find the emotion label session that matches emotion label and special session name
    const existingEmotionSession = await this.sessionModel.findOne({
      userId,
      content: { 
        $regex: `"SessionName":\\s*"#EMOTIONLABELSESSION".*"Emotion":\\s*\\{[^}]*"Label":\\s*${emotionLabel}`,
        $options: 's'
      }
    });

    if (existingEmotionSession) {
      // Extract data entries from both existing and new content
      const existingLines = existingEmotionSession.content.split('\n');
      const newLines = newContent.split('\n');
      
      // Get metadata from existing session
      const metadataLines = existingLines.slice(0, 11);
      
      // Get data entries from both sessions
      const existingDataEntries = existingLines.slice(11).filter(line => line.trim() !== '');
      const newDataEntries = newLines.slice(11)
        .filter(line => line.trim() !== '')
        .filter(line => {
          try {
            const entry = JSON.parse(line);
            return entry.Emotion?.Label === emotionLabel;
          } catch (e) {
            return false;
          }
        });
      
      // Combine all data entries
      const combinedDataEntries = [...existingDataEntries, ...newDataEntries];
      
      // Create new content with original metadata and combined data entries
      const updatedContent = [
        ...metadataLines,
        ...combinedDataEntries
      ].join('\n');

      existingEmotionSession.content = updatedContent;
      await existingEmotionSession.save();
    } else {
      // Create new emotion label session
      const lines = newContent.split('\n');
      const metadataLines = lines.slice(0, 11);
      const metadataJson = metadataLines
        .map(line => line.replace('#SESSION', '').trim())
        .join('\n');
      const metadata = JSON.parse(metadataJson);
      
      // Update metadata for emotion label session
      metadata.SessionName = emotionSessionName;
      const updatedMetadata = `#SESSION ${JSON.stringify(metadata, null, 2)}`;
      
      // Get data entries from the new session that match this emotion label
      const dataEntries = lines.slice(11)
        .filter(line => line.trim() !== '')
        .filter(line => {
          try {
            const entry = JSON.parse(line);
            return entry.Emotion?.Label === emotionLabel;
          } catch (e) {
            return false;
          }
        });
      
      // Create new content with updated metadata and filtered data entries
      const combinedContent = [updatedMetadata, ...dataEntries].join('\n');

      const newEmotionSession = new this.sessionModel({
        userId,
        content: combinedContent
      });
      await newEmotionSession.save();
    }
  }

  private async updateFeatureNameSession(userId: string, featureName: string, newContent: string): Promise<void> {
    const featureSessionName = `#FEATURENAMESESSION`;
    
    // Find the feature name session that matches feature name and special session name
    const existingFeatureSession = await this.sessionModel.findOne({
      userId,
      content: { 
        $regex: `"SessionName": "${featureSessionName}".*"FeatureName":"${featureName}"`,
        $options: 's'
      }
    });

    if (existingFeatureSession) {
      // Extract data entries from both existing and new content
      const existingLines = existingFeatureSession.content.split('\n');
      const newLines = newContent.split('\n');
      
      // Get metadata from existing session
      const metadataLines = existingLines.slice(0, 11);
      
      // Get data entries from both sessions
      const existingDataEntries = existingLines.slice(11).filter(line => line.trim() !== '');
      const newDataEntries = newLines.slice(11)
        .filter(line => line.trim() !== '')
        .filter(line => {
          try {
            const entry = JSON.parse(line);
            return entry.FeatureName === featureName;
          } catch (e) {
            return false;
          }
        });
      
      // Combine all data entries
      const combinedDataEntries = [...existingDataEntries, ...newDataEntries];
      
      // Create new content with original metadata and combined data entries
      const updatedContent = [
        ...metadataLines,
        ...combinedDataEntries
      ].join('\n');

      existingFeatureSession.content = updatedContent;
      await existingFeatureSession.save();
    } else {
      // Create new feature name session
      const lines = newContent.split('\n');
      const metadataLines = lines.slice(0, 11);
      const metadataJson = metadataLines
        .map(line => line.replace('#SESSION', '').trim())
        .join('\n');
      const metadata = JSON.parse(metadataJson);
      
      // Update metadata for feature name session
      metadata.SessionName = featureSessionName;
      const updatedMetadata = `#SESSION ${JSON.stringify(metadata, null, 2)}`;
      
      // Get data entries from the new session that match this feature name
      const dataEntries = lines.slice(11)
        .filter(line => line.trim() !== '')
        .filter(line => {
          try {
            const entry = JSON.parse(line);
            return entry.FeatureName === featureName;
          } catch (e) {
            return false;
          }
        });
      
      // Create new content with updated metadata and filtered data entries
      const combinedContent = [updatedMetadata, ...dataEntries].join('\n');

      const newFeatureSession = new this.sessionModel({
        userId,
        content: combinedContent
      });
      await newFeatureSession.save();
    }
  }
} 