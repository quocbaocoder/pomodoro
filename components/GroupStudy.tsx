import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Settings } from '../types';
import { VideoIcon } from './icons/VideoIcon';
import { VideoOffIcon } from './icons/VideoOffIcon';
import { MicIcon } from './icons/MicIcon';
import { MicOffIcon } from './icons/MicOffIcon';
import { PhoneOffIcon } from './icons/PhoneOffIcon';

// Helper icons (can be in their own files if preferred)
const CopyIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
);

interface GroupStudyProps {
  settings: Settings;
}

type View = 'lobby' | 'create' | 'join' | 'room';

const themeClasses = {
  cyan: { text: 'text-cyan-400', ring: 'focus:ring-cyan-500', bg: 'bg-cyan-600', hoverBg: 'hover:bg-cyan-500' },
  magenta: { text: 'text-fuchsia-400', ring: 'focus:ring-fuchsia-500', bg: 'bg-fuchsia-600', hoverBg: 'hover:bg-fuchsia-500' },
  green: { text: 'text-emerald-400', ring: 'focus:ring-emerald-500', bg: 'bg-emerald-600', hoverBg: 'hover:bg-emerald-500' },
};

const GroupStudy: React.FC<GroupStudyProps> = ({ settings }) => {
  const [view, setView] = useState<View>('lobby');
  const [roomCode, setRoomCode] = useState('');
  const [password, setPassword] = useState('');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [initialRoomCode, setInitialRoomCode] = useState('');
  const [showCopySuccess, setShowCopySuccess] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const currentTheme = themeClasses[settings.theme];
  const copySuccessTimer = useRef<number | null>(null);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#roomCode=')) {
        const code = hash.substring('#roomCode='.length);
        if (code) {
          setInitialRoomCode(code.toUpperCase());
          setView('join');
        }
      }
    };
    handleHashChange(); // Check on initial load
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const cleanupStream = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
  }, [localStream]);

  const startMedia = async () => {
    cleanupStream();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      setError(null); // Clear previous errors on success
      return stream;
    } catch (err) {
      console.error("Lỗi truy cập media:", err);
      let message = "Đã xảy ra lỗi không xác định. Vui lòng thử lại.";
      if (err instanceof DOMException) {
          switch (err.name) {
              case 'NotAllowedError':
              case 'PermissionDeniedError':
                  message = "Bạn đã từ chối quyền truy cập camera và microphone. Vui lòng cho phép truy cập trong cài đặt trình duyệt để tiếp tục.";
                  break;
              case 'NotFoundError':
                  message = "Không tìm thấy camera hoặc microphone. Vui lòng đảm bảo thiết bị của bạn đã được kết nối và hoạt động.";
                  break;
              case 'NotReadableError':
                  message = "Đã xảy ra lỗi khi truy cập camera/microphone. Một ứng dụng khác có thể đang sử dụng nó hoặc thiết bị bị lỗi.";
                  break;
              case 'AbortError':
                   message = "Yêu cầu truy cập thiết bị đã bị hủy bỏ. Vui lòng thử lại.";
                   break;
              default:
                  message = `Không thể truy cập camera và microphone. Lỗi: ${err.message}`;
          }
      }
      setError(message);
      return null;
    }
  };

  useEffect(() => {
    if (localStream && videoRef.current) {
      videoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  const handleCreateRoom = async (pass: string) => {
    const stream = await startMedia();
    if (stream) {
      setPassword(pass);
      setRoomCode(Math.random().toString(36).substring(2, 8).toUpperCase());
      setView('room');
    }
  };

  const handleJoinRoom = async (code: string, pass: string) => {
    if (!code.trim() || !pass.trim()) {
        setError("Mã phòng và mật khẩu không được để trống.");
        return;
    }
    const stream = await startMedia();
    if (stream) {
      setRoomCode(code);
      setPassword(pass);
      setView('room');
    }
  };

  const handleLeave = () => {
    cleanupStream();
    setView('lobby');
    setRoomCode('');
    setPassword('');
    setError(null);
    // Clear hash from URL
    history.pushState("", document.title, window.location.pathname + window.location.search);
  };
  
  useEffect(() => {
    return () => {
      cleanupStream(); // Cleanup on component unmount
      if (copySuccessTimer.current) {
        clearTimeout(copySuccessTimer.current);
      }
    };
  }, [cleanupStream]);

  const toggleMic = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => track.enabled = !track.enabled);
      setIsMicMuted(!isMicMuted);
    }
  };

  const toggleCamera = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => track.enabled = !track.enabled);
      setIsCameraOff(!isCameraOff);
    }
  };

  const Lobby = () => (
    <div className="text-center">
      <h1 className={`text-3xl font-bold ${currentTheme.text} mb-2`}>Học Nhóm</h1>
      <p className="text-slate-400 mb-8">Tạo hoặc tham gia một phòng học để kết nối với bạn bè.</p>
      <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
        <button onClick={() => setView('create')} className="p-8 bg-slate-800/60 rounded-2xl hover:bg-slate-750/60 transition-colors">
          <h2 className="text-2xl font-semibold mb-2">Tạo phòng mới</h2>
          <p className="text-slate-400">Tạo một phòng học riêng tư và mời người khác tham gia.</p>
        </button>
        <button onClick={() => setView('join')} className="p-8 bg-slate-800/60 rounded-2xl hover:bg-slate-750/60 transition-colors">
          <h2 className="text-2xl font-semibold mb-2">Tham gia phòng</h2>
          <p className="text-slate-400">Nhập mã phòng và mật khẩu để tham gia một buổi học.</p>
        </button>
      </div>
    </div>
  );

  const CreateOrJoin = ({ isJoin, initialCode }: { isJoin: boolean, initialCode?: string }) => {
    const [code, setCode] = useState(initialCode || '');
    const [pass, setPass] = useState('');

    useEffect(() => {
        if (isJoin && initialCode) {
            setCode(initialCode);
        }
    }, [isJoin, initialCode]);
    
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (isJoin) handleJoinRoom(code, pass);
      else handleCreateRoom(pass);
    };

    return (
      <div className="max-w-md mx-auto text-center">
        <h1 className={`text-3xl font-bold ${currentTheme.text} mb-8`}>{isJoin ? 'Tham gia phòng học' : 'Tạo phòng học mới'}</h1>
        <form onSubmit={handleSubmit} className="p-8 bg-slate-800/60 rounded-2xl space-y-4">
          {isJoin && <input type="text" value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="Nhập mã phòng" className={`w-full bg-slate-700 p-3 rounded-lg focus:outline-none focus:ring-2 ${currentTheme.ring}`} required />}
          <input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="Nhập mật khẩu" className={`w-full bg-slate-700 p-3 rounded-lg focus:outline-none focus:ring-2 ${currentTheme.ring}`} required />
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          <div className="flex gap-4 pt-4">
            <button type="button" onClick={() => setView('lobby')} className="w-full px-4 py-3 bg-slate-600 rounded-lg font-semibold hover:bg-slate-500 transition-colors">Quay lại</button>
            <button type="submit" className={`w-full px-4 py-3 rounded-lg font-semibold text-white ${currentTheme.bg} ${currentTheme.hoverBg} transition-colors`}>{isJoin ? 'Tham gia' : 'Tạo phòng'}</button>
          </div>
        </form>
      </div>
    );
  };
  
  const handleCopyInvite = () => {
    const shareableLink = `${window.location.origin}${window.location.pathname}#roomCode=${roomCode}`;
    const invitationText = `Tham gia nhóm học của tôi trên FocusFlow!\n\nMã phòng: ${roomCode}\nMật khẩu: ${password}\n\nTham gia tại: ${shareableLink}`;
    
    navigator.clipboard.writeText(invitationText).then(() => {
        setShowCopySuccess(true);
        if (copySuccessTimer.current) clearTimeout(copySuccessTimer.current);
        copySuccessTimer.current = window.setTimeout(() => setShowCopySuccess(false), 2000);
    }, (err) => {
        console.error('Không thể sao chép: ', err);
        alert('Không thể sao chép lời mời.');
    });
  };

  const Room = () => {
    return (
      <div className="flex flex-col h-full max-h-[calc(100vh-8rem)]">
        <div className="mb-4">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-slate-800/80 rounded-2xl">
                <div className="text-center sm:text-left">
                    <h2 className="text-xl font-bold">Mã phòng: <span className={`${currentTheme.text} font-mono`}>{roomCode}</span></h2>
                    <p className="text-sm text-slate-400">Mật khẩu: <span className="font-mono">{password}</span></p>
                </div>
                <button 
                    onClick={handleCopyInvite} 
                    className={`flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 rounded-lg font-semibold text-white transition-colors ${currentTheme.bg} ${currentTheme.hoverBg}`}
                >
                    <CopyIcon className="w-4 h-4" />
                    <span>Sao chép lời mời</span>
                </button>
            </div>
            {showCopySuccess && (
                <div className="mt-2 text-center text-sm text-green-400 transition-opacity duration-300">
                    Đã sao chép liên kết mời vào clipboard!
                </div>
            )}
        </div>
        <div className="flex-grow grid grid-cols-2 grid-rows-2 gap-4">
          <div className="col-span-2 row-span-2 md:col-span-1 md:row-span-2 bg-slate-950 rounded-2xl overflow-hidden relative flex items-center justify-center">
            <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${isCameraOff ? 'hidden' : ''}`} />
            {isCameraOff && (
              <div className="flex flex-col items-center text-slate-400 p-4 text-center">
                <VideoOffIcon className="w-16 h-16" />
                <span className="mt-2">Camera đang tắt</span>
              </div>
            )}
            <div className="absolute bottom-2 left-2 bg-black/50 text-white text-sm px-2 py-1 rounded">Bạn</div>
          </div>
          
          {/* Placeholder for other participants */}
          <div className="bg-slate-800 rounded-2xl flex items-center justify-center">
              <span className="text-slate-500">Đang chờ...</span>
          </div>
          <div className="bg-slate-800 rounded-2xl flex items-center justify-center">
              <span className="text-slate-500">Đang chờ...</span>
          </div>
        </div>
        {/* Controls */}
        <div className="mt-4 p-4 bg-slate-900/50 backdrop-blur-lg rounded-2xl flex justify-center items-center gap-4">
            <button onClick={toggleMic} className={`p-3 rounded-full ${isMicMuted ? 'bg-red-600' : 'bg-slate-700 hover:bg-slate-600'} transition-colors`}>
              {isMicMuted ? <MicOffIcon /> : <MicIcon />}
            </button>
            <button onClick={toggleCamera} className={`p-3 rounded-full ${isCameraOff ? 'bg-red-600' : 'bg-slate-700 hover:bg-slate-600'} transition-colors`}>
              {isCameraOff ? <VideoOffIcon /> : <VideoIcon />}
            </button>
            <button onClick={handleLeave} className="p-3 rounded-full bg-red-600 hover:bg-red-500 transition-colors">
              <PhoneOffIcon />
            </button>
        </div>
      </div>
    )
  };

  const renderContent = () => {
    switch(view) {
      case 'lobby': return <Lobby />;
      case 'create': return <CreateOrJoin isJoin={false} />;
      case 'join': return <CreateOrJoin isJoin={true} initialCode={initialRoomCode} />;
      case 'room': return <Room />;
    }
  };

  return <div className="h-full flex flex-col justify-center">{renderContent()}</div>;
};

export default GroupStudy;