import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { genrateToken } from '../lib/utils.js';
import cloudinary from '../lib/cloudinary.js';

export const signup = async (req, res) => {
    // Get data from request body
    const { email, fullname, password } = req.body;
    try {
        if (!email || !fullname || !password) {
            return res.status(400).json({ message: 'All fields are required!' });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long!' });
        }

        // Check if user already exists in the database
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists!' });
        }


        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(password, salt);

        // Create new user
        const newUser = new User({
            email,
            fullname,
            password: hashedPassword,
        });
        if (newUser) {
            genrateToken(newUser._id, res);
            await newUser.save();
            return res.status(201).json({ message: 'User created successfully!', user: newUser });
        } else {
            return res.status(500).json({ message: 'User creation failed! Invalid data' });
        }

    } catch (error) {

    }
}

export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        if (!email || !password) {
            return res.status(400).json({ message: 'All fields are required!' });
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials!' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid credentials!' });
        }

        genrateToken(user._id, res);
        return res.status(200).json({ message: 'Login successful!', user });

    } catch (error) {
        return res.status(500).json({ message: 'Internal server error during login!' });
    }
}

export const logout = (req, res) => {
    try {
        res.clearCookie('jwt', "", { maxAge: 0 });
        return res.status(200).json({ message: 'Logout successful!' });
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error during logout!' });

    }
}

export const updateProfile = async (req, res) => {
    try {
        const { profilePic } = req.body;
        const userId = req.user._id;

        if (!profilePic) {
            return res.status(400).json({ message: 'Profile picture is required!' });
        }

        // Log a snippet of the base64 data
        console.log("Profile pic data (first 30 chars):", profilePic.substring(0, 30));

        // Upload to Cloudinary (optionally specify a folder)
        const uploadResponse = await cloudinary.uploader.upload(profilePic, {
            folder: "profile_pics",
        });
        console.log("Cloudinary upload response:", uploadResponse);

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { profilePic: uploadResponse.secure_url },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found!' });
        }

        return res.status(200).json({ message: 'Profile updated successfully!', user: updatedUser });

    } catch (error) {
        console.error("Error in updateProfile controller:", error);
        return res.status(500).json({ message: error.message || 'Internal server error during profile update!' });
    }
}

export const checkAuth = (req, res) => {
    try {
        res.status(200).json(req.user);
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error in Auth controller!' });
    }
}

export const updatePublicKey = async (req, res) => {
    try {
        const { publicKey } = req.body;
        
        if (!publicKey) {
            return res.status(400).json({ message: 'Public key is required' });
        }
        
        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            { publicKey: publicKey },
            { new: true }
        );
        
        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        return res.status(200).json({ message: 'Public key updated successfully' });
    } catch (error) {
        console.error('Error updating public key:', error);
        return res.status(500).json({ message: error.message || 'Failed to update public key' });
    }
}