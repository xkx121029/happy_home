import { useState, useEffect } from 'react';
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

// 模拟数据分析
const generateAnalyticsData = () => {
  const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  
  return {
    overview: {
      totalViews: 12580,
      viewsChange: 12.5,
      uniqueVisitors: 3420,
      visitorsChange: 8.2,
      totalPosts: 45,
      postsChange: 5,
      avgTime: '3分20秒',
      avgTimeChange: 15,
    },
    dailyViews: {
      labels: days,
      data: [1200, 1500, 1800, 1300, 2100, 2500, 1900],
    },
    monthlyViews: {
      labels: months,
      data: [8500, 9200, 11000, 10500, 12500, 14000, 13200, 11800, 12580],
    },
    topPosts: [
      { title: '欢迎使用 HappyHome 建站平台', views: 2340, change: 15 },
      { title: '如何创建您的第一篇文章', views: 1890, change: 8 },
      { title: '主题定制指南', views: 1450, change: -3 },
      { title: 'SEO优化技巧', views: 1230, change: 22 },
      { title: '用户管理入门', views: 980, change: 5 },
    ],
    trafficSources: [
      { name: '搜索引擎', value: 45, color: '#3b82f6' },
      { name: '社交媒体', value: 25, color: '#10b981' },
      { name: '直接访问', value: 20, color: '#8b5cf6' },
      { name: '外部链接', value: 10, color: '#f59e0b' },
    ],
    visitorCountries: [
      { name: '中国', count: 8520 },
      { name: '美国', count: 1560 },
      { name: '日本', count: 890 },
      { name: '韩国', count: 540 },
      { name: '其他', count: 1070 },
    ],
    engagement: {
      bounceRate: 35.2,
      bounceChange: -2.5,
      pagesPerVisit: 3.8,
      pagesChange: 1.2,
    },
  };
};

