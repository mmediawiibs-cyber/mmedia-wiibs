import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';

const TEAM_MEMBERS = ['Doni', 'Ersady', 'Jalal', 'Rica', 'Bila', 'Resti', 'Afghan'];

const MEMBER_COLORS = {
  'Doni': { bg: 'bg-blue-100', text: 'text-blue-900', border: 'border-blue-200' },
  'Ersady': { bg: 'bg-emerald-100', text: 'text-emerald-900', border: 'border-emerald-200' },
  'Jalal': { bg: 'bg-amber-100', text: 'text-amber-900', border: 'border-amber-200' },
  'Rica': { bg: 'bg-pink-100', text: 'text-pink-900', border: 'border-pink-200' },
  'Bila': { bg: 'bg-purple-100', text: 'text-purple-900', border: 'border-purple-200' },
  'Resti': { bg: 'bg-orange-100', text: 'text-orange-900', border: 'border-orange-200' },
  'Afghan': { bg: 'bg-cyan-100', text: 'text-cyan-900', border: 'border-cyan-200' },
};

const EVENT_COLORS = [
  { id: 'default', bg: 'bg-white', border: 'border-gray-200', tab: 'bg-gray-400' },
  { id: 'high', bg: 'bg-red-50', border: 'border-red-200', tab: 'bg-red-500' },
  { id: 'medium', bg: 'bg-orange-50', border: 'border-orange-200', tab: 'bg-orange-500' },
  { id: 'low', bg: 'bg-green-50', border: 'border-green-200', tab: 'bg-green-500' },
  { id: 'info', bg: 'bg-blue-50', border: 'border-blue-200', tab: 'bg-blue-500' },
  { id: 'purple', bg: 'bg-purple-50', border: 'border-purple-200', tab: 'bg-purple-500' },
  { id: 'pink', bg: 'bg-pink-50', border: 'border-pink-200', tab: 'bg-pink-500' },
  { id: 'teal', bg: 'bg-teal-50', border: 'border-teal-200', tab: 'bg-teal-500' },
  { id: 'yellow', bg: 'bg-yellow-50', border: 'border-yellow-200', tab: 'bg-yellow-500' },
  { id: 'sky', bg: 'bg-sky-50', border: 'border-sky-200', tab: 'bg-sky-500' }
];

const UNIT_OPTIONS = ['Asset Management', 'Content Creator', 'Design Graphic'];

const TASK_TYPES = [
  'Desain Flyer', 'Desain Banner', 'Desain Bumper', 'Desain Infografis', 'Video Promosi/CTA',
  'Dokumentasi', 'Story', 'photobooth', 'Streaming', 'Operator',
  'Asseting','Carousel', 'Reels', 'Aftermovie', 'Short Video', 'Video Rekap', 
  'Taping', 'Recording', 'Layouting', 'Editing', 
  'Publishing', 'Copywriting',
];

const DIVISI_OPTIONS = ['SMP Banin', 'SMA Banin', 'SMP Banat', 'SMA Banat', 'STIT', 'SDTQ', 'Biro Bekal', 'BK', 'Balitbangwas', 'Marketing'];

const generateId = () => Math.random().toString(36).substr(2, 9);

