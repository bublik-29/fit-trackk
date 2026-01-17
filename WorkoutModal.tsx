
import React, { useState, useEffect, useRef } from 'react';
import { BlockStats, Language, ExerciseSet, WorkoutEntry } from '../types';

interface WorkoutModalProps {
  date: Date;
  isCompleted: boolean;
  currentEntry?: WorkoutEntry;
  prevStats: { [key: number]: BlockStats };
  onSave: (block: 1 | 2 | 3, exA: ExerciseSet[], exB: ExerciseSet[], duration: number) => void;
  onClear: () => void;
  onClose: () => void;
  lang: Language;
  t: any;
}

const getBlockData = (lang: Language) => [
  {
    id: 1,
    title: { en: 'Block 1: Basic Endurance', ru: 'Блок 1: Базовая выносливость', pl: 'Blok 1: Podstawowa wytrzymałość' }[lang],
    exercises: [
      { name: { en: 'Standing Barbell Bicep Curl', ru: 'Подъем штанги на бицепс стоя', pl: 'Uginanie ramion ze sztangą stojąc' }[lang] },
      { name: { en: 'Standing French Press', ru: 'Французский жим стоя', pl: 'Wyciskanie francuskie stojąc' }[lang] }
    ]
  },
  {
    id: 2,
    title: { en: 'Block 2: Shoulder Strength', ru: 'Блок 2: Сила плеч', pl: 'Blok 2: Siła barków' }[lang],
    exercises: [
      { name: { en: 'Military Press', ru: 'Армейский жим', pl: 'Wyciskanie żołnierskie' }[lang] },
      { name: { en: 'Reverse Grip Barbell Curl', ru: 'Подъем штанги обратным хватом', pl: 'Uginanie ramion nachwytem' }[lang] }
    ]
  },
  {
    id: 3,
    title: { en: 'Block 3: Grip & Detailing', ru: 'Блок 3: Хват и детализация', pl: 'Blok 3: Chwyt i detale' }[lang],
    exercises: [
      { name: { en: 'Upright Row', ru: 'Тяга к подбородку', pl: 'Podciąganie sztangi wzdłuż tułowia' }[lang] },
      { name: { en: 'Seated Wrist Curls', ru: 'Сгибания в запястьях сидя', pl: 'Uginanie nadgarstków siedząc' }[lang] }
    ]
  }
];

type ModalMode = 'setup' | 'countdown' | 'active' | 'summary';

