// src/pages/CreateTeam.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTeam } from '../context/TeamContext';

const CreateTeam = () => {
  const { createTeam, teamState, clearError } = useTeam();
  const navigate = useNavigate();
  
  // Track team creation steps
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState({
    name: '',
    memberCount: 2, // Default to 2 additional members (excluding self)
    members: []
  });
  
  const [error, setError] = useState('');
  
  // Calculate total team size (including the creator)
  const totalTeamSize = formData.memberCount + 1;
  
  // Update members array whenever memberCount changes
  useEffect(() => {
    // Initialize member array based on total count (including self)
    const updatedMembers = [];
    
    // Create total number of member fields (including self)
    for (let i = 0; i < totalTeamSize; i++) {
      // Keep existing data if available
      if (i < formData.members.length) {
        updatedMembers.push(formData.members[i]);
      } else {
        // First member should be the creator
        if (i === 0) {
          updatedMembers.push({ email: '', role: 'creator' });
        } else {
          updatedMembers.push({ email: '', role: 'member' });
        }
      }
    }
    
    setFormData(prev => ({
      ...prev,
      members: updatedMembers
    }));
  }, [formData.memberCount]);
  
  // Clear errors when component mounts or when context error changes
  useEffect(() => {
    if (teamState.error) {
      setError(teamState.error);
      clearError();
    }
  }, [teamState.error, clearError]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'memberCount') {
      // Update member count (ensuring it's at least 1)
      const newCount = Math.max(1, parseInt(value) || 0);
      setFormData(prev => ({ 
        ...prev, 
        [name]: newCount
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleMemberChange = (index, e) => {
    const { name, value } = e.target;
    const updatedMembers = [...formData.members];
    updatedMembers[index] = { ...updatedMembers[index], [name]: value };
    setFormData(prev => ({ ...prev, members: updatedMembers }));
  };
  
  const addMember = () => {
    setFormData(prev => ({
      ...prev,
      memberCount: prev.memberCount + 1
      // The useEffect will handle updating the members array
    }));
  };
  
  const removeMember = (index) => {
    if (formData.members.length > 2) { // Ensure at least 2 total members (including self)
      const updatedMembers = [...formData.members];
      updatedMembers.splice(index, 1);
      setFormData(prev => ({
        ...prev,
        memberCount: prev.memberCount - 1,
        members: updatedMembers
      }));
    }
  };
  
  const handleNextStep = () => {
    // Validate first step
    if (!formData.name.trim()) {
      setError('Team name is required');
      return;
    }
    
    // Make sure member count is at least 1
    if (formData.memberCount < 1) {
      setError('Team must have at least one additional member besides you');
      return;
    }
    
    setError('');
    setStep(2);
  };
  
  const validateEmails = () => {
    // Check if all emails are filled
    const emptyEmails = formData.members.filter(member => !member.email.trim());
    if (emptyEmails.length > 0) {
      setError('All member email fields must be filled');
      return false;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    for (let i = 0; i < formData.members.length; i++) {
      if (!emailRegex.test(formData.members[i].email)) {
        setError(`Invalid email address for member ${i + 1}`);
        return false;
      }
    }
    
    // Check for duplicate emails
    const emails = formData.members.map(member => member.email);
    if (new Set(emails).size !== emails.length) {
      setError('Duplicate email addresses are not allowed');
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate emails
    if (!validateEmails()) {
      return;
    }
    
    try {
      // Use the TeamContext's createTeam function
      const teamData = {
        name: formData.name,
        members: formData.members
      };
      
      console.log('Creating team with data:', teamData);
      
      await createTeam(teamData);
      
      console.log('✅ Team created successfully');
      
      // Reset form
      setFormData({
        name: '',
        memberCount: 2,
        members: []
      });
      
      // Go back to step 1
      setStep(1);
      
      // Navigate to team page
      navigate('/team');
      
    } catch (err) {
      console.error('Error creating team:', err);
      setError(err.message || 'Failed to create team');
    }
  };

  const handleCreateAnother = () => {
    // Reset form for new team creation
    setFormData({
      name: '',
      memberCount: 2,
      members: []
    });
    setStep(1);
    setError('');
  };

  return (
    <div className="max-w-lg mx-auto mt-8">
      <h1 className="text-2xl font-bold text-white mb-6">
        {step === 1 ? 'Create New Team Vault' : 'Add Team Members'}
      </h1>
      
      <div className="bg-gray-800 rounded-lg p-6">
        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}
        
        {step === 1 ? (
          <form onSubmit={(e) => { e.preventDefault(); handleNextStep(); }}>
            <div className="mb-6">
              <label htmlFor="name" className="block text-white mb-2">Team Vault Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-gray-700 text-white border border-gray-600 rounded-md py-2 px-4 focus:outline-none focus:border-yellow-500"
                placeholder="Enter team vault name"
                disabled={teamState.loading}
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="memberCount" className="block text-white mb-2">Number of Additional Members</label>
              <input
                type="number"
                id="memberCount"
                name="memberCount"
                min="1"
                max="10"
                value={formData.memberCount}
                onChange={handleChange}
                className="w-full bg-gray-700 text-white border border-gray-600 rounded-md py-2 px-4 focus:outline-none focus:border-yellow-500"
                disabled={teamState.loading}
              />
              <p className="text-gray-400 text-sm mt-1">
                Total team size will be {totalTeamSize} (you + {formData.memberCount} additional members)
              </p>
              <p className="text-yellow-500 text-sm mt-1">
                Note: All team members must approve transactions with our MPC-based system.
              </p>
            </div>
            
            <div className="mt-8">
              <button
                type="submit"
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-md disabled:opacity-50"
                disabled={teamState.loading}
              >
                {teamState.loading ? 'Processing...' : 'Next: Add Team Members'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <div className="mb-4">
                <h3 className="text-lg font-medium text-white">Team Summary</h3>
                <p className="text-gray-400">
                  {formData.name} - Total {totalTeamSize} members
                </p>
              </div>
              
              <p className="text-white mb-3">All Team Members ({totalTeamSize})</p>
              <p className="text-gray-400 text-sm mb-4">
                Enter email addresses for all team members including yourself. Each member will receive a key shard via email for MPC-based approvals.
              </p>
              
              {formData.members.map((member, index) => (
                <div key={index} className="flex items-center mb-3">
                  <div className="flex-grow">
                    <input
                      type="email"
                      name="email"
                      value={member.email}
                      onChange={(e) => handleMemberChange(index, e)}
                      className="w-full bg-gray-700 text-white border border-gray-600 rounded-md py-2 px-4 focus:outline-none focus:border-yellow-500"
                      placeholder={index === 0 ? "Your email address (creator)" : "member@example.com"}
                      required
                      disabled={teamState.loading}
                    />
                    {index === 0 && (
                      <p className="text-xs text-gray-400 mt-1">This should be your email address (team creator)</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeMember(index)}
                    className="ml-2 text-gray-400 hover:text-red-400 disabled:opacity-50"
                    disabled={formData.members.length <= 2 || teamState.loading} // Don't allow removing if only 2 members left
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ))}
              
              <button
                type="button"
                onClick={addMember}
                className="flex items-center text-yellow-500 hover:text-yellow-600 mt-2 disabled:opacity-50"
                disabled={teamState.loading}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                </svg>
                Add Another Member
              </button>
            </div>
            
            <div className="mt-8 flex space-x-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-md disabled:opacity-50"
                disabled={teamState.loading}
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-md disabled:opacity-50"
                disabled={teamState.loading}
              >
                {teamState.loading ? 'Creating Team...' : 'Create Team Vault'}
              </button>
            </div>
          </form>
        )}
      </div>
      
      <div className="mt-4 text-center flex justify-between">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-400 hover:text-white disabled:opacity-50"
          disabled={teamState.loading}
        >
          Cancel
        </button>
        
        {/* Option to create another team */}
        <button
          onClick={handleCreateAnother}
          className="text-yellow-500 hover:text-yellow-400 disabled:opacity-50"
          disabled={teamState.loading}
        >
          Create Another Team Vault
        </button>
      </div>
    </div>
  );
};

export default CreateTeam;