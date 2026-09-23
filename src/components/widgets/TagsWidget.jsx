import { Link } from 'react-router-dom';
import { Tag } from 'lucide-react';

export default function TagsWidget({ tags, config = {} }) {
  const count = config.count || 20;
  const displayTags = tags.slice(0, count);

  if (displayTags.length === 0) {
    return (
      <div className="bg-surface rounded-xl shadow-sm border border-line p-4">
        <h3 className="font-bold text-fg mb-4 flex items-center gap-2">
          <Tag className="w-4 h-4" />
          标签云
        </h3>
        <p className="text-muted text-sm">暂无标签</p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl shadow-sm border border-line p-4">
      <h3 className="font-bold text-fg mb-4 flex items-center gap-2">
        <Tag className="w-4 h-4" />
        标签云
      </h3>
      <div className="flex flex-wrap gap-2">
        {displayTags.map(tag => (
          <Link
            key={tag.id}
            to={`/posts?tag=${tag.slug}`}
            className="px-3 py-1 text-sm bg-surface-2 text-fg rounded-full hover:bg-accent/12  hover:text-accent transition-colors"
          >
            {tag.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
