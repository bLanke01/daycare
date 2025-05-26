'use client';

import { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, addDoc, updateDoc, doc, onSnapshot } from 'firebase/firestore';
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
      await addDoc(collection(db, `conversations/${conversation.id}/messages`), messageData);

      // Update conversation's last message
      await updateDoc(doc(db, 'conversations', conversation.id), {
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
      setError('Failed to send message. Please try again.');
      console.error('Error sending message:', err);
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
      <div className="chat-window-placeholder">
        <p>Select a conversation to start messaging</p>
      </div>
    );
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div className="chat-window">
      <div className="chat-header">
        <h2>{conversation.parentName}</h2>
      </div>

      <div className="messages-container">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${message.senderId === user.uid ? 'sent' : 'received'}`}
          >
            <div className="message-content">
              {message.imageUrl && (
                <div className="message-image">
                  <Image
                    src={message.imageUrl}
                    alt="Shared image"
                    width={200}
                    height={200}
                    objectFit="contain"
                  />
                </div>
              )}
              {message.text && <p className="message-text">{message.text}</p>}
              <span className="message-time">
                {formatTime(message.timestamp)}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="message-input-form">
        {error && <div className="error-message">{error}</div>}
        {imageUpload && (
          <div className="image-preview">
            <span>{imageUpload.name}</span>
            <button
              type="button"
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
        <div className="input-container">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="attach-button"
            disabled={sending}
          >
            📎
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={sending}
          />
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            ref={fileInputRef}
            style={{ display: 'none' }}
          />
          <button 
            type="submit" 
            className="send-button"
            disabled={sending || (!newMessage.trim() && !imageUpload)}
          >
            {sending ? '...' : '➤'}
          </button>
        </div>
      </form>
    </div>
  );
} 