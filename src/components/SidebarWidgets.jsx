import RecentPostsWidget from './widgets/RecentPostsWidget';
import CategoriesWidget from './widgets/CategoriesWidget';
import TagsWidget from './widgets/TagsWidget';
import SearchWidget from './widgets/SearchWidget';
import RecentCommentsWidget from './widgets/RecentCommentsWidget';
import MetaWidget from './widgets/MetaWidget';

export default function SidebarWidgets({ widgets, posts, categories, tags, comments, settings }) {
  const sidebarWidgets = widgets
    .filter(w => w.location === 'sidebar' && w.enabled)
    .sort((a, b) => a.order - b.order);

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
        return <RecentCommentsWidget key={widget.id} comments={comments} config={widget.config} />;
      case 'meta':
        return <MetaWidget key={widget.id} settings={settings} />;
      default:
        return null;
    }
  };

  if (sidebarWidgets.length === 0) {
    return null;
  }

  return (
    <aside className="space-y-6">
      {sidebarWidgets.map(widget => renderWidget(widget))}
    </aside>
  );
}
