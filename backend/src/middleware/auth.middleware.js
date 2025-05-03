import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import dotenv from 'dotenv';
dotenv.config();

export const protectRoute = async (req, res, next) => {
    const token = req.cookies.jwt;
    try {
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized access! No token provided' });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded) {
            return res.status(401).json({ message: 'Unauthorized access! Invalid token' });
        }
        const user = await User.findById(decoded.id).select('-password');
        console.log(user);
        if (!user) {
            return res.status(401).json({ message: 'Unauthorized access! User not found' });
        }
        req.user = user;
        next();
        
    } catch (error) {
        console.error('Error verifying token:', error);
        return res.status(401).json({ message: 'Unauthorized access! Invalid token' });
    }
}