export default function Analytics() {
  const [data, setData] = useState(null);
  const [activePeriod, setActivePeriod] = useState('7days');

  useEffect(() => {
    setData(generateAnalyticsData());
  }, []);

  if (!data) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const maxDailyViews = Math.max(...data.dailyViews.data);
  const maxMonthlyViews = Math.max(...data.monthlyViews.data);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">数据分析</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">查看网站访问统计和用户行为分析</p>
        </div>
        <div className="flex gap-2">
          {[
            { id: '7days', label: '7天' },
            { id: '30days', label: '30天' },
            { id: '90days', label: '90天' },
            { id: '1year', label: '1年' },
          ].map((period) => (
            <button
              key={period.id}
              onClick={() => setActivePeriod(period.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activePeriod === period.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">总访问量</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {data.overview.totalViews.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <Eye className="w-6 h-6 text-blue-600 dark:text-blue-300" />
            </div>
          </div>
          <div className={`flex items-center gap-1 mt-3 text-sm ${data.overview.viewsChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {data.overview.viewsChange >= 0 ? (
              <ArrowUpRight className="w-4 h-4" />
            ) : (
              <ArrowDownRight className="w-4 h-4" />
            )}
            <span>{Math.abs(data.overview.viewsChange)}% 较上周</span>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">独立访客</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {data.overview.uniqueVisitors.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-green-600 dark:text-green-300" />
            </div>
          </div>
          <div className={`flex items-center gap-1 mt-3 text-sm ${data.overview.visitorsChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {data.overview.visitorsChange >= 0 ? (
              <ArrowUpRight className="w-4 h-4" />
            ) : (
              <ArrowDownRight className="w-4 h-4" />
            )}
            <span>{Math.abs(data.overview.visitorsChange)}% 较上周</span>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">文章总数</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {data.overview.totalPosts}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-purple-600 dark:text-purple-300" />
            </div>
          </div>
          <div className={`flex items-center gap-1 mt-3 text-sm ${data.overview.postsChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {data.overview.postsChange >= 0 ? (
              <ArrowUpRight className="w-4 h-4" />
            ) : (
              <ArrowDownRight className="w-4 h-4" />
            )}
            <span>{Math.abs(data.overview.postsChange)} 篇新增</span>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">平均停留时间</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {data.overview.avgTime}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-orange-600 dark:text-orange-300" />
            </div>
          </div>
          <div className={`flex items-center gap-1 mt-3 text-sm ${data.overview.avgTimeChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {data.overview.avgTimeChange >= 0 ? (
              <ArrowUpRight className="w-4 h-4" />
            ) : (
              <ArrowDownRight className="w-4 h-4" />
            )}
            <span>{Math.abs(data.overview.avgTimeChange)}% 较上周</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Views Chart */}
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-gray-900 dark:text-white">每日访问量趋势</h3>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-500 dark:text-gray-400">访问量</span>
            </div>
          </div>
          <div className="flex items-end justify-between h-64 gap-4">
            {data.dailyViews.data.map((value, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="w-full bg-blue-100 dark:bg-blue-900 rounded-t-lg transition-all hover:bg-blue-200 dark:hover:bg-blue-800" style={{ height: `${(value / maxDailyViews) * 100}%` }}>
                  <span className="text-xs text-blue-600 dark:text-blue-300 mt-2 text-center">
                    {value}
                  </span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-2">{data.dailyViews.labels[index]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Traffic Sources */}
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-6">流量来源</h3>
          <div className="space-y-4">
            {data.trafficSources.map((source) => (
              <div key={source.name}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: source.color }}></div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{source.name}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{source.value}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{ width: `${source.value}%`, backgroundColor: source.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Posts */}
        <div className="card p-6 lg:col-span-2">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-6">热门文章</h3>
          <div className="space-y-4">
            {data.topPosts.map((post, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-yellow-100 text-yellow-700' :
                    index === 1 ? 'bg-gray-100 text-gray-600' :
                    index === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{post.title}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{post.views.toLocaleString()} 次阅读</p>
                  </div>
                </div>
                <div className={`flex items-center gap-1 text-sm ${post.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {post.change >= 0 ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4" />
                  )}
                  <span>{Math.abs(post.change)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Engagement Metrics */}
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-6">用户参与度</h3>
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-300">跳出率</span>
                <span className={`text-sm font-medium ${data.engagement.bounceRate > 50 ? 'text-red-500' : 'text-green-500'}`}>
                  {data.engagement.bounceRate}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${data.engagement.bounceRate > 50 ? 'bg-red-500' : 'bg-green-500'}`}
                  style={{ width: `${data.engagement.bounceRate}%` }}
                />
              </div>
              <div className={`flex items-center gap-1 mt-2 text-xs ${data.engagement.bounceChange >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                {data.engagement.bounceChange >= 0 ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                <span>{Math.abs(data.engagement.bounceChange)}% 较上周</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-300">每次访问页数</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {data.engagement.pagesPerVisit} 页
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-blue-500"
                  style={{ width: `${(data.engagement.pagesPerVisit / 10) * 100}%` }}
                />
              </div>
              <div className={`flex items-center gap-1 mt-2 text-xs ${data.engagement.pagesChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {data.engagement.pagesChange >= 0 ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                <span>{Math.abs(data.engagement.pagesChange)}% 较上周</span>
              </div>
            </div>
          </div>
        </div>

        {/* Visitor Countries */}
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-6">访客地域分布</h3>
          <div className="space-y-3">
            {data.visitorCountries.map((country) => (
              <div key={country.name} className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">{country.name}</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {country.count.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="card p-6 lg:col-span-2">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-6">月度访问趋势</h3>
          <div className="flex items-end justify-between h-48 gap-2">
            {data.monthlyViews.data.map((value, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="w-full bg-gradient-to-t from-blue-500 to-blue-300 rounded-t-lg" style={{ height: `${(value / maxMonthlyViews) * 100}%` }} />
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{data.monthlyViews.labels[index]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
