import React from 'react';
import Balance from '../components/dashboard/Balance';
import TokenList from '../components/dashboard/TokenList';

const Dashboard = () => {
  return (
    <div>
      <div className="flex items-center justify-between">
        <Balance />
      </div>
      <TokenList />
    </div>
  );
};

export default Dashboard;
