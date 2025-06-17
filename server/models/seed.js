const bcrypt = require('bcrypt');
const { runQuery, getQuery, allQuery } = require('./db');

// Sample data
const sampleUsers = [
  {
    username: 'admin1',
    password: 'adminpass',
    role: 'admin',
    email: 'admin1@example.com',
    fullName: 'Admin One'
  },
  {
    username: 'user1',
    password: 'userpass',
    role: 'personnel',
    email: 'user1@example.com',
    fullName: 'Regular User One'
  }
];

const sampleEquipment = [
  {
    name: 'HVAC System',
    model: 'CoolBreeze X2000',
    serialNumber: 'HVAC-001',
    location: 'Main Building - Floor 1',
    status: 'operational',
    serviceIntervalDays: 90
  },
  {
    name: 'Elevator',
    model: 'LiftMaster 5000',
    serialNumber: 'ELEV-001',
    location: 'Main Building',
    status: 'operational',
    serviceIntervalDays: 180
  },
  {
    name: 'Fire Alarm System',
    model: 'SafeGuard Pro',
    serialNumber: 'FIRE-001',
    location: 'Entire Building',
    status: 'operational',
    serviceIntervalDays: 365
  }
];

// Generate sample tasks (will be populated after users and equipment exist)
const getSampleTasks = (userId, equipmentIds) => [
  {
    title: 'Daily HVAC Check',
    description: 'Check and record HVAC system temperatures',
    category: 'daily',
    status: 'pending',
    priority: 'high',
    assignedTo: userId,
    equipmentId: equipmentIds[0],
    benchmarkTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    colorStatus: 'green'
  },
  {
    title: 'Daily Safety Check',
    description: 'Inspect emergency exits and fire extinguishers',
    category: 'daily',
    status: 'pending',
    priority: 'high',
    assignedTo: userId,
    equipmentId: equipmentIds[2],
    benchmarkTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    colorStatus: 'green'
  },
  {
    title: 'Weekly Elevator Inspection',
    description: 'Full elevator inspection and test run',
    category: 'weekly',
    status: 'pending',
    priority: 'medium',
    assignedTo: userId,
    equipmentId: equipmentIds[1],
    benchmarkTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Next week
    colorStatus: 'yellow'
  },
  {
    title: 'Weekly Generator Test',
    description: 'Test backup generator and record results',
    category: 'weekly',
    status: 'pending',
    priority: 'medium',
    assignedTo: userId,
    benchmarkTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    colorStatus: 'yellow'
  },
  {
    title: 'Monthly Fire System Check',
    description: 'Full fire alarm system test and inspection',
    category: 'monthly',
    status: 'pending',
    priority: 'high',
    assignedTo: userId,
    equipmentId: equipmentIds[2],
    benchmarkTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Next month
    colorStatus: 'red'
  }
];

// Generate sample logs (will be populated after tasks exist)
const getSampleLogs = (taskIds, userId) => [
  {
    taskId: taskIds[0],
    userId: userId,
    action: 'TASK_CREATED',
    description: 'Task created and assigned',
    oldValue: null,
    newValue: 'pending'
  },
  {
    taskId: taskIds[1],
    userId: userId,
    action: 'TASK_CREATED',
    description: 'Task created and assigned',
    oldValue: null,
    newValue: 'pending'
  },
  {
    taskId: taskIds[0],
    userId: userId,
    action: 'STATUS_UPDATE',
    description: 'Task started',
    oldValue: 'pending',
    newValue: 'in-progress'
  },
  {
    taskId: taskIds[0],
    userId: userId,
    action: 'STATUS_UPDATE',
    description: 'Task completed',
    oldValue: 'in-progress',
    newValue: 'completed'
  },
  {
    taskId: taskIds[1],
    userId: userId,
    action: 'COMMENT_ADDED',
    description: 'Found issue with equipment',
    oldValue: null,
    newValue: 'Reported issue to maintenance team'
  }
];

const seedDatabase = async () => {
  try {
    console.log('Starting database seeding...');

    // 1. Seed Users
    console.log('Seeding users...');
    const userIds = [];
    for (const user of sampleUsers) {
      // Check if user already exists
      const existingUser = await getQuery('SELECT id FROM Users WHERE username = ?', [user.username]);
      
      if (!existingUser) {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        const result = await runQuery(
          'INSERT INTO Users (username, password, role, email, fullName) VALUES (?, ?, ?, ?, ?)',
          [user.username, hashedPassword, user.role, user.email, user.fullName]
        );
        userIds.push(result.id);
      } else {
        console.log(`User ${user.username} already exists, skipping...`);
        const existingId = await getQuery('SELECT id FROM Users WHERE username = ?', [user.username]);
        userIds.push(existingId.id);
      }
    }

    // 2. Seed Equipment
    console.log('Seeding equipment...');
    const equipmentIds = [];
    for (const equipment of sampleEquipment) {
      const existingEquipment = await getQuery(
        'SELECT id FROM Equipment WHERE serialNumber = ?', 
        [equipment.serialNumber]
      );

      if (!existingEquipment) {
        const result = await runQuery(
          `INSERT INTO Equipment 
           (name, model, serialNumber, location, status, serviceIntervalDays, lastServiced)
           VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          [
            equipment.name,
            equipment.model,
            equipment.serialNumber,
            equipment.location,
            equipment.status,
            equipment.serviceIntervalDays
          ]
        );
        equipmentIds.push(result.id);
      } else {
        console.log(`Equipment ${equipment.serialNumber} already exists, skipping...`);
        equipmentIds.push(existingEquipment.id);
      }
    }

    // 3. Seed Tasks (assign to the personnel user)
    console.log('Seeding tasks...');
    const personnelId = userIds[1]; // user1 is the personnel
    const sampleTasks = getSampleTasks(personnelId, equipmentIds);
    const taskIds = [];

    for (const task of sampleTasks) {
      const existingTask = await getQuery(
        'SELECT id FROM Tasks WHERE title = ? AND category = ?',
        [task.title, task.category]
      );

      if (!existingTask) {
        const result = await runQuery(
          `INSERT INTO Tasks 
           (title, description, category, status, priority, assignedTo, equipmentId, benchmarkTime, colorStatus)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            task.title,
            task.description,
            task.category,
            task.status,
            task.priority,
            task.assignedTo,
            task.equipmentId || null,
            task.benchmarkTime,
            task.colorStatus
          ]
        );
        taskIds.push(result.id);
      } else {
        console.log(`Task "${task.title}" (${task.category}) already exists, skipping...`);
        taskIds.push(existingTask.id);
      }
    }

    // 4. Seed Logs
    console.log('Seeding logs...');
    const sampleLogs = getSampleLogs([taskIds[0], taskIds[1]], personnelId);
    
    for (const log of sampleLogs) {
      await runQuery(
        `INSERT INTO Logs 
         (taskId, userId, action, description, oldValue, newValue)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          log.taskId,
          log.userId,
          log.action,
          log.description,
          log.oldValue,
          log.newValue
        ]
      );
    }

    console.log('Database seeding completed successfully!');
    console.log('Admin credentials:');
    console.log('  Username: admin1');
    console.log('  Password: adminpass');
    console.log('\nUser credentials:');
    console.log('  Username: user1');
    console.log('  Password: userpass');
    
    return {
      userIds,
      equipmentIds,
      taskIds
    };
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
};

// Run the seed if this file is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = seedDatabase;
