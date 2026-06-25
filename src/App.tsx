import { useEffect, useState, useMemo } from "react";
import { Clock, RefreshCw, ZapOff, MapPin, Loader2, Calendar as CalendarIcon, Info } from "lucide-react";
import { OutageSchedule } from "./types";

const ALL_DISTRICTS = "Tất cả khu vực";

export default function App() {
  const [schedules, setSchedules] = useState<OutageSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>(ALL_DISTRICTS);

  const fetchSchedules = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const basePath = import.meta.env.BASE_URL || '/';
      const res = await fetch(`${basePath}schedules.json`);
      const data = await res.json();
      
      if (Array.isArray(data)) {
        setSchedules(data);
      } else {
        setSchedules([]);
      }
    } catch (e) {
      console.error("Failed to fetch schedules", e);
      setErrorMsg("Không thể tải lịch cúp điện. Vui lòng thử lại sau.");
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const districts = useMemo(() => {
    const set = new Set<string>();
    schedules.forEach(s => {
      if (s.district) {
        // Strip "Điện lực" prefix for a cleaner dropdown
        const name = s.district.replace(/Điện lực/gi, "").trim();
        set.add(name);
      }
    });
    return [ALL_DISTRICTS, ...Array.from(set).sort()];
  }, [schedules]);

  const filteredSchedules = useMemo(() => {
    if (selectedDistrict === ALL_DISTRICTS) return schedules;
    return schedules.filter(s => {
       const name = s.district.replace(/Điện lực/gi, "").trim();
       return name === selectedDistrict;
    });
  }, [schedules, selectedDistrict]);

  const groupedSchedules = useMemo(() => {
    const groups: Record<string, OutageSchedule[]> = {};
    filteredSchedules.forEach(s => {
      const date = new Date(s.start_time);
      const dateStr = date.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
      if (!groups[dateStr]) groups[dateStr] = [];
      groups[dateStr].push(s);
    });

    // Sort dates
    return Object.keys(groups).sort((a, b) => {
       const dateA = groups[a][0].start_time;
       const dateB = groups[b][0].start_time;
       return new Date(dateA).getTime() - new Date(dateB).getTime();
    }).map(dateStr => ({
       date: dateStr,
       items: groups[dateStr]
    }));
  }, [filteredSchedules]);

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-12">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 text-yellow-600 rounded-xl flex items-center justify-center">
              <ZapOff className="w-5 h-5" />
            </div>
            <div>
               <h1 className="text-xl font-bold tracking-tight text-gray-900">Lịch Cúp Điện Lâm Đồng</h1>
            </div>
          </div>
          <button
            onClick={fetchSchedules}
            disabled={loading}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors px-3 py-2 rounded-lg font-medium text-sm disabled:opacity-50"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={"w-4 h-4 " + (loading ? "animate-spin text-yellow-600" : "")} />
            <span className="hidden sm:inline">Cập nhật</span>
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        
        {/* Filters */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-3 w-full sm:w-auto">
               <MapPin className="w-5 h-5 text-gray-400" />
               <select 
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-yellow-500 focus:border-yellow-500 block w-full p-2.5 outline-none transition-shadow cursor-pointer"
               >
                  {districts.map(d => (
                     <option key={d} value={d}>{d}</option>
                  ))}
               </select>
            </div>
            <div className="text-sm text-gray-500 w-full sm:w-auto text-left sm:text-right">
                Tìm thấy <strong className="text-gray-900">{filteredSchedules.length}</strong> lịch cúp điện
            </div>
        </div>

        {errorMsg && (
           <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 shadow-sm flex items-start gap-3">
              <Info className="w-5 h-5 shrink-0 mt-0.5" />
              <p>{errorMsg}</p>
           </div>
        )}

        {/* Schedules List */}
        <div className="space-y-8">
          {loading && schedules.length === 0 ? (
             <div className="flex flex-col justify-center items-center py-20 text-gray-400">
                <Loader2 className="w-10 h-10 text-yellow-500 animate-spin mb-4" />
                <p>Đang tải dữ liệu...</p>
             </div>
          ) : groupedSchedules.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-200 border-dashed text-gray-500 shadow-sm">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                 <ZapOff className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-lg font-medium text-gray-900">Không có lịch cúp điện</p>
              <p className="mt-1">Khu vực này hiện không có lịch cúp điện nào được lên kế hoạch.</p>
            </div>
          ) : (
            groupedSchedules.map((group) => (
              <section key={group.date} className="space-y-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 sticky top-16 bg-gray-50/90 backdrop-blur-sm py-2 z-0">
                   <CalendarIcon className="w-5 h-5 text-yellow-600" />
                   <span className="capitalize">{group.date}</span>
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {group.items.map((schedule) => (
                    <div key={schedule.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow flex flex-col h-full">
                      <div className="flex items-start justify-between mb-4 gap-2">
                        <div className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-100">
                          {schedule.district.replace(/Điện lực/gi, "").trim()}
                        </div>
                        <div className="flex items-center text-sm font-semibold text-gray-900 bg-gray-50 px-3 py-1.5 rounded-lg shrink-0">
                           <Clock className="w-4 h-4 mr-2 text-gray-500" />
                           {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                        </div>
                      </div>
                      
                      <div className="space-y-4 flex-grow">
                        <div>
                           <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Khu vực</p>
                           <p className="text-gray-900 text-sm leading-relaxed">{schedule.area}</p>
                        </div>
                        {schedule.reason && (
                           <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 mt-auto">
                              <p className="text-xs font-semibold text-gray-500 mb-1">Lý do cắt điện</p>
                              <p className="text-gray-700 text-sm leading-relaxed">{schedule.reason}</p>
                           </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
