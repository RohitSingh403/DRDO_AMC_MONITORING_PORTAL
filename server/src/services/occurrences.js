import { Task } from '../models/Task.js';
import { TaskTemplate } from '../models/TaskTemplate.js';
import { Equipment } from '../models/Equipment.js';
import { periodKeyFor, windowFor } from '../utils/periods.js';

export async function generateOccurrences({ frequency, assignedBy, personnel, now = new Date() }) {
  const frequencies = frequency === 'all' ? ['daily', 'weekly', 'monthly'] : [frequency];
  const people = [...personnel].sort((a, b) => a.name.localeCompare(b.name));
  if (!people.length) {
    const error = new Error('Add AMC personnel before generating the board');
    error.status = 400;
    throw error;
  }

  let created = 0;
  let skipped = 0;
  let cursor = 0;

  for (const freq of frequencies) {
    const templates = await TaskTemplate.find({ frequency: freq }).sort({ title: 1 });
    const periodKey = periodKeyFor(freq, now);
    const { scheduledFor, dueAt } = windowFor(freq, now);

    for (const template of templates) {
      const exists = await Task.exists({ template: template._id, periodKey });
      if (exists) {
        skipped += 1;
        continue;
      }
      const assignee = people[cursor % people.length];
      cursor += 1;
      const equipment = template.equipmentSerial
        ? await Equipment.findOne({ serial: template.equipmentSerial })
        : null;
      await Task.create({
        template: template._id,
        title: template.title,
        description: template.description,
        frequency: template.frequency,
        checklist: template.checklist.map((label) => ({ label, done: false, note: '' })),
        assignedTo: assignee._id,
        assignedBy,
        equipment: equipment?._id || null,
        scheduledFor,
        dueAt,
        periodKey,
        status: 'pending',
      });
      created += 1;
    }
  }

  return { created, skipped };
}
