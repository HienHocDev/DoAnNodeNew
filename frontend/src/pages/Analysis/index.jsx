import React from 'react';
import { TrendingUp, Clock, Coffee } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

const Analysis = () => {
  const trendData = [
    { name: 'W1', value: 20 },
    { name: 'W2', value: 45 },
    { name: 'W3', value: 28 },
    { name: 'W4', value: 80 },
    { name: 'W5', value: 65 },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 min-h-[calc(100vh-8rem)]">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-800">Phân tích hành vi</h2>
        <p className="text-sm text-gray-500 mt-1">Góc nhìn sâu hơn về thói quen chi tiêu của bạn</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1 */}
        <div className="border border-gray-100 rounded-xl p-6 bg-gradient-to-br from-blue-50 to-white">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Xu hướng chi tiêu</p>
              <h3 className="text-lg font-bold text-gray-800 mt-1 flex items-center gap-2">
                Tăng 8.5% <TrendingUp className="w-4 h-4 text-red-500" />
              </h3>
            </div>
          </div>
          <div className="h-20 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 2 */}
        <div className="border border-gray-100 rounded-xl p-6 bg-gradient-to-br from-orange-50 to-white">
          <p className="text-sm font-medium text-gray-500 mb-4">Danh mục chi nhiều nhất</p>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <Coffee className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Ăn uống</h3>
              <p className="text-sm text-gray-500 font-medium mt-1">26.7% tổng chi</p>
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="border border-gray-100 rounded-xl p-6 bg-gradient-to-br from-purple-50 to-white">
          <p className="text-sm font-medium text-gray-500 mb-4">Thời điểm chi nhiều nhất</p>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Buổi tối</h3>
              <p className="text-sm text-gray-500 font-medium mt-1">(18h - 21h)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analysis;
