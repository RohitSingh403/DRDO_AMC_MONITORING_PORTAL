const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5001;
const JWT_SECRET = 'your_jwt_secret_key_here';

// Mock data for tasks
let tasks = [
  {
    id: 1,
    userId: 2,
    title: 'Complete monthly maintenance',
    description: 'Perform routine maintenance on all equipment',
    status: 'pending',
    dueDate: '2023-06-30',
    priority: 'high',
    category: 'monthly',
    assignedBy: 1
  },
  {
    id: 2,
    userId: 2,
    title: 'Inspect HVAC system',
    description: 'Check and clean HVAC filters and vents',
    status: 'in-progress',
    dueDate: '2023-06-25',
    priority: 'medium',
    category: 'weekly',
    assignedBy: 1
  },
  {
    id: 3,
    userId: 3,
    title: 'Check fire extinguishers',
    description: 'Inspect and tag all fire extinguishers',
    status: 'completed',
    dueDate: '2023-06-20',
    priority: 'high',
    category: 'monthly',
    assignedBy: 1
  },
  {
    id: 4,
    userId: 2,
    title: 'Test emergency lighting',
    description: 'Test all emergency exit lights',
    status: 'pending',
    dueDate: '2023-06-28',
    priority: 'medium',
    category: 'weekly',
    assignedBy: 1
  }
];

// Enable CORS for all routes
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log('Headers:', req.headers);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body:', req.body);
  }
  next();
});

// Body parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Mock database with consistent role names
const users = [
  {
    id: 1,
    username: 'admin@example.com',
    password: bcrypt.hashSync('admin123', 10), // hashed password
    role: 'admin',
    name: 'Admin User',
    displayRole: 'Administrator'
  },
  {
    id: 2,
    username: 'user@example.com',
    password: bcrypt.hashSync('user123', 10), // hashed password
    role: 'user',
    name: 'Regular User',
    displayRole: 'User'
  },
  {
    id: 3,
    username: 'technician@example.com',
    password: bcrypt.hashSync('tech123', 10), // hashed password
    role: 'technician',
    name: 'Technician',
    displayRole: 'Technician'
  },
  {
    id: 4,
    username: 'user2@example.com',
    password: bcrypt.hashSync('user123', 10),
    role: 'user',
    name: 'Normal User 2',
    displayRole: 'User'
  }
];

// Mock data for equipment
let equipmentList = [
  {
    id: 'EQ-1001',
    name: 'HVAC Unit #5',
    type: 'HVAC',
    model: 'Trane XR16',
    serialNumber: 'TRN-XR16-2023-0042',
    location: 'Main Building - 3rd Floor',
    status: 'operational',
    lastServiced: '2023-05-15',
    nextService: '2023-07-15',
    serviceHistory: 'Routine maintenance and filter replacement',
    maintenanceHistory: [
      { date: '2023-05-15', type: 'Routine', technician: 'John D.', notes: 'Filter replacement and system check' },
      { date: '2023-03-10', type: 'Inspection', technician: 'Sarah M.', notes: 'Seasonal inspection' },
    ],
  },
  {
    id: 'EQ-1002',
    name: 'Generator #2',
    type: 'Generator',
    model: 'Generac 22kW',
    serialNumber: 'GNRC-22KW-2022-0178',
    location: 'Backup Power Room',
    status: 'maintenance-due',
    lastServiced: '2023-02-20',
    nextService: '2023-06-20',
    serviceHistory: 'Routine maintenance',
    maintenanceHistory: [
      { date: '2023-02-20', type: 'Oil Change', technician: 'Mike R.', notes: 'Routine oil and filter change' },
      { date: '2022-11-15', type: 'Load Test', technician: 'Mike R.', notes: 'Passed load test' },
    ],
  },
];

// Login endpoint
app.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Input validation
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    // Find user by username (email)
    const user = users.find(u => u.username === username);
    
    // Check if user exists and password is correct
    // In a real app, you would verify the hashed password
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    // Create JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        role: user.role,
        name: user.name
      }, 
      JWT_SECRET, 
      { expiresIn: '24h' }
    );

    // Return user data and token
    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.username,
        role: user.role,
        displayRole: user.displayRole
      },
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during login'
    });
  }
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'No token provided' 
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ 
        success: false, 
        message: 'Invalid or expired token' 
      });
    }
    req.user = user;
    next();
  });
};

// Equipment Routes

// Get all equipment
app.get('/equipment', (req, res) => {
  try {
    res.json({
      success: true,
      equipment: equipmentList
    });
  } catch (error) {
    console.error('Error fetching equipment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch equipment list'
    });
  }
});

// Get single equipment by ID
app.get('/equipment/:id', (req, res) => {
  try {
    const equipment = equipmentList.find(eq => eq.id === req.params.id);
    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found'
      });
    }
    
    res.json({
      success: true,
      equipment
    });
  } catch (error) {
    console.error('Error fetching equipment details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch equipment details'
    });
  }
});

