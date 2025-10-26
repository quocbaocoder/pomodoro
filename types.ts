export type View = 'timer' | 'homework' | 'stats' | 'settings' | 'group';

export enum TimerMode {
  Focus = 'focus',
  ShortBreak = 'shortBreak',
  LongBreak = 'longBreak',
}

export enum ReminderMode {
  None = 'none',
  OneDay = '1day',
  TwoDays = '2days',
  OneWeek = '1week',
}

export interface Homework {
  id: number;
  subject: string;
  task: string;
  deadline: string;
  reminder: ReminderMode;
  email?: string;
  reminderSent?: boolean;
  completed: boolean;
}

export interface SessionLog {
  id: number;
  subject: string;
  date: string;
  duration: number; // in minutes
}

export type FocusLevel = 'pomodoro' | 'deepWork' | 'eisenhower' | 'custom';

export type Theme = 'cyan' | 'magenta' | 'green';

export interface Settings {
  focusTime: number;
  shortBreak: number;
  longBreak: number;
  pomodorosPerCycle: number;
  autoStartPomodoros: boolean;
  autoStartBreaks: boolean;
  musicPlaylistUrl: string;
  musicPlaylistType: 'spotify' | 'youtube' | 'none';
  alarmSoundUrl: string;
  focusLevel: FocusLevel;
  theme: Theme;
  backgroundImage: string;
}

export type AIMode = 'tasks' | 'study';

export interface Message {
  role: 'user' | 'model';
  text: string;
}