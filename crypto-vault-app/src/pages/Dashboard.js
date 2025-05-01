import React from 'react';
import Balance from '../components/dashboard/Balance';
import TokenList from '../components/dashboard/TokenList';

const Dashboard = () => {
  return (
    <div>
      <div className="flex items-center justify-between">
        <Balance />
        {/* <div className="flex space-x-2">
          <button className="bg-yellow-800 hover:bg-yellow-700 text-white px-6 py-2 rounded-md flex items-center">
            <span className="mr-2">↑</span>
            Buy
          </button>
          <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-md flex items-center">
            <span className="mr-2">↓</span>
            Sell
          </button>
        </div> */}
      </div>
      <TokenList />
    </div>
  );
};

export default Dashboard;
