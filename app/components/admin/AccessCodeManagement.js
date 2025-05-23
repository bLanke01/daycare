// components/admin/AccessCodeManagement.js
'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';

const AccessCodeManagement = () => {
  const [accessCodes, setAccessCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    code: '',
    expiresAt: '',
    maxUses: 1,
    note: ''
  });

  // Generate random code
  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  // Load access codes
  useEffect(() => {
    const fetchAccessCodes = async () => {
      try {
        const codesQuery = query(collection(db, 'accessCodes'), where('usesLeft', '>', 0));
        const snapshot = await getDocs(codesQuery);
        
        const codes = [];
        snapshot.forEach(doc => {
          codes.push({ id: doc.id, ...doc.data() });
        });
        
        setAccessCodes(codes);
      } catch (error) {
        console.error('Error fetching access codes:', error);
        setError('Error loading access codes');
      } finally {
        setLoading(false);
      }
    };

    fetchAccessCodes();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'maxUses' ? parseInt(value) : value
    });
  };

  const handleGenerateCode = () => {
    setFormData({
      ...formData,
      code: generateRandomCode()
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      setLoading(true);
      
      // Set expiration date if not provided
      let expiresAt = formData.expiresAt;
      if (!expiresAt) {
        const date = new Date();
        date.setMonth(date.getMonth() + 1); // Default 1 month expiration
        expiresAt = date.toISOString().split('T')[0];
      }
      
      // Add new access code
      const newCode = {
        code: formData.code || generateRandomCode(),
        createdAt: new Date().toISOString(),
        expiresAt: new Date(expiresAt).toISOString(),
        maxUses: formData.maxUses,
        usesLeft: formData.maxUses,
        note: formData.note,
        usedBy: []
      };
      
      const docRef = await addDoc(collection(db, 'accessCodes'), newCode);
      
      // Add to local state
      setAccessCodes([...accessCodes, { id: docRef.id, ...newCode }]);
      
      // Reset form and close modal
      setFormData({
        code: '',
        expiresAt: '',
        maxUses: 1,
        note: ''
      });
      setShowModal(false);
    } catch (error) {
      setError(`Error creating access code: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCode = async (codeId) => {
    if (!confirm('Are you sure you want to delete this access code?')) return;
    
    try {
      setLoading(true);
      
      // Delete the access code
      await deleteDoc(doc(db, 'accessCodes', codeId));
      
      // Update local state
      setAccessCodes(accessCodes.filter(code => code.id !== codeId));
    } catch (error) {
      setError(`Error deleting access code: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div className="access-code-management">
      <div className="page-header">
        <h1>Registration Access Codes</h1>
        <button className="add-code-btn" onClick={() => setShowModal(true)}>
          Generate New Code
        </button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="access-codes-list">
        {loading && accessCodes.length === 0 ? (
          <div className="loading">Loading access codes...</div>
        ) : accessCodes.length === 0 ? (
          <div className="no-codes">No active access codes found. Generate a code for parent registration.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Expires</th>
                <th>Uses Left</th>
                <th>Note</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {accessCodes.map(code => (
                <tr key={code.id}>
                  <td><strong>{code.code}</strong></td>
                  <td>{formatDate(code.expiresAt)}</td>
                  <td>{code.usesLeft} / {code.maxUses}</td>
                  <td>{code.note}</td>
                  <td>
                    <button className="delete-btn" onClick={() => handleDeleteCode(code.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      
      {/* Generate Code Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Generate Access Code</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="code">Access Code</label>
                <div className="code-input-container">
                  <input
                    type="text"
                    id="code"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    placeholder="Auto-generated if left blank"
                  />
                  <button
                    type="button"
                    className="generate-btn"
                    onClick={handleGenerateCode}
                  >
                    Generate
                  </button>
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="expiresAt">Expiration Date</label>
                <input
                  type="date"
                  id="expiresAt"
                  name="expiresAt"
                  value={formData.expiresAt}
                  onChange={handleChange}
                />
                <small>If not specified, code will expire in 1 month</small>
              </div>
              
              <div className="form-group">
                <label htmlFor="maxUses">Maximum Uses</label>
                <input
                  type="number"
                  id="maxUses"
                  name="maxUses"
                  value={formData.maxUses}
                  onChange={handleChange}
                  min="1"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="note">Note (Optional)</label>
                <input
                  type="text"
                  id="note"
                  name="note"
                  value={formData.note}
                  onChange={handleChange}
                  placeholder="e.g., For Smith family"
                />
              </div>
              
              <div className="form-actions">
                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? 'Generating...' : 'Create Access Code'}
                </button>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccessCodeManagement;