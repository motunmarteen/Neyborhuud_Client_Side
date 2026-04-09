'use client';

import React, { useState } from 'react';
import { Download, Loader } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

interface MediaDownloadButtonProps {
  mediaUrl: string;
  contentId?: string;
  fileName?: string;
  apiBaseUrl?: string;
  className?: string;
  iconSize?: number;
  showText?: boolean;
}

export default function MediaDownloadButton({
  mediaUrl,
  contentId,
  fileName,
  apiBaseUrl = API_BASE_URL,
  className = '',
  iconSize = 20,
  showText = false,
}: MediaDownloadButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setLoading(true);

    try {
      // Build download URL
      let downloadUrl = `${apiBaseUrl}/media/download?url=${encodeURIComponent(mediaUrl)}`;
      if (contentId) {
        downloadUrl += `&contentId=${contentId}`;
      }

      // Fetch the media
      const response = await fetch(downloadUrl);

      if (!response.ok) {
        throw new Error('Failed to download media');
      }

      // Get filename from Content-Disposition header or use provided/generated name
      const contentDisposition = response.headers.get('content-disposition');
      let downloadFileName = fileName || `media-${Date.now()}`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch) {
          downloadFileName = filenameMatch[1];
        }
      }

      // If no extension in filename, try to add one from content-type
      if (!downloadFileName.includes('.')) {
        const contentType = response.headers.get('content-type');
        if (contentType) {
          if (contentType.includes('image/jpeg') || contentType.includes('image/jpg')) {
            downloadFileName += '.jpg';
          } else if (contentType.includes('image/png')) {
            downloadFileName += '.png';
          } else if (contentType.includes('image/gif')) {
            downloadFileName += '.gif';
          } else if (contentType.includes('image/webp')) {
            downloadFileName += '.webp';
          } else if (contentType.includes('video/mp4')) {
            downloadFileName += '.mp4';
          } else if (contentType.includes('video/webm')) {
            downloadFileName += '.webm';
          }
        }
      }

      // Download the file
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = downloadFileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Media download error:', error);
      alert('Failed to download media. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/90 hover:bg-white text-gray-700 hover:text-blue-600 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      title="Download media"
    >
      {loading ? (
        <Loader className="animate-spin" size={iconSize} />
      ) : (
        <Download size={iconSize} />
      )}
      {showText && <span className="text-sm font-medium">Download</span>}
    </button>
  );
}

// Alternative: Icon-only button for overlay on images/videos
export function MediaDownloadIcon({
  mediaUrl,
  contentId,
  fileName,
  apiBaseUrl = API_BASE_URL,
}: MediaDownloadButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setLoading(true);

    try {
      let downloadUrl = `${apiBaseUrl}/media/download?url=${encodeURIComponent(mediaUrl)}`;
      if (contentId) {
        downloadUrl += `&contentId=${contentId}`;
      }

      const response = await fetch(downloadUrl);

      if (!response.ok) {
        throw new Error('Failed to download media');
      }

      const contentDisposition = response.headers.get('content-disposition');
      let downloadFileName = fileName || 'media';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch) {
          downloadFileName = filenameMatch[1];
        }
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = downloadFileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Media download error:', error);
      alert('Failed to download media. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="absolute top-2 right-2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-all z-10"
      title="Download"
    >
      {loading ? (
        <Loader className="animate-spin" size={18} />
      ) : (
        <Download size={18} />
      )}
    </button>
  );
}
