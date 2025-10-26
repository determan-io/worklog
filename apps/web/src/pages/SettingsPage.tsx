import React from 'react';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">
          Manage your account and preferences
        </p>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Account Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input type="email" className="input mt-1" placeholder="your@email.com" />
          </div>
          <div>
            <label className="label">First Name</label>
            <input type="text" className="input mt-1" placeholder="John" />
          </div>
          <div>
            <label className="label">Last Name</label>
            <input type="text" className="input mt-1" placeholder="Doe" />
          </div>
          <button className="btn-primary btn-md">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
