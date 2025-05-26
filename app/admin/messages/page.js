'use client';

import { useState } from 'react';
import { withAuth } from '../../utils/with-auth';
import MessageList from '../../components/messaging/MessageList';
import ChatWindow from '../../components/messaging/ChatWindow';

function AdminMessagesPage() {
  const [selectedConversation, setSelectedConversation] = useState(null);

  return (
    <div className="messages-page">
      <div className="messages-container">
        <div className="sidebar">
          <MessageList onSelectConversation={setSelectedConversation} />
        </div>
        <div className="chat-area">
          <ChatWindow conversation={selectedConversation} />
        </div>
      </div>
    </div>
  );
}

export default withAuth(AdminMessagesPage, 'admin');
