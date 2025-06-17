const cron = require('node-cron');
const { runQuery, allQuery } = require('../models/db');
const logger = require('./logger'); // We'll create this next

/**
 * Checks for tasks that are due soon and updates their status
 * @returns {Promise<void>}
 */
async function checkAndUpdateTaskStatuses() {
  try {
    // Get current time and 24 hours from now in ISO format
    const now = new Date();
    const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    // Query tasks that are not completed and due within the next 24 hours
    const tasks = await allQuery(
      `SELECT id, title, status, benchmarkTime, colorStatus 
       FROM Tasks 
       WHERE status != 'completed' 
       AND benchmarkTime <= ? 
       AND benchmarkTime >= ?`,
      [twentyFourHoursFromNow.toISOString(), now.toISOString()]
    );

    // Process each task
    for (const task of tasks) {
      try {
        const benchmarkTime = new Date(task.benchmarkTime);
        const timeDiff = benchmarkTime - now;
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        
        let newColorStatus = task.colorStatus;
        let logMessage = '';
        
        // Determine the status based on time difference
        if (hoursDiff <= 0) {
          // Task is overdue
          newColorStatus = 'Red';
          logMessage = `Task "${task.title}" is OVERDUE (was due at ${benchmarkTime.toISOString()})`;
        } else if (hoursDiff <= 24) {
          // Task is due within 24 hours
          newColorStatus = 'Orange';
          logMessage = `Task "${task.title}" is due in ${Math.ceil(hoursDiff)} hours (${benchmarkTime.toISOString()})`;
        }
        
        // Only update if the status has changed
        if (newColorStatus !== task.colorStatus) {
          await runQuery(
            'UPDATE Tasks SET colorStatus = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
            [newColorStatus, task.id]
          );
          
          // Log the update
          logger.info(logMessage);
          
          // Here you could also send email notifications or other alerts
          // await sendTaskNotification(task, newColorStatus);
        }
      } catch (taskError) {
        logger.error(`Error processing task ${task.id}:`, taskError);
        // Continue with the next task even if one fails
        continue;
      }
    }
    
    logger.info(`Processed ${tasks.length} tasks for status updates`);
  } catch (error) {
    logger.error('Error in task status check:', error);
  }
}

/**
 * Initializes the reminder system
 */
function initReminders() {
  try {
    // Schedule the job to run every hour at minute 0 (e.g., 1:00, 2:00, etc.)
    cron.schedule('0 * * * *', async () => {
      logger.info('Running scheduled task status check...');
      await checkAndUpdateTaskStatuses();
    }, {
      scheduled: true,
      timezone: 'UTC' // Adjust timezone as needed
    });
    
    logger.info('Task reminder system initialized');
    
    // Run once on startup
    checkAndUpdateTaskStatuses().catch(error => {
      logger.error('Initial task status check failed:', error);
    });
  } catch (error) {
    logger.error('Failed to initialize reminder system:', error);
  }
}

module.exports = {
  initReminders,
  checkAndUpdateTaskStatuses // Exported for testing purposes
};
