'use client';

import { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, addDoc, updateDoc, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase/config';
import { useAuth } from '../../firebase/auth-context';
import Image from 'next/image';

export default function ChatWindow({ conversation }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [imageUpload, setImageUpload] = useState(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const { user, userRole } = useAuth();
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!conversation) return;

    // If it's a new conversation, don't try to load messages
    if (conversation.isNew) return;

    const q = query(
      collection(db, `conversations/${conversation.id}/messages`),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messageList = [];
      snapshot.forEach((doc) => {
        messageList.push({ id: doc.id, ...doc.data() });
      });
      setMessages(messageList);
      scrollToBottom();
    });

    return () => unsubscribe();
  }, [conversation]);

  const handleImageUpload = async (file) => {
    if (!file) return null;

    const storageRef = ref(storage, `chat-images/${conversation.id}/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !imageUpload) || !conversation || sending) return;

    try {
      setSending(true);
      setError('');

      let conversationId = conversation.id;
      
      // If this is a new conversation, create it first
      if (conversation.isNew) {
        const newConversationRef = doc(collection(db, 'conversations'));
        conversationId = newConversationRef.id;
        
        await setDoc(newConversationRef, {
          id: conversationId,
          parentId: conversation.parentId,
          parentName: conversation.parentName,
          adminId: user.uid,
          createdAt: new Date().toISOString(),
          lastMessageAt: new Date().toISOString(),
          unreadCountAdmin: 0,
          unreadCountParent: 1
        });
        
        // Update the conversation object
        conversation = {
          ...conversation,
          id: conversationId,
          isNew: false
        };
      }

      let imageUrl = null;
      if (imageUpload) {
        imageUrl = await handleImageUpload(imageUpload);
      }

      const messageData = {
        text: newMessage.trim(),
        senderId: user.uid,
        senderRole: userRole,
        timestamp: new Date().toISOString(),
        ...(imageUrl && { imageUrl })
      };

      // Add message to the conversation
      await addDoc(collection(db, `conversations/${conversationId}/messages`), messageData);

      // Update conversation's last message
      await updateDoc(doc(db, 'conversations', conversationId), {
        lastMessage: imageUrl ? '📷 Image' : newMessage.trim(),
        lastMessageAt: new Date().toISOString(),
        [`unreadCount${userRole === 'admin' ? 'Parent' : 'Admin'}`]: (conversation[`unreadCount${userRole === 'admin' ? 'Parent' : 'Admin'}`] || 0) + 1
      });

      setNewMessage('');
      setImageUpload(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setImageUpload(file);
    } else {
      setError('Please select an image file.');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (!conversation) {
    return (
      <div className="h-full flex items-center justify-center bg-base-200">
        <div className="text-center p-8">
          <h3 className="text-xl font-semibold mb-2">Welcome to Messages</h3>
          <p className="text-base-content/70">Select a conversation to start messaging</p>
        </div>
      </div>
    );
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div className="h-full flex flex-col bg-base-100">
      <div className="bg-base-200 p-4 shadow-lg">
        <h2 className="text-xl font-bold">{conversation.parentName}</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`chat ${message.senderId === user.uid ? 'chat-end' : 'chat-start'}`}
          >
            <div className={`chat-bubble ${message.senderId === user.uid ? 'chat-bubble-primary' : 'chat-bubble-secondary'}`}>
              {message.imageUrl && (
                <div className="mb-2">
                  <Image
                    src={message.imageUrl}
                    alt="Shared image"
                    width={200}
                    height={200}
                    className="rounded-lg"
                    objectFit="contain"
                  />
                </div>
              )}
              {message.text && <p>{message.text}</p>}
              <div className="text-xs opacity-70 mt-1">
                {formatTime(message.timestamp)}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-base-200">
        {error && (
          <div className="alert alert-error mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {imageUpload && (
          <div className="alert alert-info mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{imageUpload.name}</span>
            <button
              type="button"
              className="btn btn-sm btn-circle btn-ghost"
              onClick={() => {
                setImageUpload(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
            >
              ✕
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-circle btn-ghost"
            disabled={sending}
          >
            📎
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="input input-bordered flex-1"
            disabled={sending}
          />
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            ref={fileInputRef}
            className="hidden"
          />
          <button 
            type="submit" 
            className={`btn btn-primary ${sending ? 'loading' : ''}`}
            disabled={sending || (!newMessage.trim() && !imageUpload)}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
} 