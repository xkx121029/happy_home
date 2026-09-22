import { useData } from '../contexts/DataContext';
import RecentPostsWidget from './widgets/RecentPostsWidget';
import CategoriesWidget from './widgets/CategoriesWidget';
import TagsWidget from './widgets/TagsWidget';
import SearchWidget from './widgets/SearchWidget';
import RecentCommentsWidget from './widgets/RecentCommentsWidget';
import MetaWidget from './widgets/MetaWidget';

/**
 * 前台侧栏：按配置渲染已启用的小工具。
 *
 * 修正：
 * 1. widgets 从 Context 自取（原来由父级传，一旦没传就会在 .filter 上抛错）。
 * 2. 排序字段是 orderNum —— 后端列名 order_num 经 api 层规整为 orderNum，
 *    原来读的 `w.order` 永远是 undefined，排序结果不稳定。
 * 3. 不再向下传 comments —— 最新评论部件自己去公开端点取，
 *    避免把它变成「只有管理员才看得到」的部件。
 */
export default function SidebarWidgets({ posts = [], categories = [], tags = [], settings }) {
  const { widgets = [] } = useData();

  const sidebarWidgets = widgets
    .filter((w) => w.location === 'sidebar' && w.enabled)
    .sort((a, b) => (a.orderNum ?? 0) - (b.orderNum ?? 0));

  if (sidebarWidgets.length === 0) return null;

  const renderWidget = (widget) => {
    switch (widget.type) {
      case 'recent_posts':
        return <RecentPostsWidget key={widget.id} posts={posts} config={widget.config} />;
      case 'categories':
        return <CategoriesWidget key={widget.id} categories={categories} config={widget.config} />;
      case 'tags':
        return <TagsWidget key={widget.id} tags={tags} config={widget.config} />;
      case 'search':
        return <SearchWidget key={widget.id} />;
      case 'recent_comments':
        return <RecentCommentsWidget key={widget.id} config={widget.config} />;
      case 'meta':
        return <MetaWidget key={widget.id} settings={settings} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {sidebarWidgets.map((widget) => renderWidget(widget))}
    </div>
  );
}