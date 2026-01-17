
import React, { useState, useEffect, useMemo } from 'react';
import { ProgressData, MonthSummary, WorkoutEntry, BlockStats, Language, ExerciseSet } from './types';
import { saveProgress, loadProgress } from './services/storageService';
import CalendarHeader from './components/CalendarHeader';
import DayCell from './components/DayCell';
import WorkoutModal from './components/WorkoutModal';
import Summary from './components/Summary';

const translations = {
  en: {
    title: 'BLOCK TRAINING',
    subtitle: 'Progress Tracker',
    sessions: 'Sessions',
    growth: 'Growth',
    consistency: 'Consistency',
    lastWeights: 'Personal Bests (Max Weight x Reps)',
    block: 'Block',
    rest: 'Rest',
    today: 'Today',
    pending: 'Ready',
    completed: 'Completed',
    selectBlock: 'Select Training Block',
    sessionSummary: 'Session Summary',
    save: 'Save Workout',
    remove: 'Remove Entry',
    close: 'Close',
    lastTime: 'Last',
    weight: 'Weight',
    reps: 'Reps',
    set: 'Set',
    footer: 'Visualize your progress',
    lang: 'Language',
    start: 'START',
    finish: 'FINISH',
    holdToFinish: 'Hold 3s to finish',
    activeTimer: 'Workout Time',
    countdown: 'Get Ready!',
    monthlyReport: 'Monthly Achievement',
    days: 'days',
    install: 'Install'
  },
  ru: {
    title: 'БЛОЧНЫЕ ТРЕНИРОВКИ',
    subtitle: 'Трекер прогресса',
    sessions: 'Сессии',
    growth: 'Рост',
    consistency: 'Постоянство',
    lastWeights: 'Личные рекорды (Макс. Вес x Повторы)',
    block: 'Блок',
    rest: 'Отдых',
    today: 'Сегодня',
    pending: 'Готов',
    completed: 'Завершено',
    selectBlock: 'Выберите блок тренировки',
    sessionSummary: 'Итоги сессии',
    save: 'Сохранить',
    remove: 'Удалить',
    close: 'Закрыть',
    lastTime: 'Прошлый раз',
    weight: 'Вес',
    reps: 'Повторы',
    set: 'Подход',
    footer: 'Визуализируйте свой прогресс',
    lang: 'Язык',
    start: 'СТАРТ',
    finish: 'ЗАКОНЧИТЬ',
    holdToFinish: 'Удерживайте 3с',
    activeTimer: 'Время тренировки',
    countdown: 'Приготовьтесь!',
    monthlyReport: 'Достижения за месяц',
    days: 'дн.',
    install: 'Установить'
  },
  pl: {
    title: 'TRENING BLOKOWY',
    subtitle: 'Monitor postępów',
    sessions: 'Sesje',
    growth: 'Wzrost',
    consistency: 'Konsekwencja',
    lastWeights: 'Rekordy życiowe (Maks. Ciężar x Powt.)',
    block: 'Blok',
    rest: 'Odpoczynek',
    today: 'Dziś',
    pending: 'Gotowy',
    completed: 'Ukończono',
    selectBlock: 'Wybierz blok treningowy',
    sessionSummary: 'Podsumowanie sesji',
    save: 'Zapisz trening',
    remove: 'Usuń wpis',
    close: 'Zamknij',
    lastTime: 'Ostatnio',
    weight: 'Ciężar',
    reps: 'Powt.',
    set: 'Seria',
    footer: 'Wizualizuj swoje postępy',
    lang: 'Język',
    start: 'START',
    finish: 'KONIEC',
    holdToFinish: 'Przytrzymaj 3s',
    activeTimer: 'Czas treningu',
    countdown: 'Przygotuj się!',
    monthlyReport: 'Osiągnięcia miesiąca',
    days: 'dni',
    install: 'Zainstaluj'
  }
};

