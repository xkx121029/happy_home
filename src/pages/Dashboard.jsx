import { FileText, FolderOpen, Image, Users, Eye, TrendingUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import { analyticsAPI } from '../services/api';
import { useData } from '../contexts/DataContext';
import { toneChip } from '../lib/tones';

export default function Dashboard() {
  // 原来靠 App.jsx 通过 props 下发数据，路由重构后页面自取 Context
  const { posts, pages, mediaItems, users } = useData();
  const [analytics, setAnalytics] = useState({
    today: 0,
    week: 0,
    month: 0,
    total: 0,
    trend: 0,
    dailyData: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const response = await analyticsAPI.getStats();
      if (response.success && response.data) {
        setAnalytics(response.data);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const publishedPosts = posts.filter(post => post.status === 'published').length;
  const draftPosts = posts.filter(post => post.status === 'draft').length;

  const statCards = [
    // 六张卡不做彩虹色：只有真正承载状态的「草稿」「用户」带色调，其余走中性。
    // 六个高饱和色块并排是模板生成界面最典型的特征之一。
    { label: '文章总数', value: posts.length, icon: FileText, tone: 'neutral' },
    { label: '已发布', value: publishedPosts, icon: FileText, tone: 'neutral' },
    { label: '草稿', value: draftPosts, icon: FileText, tone: 'warning' },
    { label: '页面', value: pages.length, icon: FolderOpen, tone: 'neutral' },
    { label: '媒体文件', value: mediaItems.length, icon: Image, tone: 'neutral' },
    { label: '用户', value: users.length, icon: Users, tone: 'info' },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-fg">仪表盘</h1>
        <p className="text-muted mt-1">欢迎回来！查看您网站的最新数据概览。</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-surface rounded-xl shadow-sm border border-line p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted">{stat.label}</p>
                  <p className="text-2xl font-bold text-fg mt-1">{stat.value}</p>
                </div>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center${toneChip(stat.tone)}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface rounded-xl shadow-sm border border-line p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-fg">最近文章</h2>
            <a href="#" className="text-accent hover:text-accent text-sm font-medium">
              查看全部
            </a>
          </div>
          
          <div className="space-y-4">
            {posts.slice(0, 3).map((post) => (
              <div key={post.id} className="flex items-start gap-4 p-3 hover:bg-surface-2 rounded-lg transition-colors">
                <div className={`w-2 h-2 rounded-full mt-2${post.status === 'published' ? 'bg-success' : 'bg-warning'}`}></div>
                <div className="flex-1">
                  <h3 className="font-medium text-fg hover:text-accent cursor-pointer">
                    {post.title}
                  </h3>
                  <p className="text-sm text-muted mt-1">
                    {post.author} · {post.createdAt} · {post.category}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full${post.status === 'published' ? 'bg-success/12  text-success' : 'bg-warning/14  text-warning'}`}>
                  {post.status === 'published' ? '已发布' : '草稿'}
                </span>
              </div>
            ))}
            {posts.length === 0 && (
              <p className="text-center text-muted py-8">暂无文章</p>
            )}
          </div>
        </div>

        <div className="bg-surface rounded-xl shadow-sm border border-line p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-semibold text-fg">访问统计</h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-muted" />
                  <span className="text-sm text-muted">今日访问</span>
                </div>
                <span className="font-semibold text-fg">{analytics.today.toLocaleString()}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-muted" />
                  <span className="text-sm text-muted">本周访问</span>
                </div>
                <span className="font-semibold text-fg">{analytics.week.toLocaleString()}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted" />
                  <span className="text-sm text-muted">本月访问</span>
                </div>
                <span className="font-semibold text-fg">{analytics.month.toLocaleString()}</span>
              </div>

              <div className="pt-4 border-t border-line">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted">访问趋势</span>
                  <span className={`text-xs${analytics.trend >= 0 ? 'text-success' : 'text-danger'}`}>
                    {analytics.trend >= 0 ? '+' : ''}{analytics.trend}% 较上周
                  </span>
                </div>
                <div className="flex items-end gap-2 h-24">
                  {analytics.dailyData.length > 0 ? (() => {
                    const maxCount = Math.max(...analytics.dailyData.map(d => d.count), 1);
                    return analytics.dailyData.map((day, index) => {
                      const height = (day.count / maxCount) * 100;
                      return (
                        <div
                          key={day.date || index}
                          className="flex-1 bg-accent/60 rounded-t transition-all hover:bg-accent/70"
                          style={{ height: `${Math.max(height, 5)}%` }}
                          title={`${day.date}: ${day.count} 次访问`}
                        ></div>
                      );
                    });
                  })() : (
                    Array(7).fill(0).map((_, index) => (
                      <div
                        key={`placeholder-${index}`}
                        className="flex-1 bg-surface-2 rounded-t"
                        style={{ height: '10%' }}
                      ></div>
                    ))
                  )}
                </div>
                <div className="flex justify-between mt-2 text-xs text-muted">
                  <span>{analytics.dailyData.length > 0 ? analytics.dailyData[0]?.date?.slice(5) : '周一'}</span>
                  <span>{analytics.dailyData.length > 0 ? analytics.dailyData[6]?.date?.slice(5) : '周日'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
