import mongoose, { Schema, Document } from 'mongoose';

export interface IOutput extends Document {
  projectId: mongoose.Types.ObjectId;
  planId: mongoose.Types.ObjectId;
  researchId: mongoose.Types.ObjectId;
  content: string;
  sections: Array<{ title: string; content: string }>;
  wordCount: number;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

const outputSchema = new Schema<IOutput>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    planId: {
      type: Schema.Types.ObjectId,
      ref: 'Plan',
      required: true,
    },
    researchId: {
      type: Schema.Types.ObjectId,
      ref: 'Research',
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    sections: [
      {
        title: String,
        content: String,
      },
    ],
    wordCount: {
      type: Number,
      default: 0,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
);

export const OutputModel =
  mongoose.models.Output ||
  mongoose.model<IOutput>('Output', outputSchema);
