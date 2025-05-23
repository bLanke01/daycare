// app/admin/debug/page.js
'use client';

import { useState } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

export default function DebugPage() {
  const [results, setResults] = useState('');
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState('wad@gmail.com'); // Default from your image

  const checkDatabaseState = async () => {
    setLoading(true);
    setResults('🔍 Checking database state...\n\n');
    
    try {
      let output = '';
      
      // Check users collection
      output += '=== USERS COLLECTION ===\n';
      const usersSnapshot = await getDocs(collection(db, 'users'));
      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        output += `User ID: ${doc.id}\n`;
        output += `  Email: ${userData.email}\n`;
        output += `  Role: ${userData.role}\n`;
        output += `  Name: ${userData.firstName} ${userData.lastName}\n`;
        output += `  Access Code: ${userData.accessCode || 'None'}\n`;
        output += `  Child IDs: ${JSON.stringify(userData.linkedChildIds || [])}\n`;
        output += `  Created: ${userData.createdAt}\n\n`;
      });
      
      // Check children collection
      output += '=== CHILDREN COLLECTION ===\n';
      const childrenSnapshot = await getDocs(collection(db, 'children'));
      childrenSnapshot.forEach(doc => {
        const childData = doc.data();
        output += `Child ID: ${doc.id}\n`;
        output += `  Name: ${childData.firstName} ${childData.lastName}\n`;
        output += `  Parent ID: ${childData.parentId || 'None'}\n`;
        output += `  Parent Email: ${childData.parentEmail}\n`;
        output += `  Parent Registered: ${childData.parentRegistered}\n`;
        output += `  Access Code: ${childData.accessCode}\n`;
        output += `  Created: ${childData.createdAt}\n\n`;
      });
      
      // Check access codes collection
      output += '=== ACCESS CODES COLLECTION ===\n';
      const accessCodesSnapshot = await getDocs(collection(db, 'accessCodes'));
      accessCodesSnapshot.forEach(doc => {
        const codeData = doc.data();
        output += `Access Code: ${codeData.code || doc.id}\n`;
        output += `  Child ID: ${codeData.childId || 'None'}\n`;
        output += `  Parent Email: ${codeData.parentEmail}\n`;
        output += `  Parent ID: ${codeData.parentId || 'None'}\n`;
        output += `  Used: ${codeData.used}\n`;
        output += `  Uses Left: ${codeData.usesLeft}\n`;
        output += `  Expires: ${codeData.expiresAt}\n\n`;
      });
      
      setResults(output);
      
    } catch (error) {
      setResults(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const fixParentLinking = async () => {
    if (!userEmail) {
      alert('Please enter a parent email address');
      return;
    }
    
    setLoading(true);
    setResults('🔧 Attempting to fix parent linking...\n\n');
    
    try {
      let output = '';
      
      // Find the user
      const usersSnapshot = await getDocs(collection(db, 'users'));
      let targetUser = null;
      
      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        if (userData.email.toLowerCase() === userEmail.toLowerCase()) {
          targetUser = { id: doc.id, ...userData };
        }
      });
      
      if (!targetUser) {
        output += `❌ User with email ${userEmail} not found\n`;
        setResults(output);
        return;
      }
      
      output += `✅ Found user: ${targetUser.firstName} ${targetUser.lastName} (${targetUser.id})\n`;
      output += `   Access Code: ${targetUser.accessCode}\n\n`;
      
      // Find children with matching parent email or access code
      const childrenSnapshot = await getDocs(collection(db, 'children'));
      const matchingChildren = [];
      
      childrenSnapshot.forEach(doc => {
        const childData = doc.data();
        const emailMatch = childData.parentEmail && 
          childData.parentEmail.toLowerCase() === userEmail.toLowerCase();
        const codeMatch = targetUser.accessCode && 
          childData.accessCode === targetUser.accessCode;
        
        if (emailMatch || codeMatch) {
          matchingChildren.push({ id: doc.id, ...childData });
          output += `📍 Found matching child: ${childData.firstName} ${childData.lastName}\n`;
          output += `   Email match: ${emailMatch ? 'Yes' : 'No'}\n`;
          output += `   Code match: ${codeMatch ? 'Yes' : 'No'}\n`;
          output += `   Current parentId: ${childData.parentId || 'None'}\n\n`;
        }
      });
      
      if (matchingChildren.length === 0) {
        output += `❌ No matching children found for ${userEmail}\n`;
        output += `🔍 Searching by access code: ${targetUser.accessCode}\n`;
        setResults(output);
        return;
      }
      
      output += `📊 Found ${matchingChildren.length} matching children\n\n`;
      
      // Update children to link with parent
      for (const child of matchingChildren) {
        output += `🔗 Linking child: ${child.firstName} ${child.lastName}\n`;
        
        try {
          await updateDoc(doc(db, 'children', child.id), {
            parentId: targetUser.id,
            parentRegistered: true,
            parentRegisteredAt: new Date().toISOString(),
            parentFirstName: targetUser.firstName,
            parentLastName: targetUser.lastName,
            updatedAt: new Date().toISOString()
          });
          
          output += `  ✅ Successfully linked\n`;
        } catch (updateError) {
          output += `  ❌ Failed to link: ${updateError.message}\n`;
        }
      }
      
      // Update user with linked child IDs
      const childIds = matchingChildren.map(child => child.id);
      try {
        await updateDoc(doc(db, 'users', targetUser.id), {
          linkedChildIds: childIds,
          updatedAt: new Date().toISOString()
        });
        
        output += `\n✅ Updated user with ${childIds.length} linked children\n`;
      } catch (userUpdateError) {
        output += `\n❌ Failed to update user: ${userUpdateError.message}\n`;
      }
      
      // Update access code as used
      if (targetUser.accessCode) {
        try {
          const accessCodesSnapshot = await getDocs(collection(db, 'accessCodes'));
          accessCodesSnapshot.forEach(async (accessDoc) => {
            const accessData = accessDoc.data();
            if (accessData.code === targetUser.accessCode) {
              await updateDoc(doc(db, 'accessCodes', accessDoc.id), {
                used: true,
                usesLeft: 0,
                parentId: targetUser.id,
                usedAt: new Date().toISOString()
              });
              output += `✅ Updated access code as used\n`;
            }
          });
        } catch (accessError) {
          output += `⚠️ Warning: Could not update access code: ${accessError.message}\n`;
        }
      }
      
      output += '\n🎉 Parent linking process completed!\n';
      output += '📱 Please refresh the parent dashboard to see the changes.\n';
      
      setResults(output);
      
    } catch (error) {
      setResults(`❌ Error fixing parent linking: ${error.message}\n${error.stack}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="debug-page" style={{ padding: '2rem' }}>
      <h1>🔧 Database Debugger & Fixer</h1>
      <p>Use this tool to diagnose and fix parent-child linking issues.</p>
      
      <div style={{ 
        margin: '2rem 0', 
        display: 'flex', 
        gap: '1rem', 
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Parent Email to Fix:
          </label>
          <input 
            type="email"
            placeholder="Enter parent email"
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
            style={{ 
              padding: '0.75rem', 
              border: '1px solid #ccc', 
              borderRadius: '4px',
              minWidth: '250px',
              fontSize: '1rem'
            }}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
          <button 
            onClick={checkDatabaseState}
            disabled={loading}
            style={{
              background: '#007bff',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold'
            }}
          >
            {loading ? 'Checking...' : '🔍 Check Database'}
          </button>
          
          <button 
            onClick={fixParentLinking}
            disabled={loading || !userEmail}
            style={{
              background: '#28a745',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '4px',
              cursor: loading || !userEmail ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold',
              opacity: !userEmail ? 0.6 : 1
            }}
          >
            {loading ? 'Fixing...' : '🔧 Fix Parent Linking'}
          </button>
        </div>
      </div>
      
      {results && (
        <div style={{
          background: '#f8f9fa',
          padding: '1.5rem',
          borderRadius: '8px',
          fontFamily: 'monospace',
          fontSize: '0.9rem',
          whiteSpace: 'pre-wrap',
          maxHeight: '600px',
          overflow: 'auto',
          border: '1px solid #dee2e6',
          marginTop: '1rem'
        }}>
          {results}
        </div>
      )}
      
      <div style={{ 
        marginTop: '2rem', 
        padding: '1rem', 
        background: '#e7f3ff', 
        borderRadius: '8px',
        border: '1px solid #b3d7ff'
      }}>
        <h3>📋 Instructions:</h3>
        <ol>
          <li><strong>Check Database:</strong> Click "Check Database" to see the current state of users, children, and access codes</li>
          <li><strong>Enter Parent Email:</strong> Enter the email of the parent having issues (default: wad@gmail.com)</li>
          <li><strong>Fix Linking:</strong> Click "Fix Parent Linking" to automatically link the parent with their children</li>
          <li><strong>Refresh Parent Dashboard:</strong> After fixing, tell the parent to refresh their dashboard</li>
        </ol>
      </div>
    </div>
  );
}