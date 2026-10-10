import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    serviceType: { type: String, required: true, trim: true },
    notes: { type: String, default: '' },
    technician: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
  },
  { timestamps: true }
);

const equipmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    serial: { type: String, required: true, unique: true, trim: true },
    status: { type: String, enum: ['operational', 'attention', 'offline'], default: 'operational' },
    notes: { type: String, default: '' },
    serviceHistory: [serviceSchema],
  },
  { timestamps: true }
);

export const Equipment = mongoose.model('Equipment', equipmentSchema);
