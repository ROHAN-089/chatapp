import axios from "axios";
import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { disconnect, get } from "mongoose";
import { io } from "socket.io-client";

const BASE_URL = "http://localhost:5000"

export const useAuthStore = create((set,get) => ({
     authUser: null,
     isSigningUp: false,
     isLoggingIn: false,
     isUpdatingProfile: false,
     onlineUsers: [],
     socket: null,

     isCheckingAuth: true,

     checkAuth: async () => {
        try {
            const res = await axiosInstance.get("/auth/check");
            set({ authUser : res.data })
            get().connectSocket(); // Call the connectSocket function after successful login

        } catch (error) {
            console.log("Error in checkAuth: ",error);
        }finally {
            set({ isCheckingAuth: false });
        }
        },

     signup : async (formData) => {
        set({ isSigningUp: true });
        try {
            const res = await axiosInstance.post("/auth/signup", formData);
            toast.success("Account created successfully");
            set({authUser : res.data});
            get().connectSocket(); // Call the connectSocket function after successful login

        } catch (error) {
            console.log("Error in signup: ", error);
            toast.error(error?.response?.data?.message || "Something went wrong");
        } finally {
            set({ isSigningUp: false });
        }
     },

     logout : async() =>{
        try {
            await axiosInstance.post("/auth/logout");
            set({ authUser : null });
            toast.success("Logout successful")
            get().disconnectSocket(); // Call the disconnectSocket function after logout
        } catch (error) {
            console.log("Error in logout: ", error);
            toast.error(error?.response?.data?.message || "Something went wrong")
        }
     },

     login : async(formData) =>{
        set({ isLoggingIn: true });
        try {
            const res = await axiosInstance.post("/auth/login", formData);
            set({ authUser : res.data });
            toast.success("Login successful")

            get().connectSocket(); // Call the connectSocket function after successful login
        } catch (error) {
            console.log("Error in login: ", error);
            toast.error(error?.response?.data?.message || "Something went wrong")
        } finally {
            set({ isLoggingIn: false });
        }
     },

     updateProfile : async(profilePic) =>{
        set({ isUpdatingProfile: true });
        try {
             const res = await axiosInstance.put("/auth/update-profile", profilePic);
             set({ authUser: res.data.user });
             toast.success("Profile updated successfully");
         }
        catch (error) {
            console.log("Error in updateProfile: ", error);
            toast.error(error?.response?.data?.message || "Something went wrong")
        }
        finally {
            set({ isUpdatingProfile: false });
        }
     },

     connectSocket: () => {
        const { authUser } = get();
        if (!authUser  || get().socket?.connected) return; // Don't connect if not logged in
        const socket = io(BASE_URL,{
            query: {
                userId: authUser._id,
            },
            transports: ["websocket"],
        });

        socket.connect();

        set({ socket });

        socket.on("getOnlineUsers", (userIds) => {
                set({ onlineUsers: userIds });
        });
     },

     disconnectSocket: () => {
        const { socket } = get();
        if (socket.connected) {
            socket.disconnect();
            console.log("Disconnected from socket server:", socket.id);
        }
     },
     

    }));