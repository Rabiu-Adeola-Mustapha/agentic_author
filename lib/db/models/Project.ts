import mongoose, { Schema, Document } from 'mongoose';
import { ContentCategory, ProjectStatus, PipelineStage } from '@/types';

export interface IProject extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  category: ContentCategory;
  rawPrompt?: string;
  status: ProjectStatus;
  currentStage: PipelineStage;
  promptId?: mongoose.Types.ObjectId;
  planId?: mongoose.Types.ObjectId;
  researchId?: mongoose.Types.ObjectId;
  outputId?: mongoose.Types.ObjectId;
  evaluationId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  deleted?: boolean;
}

const projectSchema = new Schema<IProject>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['book', 'screenplay', 'thesis', 'journal', 'educational', 'article', 'social_media'],
      required: true,
    },
    rawPrompt: {
      type: String,
    },
    status: {
      type: String,
      enum: ['draft', 'running', 'completed', 'failed'],
      default: 'draft',
    },
    currentStage: {
      type: String,
      enum: ['idle', 'prompt', 'plan', 'research', 'writing', 'evaluation', 'done', 'failed'],
      default: 'idle',
    },
    promptId: Schema.Types.ObjectId,
    planId: Schema.Types.ObjectId,
    researchId: Schema.Types.ObjectId,
    outputId: Schema.Types.ObjectId,
    evaluationId: Schema.Types.ObjectId,
    deleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

projectSchema.index({ userId: 1, createdAt: -1 });

export const ProjectModel =
  mongoose.models.Project ||
  mongoose.model<IProject>('Project', projectSchema);
