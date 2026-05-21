import { useParams, Link } from 'react-router-dom';

export default function PublicPageDetail({ pages }) {
  const { slug } = useParams();
  
  const page = pages.find(p => p.slug === slug && p.status === 'published');
  
  if (!page) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-gray-300 dark:text-gray-600 mb-4">404</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">页面不存在</p>
          <Link to="/" className="text-blue-600 hover:text-blue-700 font-medium">
            返回首页
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <article className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-8 md:p-12">
            <header className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                {page.title}
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span>作者: {page.author}</span>
                <span>•</span>
                <span>更新于: {page.updatedAt}</span>
              </div>
            </header>
            
            <div 
              className="prose prose-lg dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: page.content }}
            />
          </div>
        </article>
        
        <div className="mt-8 text-center">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            ← 返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}
