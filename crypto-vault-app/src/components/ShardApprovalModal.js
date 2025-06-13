import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

const ShardApprovalModal = ({ show, onHide, onSubmit, loading }) => {
  const [shardValue, setShardValue] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!shardValue.trim()) {
      setError('Please enter a shard value');
      return;
    }

    onSubmit(shardValue.trim());
  };

  const handleClose = () => {
    setShardValue('');
    setError('');
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Enter Shard Value</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Shard Value</Form.Label>
            <Form.Control
              type="text"
              value={shardValue}
              onChange={(e) => {
                setShardValue(e.target.value);
                setError('');
              }}
              placeholder="Enter your shard value"
              isInvalid={!!error}
            />
            <Form.Control.Feedback type="invalid">
              {error}
            </Form.Control.Feedback>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default ShardApprovalModal; 