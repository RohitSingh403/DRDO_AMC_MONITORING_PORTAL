const express = require('express');
const router = express.Router();
const { allQuery } = require('../models/db');
const { authenticated, authorizeRoles } = require('../middleware/auth');
const logger = require('../utils/logger');

/**
 * @route   GET /logs
 * @desc    Get the 10 most recent incident logs with task titles
 * @access  Private (admin, personnel)
 * @returns {Array} List of log entries with task information
 */
router.get('/', authenticated, authorizeRoles(['admin', 'personnel']), async (req, res) => {
  try {
    // Query to get the 10 most recent logs with task titles
    const logs = await allQuery(`
      SELECT 
        l.id,
        l.taskId,
        t.title AS taskTitle,
        l.userId,
        u.username AS userName,
        l.action,
        l.description,
        l.oldValue,
        l.newValue,
        l.createdAt
      FROM Logs l
      LEFT JOIN Tasks t ON l.taskId = t.id
      LEFT JOIN Users u ON l.userId = u.id
      ORDER BY l.createdAt DESC
      LIMIT 10
    `);

    // Format the response
    const formattedLogs = logs.map(log => ({
      id: log.id,
      task: {
        id: log.taskId,
        title: log.taskTitle
      },
      user: log.userId ? {
        id: log.userId,
        username: log.userName
      } : null,
      action: log.action,
      description: log.description,
      oldValue: log.oldValue ? JSON.parse(log.oldValue) : null,
      newValue: log.newValue ? JSON.parse(log.newValue) : null,
      timestamp: log.createdAt
    }));

    res.json({
      success: true,
      data: formattedLogs,
      count: formattedLogs.length
    });

  } catch (error) {
    logger.error('Error fetching logs:', error);
    
    // Handle specific database errors
    if (error.code === 'SQLITE_ERROR') {
      return res.status(500).json({
        success: false,
        message: 'Database error occurred while fetching logs',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    // Generic error response
    res.status(500).json({
      success: false,
      message: 'Failed to fetch logs',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
