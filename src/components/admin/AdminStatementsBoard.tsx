import React, { useState, useEffect } from 'react';
import { DeletionStatement, AdminUser } from '../../types/admin';
import { getDeletionStatements } from '../../services/adminService';
import { FileText, Trash2, UserX, ShieldAlert, Calendar, User } from 'lucide-react';

interface AdminStatementsBoardProps {
  currentAdmin: AdminUser;
}

export const AdminStatementsBoard: React.FC<AdminStatementsBoardProps> = ({ currentAdmin }) => {
  const [statements, setStatements] = useState<DeletionStatement[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'user' | 'admin'>('all');

  useEffect(() => {
    setStatements(getDeletionStatements());
  }, []);

  const filteredStatements = statements.filter(
    (stmt) => filterType === 'all' || stmt.accountType === filterType
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-red-400 text-xs font-bold uppercase tracking-wider mb-1">
            <FileText className="w-4 h-4" />
            <span>Account Deletion Archive</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Exit Statements Board
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            View exit surveys and statements from users and administrators who have deleted their accounts or been removed.
          </p>
        </div>

        <div className="flex bg-slate-950 rounded-xl p-1 border border-slate-800">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
              filterType === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            All Accounts
          </button>
          <button
            onClick={() => setFilterType('user')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
              filterType === 'user' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Learners
          </button>
          <button
            onClick={() => setFilterType('admin')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
              filterType === 'admin' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Administrators
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStatements.length === 0 ? (
          <div className="col-span-full p-10 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-3">
            <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-500">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-slate-300 font-semibold">No Exit Statements Found</p>
              <p className="text-xs text-slate-500 mt-1">
                There are currently no records of account deletions matching this filter.
              </p>
            </div>
          </div>
        ) : (
          filteredStatements.map((stmt) => (
            <div key={stmt.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      stmt.accountType === 'admin' 
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {stmt.accountType === 'admin' ? <ShieldAlert className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white line-clamp-1">
                        {stmt.displayName || stmt.username}
                      </h4>
                      <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-mono">
                        <span>@{stmt.username}</span>
                        {stmt.role && (
                          <span className="uppercase text-purple-300 bg-purple-500/10 px-1 rounded">
                            {stmt.role}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-xs space-y-2">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <div className="text-[10px] uppercase text-slate-500 font-bold mb-1">Reason:</div>
                    <div className="font-semibold text-slate-300">
                      {stmt.reasonCategory.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </div>
                  </div>
                  
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <div className="text-[10px] uppercase text-slate-500 font-bold mb-1">Statement:</div>
                    <p className="text-slate-300 italic whitespace-pre-wrap">
                      "{stmt.statement}"
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex flex-col gap-1 text-[10px] text-slate-500 font-mono">
                <div className="flex items-center space-x-1.5">
                  <Calendar className="w-3 h-3" />
                  <span>Deleted: {new Date(stmt.deletedAt).toLocaleString()}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <User className="w-3 h-3" />
                  <span>By: {stmt.deletedBy === stmt.accountId ? 'Self-Deleted' : stmt.deletedBy}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
