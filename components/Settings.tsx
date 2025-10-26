import React, { useState, useEffect } from 'react';
import { Settings, FocusLevel, Theme } from '../types';

interface SettingsComponentProps {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
}

const focusLevelsConfig: Record<FocusLevel, Partial<Settings>> = {
  pomodoro: { focusTime: 25, shortBreak: 5, longBreak: 15, pomodorosPerCycle: 4 },
  deepWork: { focusTime: 50, shortBreak: 10, longBreak: 30, pomodorosPerCycle: 2 },
  eisenhower: { focusTime: 90, shortBreak: 15, longBreak: 30, pomodorosPerCycle: 2 },
  custom: {},
};

const themeOptions: { name: Theme; label: string; color: string }[] = [
    { name: 'cyan', label: 'Xanh băng', color: 'bg-cyan-500' },
    { name: 'magenta', label: 'Tím hoàng hôn', color: 'bg-fuchsia-500' },
    { name: 'green', label: 'Xanh rừng', color: 'bg-emerald-500' },
];

const backgroundPresets = [
  { name: 'Thư viện', url: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=2070&auto=format&fit=crop' },
  { name: 'Quán cà phê', url: 'https://images.unsplash.com/photo-1511920170033-f83297294792?q=80&w=1974&auto=format&fit=crop' },
  { name: 'Bàn học', url: 'https://images.unsplash.com/photo-1516534775068-ba3e7458af70?q=80&w=2070&auto=format&fit=crop' },
  { name: 'Thiên nhiên', url: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?q=80&w=2070&auto=format&fit=crop' },
]

const SettingsComponent: React.FC<SettingsComponentProps> = ({ settings, setSettings }) => {
  const [localSettings, setLocalSettings] = useState<Settings>(settings);
  const [showSaveMessage, setShowSaveMessage] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleLevelChange = (level: FocusLevel) => {
    if (level === 'custom') {
      setLocalSettings(prev => ({ ...prev, focusLevel: 'custom' }));
    } else {
      setLocalSettings(prev => ({ ...prev, ...focusLevelsConfig[level], focusLevel: level }));
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    
    if (['focusTime', 'shortBreak', 'longBreak', 'pomodorosPerCycle'].includes(name)) {
        setLocalSettings({ ...localSettings, focusLevel: 'custom', [name]: Number(value) });
    } else {
        setLocalSettings({ ...localSettings, [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert("Kích thước hình ảnh phải nhỏ hơn 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalSettings(prev => ({ ...prev, backgroundImage: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleAlarmSoundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        alert("Kích thước tệp âm thanh phải nhỏ hơn 2MB.");
        return;
      }
      if (!file.type.startsWith('audio/')) {
        alert("Vui lòng tải lên một tệp âm thanh hợp lệ (MP3, WAV, OGG, v.v.).");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalSettings(prev => ({ ...prev, alarmSoundUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    setSettings(localSettings);
    setShowSaveMessage(true);
    setTimeout(() => setShowSaveMessage(false), 2000);
  };

  const InputField: React.FC<{ label: string; name: keyof Settings; type?: string, min?: number, max?: number, placeholder?: string }> = ({ label, name, type = 'number', min = 1, max = 120, placeholder }) => (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-slate-300 mb-1">{label}</label>
      <input
        type={type}
        id={name}
        name={name}
        min={min}
        max={max}
        placeholder={placeholder}
        value={localSettings[name] as string}
        onChange={handleInputChange}
        className="w-full bg-slate-700 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
      />
    </div>
  );
  
  const Toggle: React.FC<{ label: string; name: keyof Settings; }> = ({label, name}) => (
     <div className="flex justify-between items-center bg-slate-800 p-3 rounded-xl">
      <span className="text-slate-200">{label}</span>
      <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" name={name} checked={!!localSettings[name]} onChange={handleInputChange} className="sr-only peer" />
        <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
      </label>
    </div>
  );
  
  const Section: React.FC<{title: string, children: React.ReactNode}> = ({title, children}) => (
    <div className="p-6 bg-slate-800/60 backdrop-blur-md border border-white/10 rounded-3xl shadow-lg space-y-4">
      <h2 className="text-xl font-semibold text-slate-100 mb-2">{title}</h2>
      {children}
    </div>
  );

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-cyan-400">Cài đặt</h1>

      <Section title="Giao diện">
        <div className="grid grid-cols-3 gap-4">
            {themeOptions.map(theme => (
                <button key={theme.name} onClick={() => setLocalSettings(prev => ({...prev, theme: theme.name}))} className={`p-3 rounded-xl flex items-center justify-center space-x-2 transition-all ${localSettings.theme === theme.name ? 'ring-2 ring-white' : 'opacity-70 hover:opacity-100'}`}>
                    <span className={`w-5 h-5 rounded-full ${theme.color}`}></span>
                    <span className="font-semibold">{theme.label}</span>
                </button>
            ))}
        </div>
      </Section>
      
      <Section title="Mức độ tập trung">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {Object.keys(focusLevelsConfig).map(level => (
            <button key={level} onClick={() => handleLevelChange(level as FocusLevel)} className={`p-2 rounded-xl transition-colors ${localSettings.focusLevel === level ? 'bg-cyan-600 font-bold' : 'bg-slate-700 hover:bg-slate-600'}`}>
              {level === 'custom' ? 'Tùy chỉnh' : level.charAt(0).toUpperCase() + level.slice(1).replace('Work', ' Work')}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Thời lượng (phút)">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InputField label="Tập trung" name="focusTime" />
          <InputField label="Nghỉ ngắn" name="shortBreak" />
          <InputField label="Nghỉ dài" name="longBreak" />
        </div>
         <InputField label="Số Pomodoro mỗi chu kỳ" name="pomodorosPerCycle" min={1} max={10} />
      </Section>
      
      <Section title="Tự động hóa">
        <div className="space-y-3">
            <Toggle label="Tự động bắt đầu nghỉ" name="autoStartBreaks" />
            <Toggle label="Tự động bắt đầu Pomodoro" name="autoStartPomodoros" />
        </div>
      </Section>

      <Section title="Âm thanh & Hình ảnh">
        <div className="space-y-6">
            <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">Âm báo tùy chỉnh (tối đa 2MB)</label>
                <div className="flex flex-col sm:flex-row gap-2">
                    <input
                        type="file"
                        id="alarm-upload"
                        accept="audio/*"
                        onChange={handleAlarmSoundUpload}
                        className="hidden"
                    />
                    <label
                        htmlFor="alarm-upload"
                        className="w-full sm:w-auto text-center block py-2 px-4 bg-slate-700 rounded-xl font-semibold hover:bg-slate-600 transition-colors cursor-pointer whitespace-nowrap"
                    >
                        Tải lên
                    </label>
                    {localSettings.alarmSoundUrl && (
                        <div className="flex items-center justify-between flex-grow bg-slate-700 py-0 px-3 rounded-xl">
                            <span className="text-sm text-slate-300 truncate">Đã tải lên âm thanh tùy chỉnh.</span>
                            <button
                                onClick={() => setLocalSettings(p => ({ ...p, alarmSoundUrl: '' }))}
                                className="text-cyan-400 hover:underline ml-4 text-sm font-semibold">
                                Xóa
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Nguồn nhạc tập trung</label>
                <div className="flex space-x-2 rounded-xl bg-slate-700 p-1">
                    <button onClick={() => setLocalSettings(prev => ({...prev, musicPlaylistType: 'none'}))} className={`w-full p-2 rounded-lg transition-colors text-sm font-semibold ${localSettings.musicPlaylistType === 'none' ? 'bg-cyan-600 text-white' : 'hover:bg-slate-600'}`}>Không</button>
                    <button onClick={() => setLocalSettings(prev => ({...prev, musicPlaylistType: 'spotify'}))} className={`w-full p-2 rounded-lg transition-colors text-sm font-semibold ${localSettings.musicPlaylistType === 'spotify' ? 'bg-cyan-600 text-white' : 'hover:bg-slate-600'}`}>Spotify</button>
                    <button onClick={() => setLocalSettings(prev => ({...prev, musicPlaylistType: 'youtube'}))} className={`w-full p-2 rounded-lg transition-colors text-sm font-semibold ${localSettings.musicPlaylistType === 'youtube' ? 'bg-cyan-600 text-white' : 'hover:bg-slate-600'}`}>YouTube</button>
                </div>
            </div>
            {localSettings.musicPlaylistType !== 'none' && (
                <InputField label="URL danh sách phát nhạc" name="musicPlaylistUrl" type="text" placeholder={`https://${localSettings.musicPlaylistType}.com/playlist/...`} />
            )}
            
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Ảnh nền</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                    {backgroundPresets.map(bg => (
                        <button key={bg.name} onClick={() => setLocalSettings(p => ({...p, backgroundImage: bg.url}))} className={`aspect-video rounded-lg bg-cover bg-center transition-all ${localSettings.backgroundImage === bg.url ? 'ring-2 ring-white' : 'opacity-70 hover:opacity-100'}`} style={{backgroundImage: `url(${bg.url})`}}>
                            <div className="bg-black/30 w-full h-full flex items-end justify-center p-1 rounded-lg">
                                <span className="text-white text-xs font-semibold">{bg.name}</span>
                            </div>
                        </button>
                    ))}
                </div>
                <div>
                    <label htmlFor="backgroundImage" className="block text-sm font-medium text-slate-300 mb-1">URL ảnh nền tùy chỉnh hoặc Tải lên</label>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <input
                            type="text"
                            id="backgroundImage"
                            name="backgroundImage"
                            placeholder="Dán URL hoặc tải ảnh lên"
                            value={localSettings.backgroundImage.startsWith('data:image') ? '' : localSettings.backgroundImage}
                            onChange={handleInputChange}
                            className="w-full bg-slate-700 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                        <input
                            type="file"
                            id="bg-upload"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                        />
                        <label
                            htmlFor="bg-upload"
                            className="w-full sm:w-auto text-center block py-2 px-4 bg-slate-700 rounded-xl font-semibold hover:bg-slate-600 transition-colors cursor-pointer whitespace-nowrap"
                        >
                            Tải ảnh
                        </label>
                    </div>
                     {localSettings.backgroundImage.startsWith('data:image') && (
                        <div className="mt-2 text-sm text-slate-400">
                            <p>Đã tải lên ảnh tùy chỉnh.</p>
                             <button 
                                onClick={() => setLocalSettings(p => ({...p, backgroundImage: ''}))} 
                                className="text-cyan-400 hover:underline mt-1">
                                Xóa ảnh
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </Section>

      <div className="relative pb-6">
        <button onClick={handleSave} className="w-full py-3 bg-cyan-600 rounded-xl font-bold text-lg text-white hover:bg-cyan-500 transition-colors shadow-lg shadow-cyan-600/30">
          Lưu cài đặt
        </button>
        {showSaveMessage && <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-green-400">Đã lưu cài đặt!</span>}
      </div>
    </div>
  );
};

export default SettingsComponent;
