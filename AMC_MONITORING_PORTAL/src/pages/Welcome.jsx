import React from 'react';
import Card from '../components/Card';

const Welcome = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="text-center max-w-md w-full mx-auto animate-fade-in">
        <h1 className="text-3xl font-bold text-primary mb-4">
          Welcome to AMC Monitoring Portal
        </h1>
        <p className="text-gray-600 mb-6">
          Your one-stop solution for monitoring and managing AMC contracts
        </p>
        <div className="flex justify-center space-x-4 mt-8">
          <span className="inline-block w-3 h-3 rounded-full bg-status-success"></span>
          <span className="inline-block w-3 h-3 rounded-full bg-status-warning"></span>
          <span className="inline-block w-3 h-3 rounded-full bg-status-error"></span>
        </div>
      </Card>
    </div>
  );
};

export default Welcome;
