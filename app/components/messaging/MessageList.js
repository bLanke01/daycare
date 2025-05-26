'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../firebase/auth-context';

export default function MessageList({ onSelectConversation, selectedId }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, userRole } = useAuth();

  useEffect(() => {
    if (!user) return;

    const q = userRole === 'admin'
      ? query(
          collection(db, 'conversations'),
          orderBy('lastMessageAt', 'desc')
        )
      : query(
          collection(db, 'conversations'),
          where('parentId', '==', user.uid),
          orderBy('lastMessageAt', 'desc')
        );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const conversationList = [];
      snapshot.forEach((doc) => {
        conversationList.push({ id: doc.id, ...doc.data() });
      });
      setConversations(conversationList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, userRole]);

  if (loading) {
    return <div className="loading-spinner">Loading conversations...</div>;
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div className="message-list">
      <div className="message-list-header">
        <h2>Messages</h2>
        <div className="search-box">
          <input type="text" placeholder="Search" className="search-input" />
        </div>
      </div>
      
      <div className="conversation-list">
        {conversations.map((conversation) => (
          <div
            key={conversation.id}
            className={`conversation-item ${selectedId === conversation.id ? 'selected' : ''}`}
            onClick={() => onSelectConversation(conversation)}
          >
            <div className="conversation-info">
              <div className="conversation-header">
                <h3>{conversation.parentName}</h3>
                <span className="time">
                  {formatTime(conversation.lastMessageAt)}
                </span>
              </div>
              <p className="last-message">
                {conversation.lastMessage || 'No messages yet'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 