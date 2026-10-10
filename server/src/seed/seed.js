import { User } from '../models/User.js';
import { TaskTemplate } from '../models/TaskTemplate.js';
import { Task } from '../models/Task.js';
import { Equipment } from '../models/Equipment.js';
import { Incident } from '../models/Incident.js';
import { catalog } from '../utils/catalog.js';
import { addDays, addMonths, periodKeyFor, windowFor } from '../utils/periods.js';

const remarks = {
  'av-check': 'Displays and the ceiling mic checked. Signal is clean.',
  'os-update': 'Updates installed on the admin endpoints. Activation is still valid.',
  'office-activation': 'Microsoft Office activation confirmed on the shared PCs.',
  'hardware-status': 'CPU, monitors, and keyboards checked. One display cable reseated.',
  'network-connectivity': 'CORONA, CIAG, DMZ, and NKN all answered.',
  'cameras-recordings': 'Live view and last night’s recording spot-checked.',
  'ups-check': 'UPS on mains. Battery charge normal, no alarm.',
  'ac-status': 'Server-room AC holding setpoint. No water alarm.',
  'biometric-check': 'Morning and evening reads tested with a staff card.',
  'surveillance-check': 'Surveillance workstation and recorder clocks match.',
  'vc-setup': 'VC room placed a test call. Audio and video both ways.',
  'printers-scanners': 'Test page printed. Scanner path is clear.',
  'respond-complaints': 'No complaints left open from the previous shift.',
  'vc-rooms': 'All points, display, PDF reader, VLC, and sound checked.',
  'cable-inspection': 'Fibre and power leads in the rack dressed and labelled.',
  'network-switches': 'Core and access switches up. No error lights.',
  'sr-hdd': 'File-server volumes mounted. SMART status healthy.',
  'server-workings': 'Application and file servers responding. Event log is quiet.',
  'cleaning': 'Server room and endpoint desks cleaned. Intakes clear.',
  'avasyam': 'AVASYAM scan completed. No new findings.',
  'unauthorized-devices': 'No unknown devices on the access switches.',
  'firewall-check': 'Perimeter rules reviewed against the change log.',
  'backup-restore': 'Nightly backup succeeded. Sample restore opened.',
};

const equipmentSeed = [
  { name: 'VC Room A', category: 'AV', location: 'VC Room A', serial: 'VC-A-01', status: 'operational', notes: 'Primary video-conferencing room.' },
  { name: 'Endpoint fleet', category: 'Endpoint', location: 'Offices', serial: 'END-01', status: 'operational', notes: 'Shared and admin PCs covered by the daily checks.' },
  { name: 'Core switch', category: 'Network', location: 'Server room', serial: 'SW-CORE-01', status: 'attention', notes: 'Feeds CORONA, CIAG, DMZ, and NKN.' },
  { name: 'Corridor cameras', category: 'Security', location: 'Corridor and gate', serial: 'CAM-01', status: 'attention', notes: 'One camera has dropped its feed before.' },
  { name: 'Server-room UPS', category: 'Power', location: 'Server room', serial: 'UPS-SR-01', status: 'operational', notes: '' },
  { name: 'Precision AC', category: 'Cooling', location: 'Server room', serial: 'AC-SR-01', status: 'operational', notes: '' },
  { name: 'Biometric reader', category: 'Security', location: 'Main entry', serial: 'BIO-01', status: 'operational', notes: 'Checked morning and evening.' },
  { name: 'Network recorder', category: 'Security', location: 'Server room', serial: 'NVR-01', status: 'operational', notes: '' },
  { name: 'Floor printer', category: 'Endpoint', location: 'Admin bay', serial: 'PRN-01', status: 'attention', notes: '' },
  { name: 'Application server', category: 'Server', location: 'Server room', serial: 'SRV-APP-01', status: 'operational', notes: '' },
  { name: 'File server', category: 'Storage', location: 'Server room', serial: 'SRV-FILE-01', status: 'operational', notes: 'Holds the backup volumes.' },
  { name: 'Perimeter firewall', category: 'Network', location: 'Server room', serial: 'FW-01', status: 'operational', notes: '' },
];

function hoursFrom(base, hours) {
  return new Date(base.getTime() + hours * 60 * 60 * 1000);
}

function checksFor(template, mode) {
  return template.checklist.map((label, index) => ({
    label,
    done: mode === 'all' || (mode === 'half' && index < Math.ceil(template.checklist.length / 2)),
    note: '',
  }));
}

function buildTask({ template, equipment, personnel, admin, when, status, dueAt, startedAt, completedAt, completionRemark, issueRemark, checks }) {
  const window = windowFor(template.frequency, when);
  return {
    template: template._id,
    title: template.title,
    description: template.description,
    frequency: template.frequency,
    checklist: checksFor(template, checks),
    assignedTo: personnel._id,
    assignedBy: admin._id,
    equipment: equipment?._id || null,
    scheduledFor: window.scheduledFor,
    dueAt: dueAt || window.dueAt,
    periodKey: periodKeyFor(template.frequency, when),
    status,
    startedAt: startedAt || null,
    completedAt: completedAt || null,
    completionRemark: completionRemark || '',
    issueRemark: issueRemark || '',
  };
}

