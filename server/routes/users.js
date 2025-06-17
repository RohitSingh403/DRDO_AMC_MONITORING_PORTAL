const express = require('express');
const { getQuery } = require('../models/db');
const { adminOnly } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   GET /users
 * @desc    Get all users (admin only)
 * @access  Private/Admin
 * @returns {Array} List of users without password hashes
 */
router.get('/', adminOnly(), async (req, res) => {
  try {
    // Fetch all users from the database, excluding passwords
    const users = await getQuery(
      'SELECT id, username, email, fullName, role, createdAt, updatedAt FROM Users',
      []
    );

    // Return the list of users
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;