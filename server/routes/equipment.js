const express = require('express');
const router = express.Router();
const { runQuery, allQuery, getQuery } = require('../models/db');
const { authenticated, authorizeRoles } = require('../middleware/auth');
const logger = require('../utils/logger');

/**
 * @route   GET /equipment
 * @desc    Get all equipment records
 * @access  Private (admin, personnel)
 */
router.get('/', authenticated, authorizeRoles(['admin', 'personnel']), async (req, res) => {
  try {
    const equipment = await allQuery(
      `SELECT id, name, model, serialNumber, location, 
              lastServiced, serviceIntervalDays, status, notes,
              createdAt, updatedAt 
       FROM Equipment 
       ORDER BY name`
    );
    
    // Parse serviceHistory JSON if it exists
    const equipmentWithHistory = equipment.map(item => ({
      ...item,
      serviceHistory: item.serviceHistory ? JSON.parse(item.serviceHistory) : []
    }));
    
    res.json({
      success: true,
      data: equipmentWithHistory
    });
  } catch (error) {
    logger.error('Error fetching equipment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch equipment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   POST /equipment/update
 * @desc    Create or update an equipment record
 * @access  Private (admin, personnel)
 * @body    {number} [id] - Equipment ID (for updates)
 * @body    {string} name - Equipment name (required)
 * @body    {string} [model] - Equipment model
 * @body    {string} [serialNumber] - Serial number
 * @body    {string} [location] - Equipment location
 * @body    {string} [lastServiced] - ISO date string of last service
 * @body    {number} [serviceIntervalDays] - Days between services
 * @body    {string} [status] - Equipment status
 * @body    {string} [notes] - Additional notes
 * @body    {Array} [serviceHistory] - Array of service history entries
 */
router.post('/update', authenticated, authorizeRoles(['admin', 'personnel']), async (req, res) => {
  try {
    const {
      id,
      name,
      model,
      serialNumber,
      location,
      lastServiced,
      serviceIntervalDays,
      status,
      notes,
      serviceHistory
    } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Equipment name is required'
      });
    }

    // Validate serviceHistory is an array if provided
    if (serviceHistory && !Array.isArray(serviceHistory)) {
      return res.status(400).json({
        success: false,
        message: 'serviceHistory must be an array'
      });
    }

    // Format serviceHistory as JSON string
    const serviceHistoryJson = serviceHistory ? JSON.stringify(serviceHistory) : '[]';
    const now = new Date().toISOString();

    if (id) {
      // Update existing equipment
      const result = await runQuery(
        `UPDATE Equipment 
         SET name = ?, model = ?, serialNumber = ?, location = ?, 
             lastServiced = ?, serviceIntervalDays = ?, status = ?, notes = ?,
             serviceHistory = COALESCE(?, serviceHistory), updatedAt = ?
         WHERE id = ?`,
        [
          name,
          model || null,
          serialNumber || null,
          location || null,
          lastServiced || null,
          serviceIntervalDays || 30,
          status || 'operational',
          notes || null,
          serviceHistoryJson,
          now,
          id
        ]
      );

      if (result.changes === 0) {
        return res.status(404).json({
          success: false,
          message: 'Equipment not found'
        });
      }

      const updatedEquipment = await getQuery(
        'SELECT * FROM Equipment WHERE id = ?',
        [id]
      );

      return res.json({
        success: true,
        message: 'Equipment updated successfully',
        data: {
          ...updatedEquipment,
          serviceHistory: JSON.parse(updatedEquipment.serviceHistory || '[]')
        }
      });
    } else {
      // Create new equipment
      const result = await runQuery(
        `INSERT INTO Equipment 
         (name, model, serialNumber, location, lastServiced, 
          serviceIntervalDays, status, notes, serviceHistory, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          name,
          model || null,
          serialNumber || null,
          location || null,
          lastServiced || null,
          serviceIntervalDays || 30,
          status || 'operational',
          notes || null,
          serviceHistoryJson,
          now,
          now
        ]
      );

      const newEquipment = await getQuery(
        'SELECT * FROM Equipment WHERE id = ?',
        [result.lastID]
      );

      return res.status(201).json({
        success: true,
        message: 'Equipment created successfully',
        data: {
          ...newEquipment,
          serviceHistory: JSON.parse(newEquipment.serviceHistory || '[]')
        }
      });
    }
  } catch (error) {
    logger.error('Error updating equipment:', error);
    
    // Handle unique constraint violation
    if (error.message && error.message.includes('UNIQUE constraint failed: Equipment.serialNumber')) {
      return res.status(400).json({
        success: false,
        message: 'An equipment with this serial number already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update equipment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
