import React from 'react';

export default function AdminPortal({ currentUser, onLogout }) {
  return (
    <div className="min-h-[60vh] bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center max-w-lg w-full">
        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
          A
        </div>
        <h2 className="text-xl font-bold text-slate-800">System Admin Portal</h2>
        <p className="text-sm text-slate-500 mt-2">
          This module is co-developed with Member 1 (Audit Logs) and Member 2 (Doctor approvals).
        </p>
        <div className="mt-4 p-3 bg-indigo-50 rounded-xl text-xs text-indigo-700 font-mono">
          Branches: feature/member1-patient-management & feature/member2-doctor-admin
        </div>
        <p className="text-xs text-slate-400 mt-3">
          Once feature branches are merged into develop, the full Admin Portal will appear here.
        </p>
      </div>
    </div>
  );
}
