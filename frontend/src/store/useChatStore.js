import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { Socket } from "socket.io-client";
import { useAuthStore } from "./useAuthStore.js";

export const useChatStore = create((set, get) => ({
    messages: [],
    users: [],
    selectedUser: null,
    isUserLoading: false,
    isMessagesLoading: false,


    getUsers: async () => {
        set({ isUserLoading: true });
        try {
            const res = await axiosInstance.get("/messages/users");
            set({ users: res.data });
        } catch (error) {
            console.log("Error in getUsers: ", error);
            toast.error(error?.response?.data?.message || "Something went wrong");
        } finally {
            set({ isUserLoading: false });
        }
    },

    getMessages: async (userId) => {
        set({ isMessagesLoading: true });
        try {
            const res = await axiosInstance.get(`/messages/${userId}`);
            set({ messages: res.data });
        } catch (error) {
            console.log("Error in getMessages: ", error);
            toast.error(error?.response?.data?.message || "Something went wrong");
        } finally {
            set({ isMessagesLoading: false });
        }
    },

    sendMessage: async (messageData) => {
        const { selectedUser } = get();
        try {
            const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
            // Instead of refetching, directly update the messages state
            set((state) => ({
                messages: [...state.messages, res.data]
            }));
        } catch (error) {
            toast.error(error?.response?.data?.message || "Something went wrong");
            console.log("Error in sendMessage: ", error);
        }
    },

    subscribeToMessages: () => {
        const { selectedUser } = get();
        if (!selectedUser) return;
        const socket = useAuthStore.getState().socket;
        if (!socket) return;

        // Remove previous listener to avoid duplicates
        socket.off("newMessage");

        // Listen for "newMessage" events; avoid adding duplicates
        socket.on("newMessage", (message) => {
            if(message.senderId !== selectedUser._id) return; // Ignore own messages
            set((state) => {
                const exists = state.messages.find((m) => m._id === message._id);
                if (exists) return {};
                return { messages: [...state.messages, message] };
            });
        });
    },

    unsubscribeFromMessages: () => {
        const socket = useAuthStore.getState().socket;
        if (socket) socket.off("newMessage");
    },
     
    setSelectedUser: (user) => set({ selectedUser: user }),
}));