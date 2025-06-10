'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../firebase/auth-context';

export default function MessageList({ onSelectConversation, selectedId }) {
  const [conversations, setConversations] = useState([]);
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { user, userRole } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Load existing conversations
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

    // If admin, also load all parents
    if (userRole === 'admin') {
      const loadParents = async () => {
        const parentsSnapshot = await getDocs(query(collection(db, 'parents')));
        const parentsList = [];
        parentsSnapshot.forEach((doc) => {
          parentsList.push({ id: doc.id, ...doc.data() });
        });
        setParents(parentsList);
      };
      loadParents();
    }

    return () => unsubscribe();
  }, [user, userRole]);

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  // Filter conversations and parents based on search term
  const filteredItems = [...conversations];
  if (userRole === 'admin') {
    // Add parents who don't have conversations yet
    parents.forEach(parent => {
      if (!conversations.find(conv => conv.parentId === parent.id)) {
        filteredItems.push({
          id: `new_${parent.id}`,
          parentId: parent.id,
          parentName: `${parent.firstName} ${parent.lastName}`,
          isNew: true
        });
      }
    });
  }

  const filtered = filteredItems.filter(item => 
    item.parentName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-base-200">
      <div className="p-4 bg-base-100 shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Messages</h2>
        <div className="form-control">
          <div className="input-group">
            <input 
              type="text" 
              placeholder="Search conversations..." 
              className="input input-bordered w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="btn btn-square">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      <div className="overflow-y-auto flex-1">
        <div className="menu bg-base-200 w-full p-0">
          {filtered.map((item) => (
            <div
              key={item.id}
              className={`border-b border-base-300 hover:bg-base-300 cursor-pointer transition-colors ${
                selectedId === item.id ? 'bg-base-300' : ''
              }`}
              onClick={() => onSelectConversation(item)}
            >
              <div className="p-4">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-semibold">{item.parentName}</h3>
                  {!item.isNew && (
                    <span className="text-sm opacity-70">
                      {formatTime(item.lastMessageAt)}
                    </span>
                  )}
                </div>
                {!item.isNew ? (
                  <p className="text-sm opacity-70 truncate">
                    {item.lastMessage || 'No messages yet'}
                  </p>
                ) : (
                  <p className="text-sm text-primary">Start new conversation</p>
                )}
                {item.unreadCountAdmin > 0 && userRole === 'admin' && (
                  <div className="badge badge-primary mt-2">{item.unreadCountAdmin} new</div>
                )}
                {item.unreadCountParent > 0 && userRole === 'parent' && (
                  <div className="badge badge-primary mt-2">{item.unreadCountParent} new</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}