// Create new equipment
app.post('/equipment', (req, res) => {
  try {
    const { name, type, model, serialNumber, location, status, lastServiced, nextService, serviceHistory } = req.body;
    
    if (!name || !type || !model || !serialNumber || !location) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    const newEquipment = {
      id: `EQ-${1000 + equipmentList.length + 1}`,
      name,
      type,
      model,
      serialNumber,
      location,
      status: status || 'operational',
      lastServiced: lastServiced || new Date().toISOString().split('T')[0],
      nextService: nextService || '',
      serviceHistory: serviceHistory || '',
      maintenanceHistory: []
    };
    
    equipmentList.push(newEquipment);
    
    res.status(201).json({
      success: true,
      message: 'Equipment added successfully',
      equipment: newEquipment
    });
  } catch (error) {
    console.error('Error adding equipment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add equipment'
    });
  }
});

// Update equipment
app.put('/equipment/:id', (req, res) => {
  try {
    const { name, type, model, serialNumber, location, status, lastServiced, nextService, serviceHistory } = req.body;
    const equipmentIndex = equipmentList.findIndex(eq => eq.id === req.params.id);
    
    if (equipmentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found'
      });
    }
    
    const updatedEquipment = {
      ...equipmentList[equipmentIndex],
      name: name || equipmentList[equipmentIndex].name,
      type: type || equipmentList[equipmentIndex].type,
      model: model || equipmentList[equipmentIndex].model,
      serialNumber: serialNumber || equipmentList[equipmentIndex].serialNumber,
      location: location || equipmentList[equipmentIndex].location,
      status: status || equipmentList[equipmentIndex].status,
      lastServiced: lastServiced || equipmentList[equipmentIndex].lastServiced,
      nextService: nextService || equipmentList[equipmentIndex].nextService,
      serviceHistory: serviceHistory || equipmentList[equipmentIndex].serviceHistory
    };
    
    equipmentList[equipmentIndex] = updatedEquipment;
    
    res.json({
      success: true,
      message: 'Equipment updated successfully',
      equipment: updatedEquipment
    });
  } catch (error) {
    console.error('Error updating equipment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update equipment'
    });
  }
});

// Delete equipment
app.delete('/equipment/:id', (req, res) => {
  try {
    const equipmentIndex = equipmentList.findIndex(eq => eq.id === req.params.id);
    
    if (equipmentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found'
      });
    }
    
    equipmentList = equipmentList.filter(eq => eq.id !== req.params.id);
    
    res.json({
      success: true,
      message: 'Equipment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting equipment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete equipment'
    });
  }
});

// Task Routes

// Get all tasks (admin only)
app.get('/tasks', authenticateToken, (req, res) => {
  try {
    // Check if user is admin
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (decoded.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Admin access required'
      });
    }

    res.json({
      success: true,
      tasks
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tasks'
    });
  }
});

// Get tasks by category (daily, weekly, monthly)
app.get('/tasks/:category', authenticateToken, (req, res) => {
  try {
    const { category } = req.params;
    const validCategories = ['daily', 'weekly', 'monthly'];
    
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category. Must be one of: daily, weekly, monthly'
      });
    }

    const filteredTasks = tasks.filter(task => 
      task.category === category
    );

    res.json({
      success: true,
      tasks: filteredTasks
    });
  } catch (error) {
    console.error('Error fetching tasks by category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tasks by category'
    });
  }
});

// Get tasks for a specific user
app.get('/api/user-tasks/:userId', authenticateToken, (req, res) => {
  try {
    const { userId } = req.params;
    const userTasks = tasks.filter(task => 
      task.userId === parseInt(userId)
    );

    res.json({
      success: true,
      tasks: userTasks
    });
  } catch (error) {
    console.error('Error fetching user tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user tasks'
    });
  }
});

// Create a new task
app.post('/tasks', authenticateToken, (req, res) => {
  try {
    // Only admin can create tasks
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can create tasks'
      });
    }

    const { 
      title, 
      description, 
      dueDate, 
      priority = 'medium', 
      category = 'general',
      assignedTo 
    } = req.body;

    // Input validation
    if (!title || !description || !dueDate || !assignedTo) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, dueDate, and assignedTo are required'
      });
    }

    // Check if assigned user exists
    const assignedUser = users.find(u => u.id === parseInt(assignedTo));
    if (!assignedUser) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user assigned'
      });
    }

    const newTask = {
      id: tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1,
      title,
      description,
      status: 'pending',
      dueDate,
      priority,
      category,
      assignedTo: parseInt(assignedTo),
      assignedBy: req.user.userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    tasks.push(newTask);

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      task: newTask
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create task',
      error: error.message
    });
  }
});

// Get all users (for admin task assignment)
app.get('/users', authenticateToken, (req, res) => {
  try {
    // Only allow admin to access user list
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    // Return minimal user data (no passwords)
    const userList = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.username,
      role: user.role,
      displayRole: user.displayRole
    }));

    res.json({
      success: true,
      users: userList
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
});

// Update task status
app.put('/tasks/:id/status', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Validate status
    const validStatuses = ['pending', 'in-progress', 'completed', 'overdue'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
      });
    }
    
    // Find task by ID
    const taskIndex = tasks.findIndex(t => t.id === parseInt(id));
    if (taskIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    
    // Update task status
    tasks[taskIndex] = {
      ...tasks[taskIndex],
      status,
      updatedAt: new Date().toISOString()
    };
    
    res.json({
      success: true,
      task: tasks[taskIndex]
    });
  } catch (error) {
    console.error('Error updating task status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update task status'
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
