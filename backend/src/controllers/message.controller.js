import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getRecieverSocketId } from "../lib/socket.js";
import { io } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
    try {
        const loggeduserId = req.user._id;
        const users = await User.find({ _id: { $ne: loggeduserId } }).select('-password -__v');
        return res.status(200).json(users); // Send users in the response

    } catch (error) {
        console.error('Error fetching users:', error);
        return res.status(500).json({ message: 'Internal server error in finding users!' });
        
    }
}

export const getMessages = async (req, res) => {
    try {
        const {id:userToChatId} = req.params;
        const myId = req.user._id;
        
        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: userToChatId },
                { senderId: userToChatId, receiverId: myId }
            ]
        })

        res.status(200).json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        return res.status(500).json({ message: 'Internal server error in finding messages!' });
        
    }
}


export const sendMessage = async(req,res)=>{
    try {
        const {text, image} = req.body;
        const { id: receiverId } = req.params;
        const senderId = req.user._id;
        
        let imageUrl;
        if(image){
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
        }

        const newMessage = new Message({
            senderId,
            receiverId,
            text,
            image : imageUrl,
        });

        await newMessage.save();

        //socket functionality
        const reciverSocketId = getRecieverSocketId(receiverId);
        if(reciverSocketId){
            io.to(reciverSocketId).emit("newMessage",newMessage)
        }
        res.status(201).json(newMessage);


    } catch (error) {
        console.error('Error sending message:', error);
        return res.status(500).json({ message: 'Internal server error in sending message!' });
    }
}

