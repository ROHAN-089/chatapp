import React, { useState } from 'react'
import { Send, Image, X } from 'lucide-react'  // Add this line
import { useChatStore } from '../store/useChatStore.js'
import toast from 'react-hot-toast'

const MessageInput = () => {
    const { sendMessage } = useChatStore()
    const [text, setText] = useState("")
    const [imagePreview, setImagePreview] = useState(null)
    const fileInputRef = React.useRef(null)

    const handleImageChange = (e) => {
        const file = e.target.files[0]
        if (!file.type.startsWith("image/")) {
            toast.error("Please select an image file.")
            return
        }
        const reader = new FileReader()
        reader.onloadend = () => {
            setImagePreview(reader.result)
        }
        reader.readAsDataURL(file)
    }

    const removeImage = () => {
        setImagePreview(null)
        fileInputRef.current.value = null
    }

    const handleSendMessage = async (e) => {
        e.preventDefault()
        if (!text.trim() && !imagePreview) return;

        // If an image is being sent, show a "sending image" toast
        let sendingToastId = null;
        if (imagePreview) {
            sendingToastId = toast.loading("Sending image...");
        }

        try {
            await sendMessage({ text: text.trim(), image: imagePreview });
            setText("");
            removeImage();
            if (sendingToastId) {
                toast.success("Image sent", { id: sendingToastId });
            }
        } catch (error) {
            if (sendingToastId) {
                toast.error("Failed to send image", { id: sendingToastId });
            } else {
                toast.error("Failed to send message");
            }
            console.error("Error sending message:", error);
        }
    }

    return (
        <div className="p-4 w-full">
            {imagePreview && (
                <div className="mb-3 flex items-center gap-2">
                    <div className="relative">
                        <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
                        />
                        <button
                            onClick={removeImage}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300
              flex items-center justify-center"
                            type="button"
                        >
                            <X className="size-3" />
                        </button>
                    </div>
                </div>
            )}

            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <div className="flex-1 flex gap-2">
                    <input
                        type="text"
                        className="w-full input input-bordered rounded-lg input-sm sm:input-md"
                        placeholder="Type a message..."
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                    />
                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                    />

                    <button
                        type="button"
                        className={`hidden sm:flex btn btn-circle
                     ${imagePreview ? "text-emerald-500" : "text-zinc-400"}`}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Image size={20} />
                    </button>
                </div>
                <button
                    type="submit"
                    className="btn btn-sm btn-circle"
                    disabled={!text.trim() && !imagePreview}
                >
                    <Send size={22} />
                </button>
            </form>
        </div>)
}

export default MessageInput