const App: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [progress, setProgress] = useState<ProgressData>(loadProgress());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [lang, setLang] = useState<Language>(() => (localStorage.getItem('fittrack_lang') as Language) || 'en');
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  useEffect(() => {
    localStorage.setItem('fittrack_lang', lang);
  }, [lang]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const t = translations[lang];

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  const getDateKey = (date: Date) => {
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  };

  const getPreviousDateKey = (date: Date) => {
    const prev = new Date(date);
    prev.setDate(prev.getDate() - 1);
    return getDateKey(prev);
  };

  const monthData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [currentDate]);

  const prevStats = useMemo(() => {
    const emptySet = () => [{ weight: 0, reps: 20 }, { weight: 0, reps: 20 }, { weight: 0, reps: 20 }];
    const stats: { [key: number]: BlockStats } = { 
      1: { exerciseA: emptySet(), exerciseB: emptySet() }, 
      2: { exerciseA: emptySet(), exerciseB: emptySet() }, 
      3: { exerciseA: emptySet(), exerciseB: emptySet() } 
    };
    
    const sortedEntries = (Object.values(progress) as WorkoutEntry[])
      .filter(e => e.completed && e.blockNumber)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    for (let i = 1; i <= 3; i++) {
      const lastEntry = sortedEntries.find(e => e.blockNumber === i);
      if (lastEntry) {
        stats[i] = { 
          exerciseA: lastEntry.exerciseA,
          exerciseB: lastEntry.exerciseB
        };
      }
    }
    return stats;
  }, [progress]);

  const monthSummary = useMemo((): MonthSummary & { daysInMonth: number } => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    let completedCount = 0;
    const pbs: { [key: string]: ExerciseSet } = {};

    const updatePB = (exKey: string, sets: ExerciseSet[]) => {
      sets.forEach(set => {
        if (!pbs[exKey] || set.weight > pbs[exKey].weight || (set.weight === pbs[exKey].weight && set.reps > pbs[exKey].reps)) {
          pbs[exKey] = { ...set };
        }
      });
    };

    (Object.values(progress) as WorkoutEntry[]).forEach(entry => {
      if (entry.completed) {
        const d = new Date(entry.date);
        if (d.getFullYear() === year && d.getMonth() === month) {
          completedCount++;
        }
        
        if (entry.blockNumber === 1) {
          updatePB('b1_a', entry.exerciseA);
          updatePB('b1_b', entry.exerciseB);
        } else if (entry.blockNumber === 2) {
          updatePB('b2_a', entry.exerciseA);
          updatePB('b2_b', entry.exerciseB);
        } else if (entry.blockNumber === 3) {
          updatePB('b3_a', entry.exerciseA);
          updatePB('b3_b', entry.exerciseB);
        }
      }
    });
    
    return {
      totalWorkouts: completedCount,
      personalBests: pbs,
      daysInMonth
    };
  }, [currentDate, progress]);

  const handleSaveWorkout = (block: 1 | 2 | 3, exA: ExerciseSet[], exB: ExerciseSet[], duration: number) => {
    if (!selectedDate) return;
    const key = getDateKey(selectedDate);
    const entry: WorkoutEntry = {
      completed: true,
      blockNumber: block,
      exerciseA: exA,
      exerciseB: exB,
      date: selectedDate.toISOString(),
      duration: duration
    };
    setProgress(prev => ({ ...prev, [key]: entry }));
  };

  const handleClearWorkout = () => {
    if (!selectedDate) return;
    const key = getDateKey(selectedDate);
    setProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[key];
      return newProgress;
    });
  };

  return (
    <div className="min-h-screen pb-10 px-3 sm:px-6 lg:px-8 max-w-4xl mx-auto flex flex-col">
      <nav className="py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-xl">B</div>
          <div>
            <span className="text-xl font-black text-slate-800 tracking-tighter block leading-none">{t.title}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 block">{t.subtitle}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {installPrompt && (
            <button 
              onClick={handleInstallClick}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-200 animate-bounce"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              {t.install}
            </button>
          )}
          
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
             {(['en', 'ru', 'pl'] as Language[]).map(l => (
               <button 
                 key={l}
                 onClick={() => setLang(l)}
                 className={`px-2 py-1 text-[10px] font-bold rounded-lg transition-all ${lang === l ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
               >
                 {l.toUpperCase()}
               </button>
             ))}
          </div>
        </div>
      </nav>

      {/* Mobile Install Prompt Bar */}
      {installPrompt && (
        <div className="sm:hidden mb-4 bg-emerald-500 p-4 rounded-3xl flex items-center justify-between text-white shadow-xl shadow-emerald-100 animate-in slide-in-from-top-4">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            </div>
            <span className="text-xs font-black uppercase tracking-wider">{t.install} FitTrack</span>
          </div>
          <button 
            onClick={handleInstallClick}
            className="bg-white text-emerald-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-transform"
          >
            {t.start}
          </button>
        </div>
      )}

      <Summary summary={monthSummary} lang={lang} t={t} />

      <main className="bg-white p-4 sm:p-8 rounded-[2rem] sm:rounded-[3rem] border border-slate-200 shadow-xl shadow-slate-200/40 flex-grow mb-10">
        <CalendarHeader 
          currentDate={currentDate} 
          onPrevMonth={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} 
          onNextMonth={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
          onToday={() => setCurrentDate(new Date())}
          t={t}
        />

        <div className="grid grid-cols-7 gap-1 sm:gap-3">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => (
             <div key={idx} className="text-center text-[10px] font-black text-slate-300 uppercase tracking-widest py-3">
                {lang === 'en' ? day : day === 'Sun' ? (lang === 'ru' ? 'Вс' : 'Nie') : day === 'Mon' ? (lang === 'ru' ? 'Пн' : 'Pon') : day}
             </div>
          ))}
          
          {monthData.map((day, index) => {
            if (day === null) return <DayCell key={`empty-${index}`} day={null} isToday={false} isCompleted={false} isRestDay={false} onClick={() => {}} t={t} />;
            
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const key = getDateKey(date);
            const prevKey = getPreviousDateKey(date);
            
            const isToday = date.toDateString() === new Date().toDateString();
            const isCompleted = progress[key]?.completed || false;
            const isRestDay = !isCompleted && progress[prevKey]?.completed === true;
            
            return (
              <DayCell 
                key={day} 
                day={day} 
                isToday={isToday} 
                isCompleted={isCompleted} 
                isRestDay={isRestDay}
                blockNumber={progress[key]?.blockNumber}
                onClick={() => setSelectedDate(date)}
                t={t}
              />
            );
          })}
        </div>
      </main>

      {selectedDate && (
        <WorkoutModal 
          date={selectedDate}
          isCompleted={progress[getDateKey(selectedDate)]?.completed || false}
          currentEntry={progress[getDateKey(selectedDate)]}
          prevStats={prevStats}
          onSave={handleSaveWorkout}
          onClear={handleClearWorkout}
          onClose={() => setSelectedDate(null)}
          lang={lang}
          t={t}
        />
      )}

      <footer className="mt-4 mb-4 text-center text-slate-400 text-[10px] font-medium">
        <p>© {new Date().getFullYear()} FitTrack • {t.footer}</p>
      </footer>
    </div>
  );
};

export default App;