const WorkoutModal: React.FC<WorkoutModalProps> = ({ 
  date, isCompleted, currentEntry, prevStats, onSave, onClear, onClose, lang, t 
}) => {
  const [selectedBlockId, setSelectedBlockId] = useState<1 | 2 | 3>((currentEntry?.blockNumber as 1 | 2 | 3) || 1);
  const [mode, setMode] = useState<ModalMode>(isCompleted ? 'summary' : 'setup');
  
  const initSet = (sets?: ExerciseSet[]) => sets || [{ weight: 0, reps: 20 }, { weight: 0, reps: 20 }, { weight: 0, reps: 20 }];

  const [setsA, setSetsA] = useState<ExerciseSet[]>(initSet(currentEntry?.exerciseA));
  const [setsB, setSetsB] = useState<ExerciseSet[]>(initSet(currentEntry?.exerciseB));

  const [countdownValue, setCountdownValue] = useState<number | string>(3);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [holdProgress, setHoldProgress] = useState(0);
  
  const holdIntervalRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<number | null>(null);

  const BLOCKS = getBlockData(lang);
  const block = BLOCKS.find(b => b.id === selectedBlockId)!;

  useEffect(() => {
    if (!isCompleted && mode === 'setup') {
      setSetsA(initSet(prevStats[selectedBlockId]?.exerciseA));
      setSetsB(initSet(prevStats[selectedBlockId]?.exerciseB));
    }
  }, [selectedBlockId, isCompleted, prevStats, mode]);

  // Timer Effect
  useEffect(() => {
    if (mode === 'active') {
      timerIntervalRef.current = window.setInterval(() => {
        setTimerSeconds(s => s + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => { if (timerIntervalRef.current) clearInterval(timerIntervalRef.current); };
  }, [mode]);

  const updateSet = (exercise: 'A' | 'B', index: number, field: keyof ExerciseSet, value: string) => {
    const numVal = field === 'weight' ? parseFloat(value) || 0 : parseInt(value) || 0;
    if (exercise === 'A') {
      const newSets = [...setsA];
      newSets[index] = { ...newSets[index], [field]: numVal };
      setSetsA(newSets);
    } else {
      const newSets = [...setsB];
      newSets[index] = { ...newSets[index], [field]: numVal };
      setSetsB(newSets);
    }
  };

  const handleStartSequence = () => {
    setMode('countdown');
    setCountdownValue(3);
    let val = 3;
    const interval = window.setInterval(() => {
      val -= 1;
      if (val > 0) {
        setCountdownValue(val);
      } else if (val === 0) {
        setCountdownValue('START!');
      } else {
        clearInterval(interval);
        setMode('active');
        setTimerSeconds(0);
      }
    }, 1000);
  };

  const startHoldFinish = () => {
    setHoldProgress(0);
    holdIntervalRef.current = window.setInterval(() => {
      setHoldProgress(p => {
        if (p >= 100) {
          if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
          onSave(selectedBlockId, setsA, setsB, timerSeconds);
          return 100;
        }
        return p + 2; // ~1.5s to 2s feel
      });
    }, 30);
  };

  const stopHoldFinish = () => {
    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    setHoldProgress(0);
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const dateString = date.toLocaleDateString(lang === 'en' ? 'en-US' : lang === 'ru' ? 'ru-RU' : 'pl-PL', { 
    weekday: 'long', month: 'long', day: 'numeric' 
  });

  // Countdown View
  if (mode === 'countdown') {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-emerald-500 text-white animate-in fade-in zoom-in duration-300">
        <div className="text-center">
          <p className="text-xl font-bold uppercase tracking-widest opacity-80 mb-4">{t.countdown}</p>
          <h1 className="text-9xl font-black tabular-nums">{countdownValue}</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-t-[2.5rem] sm:rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-4 duration-300 max-h-[95vh] flex flex-col">
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-4 mb-2 sm:hidden flex-shrink-0"></div>
        
        <div className="p-6 sm:p-8 flex-grow overflow-y-auto">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
                {mode === 'active' ? block.title : (mode === 'summary' ? t.sessionSummary : t.selectBlock)}
              </h2>
              <p className="text-slate-500 text-sm font-medium mt-1">{dateString}</p>
            </div>
            {mode === 'setup' && (
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hidden sm:block">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
            {mode === 'active' && (
              <div className="bg-slate-900 text-white px-4 py-2 rounded-2xl flex flex-col items-center">
                <span className="text-[10px] font-black uppercase tracking-tighter opacity-60 leading-none mb-1">{t.activeTimer}</span>
                <span className="text-xl font-black tabular-nums leading-none">{formatTime(timerSeconds)}</span>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {mode === 'setup' && (
              <>
                <div className="flex gap-2 mb-2 overflow-x-auto pb-2 scrollbar-hide">
                  {BLOCKS.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => setSelectedBlockId(b.id as 1 | 2 | 3)}
                      className={`px-4 py-3 rounded-2xl border-2 whitespace-nowrap transition-all flex-shrink-0 ${
                        selectedBlockId === b.id 
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-bold' 
                        : 'border-slate-100 bg-slate-50 text-slate-400 font-semibold'
                      }`}
                    >
                      {t.block} {b.id}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {block.exercises.map((ex, exIdx) => (
                    <div key={exIdx} className="space-y-4">
                      <div className="flex items-center justify-between px-1">
                        <label className="text-sm font-bold text-slate-700 uppercase tracking-tight">{ex.name}</label>
                      </div>
                      
                      <div className="space-y-3">
                        {[0, 1, 2].map((setIdx) => {
                          const currentSets = exIdx === 0 ? setsA : setsB;
                          const lastSessionSets = exIdx === 0 ? prevStats[selectedBlockId]?.exerciseA : prevStats[selectedBlockId]?.exerciseB;
                          const lastSet = lastSessionSets?.[setIdx];

                          return (
                            <div key={setIdx} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 transition-all focus-within:ring-2 focus-within:ring-emerald-100 focus-within:border-emerald-200">
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.set} {setIdx + 1}</span>
                                {lastSet && (
                                  <span className="text-[9px] font-bold text-slate-400 bg-slate-200/50 px-2 py-0.5 rounded-full uppercase">
                                    {t.lastTime}: {lastSet.weight}kg x {lastSet.reps}
                                  </span>
                                )}
                              </div>
                              <div className="flex gap-3">
                                <div className="flex-1">
                                  <input
                                    type="number"
                                    inputMode="decimal"
                                    value={currentSets[setIdx].weight || ''}
                                    placeholder={t.weight}
                                    onChange={(e) => updateSet(exIdx === 0 ? 'A' : 'B', setIdx, 'weight', e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-base font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                                  />
                                </div>
                                <div className="flex-1">
                                  <input
                                    type="number"
                                    inputMode="numeric"
                                    value={currentSets[setIdx].reps || ''}
                                    placeholder={t.reps}
                                    onChange={(e) => updateSet(exIdx === 0 ? 'A' : 'B', setIdx, 'reps', e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-base font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleStartSequence}
                  className="w-full py-4 rounded-2xl font-bold text-lg shadow-lg bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-200 active:scale-95 transition-all mt-4"
                >
                  {t.start}
                </button>
              </>
            )}

            {mode === 'active' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {block.exercises.map((ex, exIdx) => (
                    <div key={exIdx} className="space-y-3">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-wide px-1">{ex.name}</p>
                      <div className="space-y-2">
                         {[0, 1, 2].map(idx => (
                           <div key={idx} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                             <span className="text-xs font-bold text-slate-400 uppercase">{t.set} {idx + 1}</span>
                             <span className="text-xl font-black text-slate-800">
                               {(exIdx === 0 ? setsA : setsB)[idx].weight} <span className="text-xs font-normal opacity-50">kg</span>
                               <span className="text-slate-200 mx-2 text-sm">x</span>
                               {(exIdx === 0 ? setsA : setsB)[idx].reps}
                             </span>
                           </div>
                         ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="relative pt-10 pb-6">
                  <div className="absolute inset-x-0 top-0 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-30" 
                      style={{ width: `${holdProgress}%` }}
                    ></div>
                  </div>
                  
                  <button
                    onPointerDown={startHoldFinish}
                    onPointerUp={stopHoldFinish}
                    onPointerLeave={stopHoldFinish}
                    className="w-full py-5 rounded-3xl font-black text-xl bg-slate-900 text-white shadow-xl shadow-slate-200 active:scale-95 transition-all select-none touch-none"
                  >
                    {t.finish}
                  </button>
                  <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-3">
                    {t.holdToFinish}
                  </p>
                </div>
              </div>
            )}

            {mode === 'summary' && (
              <div className="space-y-6">
                <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
                   <div className="flex items-center gap-4 mb-8">
                      <div className="w-14 h-14 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
                        <span className="text-2xl font-black">B{currentEntry?.blockNumber}</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-emerald-900">{BLOCKS.find(b => b.id === currentEntry?.blockNumber)?.title}</h3>
                        <p className="text-emerald-600 font-bold text-sm uppercase tracking-wider">{formatTime(currentEntry?.duration || 0)}</p>
                      </div>
                   </div>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {block.exercises.map((ex, i) => {
                        const sets = i === 0 ? currentEntry?.exerciseA : currentEntry?.exerciseB;
                        return (
                          <div key={i} className="space-y-3">
                            <p className="text-xs font-black text-emerald-700 uppercase tracking-wide px-1">{ex.name}</p>
                            <div className="space-y-2">
                              {sets?.map((s, idx) => (
                                <div key={idx} className="flex justify-between items-center bg-white/80 p-3 rounded-xl border border-emerald-100">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase">{t.set} {idx + 1}</span>
                                  <span className="text-base font-black text-emerald-600">
                                    {s.weight} <span className="text-[10px] font-normal opacity-70">kg</span>
                                    <span className="text-slate-300 mx-2 text-xs">x</span>
                                    {s.reps}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                   </div>
                </div>
                
                <button
                  onClick={onClear}
                  className="w-full py-4 rounded-2xl font-bold text-lg border-2 border-slate-100 text-slate-400 hover:bg-slate-50 active:scale-95 transition-all"
                >
                  {t.remove}
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="p-4 border-t border-slate-50 sm:hidden">
            <button onClick={onClose} className="w-full py-2 text-slate-400 font-semibold text-sm">{t.close}</button>
        </div>
      </div>
    </div>
  );
};

export default WorkoutModal;
