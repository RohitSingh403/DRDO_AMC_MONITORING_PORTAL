import mongoose from 'mongoose';

const templateSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    frequency: { type: String, enum: ['daily', 'weekly', 'monthly'], required: true },
    checklist: [{ type: String }],
    equipmentSerial: { type: String, default: null },
  },
  { timestamps: true }
);

export const TaskTemplate = mongoose.model('TaskTemplate', templateSchema);
