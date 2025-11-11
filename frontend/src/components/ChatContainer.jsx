import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef, useState } from "react";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
    updateMessage, // expects store to expose updateMessage(id, { text })
    deleteMessage, // expects store to expose deleteMessage(id)
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);

  // Local UI state for editing & optimistic delete
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editText, setEditText] = useState("");
  const editInputRef = useRef(null);
  const [localDeletedIds, setLocalDeletedIds] = useState([]);

  useEffect(() => {
    if (!selectedUser?._id) return;
    getMessages(selectedUser._id);

    subscribeToMessages();

    return () => unsubscribeFromMessages();
  }, [selectedUser?._id, getMessages, subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Handlers for edit / delete
  const handleEditClick = (message) => {
    setEditingMessageId(message._id);
    setEditText(message.text || "");
    setTimeout(() => editInputRef.current?.focus(), 0);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditText("");
  };

  const handleSaveEdit = async (message) => {
    const trimmed = editText?.trim();
    if (!trimmed && !message.image) {
      // If text empty and no image, do nothing or optionally prevent empty
      return;
    }
    try {
      await updateMessage(message._id, { text: trimmed });
      setEditingMessageId(null);
      setEditText("");
      // store should update messages; otherwise consider optimistic update here
    } catch (err) {
      console.error("Failed to update message", err);
    }
  };

  const handleDelete = async (message) => {
    try {
      await deleteMessage(message._id);
      // optimistic UI: mark locally deleted until store confirms
      setLocalDeletedIds((prev) => (prev.includes(message._id) ? prev : [...prev, message._id]));
      if (editingMessageId === message._id) {
        handleCancelEdit();
      }
    } catch (err) {
      console.error("Failed to delete message", err);
    }
  };

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto p-4 space-y-4 relative">
        {messages.map((message) => {
          const isSender = message.senderId === authUser._id;
          const isDeleted = localDeletedIds.includes(message._id) || message.deleted;
          const isEditing = editingMessageId === message._id;

          return (
            <div
              key={message._id}
              className={`chat ${isSender ? "chat-end" : "chat-start"}`}
              ref={messageEndRef}
            >
              <div className=" chat-image avatar">
                <div className="size-10 rounded-full border">
                  <img
                    src={
                      isSender
                        ? authUser.profilePic || "/avatar.png"
                        : selectedUser.profilePic || "/avatar.png"
                    }
                    alt="profile pic"
                  />
                </div>
              </div>

              <div className="chat-header mb-1">
                <time className="text-xs opacity-50 ml-1">
                  {formatMessageTime(message.createdAt)}
                </time>
              </div>

              <div className="chat-bubble flex flex-col relative">
                {/* Edit / Delete icons only for sender messages - placed on the left side */}
                {isSender && !isDeleted && (
                  <div className="absolute -left-10 top-2 flex flex-col space-y-1">
                    <button
                      type="button"
                      onClick={() => handleEditClick(message)}
                      className="p-1 rounded hover:bg-gray-100"
                      title="Edit message"
                    >
                      {/* pencil icon (lucide-style SVG) */}
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <path d="M3 21l3-1 11-11 1-3-3 1L4 20z"></path>
                        <path d="M14 7l3 3"></path>
                      </svg>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(message)}
                      className="p-1 rounded hover:bg-gray-100"
                      title="Delete message"
                    >
                      {/* trash/bin icon (lucide-style SVG) */}
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
                        <path d="M10 11v6"></path>
                        <path d="M14 11v6"></path>
                        <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                )}

                {message.image && (
                  <img
                    src={message.image}
                    alt="Attachment"
                    className="sm:max-w-[200px] rounded-md mb-2"
                  />
                )}

                {isEditing ? (
                  <div className="flex items-center space-x-2">
                    <input
                      ref={editInputRef}
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="input input-sm flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(message)}
                      className="btn btn-sm"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="btn btn-ghost btn-sm"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <p>
                    {isDeleted ? (
                      <em className="opacity-60">This message was deleted</em>
                    ) : (
                      message.text
                    )}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <MessageInput />
    </div>
  );
};
export default ChatContainer;
