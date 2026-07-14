import React, { useState, useEffect } from 'react';
import { TrendingUp, Clock, Coffee } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { getBehaviorAnalytics } from '../../services/analyticsService';

const Analysis = () => {
  const [analysisData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const res = await getBehaviorAnalytics();
        setAnalyticsData(res);
      } catch (err) {
        setError('Không thể tải dữ liệu phân tích hành vi.');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalysis();
  }, []);

  if (loading) return <div className="text-center py-10 text-gray-500">Đang chạy thuật toán phân tích chi tiêu...</div>;
  if (error) return <div className="text-red-500 text-center py-10">{error}</div>;

  const { trendPercentage, miniChartData, topCategory, topTimeSlot } = analysisData;

  // Bản đồ hóa tên danh mục tiếng Anh sang tiếng Việt để hiển thị UI đẹp hơn
  const categoryTranslation = {
    'food': 'Ăn uống',
    'transport': 'Di chuyển',
    'shopping': 'Mua sắm',
    'bills': 'Hóa đơn',
    'entertainment': 'Giải trí',
    'other': 'Khác'
  };

  const displayName = categoryTranslation[topCategory.name] || topCategory.name;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 min-h-[calc(100vh-8rem)]">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-800">Phân tích hành vi</h2>
        <p className="text-sm text-gray-500 mt-1">Góc nhìn sâu hơn về thói quen chi tiêu của bạn</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Xu hướng chi tiêu */}
        <div className="border border-gray-100 rounded-xl p-6 bg-gradient-to-br from-blue-50 to-white">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Xu hướng chi tiêu</p>
              <h3 className="text-lg font-bold text-gray-800 mt-1 flex items-center gap-2">
                Tăng {trendPercentage}% <TrendingUp className="w-4 h-4 text-red-500" />
              </h3>
            </div>
          </div>
          <div className="h-20 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={miniChartData}>
                <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 2: Danh mục chi nhiều nhất */}
        <div className="border border-gray-100 rounded-xl p-6 bg-gradient-to-br from-orange-50 to-white">
          <p className="text-sm font-medium text-gray-500 mb-4">Danh mục chi nhiều nhất</p>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <Coffee className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800 capitalize">{displayName}</h3>
              <p className="text-sm text-gray-500 font-medium mt-1">{topCategory.percentage}% tổng chi</p>
            </div>
          </div>
        </div>

        {/* Card 3: Thời điểm chi nhiều nhất */}
        <div className="border border-gray-100 rounded-xl p-6 bg-gradient-to-br from-purple-50 to-white">
          <p className="text-sm font-medium text-gray-500 mb-4">Thời điểm chi nhiều nhất</p>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">{topTimeSlot.name}</h3>
              <p className="text-sm text-gray-500 font-medium mt-1">{topTimeSlot.slot || '(18h - 21h)'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analysis;