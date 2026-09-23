import { useParams, Link } from 'react-router-dom';
import { sanitizeHtml } from '../../lib/sanitize';
import { useData } from '../../contexts/DataContext';

export default function PublicPageDetail() {
  const { slug } = useParams();
  // 原来靠 App.jsx 通过 props 下发数据，路由重构后页面自取 Context
  const { pages } = useData();
  
  const page = pages.find(p => p.slug === slug && p.status === 'published');
  
  if (!page) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-line mb-4">404</h1>
          <p className="text-muted mb-8">页面不存在</p>
          <Link to="/" className="text-accent hover:text-accent font-medium">
            返回首页
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <article className="bg-surface rounded-2xl shadow-sm overflow-hidden">
          <div className="p-8 md:p-12">
            <header className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-fg mb-4">
                {page.title}
              </h1>
              <div className="flex items-center gap-4 text-sm text-muted">
                <span>作者: {page.author}</span>
                <span>•</span>
                <span>更新于: {page.updatedAt}</span>
              </div>
            </header>
            
            <div 
              className="rich-text max-w-none"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(page.content) }}
            />
          </div>
        </article>
        
        <div className="mt-8 text-center">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-accent hover:text-accent font-medium"
          >
            ← 返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}
