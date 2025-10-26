import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Settings, TimerMode, Homework } from '../types';

interface TimerProps {
  settings: Settings;
  addSessionLog: (log: { subject: string; duration: number }) => void;
  homeworks: Homework[];
}

const ALARM_SOUND_URL = 'https://cdn.pixabay.com/audio/2022/03/15/audio_7020081b12.mp3';

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const themeClasses = {
  cyan: {
    text: 'text-cyan-400',
    bg: 'bg-cyan-600',
    hoverBg: 'hover:bg-cyan-500',
    shadow: 'shadow-cyan-600/30',
  },
  magenta: {
    text: 'text-fuchsia-400',
    bg: 'bg-fuchsia-600',
    hoverBg: 'hover:bg-fuchsia-500',
    shadow: 'shadow-fuchsia-600/30',
  },
  green: {
    text: 'text-emerald-400',
    bg: 'bg-emerald-600',
    hoverBg: 'hover:bg-emerald-500',
    shadow: 'shadow-emerald-600/30',
  },
};

const themeGradients = {
  cyan: { from: '#67e8f9', to: '#22d3ee' },
  magenta: { from: '#f0abfc', to: '#e879f9' },
  green: { from: '#6ee7b7', to: '#34d399' },
};

const Timer: React.FC<TimerProps> = ({ settings, addSessionLog, homeworks }) => {
  const [mode, setMode] = useState<TimerMode>(TimerMode.Focus);
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(settings.focusTime * 60);
  const [pomodoros, setPomodoros] = useState(0);
  const [selectedSubject, setSelectedSubject] = useState<string>('Học chung');

  const alarmAudioRef = useRef<HTMLAudioElement>(null);
  const prevMode = useRef(mode);

  const { focusTime, shortBreak, longBreak, pomodorosPerCycle, autoStartBreaks, autoStartPomodoros, theme, alarmSoundUrl } = settings;

  const currentTheme = themeClasses[theme];
  const currentGradient = themeGradients[theme];

  useEffect(() => {
    const isModeChange = prevMode.current !== mode;
    if (isModeChange) {
      switch (mode) {
        case TimerMode.Focus:
          setTimeLeft(focusTime * 60);
          break;
        case TimerMode.ShortBreak:
          setTimeLeft(shortBreak * 60);
          break;
        case TimerMode.LongBreak:
          setTimeLeft(longBreak * 60);
          break;
      }
    }
    prevMode.current = mode;
  }, [mode, focusTime, shortBreak, longBreak]);

  const nextMode = useCallback(() => {
    if (alarmAudioRef.current) {
      if (alarmAudioRef.current.error) {
        console.warn(`Không thể phát báo thức: không tải được tệp âm thanh. Vui lòng kiểm tra cài đặt hoặc kết nối internet.`);
      } else {
        alarmAudioRef.current.play().catch(e => console.error("Phát báo thức thất bại. Điều này có thể do các hạn chế tự động phát của trình duyệt.", e));
      }
    }

    if (mode === TimerMode.Focus) {
        const newPomodoros = pomodoros + 1;
        addSessionLog({ subject: selectedSubject, duration: focusTime });
        setPomodoros(newPomodoros);

        const nextIsLongBreak = newPomodoros > 0 && newPomodoros % pomodorosPerCycle === 0;

        if (nextIsLongBreak) {
            setMode(TimerMode.LongBreak);
        } else {
            setMode(TimerMode.ShortBreak);
        }
        setIsActive(autoStartBreaks);
    } else {
        if (mode === TimerMode.LongBreak) {
            setPomodoros(0); 
        }
        setMode(TimerMode.Focus);
        setIsActive(autoStartPomodoros);
    }
  }, [mode, pomodoros, addSessionLog, selectedSubject, focusTime, pomodorosPerCycle, autoStartBreaks, autoStartPomodoros]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      nextMode();
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, nextMode]);

  const handleStartPause = () => {
    setIsActive(!isActive);
  };

  const handleReset = () => {
    setIsActive(false);
    switch (mode) {
      case TimerMode.Focus:
        setTimeLeft(focusTime * 60);
        break;
      case TimerMode.ShortBreak:
        setTimeLeft(shortBreak * 60);
        break;
      case TimerMode.LongBreak:
        setTimeLeft(longBreak * 60);
        break;
    }
  };
  
  const modeTextMap = {
    [TimerMode.Focus]: 'Tập trung',
    [TimerMode.ShortBreak]: 'Nghỉ ngắn',
    [TimerMode.LongBreak]: 'Nghỉ dài',
  };
  
  const totalDuration = useMemo(() => {
    switch (mode) {
      case TimerMode.Focus:
        return focusTime * 60;
      case TimerMode.ShortBreak:
        return shortBreak * 60;
      case TimerMode.LongBreak:
        return longBreak * 60;
      default:
        return focusTime * 60;
    }
  }, [mode, focusTime, shortBreak, longBreak]);

  const progress = totalDuration > 0 ? ((totalDuration - timeLeft) / totalDuration) * 100 : 0;
  
  const availableSubjects = ['Học chung', ...Array.from(new Set(homeworks.filter(h => !h.completed).map(h => h.subject)))];
  
  const embedUrl = useMemo(() => {
    const { musicPlaylistType, musicPlaylistUrl } = settings;
    if (!musicPlaylistUrl) return '';

    if (musicPlaylistType === 'spotify') {
      const match = musicPlaylistUrl.match(/playlist\/([a-zA-Z0-9]+)/);
      const playlistId = match ? match[1] : null;
      return playlistId ? `https://open.spotify.com/embed/playlist/${playlistId}` : '';
    }

    if (musicPlaylistType === 'youtube') {
      try {
        const url = new URL(musicPlaylistUrl);
        const playlistId = url.searchParams.get('list');
        return playlistId ? `https://www.youtube.com/embed/videoseries?list=${playlistId}` : '';
      } catch (error) {
        console.error("URL YouTube không hợp lệ:", error);
        return '';
      }
    }
    return '';
  }, [settings.musicPlaylistType, settings.musicPlaylistUrl]);

  const pomodorosCompletedInCycle = (pomodoros > 0 && pomodoros % pomodorosPerCycle === 0)
    ? pomodorosPerCycle
    : pomodoros % pomodorosPerCycle;

  return (
    <>
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="relative w-full max-w-sm p-8 bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-[2.5rem] shadow-2xl shadow-black/20 space-y-6">
          <h2 className={`text-2xl font-bold ${currentTheme.text}`}>{modeTextMap[mode]}</h2>
          
          <div className="relative w-64 h-64 mx-auto">
            <svg className="w-full h-full" viewBox="0 0 100 100">
               <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={currentGradient.from} />
                  <stop offset="100%" stopColor={currentGradient.to} />
                </linearGradient>
              </defs>
              <circle className="text-slate-700" strokeWidth="7" cx="50" cy="50" r="45" fill="transparent"></circle>
              <circle 
                className="transition-all duration-500" 
                stroke="url(#progressGradient)"
                strokeWidth="7" 
                strokeDasharray="283"
                strokeDashoffset={283 - (progress / 100 * 283)}
                cx="50" cy="50" r="45" fill="transparent"
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
              ></circle>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-6xl font-mono font-bold tracking-tighter">{formatTime(timeLeft)}</span>
              <span className="text-sm text-slate-400 mt-2">Pomodoro: {pomodorosCompletedInCycle}/{pomodorosPerCycle}</span>
            </div>
          </div>

          {mode === TimerMode.Focus && (
            <div className="w-full">
              <label htmlFor="subject-select" className="sr-only">Chọn môn học</label>
              <select
                id="subject-select"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                disabled={isActive}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 px-3 text-center text-slate-100 focus:ring-2 focus:ring-cyan-500 focus:outline-none disabled:opacity-50"
              >
                {availableSubjects.map(subject => <option key={subject} value={subject}>{subject}</option>)}
              </select>
            </div>
          )}

          <div className="flex justify-center space-x-4">
            <button onClick={handleReset} className="px-6 py-3 bg-slate-700 rounded-xl font-semibold hover:bg-slate-600 transition-colors">Đặt lại</button>
            <button onClick={handleStartPause} className={`px-8 py-3 rounded-xl font-bold text-lg text-white ${currentTheme.bg} ${currentTheme.hoverBg} transition-colors shadow-lg ${currentTheme.shadow}`}>
              {isActive ? 'Tạm dừng' : 'Bắt đầu'}
            </button>
            <button onClick={nextMode} className="px-6 py-3 bg-slate-700 rounded-xl font-semibold hover:bg-slate-600 transition-colors">Bỏ qua</button>
          </div>

          {isActive && mode === TimerMode.Focus && embedUrl && (
            <div className="mt-6 w-full">
              <iframe
                  src={embedUrl}
                  width="100%"
                  height="80"
                  frameBorder="0"
                  allow="encrypted-media"
                  title="Music Player"
                  className="rounded-lg"
              ></iframe>
            </div>
          )}
        </div>
        <audio ref={alarmAudioRef} src={alarmSoundUrl || ALARM_SOUND_URL} preload="auto" key={alarmSoundUrl} />
      </div>
    </>
  );
};

export default Timer;
