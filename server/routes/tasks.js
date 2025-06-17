const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { runQuery, getQuery, allQuery } = require('../models/db');
const { adminOnly, authenticated, personnelOnly } = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Format: <timestamp>-<originalname>
    const timestamp = Date.now();
    const originalName = file.originalname.replace(/[^\w\d.]/g, '-'); // Sanitize filename
    cb(null, `${timestamp}-${originalName}`);
  }
});

// File filter to allow only JPEG and PNG files
const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);
  
  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only JPEG and PNG images are allowed'));
  }
};

// Configure multer with storage, limits, and file filter
const upload = multer({
  storage: storage,
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // Limit to single file
  },
  fileFilter: fileFilter
}).single('photo');

const router = express.Router();

// Valid task categories
const VALID_CATEGORIES = ['daily', 'weekly', 'monthly'];

/**
 * @route   POST /tasks
 * @desc    Create a new task (admin only)
 * @access  Private/Admin
 * @body    {string} title - Title of the task
 * @body    {string} category - Category of the task ('daily', 'weekly', 'monthly')
 * @body    {number} assignedTo - ID of the user to assign the task to
 * @body    {string} benchmarkTime - ISO timestamp for task completion deadline
 * @returns {Object} Created task details
 */
router.post('/', adminOnly(), async (req, res) => {
  try {
    const { title, category, assignedTo, benchmarkTime } = req.body;

    // Validate required fields
    if (!title || !category || !assignedTo || !benchmarkTime) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, category, assignedTo, and benchmarkTime'
      });
    }

    // Validate category
    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`
      });
    }

    // Validate benchmarkTime is a valid date
    const benchmarkDate = new Date(benchmarkTime);
    if (isNaN(benchmarkDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid benchmarkTime. Please provide a valid ISO timestamp'
      });
    }

    // Check if assigned user exists
    const user = await getQuery('SELECT id FROM Users WHERE id = ?', [assignedTo]);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Assigned user not found'
      });
    }

    // Insert the task
    const result = await runQuery(
      `INSERT INTO Tasks (title, category, status, assignedTo, benchmarkTime, createdAt)
       VALUES (?, ?, 'pending', ?, ?, datetime('now'))`,
      [title, category, assignedTo, benchmarkTime]
    );

    // Get the created task
    const task = await getQuery(
      `SELECT id, title, category, status, assignedTo, 
              strftime('%Y-%m-%dT%H:%M:%SZ', benchmarkTime) as benchmarkTime,
              strftime('%Y-%m-%dT%H:%M:%SZ', createdAt) as createdAt
       FROM Tasks WHERE id = ?`,
      [result.lastID]
    );

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: task
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create task',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /tasks/:category
 * @desc    Get tasks by category (admin or personnel)
 * @access  Private
 * @param   {string} category - Category of tasks to fetch ('daily', 'weekly', or 'monthly')
 * @returns {Array} List of tasks in the specified category
 */
router.get('/:category', authenticated(), async (req, res) => {
  try {
    const { category } = req.params;

    // Validate category
    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`
      });
    }

    // Fetch tasks for the specified category
    const tasks = await allQuery(
      `SELECT 
        t.id, 
        t.title, 
        t.category, 
        t.status, 
        t.assignedTo,
        u.username as assignedToUsername,
        u.fullName as assignedToName,
        strftime('%Y-%m-%dT%H:%M:%SZ', t.benchmarkTime) as benchmarkTime,
        strftime('%Y-%m-%dT%H:%M:%SZ', t.completedAt) as completedAt,
        strftime('%Y-%m-%dT%H:%M:%SZ', t.createdAt) as createdAt,
        strftime('%Y-%m-%dT%H:%M:%SZ', t.updatedAt) as updatedAt,
        (SELECT COUNT(*) FROM Logs WHERE taskId = t.id) as logCount
      FROM Tasks t
      LEFT JOIN Users u ON t.assignedTo = u.id
      WHERE t.category = ?
      ORDER BY t.createdAt DESC`,
      [category]
    );

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    console.error(`Error fetching ${req.params.category} tasks:`, error);
    res.status(500).json({
      success: false,
      message: `Failed to fetch ${req.params.category} tasks`,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /user-tasks
 * @desc    Get tasks assigned to the current user (personnel only)
 * @access  Private/Personnel
 * @returns {Array} List of tasks assigned to the current user
 */
router.get('/user-tasks', personnelOnly(), async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch tasks assigned to the current user
    const tasks = await allQuery(
      `SELECT 
        t.id, 
        t.title, 
        t.category, 
        t.status, 
        t.assignedTo,
        u.username as assignedToUsername,
        u.fullName as assignedToName,
        strftime('%Y-%m-%dT%H:%M:%SZ', t.benchmarkTime) as benchmarkTime,
        strftime('%Y-%m-%dT%H:%M:%SZ', t.completedAt) as completedAt,
        strftime('%Y-%m-%dT%H:%M:%SZ', t.createdAt) as createdAt,
        strftime('%Y-%m-%dT%H:%M:%SZ', t.updatedAt) as updatedAt,
        (SELECT COUNT(*) FROM Logs WHERE taskId = t.id) as logCount,
        CASE 
          WHEN datetime(t.benchmarkTime) < datetime('now') AND t.status != 'completed' THEN 'overdue'
          ELSE 'ontime'
        END as taskStatus
      FROM Tasks t
      LEFT JOIN Users u ON t.assignedTo = u.id
      WHERE t.assignedTo = ?
      ORDER BY 
        CASE 
          WHEN taskStatus = 'overdue' THEN 0
          WHEN t.status = 'pending' THEN 1
          ELSE 2
        END,
        t.benchmarkTime ASC`,
      [userId]
    );

    // Calculate task statistics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    const pendingTasks = totalTasks - completedTasks;
    const overdueTasks = tasks.filter(task => task.taskStatus === 'overdue').length;

    res.status(200).json({
      success: true,
      count: totalTasks,
      statistics: {
        total: totalTasks,
        completed: completedTasks,
        pending: pendingTasks,
        overdue: overdueTasks
      },
      data: tasks
    });
  } catch (error) {
    console.error('Error fetching user tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your tasks',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   POST /tasks/:id/update
 * @desc    Update task status with photo and remarks
 * @access  Private
 * @param   {string} id - Task ID to update
 * @body    {string} status - New status ('pending', 'in-progress', 'completed')
 * @body    {string} [remarks] - Optional remarks about the update
 * @body    {file} photo - Image file (jpeg, jpg, png, gif, max 5MB)
 * @returns {Object} Success message and updated task details
 */
router.post('/:id/update', authenticated(), (req, res) => {
  // Handle file upload
  upload(req, res, async (err) => {
    try {
      if (err) {
        // Handle different types of upload errors
        let errorMessage = 'Error uploading file';
        let statusCode = 400;

        if (err.code === 'LIMIT_FILE_SIZE') {
          errorMessage = 'File size too large. Maximum 5MB allowed.';
        } else if (err.code === 'LIMIT_FILE_COUNT') {
          errorMessage = 'Only one file is allowed per upload.';
        } else if (err.message) {
          errorMessage = err.message;
        }

        return res.status(statusCode).json({
          success: false,
          message: errorMessage
        });
      }

      const { id } = req.params;
      const { status, remarks } = req.body;
      const userId = req.user.id;
      const userRole = req.user.role;

      // Validate required fields
      if (!status) {
        // Delete the uploaded file if validation fails
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({
          success: false,
          message: 'Status is required'
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Photo is required'
        });
      }

      // Validate status
      const validStatuses = ['pending', 'in-progress', 'completed'];
      if (!validStatuses.includes(status)) {
        // Clean up uploaded file
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({
          success: false,
          message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
        });
      }

      // Get the task with benchmark time
      const task = await getQuery(
        `SELECT id, assignedTo, benchmarkTime 
         FROM Tasks 
         WHERE id = ?`,
        [id]
      );

      if (!task) {
        fs.unlinkSync(req.file.path); // Clean up uploaded file
        return res.status(404).json({
          success: false,
          message: 'Task not found'
        });
      }

      // Check permission (admin or assigned personnel)
      if (userRole !== 'admin' && task.assignedTo !== userId) {
        fs.unlinkSync(req.file.path); // Clean up uploaded file
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to update this task'
        });
      }

      // Calculate color status based on completion time
      const now = new Date();
      const benchmarkTime = new Date(task.benchmarkTime);
      let colorStatus = 'Green';
      
      if (status === 'completed') {
        const hoursLate = (now - benchmarkTime) / (1000 * 60 * 60);
        if (hoursLate > 24) {
          colorStatus = 'Red';
        } else if (hoursLate > 0) {
          colorStatus = 'Orange';
        }
      }

      // Update the task
      await runQuery(
        `UPDATE Tasks 
         SET status = ?,
             remarks = ?,
             photoPath = ?,
             actualTime = ?,
             colorStatus = ?,
             updatedAt = datetime('now')
         WHERE id = ?`,
        [
          status,
          remarks || null,
          `/uploads/tasks/${path.basename(req.file.path)}`,
          now.toISOString(),
          status === 'completed' ? colorStatus : null,
          id
        ]
      );

      // Create a log entry
      await runQuery(
        `INSERT INTO Logs (taskId, userId, action, details, createdAt)
         VALUES (?, ?, ?, ?, datetime('now'))`,
        [id, userId, `status_updated`, `Status changed to ${status}`]
      );

      // Get the updated task
      const updatedTask = await getQuery(
        `SELECT 
          id, 
          title, 
          category, 
          status, 
          assignedTo,
          remarks,
          photoPath,
          colorStatus,
          strftime('%Y-%m-%dT%H:%M:%SZ', benchmarkTime) as benchmarkTime,
          strftime('%Y-%m-%dT%H:%M:%SZ', actualTime) as actualTime,
          strftime('%Y-%m-%dT%H:%M:%SZ', createdAt) as createdAt,
          strftime('%Y-%m-%dT%H:%M:%SZ', updatedAt) as updatedAt
         FROM Tasks 
         WHERE id = ?`,
        [id]
      );

      res.status(200).json({
        success: true,
        message: 'Task updated successfully',
        data: updatedTask
      });

    } catch (error) {
      // Clean up uploaded file if there was an error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      console.error('Error updating task:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update task',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });
});

module.exports = router;