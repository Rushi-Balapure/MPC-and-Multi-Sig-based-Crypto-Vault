// src/components/team/AddMemberForm.js
import React, { useState } from 'react';
import { useTeam } from '../../context/TeamContext';

const AddMemberForm = ({ teamId, onComplete }) => {
  const { addTeamMember } = useTeam();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    id: '',  // This could be a wallet address or other unique identifier
    role: 'member'
  });
  
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    // Basic validation
    if (!formData.name.trim()) {
      setError('Member name is required');
      return;
    }
    
    if (!formData.id.trim()) {
      setError('Member ID/Address is required');
      return;
    }
    
    try {
      // Add team member
      addTeamMember(teamId, {
        ...formData,
        id: formData.id.toLowerCase().trim()
      });
      
      // Reset form and notify parent
      setFormData({
        name: '',
        email: '',
        id: '',
        role: 'member'
      });
      onComplete();
    } catch (err) {
      setError(err.message || 'Failed to add team member');
    }
  };

  return (
    <div>
      <h3 className="text-white font-medium mb-4">Add New Member</h3>
      
      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-2 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-gray-300 mb-1 text-sm">
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full bg-gray-600 text-white border border-gray-500 rounded py-2 px-3 focus:outline-none focus:border-yellow-500"
              placeholder="Member name"
            />
          </div>
          
          <div>
            <label htmlFor="email" className="block text-gray-300 mb-1 text-sm">
              Email (Optional)
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full bg-gray-600 text-white border border-gray-500 rounded py-2 px-3 focus:outline-none focus:border-yellow-500"
              placeholder="member@example.com"
            />
          </div>
          
          <div>
            <label htmlFor="id" className="block text-gray-300 mb-1 text-sm">
              Wallet Address / ID
            </label>
            <input
              type="text"
              id="id"
              name="id"
              value={formData.id}
              onChange={handleChange}
              className="w-full bg-gray-600 text-white border border-gray-500 rounded py-2 px-3 focus:outline-none focus:border-yellow-500"
              placeholder="0x..."
            />
          </div>
          
          <div>
            <label htmlFor="role" className="block text-gray-300 mb-1 text-sm">
              Role
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full bg-gray-600 text-white border border-gray-500 rounded py-2 px-3 focus:outline-none focus:border-yellow-500"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
        
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onComplete}
            className="mr-3 px-4 py-2 text-gray-300 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded"
          >
            Add Member
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddMemberForm;