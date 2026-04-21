'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/lib/api-client';

interface LocationSettingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocation?: {
    latitude?: number;
    longitude?: number;
    lga?: string;
    state?: string;
    neighborhood?: string;
  };
}

export function LocationSettingModal({ isOpen, onClose, currentLocation }: LocationSettingModalProps) {
  const { user } = useAuth();
  const [useGPS, setUseGPS] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Manual entry fields
  const [latitude, setLatitude] = useState<string>(currentLocation?.latitude?.toString() || '');
  const [longitude, setLongitude] = useState<string>(currentLocation?.longitude?.toString() || '');
  const [lga, setLga] = useState(currentLocation?.lga || '');
  const [state, setState] = useState(currentLocation?.state || '');
  const [neighborhood, setNeighborhood] = useState(currentLocation?.neighborhood || '');

  useEffect(() => {
    if (currentLocation) {
      setLatitude(currentLocation.latitude?.toString() || '');
      setLongitude(currentLocation.longitude?.toString() || '');
      setLga(currentLocation.lga || '');
      setState(currentLocation.state || '');
      setNeighborhood(currentLocation.neighborhood || '');
    }
  }, [currentLocation]);

  const handleGetCurrentLocation = () => {
    setIsLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(6));
        setLongitude(position.coords.longitude.toFixed(6));
        setIsLoading(false);
        setUseGPS(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setError('Unable to get your location. Please allow location access.');
        setIsLoading(false);
      }
    );
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);

      if (isNaN(lat) || isNaN(lng)) {
        setError('Please enter valid coordinates');
        setIsLoading(false);
        return;
      }

      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        setError('Coordinates out of valid range');
        setIsLoading(false);
        return;
      }

      const locationData = {
        type: 'current',
        location: {
          latitude: lat,
          longitude: lng,
          lga: lga.trim() || undefined,
          state: state.trim() || undefined,
          neighborhood: neighborhood.trim() || undefined,
        },
      };

      await apiClient.put('/auth/location/update', locationData);
      setSuccess(true);
      
      setTimeout(() => {
        onClose();
        window.location.reload(); // Refresh to show new location
      }, 1500);
    } catch (err: any) {
      console.error('Location update error:', err);
      setError(err.response?.data?.message || 'Failed to update location');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative neu-base rounded-3xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold" style={{ color: 'var(--neu-text)' }}>
            Set Your Location
          </h2>
          <button
            onClick={onClose}
            className="neu-btn-circle p-2"
            disabled={isLoading}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
          </button>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-4 p-3 rounded-xl bg-green-100 border border-green-300">
            <p className="text-sm font-medium text-green-800">
              ✓ Location updated successfully!
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-100 border border-red-300">
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        )}

        {/* GPS Button */}
        <button
          onClick={handleGetCurrentLocation}
          disabled={isLoading}
          className="w-full neu-btn rounded-2xl p-4 mb-6 flex items-center justify-center gap-2 font-semibold text-primary transition-colors hover:bg-primary/5"
        >
          <span className="material-symbols-outlined">my_location</span>
          {isLoading && useGPS ? 'Getting Location...' : 'Use Current Location (GPS)'}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-black/10" />
          <span className="text-sm" style={{ color: 'var(--neu-text-muted)' }}>or enter manually</span>
          <div className="flex-1 h-px bg-black/10" />
        </div>

        {/* Manual Entry Form */}
        <div className="space-y-4">
          {/* Coordinates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--neu-text)' }}>
                Latitude *
              </label>
              <input
                type="number"
                step="any"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="6.5244"
                disabled={isLoading}
                className="w-full neu-socket rounded-xl px-4 py-3 font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary/30"
                style={{ color: 'var(--neu-text)' }}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--neu-text)' }}>
                Longitude *
              </label>
              <input
                type="number"
                step="any"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="3.3792"
                disabled={isLoading}
                className="w-full neu-socket rounded-xl px-4 py-3 font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary/30"
                style={{ color: 'var(--neu-text)' }}
              />
            </div>
          </div>

          {/* State */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--neu-text)' }}>
              State
            </label>
            <input
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="Lagos"
              disabled={isLoading}
              className="w-full neu-socket rounded-xl px-4 py-3 font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary/30"
              style={{ color: 'var(--neu-text)' }}
            />
          </div>

          {/* LGA */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--neu-text)' }}>
              LGA (Local Government Area)
            </label>
            <input
              type="text"
              value={lga}
              onChange={(e) => setLga(e.target.value)}
              placeholder="Alimosho"
              disabled={isLoading}
              className="w-full neu-socket rounded-xl px-4 py-3 font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary/30"
              style={{ color: 'var(--neu-text)' }}
            />
          </div>

          {/* Neighborhood */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--neu-text)' }}>
              Neighborhood
            </label>
            <input
              type="text"
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              placeholder="Ikeja"
              disabled={isLoading}
              className="w-full neu-socket rounded-xl px-4 py-3 font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary/30"
              style={{ color: 'var(--neu-text)' }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 neu-btn rounded-2xl px-6 py-3 font-semibold transition-colors"
            style={{ color: 'var(--neu-text-muted)' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading || !latitude || !longitude}
            className="flex-1 neu-btn-raised rounded-2xl px-6 py-3 font-semibold text-white transition-all disabled:opacity-50"
            style={{ background: 'var(--primary)' }}
          >
            {isLoading ? 'Saving...' : 'Save Location'}
          </button>
        </div>

        {/* Helper Text */}
        <p className="text-xs text-center mt-4" style={{ color: 'var(--neu-text-muted)' }}>
          Your location will be used to show you nearby content and help others find you.
        </p>
      </div>
    </div>
  );
}
