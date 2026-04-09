'use client';

import React, { useState } from 'react';
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
      // Check if user is authenticated
      if (!apiClient.isAuthenticated()) {
        throw new Error('You must be logged in to export data');
      }

      let url = `/auth/export-data/download/${format}`;
      if (format === 'csv') {
        url += `?type=${csvType}`;
      }

      // Use fetch with the token from apiClient for file download
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

      // Get filename from Content-Disposition header or generate one
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `neyborhuud-export-${Date.now()}.${format}`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Download the file
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
      // Check if user is authenticated
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
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Download My Data</h2>
        <p className="text-gray-600 text-sm">
          Export all your personal data from NeyborHuud. This includes your profile, posts, messages, trips, and more.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}

      {emailSent && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
          Export has been sent to your email!
        </div>
      )}

      {/* Format Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Export Format
        </label>
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => setFormat('zip')}
            className={`p-4 border-2 rounded-lg flex flex-col items-center transition-all ${
              format === 'zip'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <FileArchive className="w-8 h-8 mb-2" />
            <span className="font-medium">ZIP</span>
            <span className="text-xs text-gray-500 mt-1">Complete archive</span>
          </button>

          <button
            onClick={() => setFormat('json')}
            className={`p-4 border-2 rounded-lg flex flex-col items-center transition-all ${
              format === 'json'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <FileText className="w-8 h-8 mb-2" />
            <span className="font-medium">JSON</span>
            <span className="text-xs text-gray-500 mt-1">Structured data</span>
          </button>

          <button
            onClick={() => setFormat('csv')}
            className={`p-4 border-2 rounded-lg flex flex-col items-center transition-all ${
              format === 'csv'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Table className="w-8 h-8 mb-2" />
            <span className="font-medium">CSV</span>
            <span className="text-xs text-gray-500 mt-1">Spreadsheet</span>
          </button>
        </div>
      </div>

      {/* CSV Type Selection */}
      {format === 'csv' && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Data Type
          </label>
          <select
            value={csvType}
            onChange={(e) => setCsvType(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <h3 className="font-medium text-blue-900 mb-2">What's Included?</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Profile information & settings</li>
          <li>• All posts, comments, and likes</li>
          <li>• Messages and conversations</li>
          <li>• Safety data (trips, alerts, guardians)</li>
          <li>• Marketplace listings and jobs</li>
          <li>• Activity history and points</li>
        </ul>
      </div>

      {/* Privacy Notice */}
      <p className="mt-4 text-xs text-gray-500 text-center">
        Your data export may take a few moments to generate. This feature complies with NDPR (Nigerian Data Protection Regulation).
      </p>
    </div>
  );
}
