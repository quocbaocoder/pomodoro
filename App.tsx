import React, { useState, useEffect } from 'react';
import { View, Homework, SessionLog, Settings, ReminderMode, Message } from './types';
import Navbar from './components/Navbar';
import Timer from './components/Timer';
import HomeworkTable from './components/HomeworkTable';
import Stats from './components/Stats';
import SettingsComponent from './components/Settings';
import AIAssistant from './components/AIAssistant';
import GroupStudy from './components/GroupStudy';
import { SparklesIcon } from './components/icons/SparklesIcon';

const themeClasses = {
  cyan: {
    bg: 'bg-cyan-600',
    hoverBg: 'hover:bg-cyan-500',
    shadow: 'shadow-cyan-600/30',
  },
  magenta: {
    bg: 'bg-fuchsia-600',
    hoverBg: 'hover:bg-fuchsia-500',
    shadow: 'shadow-fuchsia-600/30',
  },
  green: {
    bg: 'bg-emerald-600',
    hoverBg: 'hover:bg-emerald-500',
    shadow: 'shadow-emerald-600/30',
  },
};

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('timer');
  const [isAiAssistantVisible, setIsAiAssistantVisible] = useState(false);
  
  const [homeworks, setHomeworks] = useState<Homework[]>(() => {
    try {
      const saved = localStorage.getItem('homeworks');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to parse homeworks from localStorage', e);
      return [];
    }
  });

  const [sessionLogs, setSessionLogs] = useState<SessionLog[]>(() => {
    try {
      const saved = localStorage.getItem('sessionLogs');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to parse sessionLogs from localStorage', e);
      return [];
    }
  });

  const [settings, setSettings] = useState<Settings>(() => {
    const defaultSettings: Settings = {
      focusTime: 25,
      shortBreak: 5,
      longBreak: 15,
      pomodorosPerCycle: 4,
      autoStartPomodoros: false,
      autoStartBreaks: false,
      musicPlaylistUrl: '',
      musicPlaylistType: 'none',
      alarmSoundUrl: '',
      focusLevel: 'pomodoro',
      theme: 'cyan',
      backgroundImage: '',
    };
    try {
      const saved = localStorage.getItem('settings');
      const loadedSettings = saved ? JSON.parse(saved) : {};
      return { ...defaultSettings, ...loadedSettings };
    } catch (e) {
      console.error('Failed to parse settings from localStorage', e);
      return defaultSettings;
    }
  });

  const [aiTaskChatHistory, setAiTaskChatHistory] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem('aiTaskChatHistory');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to parse aiTaskChatHistory from localStorage', e);
      return [];
    }
  });
  
  const [aiStudyChatHistory, setAiStudyChatHistory] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem('aiStudyChatHistory');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to parse aiStudyChatHistory from localStorage', e);
      return [];
    }
  });


  useEffect(() => {
    localStorage.setItem('homeworks', JSON.stringify(homeworks));
  }, [homeworks]);

  useEffect(() => {
    localStorage.setItem('sessionLogs', JSON.stringify(sessionLogs));
  }, [sessionLogs]);
  
  useEffect(() => {
    localStorage.setItem('settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('aiTaskChatHistory', JSON.stringify(aiTaskChatHistory));
  }, [aiTaskChatHistory]);
  
  useEffect(() => {
    localStorage.setItem('aiStudyChatHistory', JSON.stringify(aiStudyChatHistory));
  }, [aiStudyChatHistory]);

  useEffect(() => {
    const checkReminders = () => {
      const now = new Date().getTime();
      let remindersTriggered = false;
      const updatedHomeworks = homeworks.map(hw => {
        if (!hw.completed && hw.email && hw.reminder !== ReminderMode.None && !hw.reminderSent) {
          const deadlineTime = new Date(hw.deadline).getTime();
          const timeUntil = deadlineTime - now;
          const hoursUntil = timeUntil / (1000 * 3600);

          let reminderHours = -1;
          if (hw.reminder === ReminderMode.OneDay) reminderHours = 24;
          else if (hw.reminder === ReminderMode.TwoDays) reminderHours = 48;
          else if (hw.reminder === ReminderMode.OneWeek) reminderHours = 168;

          if (reminderHours > 0 && hoursUntil > 0 && hoursUntil <= reminderHours) {
            alert(`Nhắc nhở cho nhiệm vụ "${hw.task}": Sắp đến hạn chót của bạn! Một email đã được "gửi" đến ${hw.email}.`);
            remindersTriggered = true;
            return { ...hw, reminderSent: true };
          }
        }
        return hw;
      });

      if (remindersTriggered) {
        setHomeworks(updatedHomeworks);
      }
    };

    const intervalId = setInterval(checkReminders, 60 * 1000); // Check every minute

    return () => clearInterval(intervalId);
  }, [homeworks]);

  const addSessionLog = (log: Omit<SessionLog, 'id' | 'date'>) => {
    setSessionLogs(prev => [...prev, { ...log, id: Date.now(), date: new Date().toISOString() }]);
  };

  const addHomeworkFromAI = (taskDetails: { subject: string; task: string; deadline: string }) => {
    const newHomework: Homework = {
      id: Date.now(),
      subject: taskDetails.subject,
      task: taskDetails.task,
      deadline: taskDetails.deadline,
      reminder: ReminderMode.None,
      email: undefined,
      reminderSent: false,
      completed: false,
    };
    setHomeworks(prev => [...prev, newHomework]);
  };
  
  const deleteHomeworkFromAI = (taskDescription: string): string | null => {
    const taskToDelete = homeworks.find(hw => 
      hw.task.toLowerCase().includes(taskDescription.toLowerCase())
    );

    if (taskToDelete) {
      setHomeworks(prev => prev.filter(hw => hw.id !== taskToDelete.id));
      return taskToDelete.task;
    }
    return null;
  };

  const completeHomeworkFromAI = (taskDescription: string): string | null => {
    let taskToComplete: Homework | undefined;
    const taskIndex = homeworks.findIndex(hw => 
        !hw.completed && hw.task.toLowerCase().includes(taskDescription.toLowerCase())
    );

    if (taskIndex > -1) {
      taskToComplete = homeworks[taskIndex];
      const updatedHomeworks = [
          ...homeworks.slice(0, taskIndex),
          { ...taskToComplete, completed: true },
          ...homeworks.slice(taskIndex + 1)
      ];
      setHomeworks(updatedHomeworks);
      return taskToComplete.task;
    }
    
    return null;
  };


  const renderView = () => {
    switch (activeView) {
      case 'timer':
        return <Timer settings={settings} addSessionLog={addSessionLog} homeworks={homeworks} />;
      case 'homework':
        return <HomeworkTable homeworks={homeworks} setHomeworks={setHomeworks} settings={settings} />;
      case 'stats':
        return <Stats sessionLogs={sessionLogs} homeworks={homeworks} settings={settings} />;
      case 'settings':
        return <SettingsComponent settings={settings} setSettings={setSettings} />;
      case 'group':
        return <GroupStudy settings={settings} />;
      default:
        return <Timer settings={settings} addSessionLog={addSessionLog} homeworks={homeworks} />;
    }
  };

  const backgroundStyle = settings.backgroundImage 
    ? { 
        backgroundImage: `url(${settings.backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      } 
    : {};

  const currentTheme = themeClasses[settings.theme];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-850 flex flex-col font-sans relative" style={backgroundStyle}>
       {settings.backgroundImage && <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" />}
      <main className="flex-grow container mx-auto p-4 pb-24 z-10">
        {renderView()}
      </main>
      <Navbar activeView={activeView} setActiveView={setActiveView} settings={settings} />

      <button
        onClick={() => setIsAiAssistantVisible(true)}
        className={`fixed bottom-24 right-4 z-30 p-4 rounded-full text-white ${currentTheme.bg} ${currentTheme.hoverBg} transition-all duration-300 hover:scale-110 shadow-lg ${currentTheme.shadow}`}
        aria-label="Mở Trợ lý AI"
      >
        <SparklesIcon className="w-6 h-6" />
      </button>

      {isAiAssistantVisible && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-lg z-50 flex items-center justify-center p-4">
            <AIAssistant 
              onClose={() => setIsAiAssistantVisible(false)} 
              onAddTask={addHomeworkFromAI}
              onDeleteTask={deleteHomeworkFromAI}
              onCompleteTask={completeHomeworkFromAI}
              taskChatHistory={aiTaskChatHistory}
              setTaskChatHistory={setAiTaskChatHistory}
              studyChatHistory={aiStudyChatHistory}
              setStudyChatHistory={setAiStudyChatHistory}
            />
        </div>
      )}
    </div>
  );
};

export default App;