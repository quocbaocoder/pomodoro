import React, { useMemo } from 'react';
import { SessionLog, Homework, Settings } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';

interface StatsProps {
  sessionLogs: SessionLog[];
  homeworks: Homework[];
  settings: Settings;
}

const themeClasses = {
  cyan: { text: 'text-cyan-400', border: 'border-cyan-500', fill: '#22d3ee' },
  magenta: { text: 'text-fuchsia-400', border: 'border-fuchsia-500', fill: '#d946ef' },
  green: { text: 'text-emerald-400', border: 'border-emerald-500', fill: '#34d399' },
};

const Stats: React.FC<StatsProps> = ({ sessionLogs, homeworks, settings }) => {
  const currentTheme = themeClasses[settings.theme];

  const chartData = useMemo(() => {
    const dataBySubject: { [key: string]: number } = {};
    sessionLogs.forEach(log => {
      dataBySubject[log.subject] = (dataBySubject[log.subject] || 0) + log.duration;
    });
    return Object.keys(dataBySubject).map(subject => ({
      name: subject,
      "Phút đã học": dataBySubject[subject],
    }));
  }, [sessionLogs]);

  const totalFocusTime = useMemo(() => sessionLogs.reduce((acc, log) => acc + log.duration, 0), [sessionLogs]);
  const totalPomodoros = sessionLogs.length;
  const tasksCompleted = homeworks.filter(h => h.completed).length;
  const tasksPending = homeworks.length - tasksCompleted;

  const StatCard: React.FC<{ title: string; value: string | number, titleColor?: string }> = ({ title, value, titleColor }) => (
    <div className={`p-6 rounded-3xl bg-slate-800/60 backdrop-blur-md border border-white/10 shadow-lg`}>
      <h3 className={`text-sm font-medium ${titleColor || 'text-slate-400'}`}>{title}</h3>
      <p className="text-3xl font-bold mt-1 text-slate-100">{value}</p>
    </div>
  );

  return (
    <div className="space-y-8">
      <h1 className={`text-3xl font-bold ${currentTheme.text}`}>Thống kê học tập của bạn</h1>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Tổng thời gian tập trung" value={`${totalFocusTime} phút`} titleColor={currentTheme.text} />
        <StatCard title="Pomodoro hoàn thành" value={totalPomodoros} titleColor={currentTheme.text} />
        <StatCard title="Nhiệm vụ hoàn thành" value={tasksCompleted} titleColor="text-green-400" />
        <StatCard title="Nhiệm vụ đang chờ" value={tasksPending} titleColor="text-yellow-400" />
      </div>

      <div className="p-4 bg-slate-800/60 backdrop-blur-md border border-white/10 rounded-3xl shadow-lg h-96">
        <h2 className="text-xl font-semibold mb-4 text-slate-200">Thời gian tập trung theo môn học</h2>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9ca3af" angle={-45} textAnchor="end" interval={0} />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '0.5rem' }}
                labelStyle={{ color: '#d1d5db' }}
              />
              <Legend wrapperStyle={{ color: '#d1d5db' }} />
              <Bar dataKey="Phút đã học" fill={currentTheme.fill} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400">
            <p>Chưa có phiên học nào được ghi lại. Hoàn thành một phiên tập trung để xem thống kê của bạn!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Stats;
