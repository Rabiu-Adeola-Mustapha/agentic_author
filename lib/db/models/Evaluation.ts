import mongoose, { Schema, Document } from 'mongoose';

export interface IEvaluation extends Document {
  outputId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  score: number;
  alignmentScore: number;
  qualityScore: number;
  issues: string[];
  suggestions: string[];
  createdAt: Date;
}

const evaluationSchema = new Schema<IEvaluation>(
  {
    outputId: {
      type: Schema.Types.ObjectId,
      ref: 'Output',
      required: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    alignmentScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    qualityScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    issues: [String],
    suggestions: [String],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
);

export const EvaluationModel =
  mongoose.models.Evaluation ||
  mongoose.model<IEvaluation>('Evaluation', evaluationSchema);
