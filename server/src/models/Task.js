import mongoose from 'mongoose';

const checklistSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    done: { type: Boolean, default: false },
    note: { type: String, default: '' },
  },
  { _id: false }
);

const attachmentSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    uploadedAt: { type: Date, default: Date.now },
  }
);

const taskSchema = new mongoose.Schema(
  {
    template: { type: mongoose.Schema.Types.ObjectId, ref: 'TaskTemplate', default: null },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    frequency: { type: String, enum: ['daily', 'weekly', 'monthly'], required: true },
    checklist: [checklistSchema],
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    equipment: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipment', default: null },
    scheduledFor: { type: Date, required: true },
    dueAt: { type: Date, required: true },
    periodKey: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed'],
      default: 'pending',
    },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    completionRemark: { type: String, default: '' },
    issueRemark: { type: String, default: '' },
    attachments: [attachmentSchema],
  },
  { timestamps: true }
);

taskSchema.index(
  { template: 1, periodKey: 1 },
  { unique: true, partialFilterExpression: { template: { $type: 'objectId' } } }
);
taskSchema.index({ assignedTo: 1, dueAt: 1 });
taskSchema.index({ frequency: 1, dueAt: 1 });

export const Task = mongoose.model('Task', taskSchema);
