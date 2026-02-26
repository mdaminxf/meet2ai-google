import { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Mic, MicOff, Video, VideoOff, ArrowRight } from 'lucide-react';

interface PreJoinPageProps {
  onJoin: () => void;
}

export default function PreJoinPage({ onJoin }: PreJoinPageProps) {
  const [micOn, setMicOn] = useState(false);
  const [videoOn, setVideoOn] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initial setup - try to get permissions
    const initMedia = async () => {
      try {
        setError(null);
        const newStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setStream(newStream);
        setMicOn(true);
        setVideoOn(true);
        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
        }
      } catch (e: any) {
        console.error("Error accessing media devices:", e);
        if (e.name === 'NotAllowedError' || e.name === 'PermissionDismissedError') {
          setError("Camera/Microphone access denied. Please enable permissions in your browser settings.");
        } else if (e.name === 'NotFoundError') {
          setError("No camera or microphone found on this device.");
        } else {
          setError("Could not access media devices. You can still join without them.");
        }
      }
    };
    initMedia();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const toggleMic = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !micOn;
        setMicOn(!micOn);
      }
    }
  };

  const toggleVideo = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoOn;
        setVideoOn(!videoOn);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#202124] flex items-center justify-center p-4">
      <div className="max-w-4xl w-full flex flex-col md:flex-row gap-8 items-center">
        
        {/* Preview Container */}
        <div className="flex-1 w-full max-w-xl">
          <div className="relative aspect-video bg-[#3c4043] rounded-2xl overflow-hidden shadow-2xl border border-gray-700">
            {error ? (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gray-800">
                <VideoOff size={48} className="text-red-500 mb-4" />
                <p className="text-white font-medium mb-2">Media Access Error</p>
                <p className="text-gray-400 text-sm">{error}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="mt-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : videoOn ? (
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover transform scale-x-[-1]"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-gray-600 flex items-center justify-center">
                  <VideoOff size={40} className="text-gray-400" />
                </div>
              </div>
            )}
            
            {!error && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
                <button 
                  onClick={toggleMic}
                  className={`p-4 rounded-full ${micOn ? 'bg-[#3c4043] hover:bg-[#4d5155] border border-gray-500' : 'bg-red-600 hover:bg-red-700 border-none'} text-white transition-all`}
                >
                  {micOn ? <Mic size={24} /> : <MicOff size={24} />}
                </button>
                <button 
                  onClick={toggleVideo}
                  className={`p-4 rounded-full ${videoOn ? 'bg-[#3c4043] hover:bg-[#4d5155] border border-gray-500' : 'bg-red-600 hover:bg-red-700 border-none'} text-white transition-all`}
                >
                  {videoOn ? <Video size={24} /> : <VideoOff size={24} />}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Join Controls */}
        <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left space-y-6">
          <h1 className="text-3xl md:text-4xl font-bold text-white">Ready to join?</h1>
          <p className="text-gray-400 text-lg">
            You are about to enter the AI Classroom. Check your audio and video settings before joining.
          </p>
          
          <button 
            onClick={() => {
              // Stop local preview stream before joining so the main app can take over
              if (stream) {
                stream.getTracks().forEach(track => track.stop());
              }
              onJoin();
            }}
            className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white transition-all duration-200 bg-blue-600 font-pj rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 hover:bg-blue-700"
          >
            Join Class Now
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

      </div>
    </div>
  );
}
