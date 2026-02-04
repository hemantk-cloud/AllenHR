import React, { useState, useEffect } from 'react';
import { MapPin, Clock, ArrowRightCircle, ArrowLeftCircle, Loader2, ShieldCheck, ShieldAlert, Camera } from 'lucide-react';
import { CameraCapture } from './CameraCapture';

interface PunchCardProps {
  isPunchedIn: boolean;
  onPunch: (location: { lat: number; lng: number }, selfie: string) => void;
  isLoading: boolean;
}

// Office Coordinates
const OFFICE_LOCATION = {
  lat: 25.13745,
  lng: 75.85537,
  address: "One Biz Square, Kota"
};

const RADIUS_METERS = 700; // Allowed radius around the office updated to 100m

// Haversine formula to calculate distance in meters
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // in metres
}

export const PunchCard: React.FC<PunchCardProps> = ({ isPunchedIn, onPunch, isLoading }) => {
  const [time, setTime] = useState(new Date());
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locError, setLocError] = useState<string | null>(null);
  const [isWithinRange, setIsWithinRange] = useState<boolean | null>(null);
  const [showCamera, setShowCamera] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const currentLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLocation(currentLoc);
        const distance = getDistance(
          currentLoc.lat, 
          currentLoc.lng, 
          OFFICE_LOCATION.lat, 
          OFFICE_LOCATION.lng
        );
        setIsWithinRange(distance <= RADIUS_METERS);
      },
      (err) => {
        setLocError(err.message);
        setIsWithinRange(false);
      },
      { enableHighAccuracy: true }
    );

    return () => {
      clearInterval(timer);
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  const handlePunchClick = () => {
    if (!isWithinRange) {
      // Trigger short error haptic
      if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]);
      alert("You are not within the office premises. Punch in/out is only allowed at One Biz Square.");
      return;
    }
    // Success haptic
    if ('vibrate' in navigator) navigator.vibrate(50);
    setShowCamera(true);
  };

  const handleCapture = (selfie: string) => {
    setShowCamera(false);
    // Double vibrate on final confirmation
    if ('vibrate' in navigator) navigator.vibrate([50, 30, 50]);
    onPunch(location!, selfie);
  };

  return (
    <>
      <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 rounded-3xl shadow-xl text-white relative overflow-hidden">
        {/* Background Decor */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-indigo-400 opacity-10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl mb-6">
            <Clock size={40} className="text-white" />
          </div>
          
          <h2 className="text-5xl font-bold tracking-tight mb-2">
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </h2>
          <p className="text-indigo-100 mb-6 font-medium">
            {time.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>

          <div className={`flex items-center space-x-2 px-4 py-2 rounded-full text-xs mb-8 transition-colors ${
            isWithinRange === true ? 'bg-emerald-500/20 text-emerald-100 border border-emerald-500/30' : 
            isWithinRange === false ? 'bg-rose-500/20 text-rose-100 border border-rose-500/30' : 
            'bg-black/10 text-indigo-100'
          }`}>
            {isWithinRange === true ? <ShieldCheck size={14} /> : isWithinRange === false ? <ShieldAlert size={14} /> : <MapPin size={14} />}
            <span>
              {isWithinRange === true ? 'Within Office Range' : 
               isWithinRange === false ? 'Outside Office Range' : 
               'Checking Location...'}
            </span>
          </div>

          <button
            onClick={handlePunchClick}
            disabled={isLoading || isWithinRange === null}
            className={`group relative flex items-center space-x-3 px-12 py-5 rounded-2xl font-bold text-lg transition-all transform active:scale-95 shadow-lg ${
              isPunchedIn 
              ? 'bg-rose-500 hover:bg-rose-600 text-white' 
              : 'bg-white hover:bg-indigo-50 text-indigo-600'
            } ${isWithinRange === false ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={24} />
            ) : isPunchedIn ? (
              <ArrowLeftCircle size={24} className="group-hover:-translate-x-1 transition-transform" />
            ) : (
              <ArrowRightCircle size={24} className="group-hover:translate-x-1 transition-transform" />
            )}
            <span>{isPunchedIn ? 'Verify & Punch Out' : 'Verify & Punch In'}</span>
          </button>
          
          <div className="mt-8 text-xs space-y-2 opacity-80">
            <p className="font-bold text-indigo-200">Mandatory Verification:</p>
            <p className="max-w-xs leading-relaxed">
              Camera capture and GPS validation are mandatory for every session.
            </p>
            {location && (
              <p className="bg-black/10 rounded px-2 py-1 inline-block">
                Coords: {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
              </p>
            )}
          </div>
        </div>
      </div>

      {showCamera && (
        <CameraCapture 
          onCapture={handleCapture} 
          onCancel={() => setShowCamera(false)} 
        />
      )}
    </>
  );
};
