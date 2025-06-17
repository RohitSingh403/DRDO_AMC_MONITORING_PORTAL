const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { getQuery, runQuery } = require('../models/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// JWT secret key - should match the one in auth.js
const JWT_SECRET = process.env.JWT_SECRET || 'mysecretkey';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * @route   POST /auth/register
 * @desc    Register a new user (Admin only)
 * @access  Private/Admin
 */
router.post('/register', authenticate(['admin']), async (req, res) => {
  try {
    const { username, password, email, fullName, role } = req.body;

    // Validate input
    if (!username || !password || !email || !fullName || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    if (!['admin', 'personnel'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be either admin or personnel'
      });
    }

    // Check if user already exists
    const existingUser = await getQuery(
      'SELECT id FROM Users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username or email already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await runQuery(
      `INSERT INTO Users (username, password, email, fullName, role)
       VALUES (?, ?, ?, ?, ?)`,
      [username, hashedPassword, email, fullName, role]
    );

    // Generate JWT token
    const token = jwt.sign(
      { userId: result.id, role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Return token and user info (without password)
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        token,
        user: {
          id: result.id,
          username,
          email,
          fullName,
          role
        }
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   POST /auth/login
 * @desc    Authenticate user with role & get token
 * @access  Public
 * @body    {string} username - User's username
 * @body    {string} password - User's password
 * @body    {string} role - User's role ('admin' or 'personnel')
 * @returns {Object} Token and user data if authentication succeeds
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password, role } = req.body;

    // Validate input
    if (!username || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username, password, and role'
      });
    }

    // Validate role
    if (!['admin', 'personnel'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be either admin or personnel'
      });
    }

    // Get user from database
    const user = await getQuery(
      'SELECT id, username, password, role, email, fullName FROM Users WHERE username = ?',
      [username]
    );

    // Check if user exists
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    // Verify role matches
    if (user.role !== role) {
      return res.status(403).json({
        success: false,
        message: `Access denied. User is not a ${role}`
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    // Generate JWT token that expires in 24 hours
    const token = jwt.sign(
      { 
        userId: user.id, 
        role: user.role,
        username: user.username
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Remove password from user object
    const { password: _, ...userData } = user;

    // Return success response with token and user data
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: userData
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during authentication',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /auth/me
 * @desc    Get current user's profile
 * @access  Private
 */
router.get('/me', authenticate(), async (req, res) => {
  try {
    const user = await getQuery(
      'SELECT id, username, email, fullName, role, createdAt FROM Users WHERE id = ?',
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;