import React, { useState } from 'react';

const ShardUploadModal = ({ isOpen, onClose, onSubmit }) => {
  const [shardValue, setShardValue] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(shardValue);
    setShardValue('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h3 className="text-xl font-bold text-white mb-4">Upload Shard</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="shard" className="block text-gray-300 mb-2">
              Enter your shard value
            </label>
            <input
              id="shard"
              type="text"
              value={shardValue}
              onChange={(e) => setShardValue(e.target.value)}
              className="w-full bg-gray-700 text-white border border-gray-600 rounded-md py-2 px-4 focus:outline-none focus:border-yellow-500"
              placeholder="Enter your shard value"
              required
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShardUploadModal; 