import { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Eye, 
  FileText, 
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { analyticsAPI } from '../services/api';

export default function Analytics() {
  const [data, setData] = useState({
    overview: {
      todayViews: 0,
      weekViews: 0,
      monthViews: 0,
      totalViews: 0,
      trend: 0,
    },
    dailyData: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const response = await analyticsAPI.getStats();
      if (response.success && response.data) {
        setData({
          overview: {
            todayViews: response.data.today,
            weekViews: response.data.week,
            monthViews: response.data.month,
            totalViews: response.data.total,
            trend: response.data.trend,
          },
          dailyData: response.data.dailyData || [],
        });
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // 这个 useMemo 原来写在下面那个 loading 的提前 return 之后：
// 首次渲染（loading=true）不执行它，拿到数据后再渲染就多出一个 hook，
// React 会抛出「Rendered more hooks than during the previous render」，页面直接崩。
// 所有 hook 必须无条件地出现在提前 return 之前。
  const maxDailyViews = useMemo(() => {
    return data.dailyData.length > 0 ? Math.max(...data.dailyData.map(d => d.count), 1) : 1;
  }, [data.dailyData]);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">数据分析</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">查看网站访问统计</p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">今日访问</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {data.overview.todayViews.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <Eye className="w-6 h-6 text-blue-600 dark:text-blue-300" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">本周访问</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {data.overview.weekViews.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-300" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">本月访问</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {data.overview.monthViews.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-300" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">总访问量</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {data.overview.totalViews.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-amber-600 dark:text-amber-300" />
            </div>
          </div>
          <div className={`flex items-center gap-1 mt-3 text-sm ${data.overview.trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {data.overview.trend >= 0 ? (
              <ArrowUpRight className="w-4 h-4" />
            ) : (
              <ArrowDownRight className="w-4 h-4" />
            )}
            <span>{Math.abs(data.overview.trend)}% 较上周</span>
          </div>
        </div>
      </div>

      {/* Daily Views Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-6">每日访问量趋势</h3>
        <div className="flex items-end gap-2 h-48">
          {data.dailyData.map((count, index) => (
            <div key={index} className="flex-1 flex flex-col items-center gap-2">
              <div
                className="w-full bg-accent/60 rounded-t transition-all hover:bg-accent/70"
                style={{ height: `${Math.max((count / maxDailyViews) * 100, 5)}%` }}
                title={`${count} 次访问`}
              ></div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {index + 1}
              </span>
            </div>
          ))}
        </div>
      </div>

      {data.dailyData.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 text-center">
          <p className="text-gray-500 dark:text-gray-400">暂无访问数据。发布文章后，访问统计将开始记录。</p>
        </div>
      )}
    </div>
  );
}