const firebaseConfig = {
  apiKey: "AIzaSyC5fsM7k6D4HIhhmvNMVniGReHmIbItynY",
  authDomain: "mmedia-wiibs-task-planner.firebaseapp.com",
  projectId: "mmedia-wiibs-task-planner",
  storageBucket: "mmedia-wiibs-task-planner.firebasestorage.app",
  messagingSenderId: "220009310175",
  appId: "1:220009310175:web:2448053c2da0df705c866a",
  measurementId: "G-58SLK1JQBM"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const rawAppId = typeof __app_id !== 'undefined' ? __app_id : 'mmedia-wiibs-app';
const appId = rawAppId.replace(/\//g, '-'); 

const getWeekDays = (weekOffset) => {
  const today = new Date();
  const dayOfWeek = today.getDay() || 7; 
  today.setHours(0, 0, 0, 0);
  const monday = new Date(today);
  monday.setDate(today.getDate() - dayOfWeek + 1 + (weekOffset * 7));

  const days = [];
  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  for (let i = 0; i < 7; i++) {
    const currentDay = new Date(monday);
    currentDay.setDate(monday.getDate() + i);
    const dateKey = `${currentDay.getFullYear()}-${String(currentDay.getMonth() + 1).padStart(2, '0')}-${String(currentDay.getDate()).padStart(2, '0')}`;
    const display = `${dayNames[currentDay.getDay()]}, ${currentDay.getDate()} ${monthNames[currentDay.getMonth()]}`;
    days.push({ dateKey, display });
  }
  return days;
};

const SchoolEventCard = ({ event, onDelete, onView, onEdit }) => {
  const activeColor = EVENT_COLORS.find(c => c.id === (event.colorId || 'info')) || EVENT_COLORS[4];
  const hasEndDate = event.endDate && event.endDate !== event.date;
  
  return (
    <div className={`${activeColor.bg} border border-gray-200 border-r-4 rounded-xl shadow-sm p-3 mb-3 relative group overflow-hidden transition-all hover:shadow-md cursor-pointer hover:border-gray-300`} 
         style={{ borderRightColor: activeColor.tab.replace('bg-', '') }}
         onClick={() => onView(event)}>
      
      <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10" onClick={e => e.stopPropagation()}>
        <button onClick={(e) => { e.stopPropagation(); onEdit(event); }} className="text-gray-400 hover:text-amber-500 bg-white/80 rounded-md p-1 shadow-sm border border-gray-100 hover:border-amber-200" title="Edit Event">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
        </button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-gray-400 hover:text-red-500 bg-white/80 rounded-md p-1 shadow-sm border border-gray-100 hover:border-red-100" title="Hapus Event">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>
      
      <div className="mb-2 pl-14 flex items-center justify-end gap-1.5 flex-wrap">
        {hasEndDate && (
          <span className="text-[9px] font-bold text-gray-500 flex items-center gap-0.5 bg-white/80 px-1.5 py-0.5 rounded border border-gray-200">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            Multi-hari
          </span>
        )}
        <span className={`text-[9px] font-extrabold uppercase tracking-widest text-white ${activeColor.tab} px-2 py-0.5 rounded-md shadow-sm`}>{event.divisi}</span>
      </div>
      
      <h4 className="text-sm font-bold text-gray-800 leading-tight mb-2 pr-2 line-clamp-2">{event.nama}</h4>
      
      <div className="flex flex-col gap-1.5 text-[11px] text-gray-600 bg-white/60 p-2 rounded-lg border border-white/50 shadow-inner">
        <div className="flex items-start gap-1.5">
           <svg className={`w-3.5 h-3.5 ${activeColor.tab.replace('bg-', 'text-')} shrink-0 mt-0.5`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
           <span className="font-semibold">{event.waktu || 'Waktu belum ditentukan'}</span>
        </div>
        {event.lokasi && (
          <div className="flex items-start gap-1.5 border-t border-gray-200/50 pt-1.5 mt-0.5">
             <svg className={`w-3.5 h-3.5 ${activeColor.tab.replace('bg-', 'text-')} shrink-0 mt-0.5`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
             <span className="truncate" title={event.lokasi}>{event.lokasi}</span>
          </div>
        )}
      </div>
    </div>
  );
};

const EventCard = ({
  event,
  onDragStart,
  onDragEnd,
  onUpdateEventParentType,
  onUpdateEventTitle,
  onUpdateEventUnit,
  onUpdateEventColor,
  onDeleteEvent,
  onDuplicateEvent,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onToggleTaskCompletion
}) => {
  const activeColor = EVENT_COLORS.find(c => c.id === event.colorId) || EVENT_COLORS[0];
  const visibleTasks = (event.tasks || []).filter(t => !t.isCompleted);

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, event.id)}
      onDragEnd={onDragEnd}
      className={`${activeColor.bg} ${activeColor.border} border-l-4 rounded-xl shadow-sm hover:shadow-md transition-all p-3 mb-3 cursor-grab active:cursor-grabbing border relative overflow-hidden group`}
      style={{ borderLeftColor: activeColor.id === 'default' ? '#cbd5e1' : activeColor.tab.replace('bg-', '') }}
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${activeColor.tab}`}></div>

      <div className="flex flex-col gap-2 mb-3 ml-1">
        <div className="flex justify-between items-start">
          <div className="flex flex-col w-full mr-2 gap-1.5">
            <div className="relative w-fit mb-0.5">
               <select
                 value={event.parentType || 'Event'}
                 onChange={(e) => onUpdateEventParentType(event.id, e.target.value)}
                 className="text-[10px] uppercase tracking-wider font-extrabold text-indigo-600 bg-indigo-50 rounded-md px-2.5 py-0.5 border border-indigo-100 hover:bg-indigo-100 focus:ring-0 cursor-pointer appearance-none pr-6 transition-colors shadow-sm"
               >
                 <option value="Event">Event</option>
                 <option value="Task">Task</option>
               </select>
               <div className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-400">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path></svg>
               </div>
            </div>

            {event.parentType === 'Task' ? (
              <div className="relative w-fit">
                 <select
                   value={event.unit || UNIT_OPTIONS[0]}
                   onChange={(e) => onUpdateEventUnit(event.id, e.target.value)}
                   className="font-bold text-gray-800 bg-transparent border-b border-gray-200 hover:border-gray-400 focus:border-indigo-500 focus:outline-none cursor-pointer p-0 pb-1 pr-5 appearance-none text-sm transition-colors"
                 >
                   {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                 </select>
                 <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                 </div>
              </div>
            ) : (
              <input
                type="text"
                value={event.title || ''}
                onChange={(e) => onUpdateEventTitle(event.id, e.target.value)}
                className="font-bold text-gray-800 bg-transparent border-b border-gray-200 hover:border-gray-400 focus:border-indigo-500 focus:outline-none w-full p-0 pb-1 text-sm transition-colors placeholder:text-gray-300"
                placeholder="Tulis Judul Tugas..."
              />
            )}
          </div>
          
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => onDuplicateEvent(event.id)} className="text-gray-400 hover:text-blue-500 bg-white/50 hover:bg-blue-50 rounded-lg p-1 shadow-sm border border-transparent hover:border-blue-100" title="Duplikat Tugas ini">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
            </button>
            <button onClick={() => onDeleteEvent(event.id)} className="text-gray-400 hover:text-red-500 bg-white/50 hover:bg-red-50 rounded-lg p-1 shadow-sm border border-transparent hover:border-red-100" title="Hapus Blok">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-1.5 mt-1">
          {EVENT_COLORS.map(color => (
            <button
              key={color.id}
              onClick={() => onUpdateEventColor(event.id, color.id)}
              className={`w-3.5 h-3.5 rounded-full ${color.tab} border-2 border-white shadow-sm transition-transform hover:scale-110 ${event.colorId === color.id ? 'ring-2 ring-offset-1 ring-gray-400 scale-110' : ''}`}
              title={`Pilih Warna`}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col ml-1 mb-3 shadow-sm rounded-lg bg-white border border-gray-200 overflow-hidden">
        {visibleTasks.length === 0 && (
          <div className="text-[11px] text-center p-3 text-gray-400 font-medium bg-gray-50/50">Belum ada tugas</div>
        )}
        
        {visibleTasks.map((task, index) => {
          const isSameAsPrev = index > 0 && visibleTasks[index - 1].assignee === task.assignee;
          const memberStyle = MEMBER_COLORS[task.assignee] || { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' };

          return (
            <div key={task.id} className="flex relative group/task border-b border-gray-100 last:border-b-0 items-stretch">
              <div className={`w-[35%] p-1 border-r border-gray-100 flex flex-col justify-center transition-colors ${memberStyle.bg} ${memberStyle.text}`}>
                <div className="relative w-full flex items-center h-full">
                  <select
                    value={task.assignee}
                    onChange={(e) => onUpdateTask(event.id, task.id, { assignee: e.target.value })}
                    className={`w-full h-full text-[11px] bg-transparent border-none focus:ring-0 font-extrabold outline-none cursor-pointer appearance-none truncate px-2 pr-5 ${isSameAsPrev ? 'opacity-40 hover:opacity-80' : 'opacity-100'}`}
                  >
                    {TEAM_MEMBERS.map(name => <option key={name} value={name}>{name}</option>)}
                  </select>
                  <div className={`absolute right-1 pointer-events-none ${isSameAsPrev ? 'opacity-30' : 'opacity-60'}`}>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>

              <div className="w-[65%] p-1.5 bg-white flex items-center justify-between hover:bg-slate-50 transition-colors relative">
                <div className="flex-1 w-full min-w-0 mr-1.5">
                  {task.isCustom ? (
                    <div className="flex items-center w-full gap-1">
                      <input
                        type="text"
                        value={task.type}
                        onChange={(e) => onUpdateTask(event.id, task.id, { type: e.target.value })}
                        className="w-full text-[11px] p-1 px-1.5 bg-white border border-indigo-200 rounded-md focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-gray-800 outline-none shadow-inner"
                        placeholder="Ketik manual..."
                        autoFocus
                      />
                      <button
                        onClick={() => onUpdateTask(event.id, task.id, { isCustom: false, type: TASK_TYPES[0] })}
                        className="text-gray-400 hover:text-red-500 p-1 shrink-0 bg-gray-50 hover:bg-red-50 rounded-md transition-colors"
                        title="Batal"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                      </button>
                    </div>
                  ) : (
                    <div className="relative w-full">
                      <select
                        value={TASK_TYPES.includes(task.type) ? task.type : (task.type === '' ? '...' : task.type)}
                        onChange={(e) => {
                          if (e.target.value === '...') {
                            onUpdateTask(event.id, task.id, { isCustom: true, type: '' });
                          } else {
                            onUpdateTask(event.id, task.id, { type: e.target.value });
                          }
                        }}
                        className="w-full text-[11px] py-1 px-1.5 bg-transparent border-none focus:ring-0 font-bold text-slate-800 outline-none cursor-pointer truncate appearance-none pr-5 hover:text-indigo-600 transition-colors"
                      >
                        {TASK_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                        <option value="...">...</option>
                      </select>
                      <div className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 opacity-60">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-1 shrink-0">
                  <button 
                    onClick={() => onDeleteTask(event.id, task.id)}
                    className="w-5 h-5 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-md text-gray-300 hover:text-red-500 opacity-0 group-hover/task:opacity-100 shadow-sm border border-transparent hover:border-red-200 hover:bg-red-50 transition-all hover:scale-110"
                    title="Hapus Baris Tugas"
                  >
                     <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                  <button
                    onClick={() => onToggleTaskCompletion(event.id, task.id)}
                    className="w-5 h-5 flex items-center justify-center rounded-md bg-white border border-gray-300 hover:bg-emerald-50 hover:border-emerald-400 text-gray-200 hover:text-emerald-500 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:ring-offset-1"
                    title="Tandai Selesai"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={() => onAddTask(event.id)}
        className="w-full py-1.5 text-[11px] text-gray-500 font-bold bg-gray-50/80 hover:bg-gray-200/80 rounded-lg transition-colors flex items-center justify-center gap-1.5 ml-1 border border-transparent hover:border-gray-200"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path></svg>
        Tambah Tugas
      </button>
    </div>
  );
};

export default function App() {
  const [history, setHistory] = useState([{}]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [draggedEventId, setDraggedEventId] = useState(null);
  
  const [user, setUser] = useState(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [syncStatus, setSyncStatus] = useState('Menghubungkan...');

  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedViewEvent, setSelectedViewEvent] = useState(null);

  const [schoolEvents, setSchoolEvents] = useState({});
  const [isSchoolEventModalOpen, setIsSchoolEventModalOpen] = useState(false);
  const [schoolEventForm, setSchoolEventForm] = useState({
    id: '', nama: '', divisi: DIVISI_OPTIONS[0], isCustomDivisi: false, pic: '', 
    temaId: '', temaAr: '', temaEn: '', date: '', endDate: '', waktu: '', lokasi: '', pemateri: '', colorId: 'info'
  });

  const events = history[historyIndex] || {}; 

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Auth error:", error);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // ... existing code ...

  useEffect(() => {
    if (!user) return;
    
    setSyncStatus('Menyinkronkan...');
    
    // UBAH BARIS INI: Hapus bagian 'users', user.uid
    // Menjadi brankas global bernama 'team_workspace'
    const plannerRef = doc(db, 'artifacts', appId, 'team_workspace', 'planner');
    const schoolEventsRef = doc(db, 'artifacts', appId, 'team_workspace', 'school_events');
    
    const unsubPlanner = onSnapshot(plannerRef, (docSnap) => {

// ... existing code ...

  const syncToCloud = (eventsToSync) => {
    if (user) {
      setSyncStatus('Menyimpan...');
      // UBAH BARIS INI JUGA: Samakan dengan yang di atas
      const docRef = doc(db, 'artifacts', appId, 'team_workspace', 'planner');
      setDoc(docRef, { events: eventsToSync })
        .then(() => setSyncStatus('Tersimpan'))
        .catch(() => setSyncStatus('Gagal Simpan'));
    }
  };

  const syncSchoolEventsToCloud = (newSchoolEvents) => {
    if (user) {
      // UBAH BARIS INI JUGA: Samakan dengan yang di atas
      const docRef = doc(db, 'artifacts', appId, 'team_workspace', 'school_events');
      setDoc(docRef, { events: newSchoolEvents }).catch(console.error);
    }
  };

// ... existing code ...
```eof

**Apa yang terjadi setelah ini diubah?**
Begitu Anda menyimpan kode ini dan melakukan *Push* ke Vercel:
1. Mulai sekarang, aplikasi tidak akan lagi peduli siapa yang *login* atau pakai perangkat apa.
2. PC Anda, Laptop Anda, maupun HP teman-teman tim Anda akan menembak ke folder database yang sama yaitu folder: `team_workspace`.
3. Jika Anda mengetik tugas di PC, tugas itu akan langsung *muncul (real-time)* di layar Laptop Anda detik itu juga!

Silakan diubah alamat databasenya dan buktikan sendiri sinkronisasinya! 🔥

  const syncToCloud = (eventsToSync) => {
    if (user) {
      setSyncStatus('Menyimpan...');
      const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'planner', 'events');
      setDoc(docRef, { events: eventsToSync })
        .then(() => setSyncStatus('Tersimpan'))
        .catch(() => setSyncStatus('Gagal Simpan'));
    }
  };

  const syncSchoolEventsToCloud = (newSchoolEvents) => {
    if (user) {
      const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'planner', 'school_events');
      setDoc(docRef, { events: newSchoolEvents }).catch(console.error);
    }
  };

  const updateEvents = (updater) => {
    setHistory(prevHistory => {
      const currentEvents = prevHistory[historyIndex];
      const newEvents = typeof updater === 'function' ? updater(currentEvents) : updater;
      
      const newHistory = prevHistory.slice(0, historyIndex + 1);
      newHistory.push(newEvents);
      syncToCloud(newEvents);
      return newHistory;
    });
    setHistoryIndex(prev => prev + 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      syncToCloud(history[newIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      syncToCloud(history[newIndex]);
    }
  };

  const handleCreateEvent = () => {
    const newId = generateId();
    updateEvents(prev => ({
      ...prev,
      [newId]: {
        id: newId,
        parentType: 'Event',
        title: 'Tugas Media Baru',
        unit: UNIT_OPTIONS[0],
        date: null,
        colorId: 'default',
        tasks: []
      }
    }));
  };

  const handleUpdateEventParentType = (eventId, newType) => updateEvents(prev => ({ ...prev, [eventId]: { ...prev[eventId], parentType: newType } }));
  const handleUpdateEventTitle = (eventId, newTitle) => updateEvents(prev => ({ ...prev, [eventId]: { ...prev[eventId], title: newTitle } }));
  const handleUpdateEventUnit = (eventId, newUnit) => updateEvents(prev => ({ ...prev, [eventId]: { ...prev[eventId], unit: newUnit } }));
  const handleUpdateEventColor = (eventId, colorId) => updateEvents(prev => ({ ...prev, [eventId]: { ...prev[eventId], colorId: colorId } }));
  
  const handleDeleteEvent = (eventId) => {
    updateEvents(prev => {
      const newEvents = { ...prev };
      delete newEvents[eventId];
      return newEvents;
    });
  };

  const handleDuplicateEvent = (eventId) => {
    updateEvents(prev => {
      const original = prev[eventId];
      if (!original) return prev;
      
      const newId = generateId();
      const duplicatedTasks = (original.tasks || []).map(t => ({
        ...t,
        id: generateId(),
        isCompleted: false
      }));

      return {
        ...prev,
        [newId]: {
          ...original,
          id: newId,
          date: null, 
          title: `${original.title} (Copy)`,
          tasks: duplicatedTasks
        }
      };
    });
  };

  const handleAddTask = (eventId) => {
    updateEvents(prev => {
      const event = prev[eventId];
      return {
        ...prev,
        [eventId]: {
          ...event,
          tasks: [...(event.tasks || []), { id: generateId(), assignee: TEAM_MEMBERS[0], type: TASK_TYPES[0], isCustom: false, isCompleted: false }]
        }
      }
    });
  };

  const handleUpdateTask = (eventId, taskId, updates) => {
    updateEvents(prev => {
      const event = prev[eventId];
      const updatedTasks = event.tasks.map(task => task.id === taskId ? { ...task, ...updates } : task);
      return { ...prev, [eventId]: { ...event, tasks: updatedTasks } };
    });
  };

  const handleDeleteTask = (eventId, taskId) => {
    updateEvents(prev => {
      const event = prev[eventId];
      const filteredTasks = event.tasks.filter(task => task.id !== taskId);
      return { ...prev, [eventId]: { ...event, tasks: filteredTasks } };
    });
  };

  const handleToggleTaskCompletion = (eventId, taskId) => {
    updateEvents(prev => {
      const event = prev[eventId];
      const updatedTasks = event.tasks.map(task => task.id === taskId ? { ...task, isCompleted: !task.isCompleted } : task);
      return { ...prev, [eventId]: { ...event, tasks: updatedTasks } };
    });
  };

  const handleDragStart = (e, eventId) => {
    setDraggedEventId(eventId);
    e.dataTransfer.setData('text/plain', eventId);
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => {
      if(e.target && e.target.classList) e.target.classList.add('opacity-40', 'scale-95');
    }, 0);
  };

  const handleDragEnd = (e) => {
    if(e.target && e.target.classList) e.target.classList.remove('opacity-40', 'scale-95');
    setDraggedEventId(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetDateKey) => {
    e.preventDefault();
    const eventId = draggedEventId || e.dataTransfer.getData('text/plain');
    if (eventId && events[eventId]) {
      updateEvents(prev => ({
        ...prev,
        [eventId]: { ...prev[eventId], date: targetDateKey }
      }));
    }
    setDraggedEventId(null);
  };

  const handleOpenSchoolEventModal = () => {
    setSchoolEventForm({
      id: '', nama: '', divisi: DIVISI_OPTIONS[0], isCustomDivisi: false, pic: '', 
      temaId: '', temaAr: '', temaEn: '', date: '', endDate: '', waktu: '', lokasi: '', pemateri: '', colorId: 'info'
    });
    setIsSchoolEventModalOpen(true);
  };

  const handleEditSchoolEvent = (eventData) => {
    const isCustom = !DIVISI_OPTIONS.includes(eventData.divisi);
    setSchoolEventForm({
      ...eventData,
      isCustomDivisi: isCustom
    });
    setSelectedViewEvent(null);
    setIsSchoolEventModalOpen(true); 
  };

  const handleSaveSchoolEvent = (e) => {
    e.preventDefault();
    const newId = schoolEventForm.id || generateId();
    let finalEndDate = schoolEventForm.endDate;
    if (finalEndDate && finalEndDate < schoolEventForm.date) {
      finalEndDate = schoolEventForm.date; 
    }
    const newEvent = { ...schoolEventForm, id: newId, endDate: finalEndDate };
    const updatedEvents = { ...schoolEvents, [newId]: newEvent };
    setSchoolEvents(updatedEvents);
    syncSchoolEventsToCloud(updatedEvents);
    setIsSchoolEventModalOpen(false);
  };

  const handleDeleteSchoolEvent = (id) => {
    if(window.confirm('Yakin ingin menghapus event sekolah ini?')) {
      const updatedEvents = { ...schoolEvents };
      delete updatedEvents[id];
      setSchoolEvents(updatedEvents);
      syncSchoolEventsToCloud(updatedEvents);
      if(selectedViewEvent && selectedViewEvent.id === id) setSelectedViewEvent(null);
    }
  };

  const getDatesInRange = (startDate, endDate) => {
    const dates = [];
    let current = new Date(startDate);
    const end = new Date(endDate);
    while (current <= end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
    return dates;
  };

  const currentWeekDays = getWeekDays(weekOffset);
  const unassignedEvents = Object.values(events).filter(e => !e.date);
  
  const eventsByDate = currentWeekDays.reduce((acc, day) => {
    acc[day.dateKey] = Object.values(events).filter(e => e.date === day.dateKey);
    return acc;
  }, {});

  const schoolEventsByDate = currentWeekDays.reduce((acc, day) => {
    acc[day.dateKey] = Object.values(schoolEvents).filter(e => {
      if (!e.date) return false;
      if (!e.endDate) return e.date === day.dateKey;
      const eventDates = getDatesInRange(e.date, e.endDate);
      return eventDates.includes(day.dateKey);
    });
    return acc;
  }, {});

  const completedTasks = [];
  Object.values(events).forEach(event => {
    if (event.tasks) {
      event.tasks.forEach(task => {
        if (task.isCompleted) {
          completedTasks.push({ 
            eventId: event.id, 
            eventTitle: event.parentType === 'Task' ? event.unit : event.title, 
            eventColor: event.colorId, 
            task 
          });
        }
      });
    }
  });

  const unfinishedTasks = [];
  Object.values(events).forEach(event => {
    if (event.date && event.tasks) { 
      event.tasks.forEach(task => {
        if (!task.isCompleted) {
          unfinishedTasks.push({ 
            eventId: event.id, 
            eventTitle: event.parentType === 'Task' ? event.unit : event.title, 
            eventColor: event.colorId, 
            date: event.date,
            task 
          });
        }
      });
    }
  });
  unfinishedTasks.sort((a, b) => new Date(a.date) - new Date(b.date));

  const allSchoolEventsList = Object.values(schoolEvents).sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-3 md:p-5 flex flex-col relative overflow-x-hidden">
      
      {/* Header Utama dengan Gradien Warna */}
      <header className="sticky top-2 z-40 bg-gradient-to-r from-[#CCF4FF] via-[#5699F2] to-[#104BE6] shadow-lg rounded-2xl p-3 md:px-5 flex flex-col md:flex-row justify-between items-center mb-6 border-none">
        <div className="flex items-center gap-4 mb-4 md:mb-0">
          <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center p-1.5 shrink-0 overflow-hidden drop-shadow-sm">
             <img src="LOGO AL WAFI TV-01.png" alt="Logo" className="w-full h-full object-contain" onError={(e) => e.target.style.display = 'none'} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-blue-900 tracking-tight flex items-center gap-2">
              MMedia WIIBS
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs font-bold text-blue-900/80 uppercase tracking-widest">Task Planner</p>
              <div className="w-1 h-1 bg-white/50 rounded-full"></div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors ${syncStatus === 'Tersimpan' || syncStatus === 'Cloud Aktif' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-amber-50 text-amber-600 border border-amber-200'}`}>
                {syncStatus === 'Tersimpan' || syncStatus === 'Cloud Aktif' ? (
                   <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
                ) : syncStatus === 'Offline Mode' ? (
                   <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"></path></svg>
                ) : (
                   <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                )}
                {syncStatus}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 bg-white border border-gray-200 p-1 rounded-xl shadow-sm">
            <button onClick={() => setWeekOffset(prev => prev - 1)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Pekan Lalu">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
            </button>
            <span className="text-xs font-bold text-gray-700 min-w-[90px] text-center tracking-wide font-tanggal">
              {weekOffset === 0 ? 'PEKAN INI' : weekOffset === -1 ? 'PEKAN LALU' : weekOffset === 1 ? 'PEKAN DEPAN' : `PEKAN ${weekOffset > 0 ? '+' : ''}${weekOffset}`}
            </span>
            <button onClick={() => setWeekOffset(prev => prev + 1)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Pekan Depan">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path></svg>
            </button>
            <div className="w-px h-5 bg-gray-200 mx-1"></div>
            <button onClick={() => setWeekOffset(0)} className="text-[10px] px-2.5 py-1.5 text-indigo-700 font-bold bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors uppercase tracking-wider">HARI INI</button>
          </div>

          <div className="flex bg-white rounded-xl p-1 border border-gray-200 shadow-sm">
            <button 
              onClick={handleUndo} disabled={historyIndex === 0}
              className={`px-3 py-1.5 rounded-lg flex items-center justify-center transition-all ${historyIndex === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-50 hover:text-indigo-600'}`}
              title="Undo"
            ><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path></svg></button>
            <div className="w-px bg-gray-200 mx-0.5 my-1.5"></div>
            <button 
              onClick={handleRedo} disabled={historyIndex === history.length - 1}
              className={`px-3 py-1.5 rounded-lg flex items-center justify-center transition-all ${historyIndex === history.length - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-50 hover:text-indigo-600'}`}
              title="Redo"
            ><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6"></path></svg></button>
          </div>
        </div>
      </header>

      <div className="flex flex-col xl:flex-row gap-4 flex-1 min-h-0">
        
        {/* PANEL KIRI: BLOK CADANGAN & TUGAS BELUM SELESAI */}
        <div className="w-full xl:w-64 flex flex-col gap-4 shrink-0 z-30">
          
          <div className="bg-white rounded-2xl p-4 border border-gray-200 flex flex-col shadow-sm sticky top-[6.5rem] h-fit" style={{ maxHeight: 'calc(50vh - 4.5rem)' }}>
            <div className="flex justify-between items-center mb-4 sticky top-0 bg-white z-10 py-1 border-b border-gray-100">
              <h2 className="font-extrabold text-gray-800 uppercase text-xs tracking-widest flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm"></span> Blok Cadangan
              </h2>
              <button onClick={handleCreateEvent} className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg flex items-center gap-1 text-[10px] font-bold px-2.5" title="Buat Event Baru">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path></svg> Baru
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-1 pb-2 custom-scrollbar">
              {unassignedEvents.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 text-gray-400 text-xs font-medium">
                  Tidak ada blok cadangan.<br/><span className="text-[10px] opacity-75 mt-1 block">Klik tombol "+ Baru"</span>
                </div>
              ) : (
                unassignedEvents.map(event => (
                  <EventCard
                    key={event.id} event={event} onDragStart={handleDragStart} onDragEnd={handleDragEnd}
                    onUpdateEventParentType={handleUpdateEventParentType} onUpdateEventTitle={handleUpdateEventTitle}
                    onUpdateEventUnit={handleUpdateEventUnit} onUpdateEventColor={handleUpdateEventColor}
                    onDeleteEvent={handleDeleteEvent} onDuplicateEvent={handleDuplicateEvent} onAddTask={handleAddTask} onUpdateTask={handleUpdateTask}
                    onDeleteTask={handleDeleteTask} onToggleTaskCompletion={handleToggleTaskCompletion}
                  />
                ))
              )}
            </div>
          </div>

          <div className="bg-amber-50/70 rounded-2xl p-4 border border-amber-200 flex flex-col shadow-inner sticky h-fit" style={{ top: 'calc(50vh + 3rem)', maxHeight: 'calc(50vh - 4.5rem)' }}>
            <div className="flex justify-between items-center mb-4 sticky top-0 bg-amber-50/70 py-1 z-10 border-b border-amber-200/50 backdrop-blur-sm">
              <h2 className="font-extrabold text-amber-800 uppercase text-xs tracking-widest flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm animate-pulse"></span> Menunggu
              </h2>
              <span className="text-[10px] font-extrabold text-amber-700 bg-amber-100 px-2 py-1 rounded-lg border border-amber-200 shadow-sm font-tanggal">
                {unfinishedTasks.length} Tugas
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-1 pb-2 flex flex-col gap-2.5 custom-scrollbar">
              {unfinishedTasks.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-amber-200/60 rounded-xl text-amber-600/70 text-[11px] font-medium bg-white/40">
                  Tidak ada tugas tertunda.<br/><span className="text-[10px] opacity-75 mt-1 block">Tarik blok ke kalender.</span>
                </div>
              ) : (
                unfinishedTasks.map(({ eventId, eventTitle, eventColor, date, task }) => {
                  const colorTab = EVENT_COLORS.find(c => c.id === eventColor)?.tab || 'bg-gray-400';
                  const member = MEMBER_COLORS[task.assignee] || MEMBER_COLORS['Doni'];
                  const shortDay = new Date(date).toLocaleDateString('id-ID', {weekday: 'short', day: 'numeric'});
                  
                  return (
                    <div key={`${eventId}-${task.id}`} className="bg-white p-2.5 rounded-xl shadow-sm border border-amber-100 flex flex-col gap-2 group relative overflow-hidden transition-all hover:shadow-md hover:border-amber-300">
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${colorTab}`}></div>
                      
                      <div className="flex justify-between items-start pl-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate pr-6" title={eventTitle}>
                          {eventTitle || 'Tanpa Judul'}
                        </span>
                        <span className="text-[9px] font-black text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 uppercase tracking-widest absolute right-2 top-2 font-tanggal">
                          {shortDay}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between pl-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md shrink-0 ${member.bg} ${member.text} border ${member.border}`}>
                            {task.assignee}
                          </span>
                          <span className="text-[11px] font-bold text-gray-700 truncate">
                            {task.type || 'Tugas kustom'}
                          </span>
                        </div>
                        
                        <button
                          onClick={() => handleToggleTaskCompletion(eventId, task.id)}
                          className="w-5 h-5 shrink-0 flex items-center justify-center rounded-md bg-white border border-gray-300 hover:bg-emerald-50 hover:border-emerald-400 text-gray-200 hover:text-emerald-500 shadow-sm transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                          title="Tandai Selesai"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* PANEL TENGAH: CALENDAR */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col min-w-0 w-full mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-px bg-gray-100 flex-1">
            {currentWeekDays.map((day, index) => {
              let headerColorClass = "bg-gray-50 border-gray-200 text-gray-700";
              let dropAreaBgClass = "bg-slate-50/20 hover:bg-slate-50/70";

              if (index >= 0 && index <= 2) { headerColorClass = "bg-orange-50 border-orange-100 text-orange-800"; dropAreaBgClass = "bg-orange-50/10 hover:bg-orange-50/40"; } 
              else if (index === 3) { headerColorClass = "bg-red-50 border-red-100 text-red-800"; dropAreaBgClass = "bg-red-50/10 hover:bg-red-50/40"; } 
              else if (index === 4) { headerColorClass = "bg-green-50 border-green-100 text-green-800"; dropAreaBgClass = "bg-green-50/10 hover:bg-green-50/40"; } 
              else if (index === 5) { headerColorClass = "bg-blue-50 border-blue-100 text-blue-800"; dropAreaBgClass = "bg-blue-50/10 hover:bg-blue-50/40"; } 
              else if (index === 6) { headerColorClass = "bg-gray-200 border-gray-300 text-gray-600"; dropAreaBgClass = "bg-gray-100/30 hover:bg-gray-100/60"; }

              const isToday = day.dateKey === new Date().toISOString().split('T')[0];
              const daySchoolEvents = schoolEventsByDate[day.dateKey] || [];

              return (
                <div key={day.dateKey} className="bg-white min-h-[600px] flex flex-col h-full transition-all group/day" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, day.dateKey)}>
                  <div className={`p-3 flex justify-center items-center shadow-sm relative ${headerColorClass} border-b`}>
                    {isToday && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>}
                    <h3 className={`text-[13px] tracking-wide font-tanggal ${isToday ? 'font-extrabold' : 'font-bold'}`}>{day.display}</h3>
                  </div>
                  
                  <div className={`flex-1 p-2 transition-colors flex flex-col h-full ${dropAreaBgClass}`}>
                    {daySchoolEvents.map(seEvent => (
                      <SchoolEventCard 
                        key={`${seEvent.id}-${day.dateKey}`} event={seEvent} 
                        onDelete={() => handleDeleteSchoolEvent(seEvent.id)}
                        onView={setSelectedViewEvent}
                        onEdit={handleEditSchoolEvent}
                      />
                    ))}

                    {eventsByDate[day.dateKey].map(event => (
                      <EventCard
                        key={event.id} event={event} onDragStart={handleDragStart} onDragEnd={handleDragEnd}
                        onUpdateEventParentType={handleUpdateEventParentType} onUpdateEventTitle={handleUpdateEventTitle}
                        onUpdateEventUnit={handleUpdateEventUnit} onUpdateEventColor={handleUpdateEventColor}
                        onDeleteEvent={handleDeleteEvent} onDuplicateEvent={handleDuplicateEvent} onAddTask={handleAddTask} onUpdateTask={handleUpdateTask}
                        onDeleteTask={handleDeleteTask} onToggleTaskCompletion={handleToggleTaskCompletion}
                      />
                    ))}
                    
                    {eventsByDate[day.dateKey].length === 0 && daySchoolEvents.length === 0 && (
                      <div className="flex-1 flex items-center justify-center text-[11px] font-medium text-gray-300 p-4 text-center pointer-events-none min-h-[150px] border-2 border-dashed border-transparent group-hover/day:border-gray-200 rounded-xl m-2 transition-all">
                        Tarik ke sini
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* PANEL KANAN: SCHOOL EVENTS & COMPLETED TASKS */}
        <div className="w-full xl:w-[17rem] flex flex-col gap-4 shrink-0 z-30">
          
          <div className="bg-white rounded-2xl p-4 border border-gray-200 flex flex-col shadow-sm sticky top-[6.5rem] h-fit" style={{ maxHeight: 'calc(50vh - 4.5rem)' }}>
            <div className="flex justify-between items-center mb-4 sticky top-0 bg-white py-1 z-10 border-b border-gray-100">
              <h2 className="font-extrabold text-gray-800 uppercase text-xs tracking-widest flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-sm"></span> Event Sekolah
              </h2>
              <button onClick={handleOpenSchoolEventModal} className="p-1.5 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors border border-purple-200 flex items-center justify-center" title="Tambah Event Sekolah Baru">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path></svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-1 pb-2 flex flex-col gap-2.5 custom-scrollbar">
              {allSchoolEventsList.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-[11px] font-medium bg-gray-50">
                  Belum ada event sekolah.<br/><span className="text-[10px] opacity-75 mt-1 block">Klik tombol + di atas.</span>
                </div>
              ) : (
                allSchoolEventsList.map((se) => {
                  const eventDateObj = new Date(se.date);
                  const isPast = eventDateObj < new Date(new Date().setHours(0,0,0,0));
                  const activeColor = EVENT_COLORS.find(c => c.id === (se.colorId || 'info')) || EVENT_COLORS[4];
                  const hasEndDate = se.endDate && se.endDate !== se.date;

                  return (
                    <div 
                      key={se.id} onClick={() => setSelectedViewEvent(se)} 
                      className={`p-2.5 rounded-xl border border-gray-200 flex flex-col gap-1.5 group relative transition-all cursor-pointer hover:shadow-md border-r-4 ${activeColor.bg} ${isPast ? 'opacity-60 grayscale-[50%]' : ''}`}
                      style={{ borderRightColor: activeColor.tab.replace('bg-', '') }}
                    >
                      <div className="flex justify-between items-start">
                        <span className={`text-[9px] font-extrabold uppercase tracking-widest text-white ${activeColor.tab} px-1.5 py-0.5 rounded shadow-sm`}>
                          {se.divisi}
                        </span>
                        {hasEndDate && (
                          <span className="text-[9px] font-bold text-gray-500 flex items-center gap-0.5 bg-white/80 px-1 rounded border border-gray-100">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg> Multi-hari
                          </span>
                        )}
                      </div>
                      <h4 className="text-[11px] font-bold text-gray-800 leading-snug line-clamp-2">{se.nama}</h4>
                      <p className="text-[10px] font-semibold text-gray-600 flex items-center gap-1 font-tanggal">
                        <svg className={`w-3 h-3 ${activeColor.tab.replace('bg-', 'text-')}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        {new Date(se.date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100 flex flex-col shadow-inner sticky h-fit" style={{ top: 'calc(50vh + 3rem)', maxHeight: 'calc(50vh - 4.5rem)' }}>
            <div className="flex justify-between items-center mb-4 sticky top-0 bg-emerald-50/80 py-1 z-10 border-b border-emerald-100 backdrop-blur-sm">
              <h2 className="font-extrabold text-emerald-800 uppercase text-xs tracking-widest flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm animate-pulse"></span> Selesai
              </h2>
              <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-lg border border-emerald-200 shadow-sm font-tanggal">
                {completedTasks.length} Tugas
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-1 pb-2 flex flex-col gap-2.5 custom-scrollbar">
              {completedTasks.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-emerald-200/60 rounded-xl text-emerald-600/70 text-[11px] font-medium bg-white/40">
                  Belum ada tugas selesai.<br/><span className="text-[10px] opacity-75 mt-1 block">Centang tugas di kalender.</span>
                </div>
              ) : (
                completedTasks.map(({ eventId, eventTitle, eventColor, task }) => {
                  const colorTab = EVENT_COLORS.find(c => c.id === eventColor)?.tab || 'bg-gray-400';
                  const member = MEMBER_COLORS[task.assignee] || MEMBER_COLORS['Doni'];
                  return (
                    <div key={task.id} className="bg-white p-2.5 rounded-xl shadow-sm border border-emerald-100 flex flex-col gap-2 group relative overflow-hidden transition-all hover:shadow-md hover:border-emerald-300">
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${colorTab}`}></div>
                      
                      <div className="flex justify-between items-start pl-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate pr-6" title={eventTitle}>
                          {eventTitle || 'Tanpa Judul'}
                        </span>
                        <button
                          onClick={() => handleToggleTaskCompletion(eventId, task.id)}
                          className="text-gray-300 hover:text-amber-600 bg-gray-50 hover:bg-amber-50 border border-transparent hover:border-amber-200 rounded p-1 opacity-0 group-hover:opacity-100 transition-all absolute right-2 top-2 shadow-sm"
                          title="Batal Selesai (Kembalikan)"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path></svg>
                        </button>
                      </div>
                      
                      <div className="flex items-center gap-2 pl-2">
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md shrink-0 ${member.bg} ${member.text} border ${member.border}`}>
                          {task.assignee}
                        </span>
                        <span className="text-[11px] font-semibold text-gray-500 line-through decoration-gray-300 truncate">
                          {task.type || 'Tugas kustom'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      </div>

      {/* MODALS */}
      {isSchoolEventModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-extrabold text-gray-800 text-lg flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-purple-500 shadow-sm"></span> {schoolEventForm.id ? 'Edit Event Sekolah' : 'Form Event Sekolah'}
              </h3>
              <button onClick={() => setIsSchoolEventModalOpen(false)} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl p-2 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <form id="schoolEventForm" onSubmit={handleSaveSchoolEvent} className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Nama Event <span className="text-red-500">*</span></label>
                  <input type="text" required value={schoolEventForm.nama} onChange={e => setSchoolEventForm({...schoolEventForm, nama: e.target.value})} className="w-full text-sm font-bold text-gray-800 p-2.5 px-3 bg-white border border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all shadow-sm placeholder:font-medium placeholder:text-gray-400" placeholder="Contoh: Kajian Akbar / Rapat Evaluasi" autoFocus />
                </div>
                
                <div>
                  <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Divisi Penyelenggara</label>
                  {schoolEventForm.isCustomDivisi ? (
                    <div className="flex items-center gap-2">
                      <input type="text" value={schoolEventForm.divisi === '...' ? '' : schoolEventForm.divisi} onChange={e => setSchoolEventForm({...schoolEventForm, divisi: e.target.value})} className="w-full text-sm font-bold text-gray-800 p-2.5 px-3 bg-white border border-indigo-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none shadow-sm" placeholder="Ketik divisi..." autoFocus />
                      <button type="button" onClick={() => setSchoolEventForm({...schoolEventForm, isCustomDivisi: false, divisi: DIVISI_OPTIONS[0]})} className="p-2.5 text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 rounded-xl transition-colors border border-gray-200 hover:border-red-200" title="Batal Ketik Manual">
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                      </button>
                    </div>
                  ) : (
                    <select value={schoolEventForm.divisi} onChange={e => {
                        if(e.target.value === '...') setSchoolEventForm({...schoolEventForm, isCustomDivisi: true, divisi: ''});
                        else setSchoolEventForm({...schoolEventForm, divisi: e.target.value});
                      }} 
                      className="w-full text-sm font-bold text-gray-800 p-2.5 px-3 bg-white border border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none cursor-pointer shadow-sm appearance-none text-slate-800"
                    >
                      {DIVISI_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      <option value="...">+ Ketik Manual...</option>
                    </select>
                  )}
                </div>
                
                <div>
                  <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">PIC (Penanggung Jawab)</label>
                  <input type="text" value={schoolEventForm.pic} onChange={e => setSchoolEventForm({...schoolEventForm, pic: e.target.value})} className="w-full text-sm font-bold text-gray-800 p-2.5 px-3 bg-white border border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all shadow-sm" placeholder="Nama PIC Acara" />
                </div>
              </div>

              <div className="bg-slate-50/50 p-4 rounded-2xl border border-gray-100 mb-6 flex flex-col gap-4">
                <h4 className="text-xs font-extrabold text-gray-800 flex items-center gap-2 mb-1">
                   <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"></path></svg>
                   Tema Acara (Multibahasa)
                </h4>
                <div>
                  <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Indonesia 🇮🇩</label>
                  <input type="text" value={schoolEventForm.temaId} onChange={e => setSchoolEventForm({...schoolEventForm, temaId: e.target.value})} className="w-full text-sm font-semibold text-gray-700 p-2.5 px-3 bg-white border border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none shadow-sm" placeholder="Contoh: Pentingnya Menuntut Ilmu" />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-1.5 ml-1 text-right">Arab 🇸🇦</label>
                  <input type="text" dir="rtl" value={schoolEventForm.temaAr} onChange={e => setSchoolEventForm({...schoolEventForm, temaAr: e.target.value})} className="w-full text-base font-medium font-serif text-gray-800 p-2.5 px-3 bg-white border border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none shadow-sm text-right" placeholder="أهمية طلب العلم" />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Inggris 🇬🇧</label>
                  <input type="text" value={schoolEventForm.temaEn} onChange={e => setSchoolEventForm({...schoolEventForm, temaEn: e.target.value})} className="w-full text-sm font-semibold text-gray-700 p-2.5 px-3 bg-white border border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none shadow-sm" placeholder="The Importance of Seeking Knowledge" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Mulai <span className="text-red-500">*</span></label>
                  <input type="date" required value={schoolEventForm.date} onChange={e => setSchoolEventForm({...schoolEventForm, date: e.target.value})} className="w-full text-sm font-bold text-gray-800 p-2.5 px-3 bg-white border border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none cursor-pointer shadow-sm font-tanggal" />
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Selesai (Opsional)</label>
                  <input type="date" min={schoolEventForm.date} value={schoolEventForm.endDate || ''} onChange={e => setSchoolEventForm({...schoolEventForm, endDate: e.target.value})} className="w-full text-sm font-bold text-gray-800 p-2.5 px-3 bg-white border border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none cursor-pointer shadow-sm font-tanggal" />
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Waktu (Jam)</label>
                  <input type="time" value={schoolEventForm.waktu} onChange={e => setSchoolEventForm({...schoolEventForm, waktu: e.target.value})} className="w-full text-sm font-bold text-gray-800 p-2.5 px-3 bg-white border border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none cursor-pointer shadow-sm font-tanggal" />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Lokasi Acara</label>
                  <input type="text" value={schoolEventForm.lokasi} onChange={e => setSchoolEventForm({...schoolEventForm, lokasi: e.target.value})} className="w-full text-sm font-bold text-gray-800 p-2.5 px-3 bg-white border border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all shadow-sm" placeholder="Contoh: Masjid / Aula / Lapangan" />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Pengisi / Pemateri</label>
                  <input type="text" value={schoolEventForm.pemateri} onChange={e => setSchoolEventForm({...schoolEventForm, pemateri: e.target.value})} className="w-full text-sm font-bold text-gray-800 p-2.5 px-3 bg-white border border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all shadow-sm" placeholder="Nama Ustadz atau Pemateri" />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Warna Kartu Event</label>
                  <div className="flex flex-wrap gap-2.5 bg-white p-3 rounded-xl border border-gray-200 shadow-sm w-fit">
                    {EVENT_COLORS.map(color => (
                      <button
                        key={color.id}
                        type="button"
                        onClick={() => setSchoolEventForm({...schoolEventForm, colorId: color.id})}
                        className={`w-7 h-7 rounded-full ${color.tab} border-2 border-white shadow-md transition-all hover:scale-110 ${schoolEventForm.colorId === color.id ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : 'opacity-70 hover:opacity-100'}`}
                        title={`Pilih Warna`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </form>
            
            <div className="p-5 bg-white border-t border-gray-100 flex justify-end gap-3 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.1)] z-10">
              <button type="button" onClick={() => setIsSchoolEventModalOpen(false)} className="px-5 py-2.5 text-xs font-extrabold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">Batal</button>
              <button type="submit" form="schoolEventForm" disabled={!schoolEventForm.nama || !schoolEventForm.date} className="px-6 py-2.5 text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-[0_4px_12px_rgba(79,70,229,0.3)] hover:shadow-[0_6px_16px_rgba(79,70,229,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                {schoolEventForm.id ? 'Simpan Perubahan' : 'Simpan ke Kalender'}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedViewEvent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            <div className={`px-6 py-4 flex justify-between items-center shadow-md z-10 ${EVENT_COLORS.find(c => c.id === (selectedViewEvent.colorId || 'info'))?.tab || 'bg-blue-500'}`}>
              <h3 className="font-extrabold text-white text-base flex items-center gap-2.5">
                <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                </div>
                Detail Event
              </h3>
              <div className="flex gap-2">
                <button onClick={() => handleEditSchoolEvent(selectedViewEvent)} className="text-white hover:text-white bg-black/10 hover:bg-black/20 rounded-xl px-3 py-1.5 text-xs font-bold transition-colors flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg> Edit
                </button>
                <button onClick={() => setSelectedViewEvent(null)} className="text-white/70 hover:text-white bg-black/10 hover:bg-black/20 rounded-xl p-1.5 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar flex flex-col gap-5 bg-slate-50/50">
               <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">Nama Event</span>
                  <p className="text-xl font-black text-gray-800 mt-0.5">{selectedViewEvent.nama}</p>
               </div>
               
               <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">Divisi</span>
                    <div className="mt-1">
                      <span className="text-xs font-bold text-gray-700 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-md">{selectedViewEvent.divisi}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">PIC</span>
                    <p className="text-sm font-bold text-gray-700 mt-1">{selectedViewEvent.pic || '-'}</p>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">Tanggal Acara</span>
                    <p className="text-sm font-bold text-gray-700 mt-1 flex items-center gap-1.5 font-tanggal">
                       <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                       {selectedViewEvent.date ? (
                         selectedViewEvent.endDate && selectedViewEvent.endDate !== selectedViewEvent.date 
                           ? `${new Date(selectedViewEvent.date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})} s.d ${new Date(selectedViewEvent.endDate).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'})}`
                           : new Date(selectedViewEvent.date).toLocaleDateString('id-ID', {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'})
                       ) : '-'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">Waktu / Jam</span>
                    <p className="text-sm font-bold text-gray-700 mt-1 flex items-center gap-1.5 font-tanggal">
                       <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                       {selectedViewEvent.waktu || '-'}
                    </p>
                  </div>
               </div>

               <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">Lokasi</span>
                    <p className="text-sm font-bold text-gray-700 mt-1 flex items-start gap-1.5">
                       <svg className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                       {selectedViewEvent.lokasi || '-'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">Pengisi / Pemateri</span>
                    <p className="text-sm font-bold text-gray-700 mt-1 flex items-start gap-1.5">
                       <svg className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                       {selectedViewEvent.pemateri || '-'}
                    </p>
                  </div>
               </div>

               {(selectedViewEvent.temaId || selectedViewEvent.temaAr || selectedViewEvent.temaEn) && (
                 <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-2 block">Tema Event</span>
                    <div className="flex flex-col gap-2">
                       {selectedViewEvent.temaId && <p className="text-sm font-semibold text-gray-700 bg-gray-50 p-2 rounded-lg border border-gray-100">🇮🇩 {selectedViewEvent.temaId}</p>}
                       {selectedViewEvent.temaAr && <p className="text-base font-semibold text-gray-700 bg-gray-50 p-2 rounded-lg border border-gray-100 text-right font-serif" dir="rtl">🇸🇦 {selectedViewEvent.temaAr}</p>}
                       {selectedViewEvent.temaEn && <p className="text-sm font-semibold text-gray-700 bg-gray-50 p-2 rounded-lg border border-gray-100">🇬🇧 {selectedViewEvent.temaEn}</p>}
                    </div>
                 </div>
               )}
            </div>
            
            <div className="p-4 bg-white border-t border-gray-100 flex justify-end shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.1)] z-10">
              <button onClick={() => setSelectedViewEvent(null)} className="px-6 py-2.5 text-xs font-extrabold text-white bg-slate-800 hover:bg-slate-900 rounded-xl shadow-md hover:shadow-lg transition-all">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@500;700;800;900&display=swap');
        
        .font-tanggal {
          font-family: 'Outfit', sans-serif;
          letter-spacing: -0.02em;
        }

        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb { background-color: #94a3b8; }
      `}} />
    </div>
  );
}