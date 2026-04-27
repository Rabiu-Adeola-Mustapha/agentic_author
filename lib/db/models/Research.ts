import mongoose, { Schema, Document } from 'mongoose';

export interface IResearch extends Document {
  projectId: mongoose.Types.ObjectId;
  planId: mongoose.Types.ObjectId;
  sources: Array<{ title: string; url: string; snippet: string }>;
  keyInsights: string[];
  createdAt: Date;
}

const researchSchema = new Schema<IResearch>(
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
    sources: [
      {
        title: String,
        url: String,
        snippet: String,
      },
    ],
    keyInsights: [String],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
);

export const ResearchModel =
  mongoose.models.Research ||
  mongoose.model<IResearch>('Research', researchSchema);
