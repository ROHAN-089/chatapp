import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { Socket } from "socket.io-client";
import { useAuthStore } from "./useAuthStore.js";
import { encryptMessage } from "../utils/encryptMessage.js";
import { decryptMessage } from "../utils/decryptMessage.js";
import { hasKeys } from "../utils/keyManager.js";

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
            // Create a copy of the message data to avoid modifying the original
            const messageToSend = { ...messageData };
            
            // Check if encryption is possible
            if (messageToSend.text && selectedUser.publicKey && hasKeys()) {
                try {
                    console.log(`Encrypting message for user ${selectedUser._id}...`);
                    const encryptedText = await encryptMessage(messageToSend.text, selectedUser.publicKey);
                    messageToSend.text = encryptedText;
                    messageToSend.isEncrypted = true; // Add flag to indicate this is encrypted
                    console.log("Message encrypted successfully");
                } catch (error) {
                    console.error("Encryption failed:", error);
                    toast.error("Failed to encrypt message");
                    return;
                }
            } else if (messageToSend.text) {
                console.warn("Sending message without encryption - no public key available");
                messageToSend.isEncrypted = false; // Mark as unencrypted
            }
            
            const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageToSend);
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
        socket.on("newMessage", async (message) => {
            if(message.senderId !== selectedUser._id) return; // Ignore messages not from selected user
            
            // Only try to decrypt messages that are marked as encrypted
            if (message.text && message.isEncrypted && hasKeys()) {
                try {
                    console.log('Attempting to decrypt encrypted message...');
                    const decryptedText = await decryptMessage(message.text, message.senderId);
                    if (typeof decryptedText === 'string') {
                        // If decryption was successful, update the message text
                        message.text = decryptedText;
                        message.isDecrypted = true;
                    } else {
                        // If we got back an error object, keep the original text but mark as encrypted
                        message.encryptionError = decryptedText.error;
                        message.isEncrypted = true;
                    }
                } catch (error) {
                    console.error("Error decrypting message:", error);
                    message.encryptionError = error.message;
                    message.isEncrypted = true;
                }
            } else if (message.text && !message.isEncrypted) {
                console.log('Received unencrypted message - no decryption needed');
            }
            
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