export async function seed({ reset = false } = {}) {
  const ready = (await User.countDocuments()) > 0 && (await Task.countDocuments()) > 0;
  if (!reset && ready) return { skipped: true };

  await Promise.all([
    User.deleteMany({}),
    TaskTemplate.deleteMany({}),
    Task.deleteMany({}),
    Equipment.deleteMany({}),
    Incident.deleteMany({}),
  ]);

  const admin = await User.create({
    name: 'Meera Krishnan',
    email: 'admin@amc.local',
    password: 'Admin@123',
    role: 'admin',
  });
  const personnel = await User.create({
    name: 'Arjun Nair',
    email: 'personnel@amc.local',
    password: 'Personnel@123',
    role: 'personnel',
  });

  const equipmentDocs = await Equipment.insertMany(equipmentSeed);
  const bySerial = Object.fromEntries(equipmentDocs.map((item) => [item.serial, item]));
  const templates = await TaskTemplate.insertMany(catalog);
  const byKey = Object.fromEntries(templates.map((item) => [item.key, item]));

  const now = new Date();
  const yesterday = addDays(now, -1);
  const lastWeek = addDays(now, -7);
  const lastMonth = addMonths(now, -1);
  const docs = [];
  const tags = [];

  const add = (tag, key, when, extras = {}) => {
    const template = byKey[key];
    docs.push(buildTask({
      template,
      equipment: template.equipmentSerial ? bySerial[template.equipmentSerial] : null,
      personnel,
      admin,
      when,
      status: extras.status,
      dueAt: extras.dueAt,
      startedAt: extras.startedAt,
      completedAt: extras.completedAt,
      completionRemark: extras.completionRemark,
      issueRemark: extras.issueRemark,
      checks: extras.checks || 'none',
    }));
    tags.push(tag);
  };

  for (const item of catalog.filter((entry) => entry.frequency === 'daily')) {
    const doneAt = new Date(yesterday);
    doneAt.setHours(16, 30, 0, 0);
    const startedAt = new Date(yesterday);
    startedAt.setHours(11, 0, 0, 0);
    add(`yesterday:${item.key}`, item.key, yesterday, {
      status: 'completed',
      startedAt,
      completedAt: doneAt,
      completionRemark: remarks[item.key],
      issueRemark: item.key === 'cameras-recordings'
        ? 'One corridor camera dropped its feed for about twenty minutes overnight. It came back on its own.'
        : '',
      checks: 'all',
    });
  }

  const todayPlan = {
    'av-check': { status: 'completed', dueHours: 6, doneHours: -2, startHours: -4, checks: 'all' },
    'os-update': { status: 'completed', dueHours: 6, doneHours: -3, startHours: -5, checks: 'all' },
    'office-activation': { status: 'completed', dueHours: 8, doneHours: -2, startHours: -3, checks: 'all' },
    'hardware-status': { status: 'completed', dueHours: 8, doneHours: -1, startHours: -3, checks: 'all' },
    'network-connectivity': { status: 'pending', dueHours: -3, checks: 'none' },
    'cameras-recordings': { status: 'in-progress', dueHours: 2, startHours: -1, checks: 'half' },
    'ups-check': { status: 'pending', dueHours: 2, checks: 'none' },
    'ac-status': { status: 'pending', dueHours: 10, checks: 'none' },
    'biometric-check': { status: 'in-progress', dueHours: 8, startHours: -6, checks: 'half' },
    'surveillance-check': { status: 'pending', dueHours: 10, checks: 'none' },
    'vc-setup': { status: 'completed', dueHours: 6, doneHours: -1, startHours: -2, checks: 'all', issue: true },
    'printers-scanners': { status: 'pending', dueHours: -4, checks: 'none' },
    'respond-complaints': { status: 'pending', dueHours: 10, checks: 'none' },
  };

  for (const [key, plan] of Object.entries(todayPlan)) {
    add(`today:${key}`, key, now, {
      status: plan.status,
      dueAt: hoursFrom(now, plan.dueHours),
      startedAt: plan.startHours !== undefined ? hoursFrom(now, plan.startHours) : null,
      completedAt: plan.doneHours !== undefined ? hoursFrom(now, plan.doneHours) : null,
      completionRemark: plan.status === 'completed' ? remarks[key] : '',
      issueRemark: plan.issue
        ? 'The test call dropped once. The spare HDMI lead was swapped and the second call held.'
        : '',
      checks: plan.checks,
    });
  }

  for (const item of catalog.filter((entry) => entry.frequency === 'weekly')) {
    const window = windowFor('weekly', lastWeek);
    const completedAt = new Date(window.dueAt.getTime() - 2 * 60 * 60 * 1000);
    const startedAt = new Date(completedAt.getTime() - 3 * 60 * 60 * 1000);
    add(`last-week:${item.key}`, item.key, lastWeek, {
      status: 'completed',
      startedAt,
      completedAt,
      completionRemark: remarks[item.key],
      checks: 'all',
    });
  }

  const weekPlan = {
    'vc-rooms': { status: 'completed', dueHours: -20, doneHours: -30, startHours: -34, checks: 'all' },
    'cable-inspection': { status: 'completed', dueHours: -10, doneHours: -18, startHours: -22, checks: 'all' },
    'network-switches': { status: 'completed', dueHours: 48, doneHours: -6, startHours: -10, checks: 'all' },
    'sr-hdd': { status: 'in-progress', dueHours: 20, startHours: -2, checks: 'half' },
    'server-workings': { status: 'pending', dueHours: 80, checks: 'none' },
    'cleaning': { status: 'pending', dueHours: -30, checks: 'none' },
    'avasyam': { status: 'completed', dueHours: 24, doneHours: -8, startHours: -12, checks: 'all' },
    'unauthorized-devices': { status: 'pending', dueHours: 20, checks: 'none' },
  };

  for (const [key, plan] of Object.entries(weekPlan)) {
    add(`week:${key}`, key, now, {
      status: plan.status,
      dueAt: hoursFrom(now, plan.dueHours),
      startedAt: plan.startHours !== undefined ? hoursFrom(now, plan.startHours) : null,
      completedAt: plan.doneHours !== undefined ? hoursFrom(now, plan.doneHours) : null,
      completionRemark: plan.status === 'completed' ? remarks[key] : '',
      checks: plan.checks,
    });
  }

  for (const item of catalog.filter((entry) => entry.frequency === 'monthly')) {
    const window = windowFor('monthly', lastMonth);
    const completedAt = new Date(window.dueAt.getTime() - 24 * 60 * 60 * 1000);
    add(`last-month:${item.key}`, item.key, lastMonth, {
      status: 'completed',
      startedAt: new Date(completedAt.getTime() - 2 * 60 * 60 * 1000),
      completedAt,
      completionRemark: remarks[item.key],
      checks: 'all',
    });
  }

  add('month:firewall-check', 'firewall-check', now, {
    status: 'pending',
    dueAt: hoursFrom(now, 48),
    checks: 'none',
  });
  add('month:backup-restore', 'backup-restore', now, {
    status: 'pending',
    dueAt: hoursFrom(now, -24),
    checks: 'none',
  });

  const created = await Task.insertMany(docs);
  const idOf = Object.fromEntries(tags.map((tag, index) => [tag, created[index]._id]));

  await Incident.create({
    task: idOf['today:network-connectivity'],
    reportedBy: personnel._id,
    message: 'CIAG has been unreachable from the admin VLAN since late morning.',
    severity: 'high',
    status: 'open',
  });
  await Incident.create({
    task: idOf['today:biometric-check'],
    reportedBy: personnel._id,
    message: 'The evening reader rejected two valid cards. The morning check had passed.',
    severity: 'medium',
    status: 'open',
  });
  await Incident.create({
    task: idOf['last-week:network-switches'],
    reportedBy: personnel._id,
    resolvedBy: admin._id,
    message: 'The annex access switch showed a fan alarm. It cleared after the rack was cleaned.',
    severity: 'low',
    status: 'resolved',
    resolvedAt: addDays(now, -5),
    createdAt: addDays(now, -6),
  });

  bySerial['UPS-SR-01'].serviceHistory.push({
    date: addDays(now, -12),
    serviceType: 'Battery test',
    notes: 'Runtime test passed. No swell on the battery string.',
    technician: personnel._id,
    task: idOf['yesterday:ups-check'],
  });
  bySerial['AC-SR-01'].serviceHistory.push({
    date: addDays(now, -9),
    serviceType: 'Filter clean',
    notes: 'Filters washed and the drain pan checked.',
    technician: personnel._id,
  });
  bySerial['SRV-FILE-01'].serviceHistory.push({
    date: addDays(now, -20),
    serviceType: 'Disk health',
    notes: 'SMART status healthy. Backup volume mounted.',
    technician: admin._id,
    task: idOf['last-month:backup-restore'],
  });
  bySerial['FW-01'].serviceHistory.push({
    date: addDays(now, -32),
    serviceType: 'Rule review',
    notes: 'Unused rules from the previous quarter removed.',
    technician: admin._id,
  });

  await Promise.all([
    bySerial['UPS-SR-01'].save(),
    bySerial['AC-SR-01'].save(),
    bySerial['SRV-FILE-01'].save(),
    bySerial['FW-01'].save(),
  ]);

  return { users: 2, tasks: created.length };
}
