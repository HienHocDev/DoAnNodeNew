import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Clock, Coffee } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { getBehaviorAnalytics } from '../../services/analyticsService';
import { useTheme } from '../../context/ThemeContext';

const Analysis = () => {
  const [analysisData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const { t } = useTheme();

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await getBehaviorAnalytics(selectedMonth);
        setAnalyticsData(res);
      } catch (err) {
        setError(t('analysis_error_api'));
      } finally {
        setLoading(false);
      }
    };
    fetchAnalysis();
  }, [selectedMonth, t]);

  if (loading) return <div className="text-center py-10 text-gray-500">{t('analysis_loading')}</div>;
  if (error) return <div className="text-red-500 text-center py-10">{error}</div>;

  const { trendPercentage, miniChartData, topCategory, topTimeSlot } = analysisData;

  // Bản đồ hóa tên danh mục tiếng Anh sang tiếng Việt để hiển thị UI đẹp hơn
  const categoryTranslation = {
    'food': 'Ăn uống',
    'transport': 'Di chuyển',
    'shopping': 'Mua sắm',
    'bills': 'Hóa đơn',
    'entertainment': 'Giải trí',
    'other': t('cat_other')
  };

  const displayName = categoryTranslation[topCategory.name] || topCategory.name;
  const trendLabel = trendPercentage === null
    ? 'Mới'
    : `${trendPercentage > 0 ? 'Tăng' : trendPercentage < 0 ? 'Giảm' : 'Không đổi'} ${Math.abs(trendPercentage).toFixed(1)}%`;

  return (
    <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/60 p-8 min-h-[calc(100vh-8rem)] max-w-6xl mx-auto animate-in fade-in duration-500">
      <div className="mb-10">
        <h2 className="text-2xl font-black text-gray-800 tracking-tight">{t('analysis_title')}</h2>
        <p className="text-sm text-gray-500 font-medium mt-1">{t('analysis_subtitle')}</p>
        <input type="month" value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)} className="mt-4 border border-gray-200 rounded-xl px-4 py-2 bg-white text-gray-700" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Xu hướng chi tiêu */}
        <div className="rounded-3xl p-6 bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-xl shadow-indigo-200/50 hover:shadow-2xl hover:shadow-indigo-300/50 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3 group-hover:scale-150 transition-transform duration-700"></div>
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-xs font-bold text-white/70 uppercase tracking-widest">{t('analysis_trend')}</p>
                <h3 className="text-2xl font-black text-white mt-1 flex items-center gap-2">
                  {trendLabel} {trendPercentage !== null && trendPercentage < 0 ? <TrendingDown className="w-6 h-6 text-emerald-300" /> : <TrendingUp className="w-6 h-6 text-rose-300" />}
                </h3>
              </div>
            </div>
            <div className="h-24 w-full mt-4 -ml-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={miniChartData}>
                  <Line type="monotone" dataKey="value" stroke="rgba(255,255,255,0.8)" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Card 2: Danh mục chi nhiều nhất */}
        <div className="rounded-3xl p-6 bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-xl shadow-orange-200/50 hover:shadow-2xl hover:shadow-orange-300/50 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3 group-hover:scale-150 transition-transform duration-700"></div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <p className="text-xs font-bold text-white/70 uppercase tracking-widest mb-6">{t('analysis_top_category')}</p>
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500">
                <Coffee className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white capitalize tracking-tight">{displayName}</h3>
                <p className="text-sm text-white/80 font-bold mt-1 bg-white/10 inline-block px-2.5 py-1 rounded-lg backdrop-blur-sm">
                  {topCategory.percentage}{t('analysis_top_category_percent')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Thời điểm chi nhiều nhất */}
        <div className="rounded-3xl p-6 bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white shadow-xl shadow-purple-200/50 hover:shadow-2xl hover:shadow-purple-300/50 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3 group-hover:scale-150 transition-transform duration-700"></div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <p className="text-xs font-bold text-white/70 uppercase tracking-widest mb-6">{t('analysis_top_time')}</p>
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500">
                <Clock className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white tracking-tight">{topTimeSlot.name}</h3>
                <p className="text-sm text-white/80 font-bold mt-1 bg-white/10 inline-block px-2.5 py-1 rounded-lg backdrop-blur-sm">
                  {topTimeSlot.slot}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analysis;
