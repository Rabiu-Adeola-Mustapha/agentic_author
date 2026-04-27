import mongoose, { Schema, Document } from 'mongoose';

export interface IPlan extends Document {
  projectId: mongoose.Types.ObjectId;
  promptId: mongoose.Types.ObjectId;
  contentType: string;
  structure: string[];
  formattingRules: Record<string, string>;
  contentStrategy: string;
  createdAt: Date;
}

const planSchema = new Schema<IPlan>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    promptId: {
      type: Schema.Types.ObjectId,
      ref: 'Prompt',
      required: true,
    },
    contentType: {
      type: String,
      required: true,
    },
    structure: [String],
    formattingRules: {
      type: Schema.Types.Mixed,
      default: {},
    },
    contentStrategy: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
);

export const PlanModel =
  mongoose.models.Plan ||
  mongoose.model<IPlan>('Plan', planSchema);
