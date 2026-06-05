'use client';

import { useState } from 'react';
import { Download, Mail, FileText, FileArchive, Table, Loader } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';
import apiClient from '@/lib/api-client';

interface DataExportProps {
  apiBaseUrl?: string;
}

export default function DataExportComponent({ apiBaseUrl = API_BASE_URL }: DataExportProps) {
  const [loading, setLoading] = useState(false);
  const [format, setFormat] = useState<'json' | 'zip' | 'csv'>('zip');
  const [csvType, setCsvType] = useState('posts');
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');

  const handleDownloadExport = async () => {
    setLoading(true);
    setError('');

    try {
      if (!apiClient.isAuthenticated()) {
        throw new Error('You must be logged in to export data');
      }

      let url = `/auth/export-data/download/${format}`;
      if (format === 'csv') {
        url += `?type=${csvType}`;
      }

      const token = localStorage.getItem('neyborhuud_access_token') ||
                    sessionStorage.getItem('neyborhuud_access_token');

      const response = await fetch(`${apiBaseUrl}${url}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to download export');
      }

      const contentDisposition = response.headers.get('content-disposition');
      let filename = `neyborhuud-export-${Date.now()}.${format}`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

    } catch (err: any) {
      setError(err.message || 'Failed to download export');
      console.error('Export download error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailExport = async () => {
    setLoading(true);
    setError('');
    setEmailSent(false);

    try {
      if (!apiClient.isAuthenticated()) {
        throw new Error('You must be logged in to export data');
      }

      const response = await apiClient.post('/auth/export-data/email', { format: 'zip' });

      if (!response.success) {
        throw new Error(response.message || 'Failed to send email');
      }

      setEmailSent(true);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to send email';
      setError(errorMessage);
      console.error('Email export error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 rounded-2xl bg-white/5 border border-white/10">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white mb-1">Download My Data</h2>
        <p className="text-white/50 text-sm">
          Export all your personal data from NeyborHuud. Includes your profile, posts, messages, trips, and more.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-status-danger/8 border border-status-danger/30 rounded-xl text-status-danger text-sm">
          {error}
        </div>
      )}

      {emailSent && (
        <div className="mb-4 p-3 bg-status-success/10 border border-status-success/30 rounded-xl text-status-success text-sm">
          Export has been sent to your email!
        </div>
      )}

      {/* Format Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-white/60 mb-3">
          Export Format
        </label>
        <div className="grid grid-cols-3 gap-3">
          {(['zip', 'json', 'csv'] as const).map((f) => {
            const Icon = f === 'zip' ? FileArchive : f === 'json' ? FileText : Table;
            const label = f === 'zip' ? 'ZIP' : f === 'json' ? 'JSON' : 'CSV';
            const subtitle = f === 'zip' ? 'Complete archive' : f === 'json' ? 'Structured data' : 'Spreadsheet';
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFormat(f)}
                className={`p-4 border-2 rounded-xl flex flex-col items-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue ${
                  format === f
                    ? 'border-brand-blue bg-brand-blue/10 text-brand-blue'
                    : 'border-white/10 text-white/60 hover:border-white/25 hover:text-white'
                }`}
              >
                <Icon className="w-7 h-7 mb-2" />
                <span className="font-medium text-sm">{label}</span>
                <span className="text-xs text-white/40 mt-0.5">{subtitle}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* CSV Type Selection */}
      {format === 'csv' && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-white/60 mb-2">
            Data Type
          </label>
          <select
            value={csvType}
            onChange={(e) => setCsvType(e.target.value)}
            className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
          >
            <option value="posts">Posts</option>
            <option value="comments">Comments</option>
            <option value="messages">Messages</option>
            <option value="trips">Trips</option>
            <option value="points">Points History</option>
            <option value="notifications">Notifications</option>
          </select>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleDownloadExport}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-brand-blue text-white rounded-xl font-medium hover:bg-brand-blue/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 focus-visible:ring-offset-brand-black"
        >
          {loading ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              <span>Download</span>
            </>
          )}
        </button>

        <button
          onClick={handleEmailExport}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white/8 text-white rounded-xl font-medium hover:bg-white/12 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        >
          {loading ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              <span>Sending...</span>
            </>
          ) : (
            <>
              <Mail className="w-5 h-5" />
              <span>Email Me</span>
            </>
          )}
        </button>
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-brand-blue/8 border border-brand-blue/20 rounded-xl">
        <h3 className="font-medium text-white mb-2 text-sm">What's Included?</h3>
        <ul className="text-sm text-white/60 space-y-1">
          <li>• Profile information &amp; settings</li>
          <li>• All posts, comments, and likes</li>
          <li>• Messages and conversations</li>
          <li>• Safety data (trips, alerts, guardians)</li>
          <li>• Marketplace listings and jobs</li>
          <li>• Activity history and points</li>
        </ul>
      </div>

      <p className="mt-4 text-xs text-white/30 text-center">
        Your data export may take a few moments to generate. Complies with NDPR (Nigerian Data Protection Regulation).
      </p>
    </div>
  );
}
