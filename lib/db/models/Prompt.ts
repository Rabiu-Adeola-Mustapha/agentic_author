import mongoose, { Schema, Document } from 'mongoose';

export interface IPrompt extends Document {
  projectId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  rawInput: string;
  structuredIntent: Record<string, string>;
  finalPrompt: string;
  versions: Array<{ prompt: string; editedAt: Date }>;
  createdAt: Date;
}

const promptSchema = new Schema<IPrompt>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rawInput: {
      type: String,
      required: true,
    },
    structuredIntent: {
      type: Schema.Types.Mixed,
      default: {},
    },
    finalPrompt: {
      type: String,
      required: true,
    },
    versions: [
      {
        prompt: String,
        editedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
);

export const PromptModel =
  mongoose.models.Prompt ||
  mongoose.model<IPrompt>('Prompt', promptSchema);
