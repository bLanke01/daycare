'use client';

import { useState, useEffect } from 'react';
import { withAuth } from '../../utils/with-auth';
import MessageList from '../../components/messaging/MessageList';
import ChatWindow from '../../components/messaging/ChatWindow';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../firebase/auth-context';

function ParentMessagesPage() {
  const [conversation, setConversation] = useState(null);
  const { user } = useAuth();

  // Load or create conversation with admin
  useEffect(() => {
    const loadConversation = async () => {
      if (!user) return;

      // Try to find existing conversation
      const q = query(
        collection(db, 'conversations'),
        where('parentId', '==', user.uid)
      );

      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        // Use existing conversation
        const conversationDoc = querySnapshot.docs[0];
        setConversation({
          id: conversationDoc.id,
          ...conversationDoc.data()
        });
      } else {
        // Create new conversation
        const userDoc = await getDocs(query(
          collection(db, 'users'),
          where('uid', '==', user.uid)
        ));

        if (!userDoc.empty) {
          const userData = userDoc.docs[0].data();
          const newConversation = {
            parentId: user.uid,
            parentName: `${userData.firstName} ${userData.lastName}`,
            parentAvatar: userData.avatar || null,
            createdAt: new Date().toISOString(),
            lastMessageAt: new Date().toISOString(),
            unreadCountAdmin: 0,
            unreadCountParent: 0
          };

          const docRef = await addDoc(collection(db, 'conversations'), newConversation);
          setConversation({
            id: docRef.id,
            ...newConversation
          });
        }
      }
    };

    loadConversation();
  }, [user]);

  return (
    <div className="messages-page">
      <div className="messages-container parent-view">
        <ChatWindow conversation={conversation} />
      </div>
    </div>
  );
}

export default withAuth(ParentMessagesPage, 'parent');
