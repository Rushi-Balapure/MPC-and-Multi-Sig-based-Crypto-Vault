import React, { useState } from 'react';
import { Card, Button, Badge } from 'react-bootstrap';
import { useTeam } from '../context/TeamContext';
import { useAuth } from '../context/AuthContext';
import ShardApprovalModal from './ShardApprovalModal';

const TransactionList = ({ transactions, onRefresh }) => {
  const { approveTransaction } = useTeam();
  const { user } = useAuth();
  const [showShardModal, setShowShardModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleApprove = (transaction) => {
    setSelectedTransaction(transaction);
    setShowShardModal(true);
  };

  const handleShardSubmit = async (shardValue) => {
    if (!selectedTransaction || !shardValue) {
      console.error('Missing transaction or shard value');
      return;
    }

    setLoading(true);
    try {
      await approveTransaction(selectedTransaction.id, {
        email: user.email,
        teamId: selectedTransaction.teamId,
        shardValue: shardValue
      });
      setShowShardModal(false);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error approving transaction:', error);
    } finally {
      setLoading(false);
      setSelectedTransaction(null);
    }
  };

  const handleModalClose = () => {
    setShowShardModal(false);
    setSelectedTransaction(null);
  };

  return (
    <>
      <div className="transaction-list">
        {transactions.map((transaction) => (
          <Card key={transaction.id} className="mb-3">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="mb-1">{transaction.amount} {transaction.currency}</h5>
                  <p className="mb-1">To: {transaction.recipient}</p>
                  <p className="mb-1">From: {transaction.initiatedBy?.email}</p>
                  <p className="mb-1">Created: {new Date(transaction.createdAt).toLocaleString()}</p>
                </div>
                <div className="text-end">
                  <Badge bg={transaction.status === 'pending' ? 'warning' : 'success'} className="mb-2">
                    {transaction.status}
                  </Badge>
                  {transaction.status === 'pending' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleApprove(transaction)}
                      disabled={loading}
                    >
                      Approve
                    </Button>
                  )}
                </div>
              </div>
            </Card.Body>
          </Card>
        ))}
      </div>

      <ShardApprovalModal
        show={showShardModal}
        onHide={handleModalClose}
        onSubmit={handleShardSubmit}
        loading={loading}
      />
    </>
  );
};

export default TransactionList; 