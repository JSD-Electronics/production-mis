import React from 'react';
import Link from 'next/link';

const NotAuthorized: React.FC = () => {
  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>403 - Not Authorized</h1>
      <p>You do not have permission to access this page.</p>
      <a href="/dashboard">
        <a>Go back to Home</a>
      </a>
    </div>
  );
};

export default NotAuthorized;
