
import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, Check } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (base64: string) => void;
  onCancel: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  useEffect(() => {
    async function startCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user', width: 640, height: 480 } 
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        alert("Could not access camera. Please ensure permissions are granted.");
        onCancel();
      }
    }
    startCamera();
    return () => {
      stream?.getTracks().forEach(track => track.stop());
    };
  }, []);

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg');
        setCapturedImage(dataUrl);
        // Stop stream once photo is taken
        stream?.getTracks().forEach(track => track.stop());
      }
    }
  };

  const handleRetake = async () => {
    setCapturedImage(null);
    const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
    setStream(mediaStream);
    if (videoRef.current) videoRef.current.srcObject = mediaStream;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl overflow-hidden max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="font-bold text-slate-800">Verification Selfie</h3>
          <button onClick={onCancel} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full">
            <X size={20} />
          </button>
        </div>
        
        <div className="relative aspect-video bg-slate-900 overflow-hidden">
          {!capturedImage ? (
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover mirror"
              style={{ transform: 'scaleX(-1)' }}
            />
          ) : (
            <img 
              src={capturedImage} 
              alt="Captured selfie" 
              className="w-full h-full object-cover" 
            />
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className="p-6 flex justify-center space-x-4">
          {!capturedImage ? (
            <button
              onClick={takePhoto}
              className="bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 transition-transform active:scale-95"
            >
              <Camera size={32} />
            </button>
          ) : (
            <>
              <button
                onClick={handleRetake}
                className="px-6 py-2 border-2 border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50"
              >
                Retake
              </button>
              <button
                onClick={() => onCapture(capturedImage)}
                className="px-6 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 flex items-center space-x-2"
              >
                <Check size={20} />
                <span>Confirm</span>
              </button>
            </>
          )}
        </div>
        <p className="px-6 pb-6 text-xs text-center text-slate-400">
          Ensure your face is clearly visible for attendance verification.
        </p>
      </div>
    </div>
  );
};
