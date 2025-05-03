import express from 'express';
import { checkAuth, login, logout, signup, updateProfile, updatePublicKey } from '../controllers/auth.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);

// These routes are protected and require authentication
router.put('/update-profile', protectRoute, updateProfile);
router.post('/update-public-key', protectRoute, updatePublicKey);
router.get('/check', protectRoute, checkAuth);

export default router;