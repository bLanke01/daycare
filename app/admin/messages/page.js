'use client';

import { useState } from 'react';
import { withAuth } from '../../utils/with-auth';
import MessageList from '../../components/messaging/MessageList';
import ChatWindow from '../../components/messaging/ChatWindow';

function AdminMessagesPage() {
  const [selectedConversation, setSelectedConversation] = useState(null);

  return (
    <div className="min-h-screen bg-base-200 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-sm breadcrumbs mb-4">
          <ul>
            <li><a href="/admin">Dashboard</a></li>
            <li>Messages</li>
          </ul>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-8rem)]">
          <div className="bg-base-100 rounded-box shadow-xl overflow-hidden">
            <MessageList 
              onSelectConversation={setSelectedConversation} 
              selectedId={selectedConversation?.id}
            />
          </div>
          <div className="lg:col-span-2 bg-base-100 rounded-box shadow-xl overflow-hidden">
            <ChatWindow conversation={selectedConversation} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default withAuth(AdminMessagesPage, 'admin');
