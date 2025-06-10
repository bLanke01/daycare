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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  // Load or create conversation with admin
  useEffect(() => {
    const loadConversation = async () => {
      if (!user) return;

      try {
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
      } catch (err) {
        console.error('Error loading conversation:', err);
        setError('Failed to load messages. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadConversation();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="alert alert-error shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="font-bold">Error</h3>
            <div className="text-sm">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body p-0">
          <ChatWindow conversation={conversation} />
        </div>
      </div>
    </div>
  );
}

export default withAuth(ParentMessagesPage, 'parent');
