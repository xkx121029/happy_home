import { useState } from 'react';
import { 
  BookOpen, 
  FileText, 
  Image, 
  Users, 
  Palette, 
  Settings,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Play
} from 'lucide-react';
import { toneChip } from '../lib/tones';

export default function Help() {
  const [expandedCategory, setExpandedCategory] = useState(null);

  const helpCategories = [
    {
      id: 'getting-started',
      icon: Play,
      title: '快速开始',
      tone: 'accent',
      articles: [
        {
          title: '首次使用指南',
          content: '欢迎使用 HappyHome！本指南将帮助您快速上手建站平台。',
          steps: [
            '1. 创建您的第一篇文章 - 点击左侧菜单"文章"，然后点击"新建文章"',
            '2. 创建静态页面 - 使用页面功能创建"关于我们"等静态内容',
            '3. 上传媒体文件 - 在媒体库中添加图片',
            '4. 定制主题 - 在主题设置中调整网站外观',
            '5. 添加团队成员 - 为网站添加编辑和作者',
          ],
        },
        {
          title: '理解文章状态',
          content: '文章有三种状态：',
          items: [
            '草稿：保存但未发布的内容，只有您能看到',
            '已发布：公开可见的内容，访客可以看到',
            '待审核：等待审核的文章，需要管理员批准后才能发布',
          ],
        },
        {
          title: '如何使用富文本编辑器',
          content: '富文本编辑器提供了丰富的文本格式化功能：',
          items: [
            '文字格式：粗体、斜体、下划线、删除线',
            '标题：H1、H2 用于创建标题层次',
            '列表：有序列表和无序列表',
            '对齐：左对齐、居中、右对齐',
            '特殊内容：引用、代码块、分隔线',
            '媒体：插入链接和图片',
            '快捷键：Ctrl+B 粗体，Ctrl+I 斜体，Ctrl+U 下划线',
          ],
        },
      ],
    },
    {
      id: 'posts',
      icon: FileText,
      title: '文章管理',
      tone: 'neutral',
      articles: [
        {
          title: '创建和管理文章',
          content: '文章是您网站的核心内容。通过文章功能，您可以：',
          items: [
            '创建新文章：点击"新建文章"按钮',
            '编辑文章：点击文章列表中的编辑按钮',
            '删除文章：点击删除按钮（请谨慎操作）',
            '搜索文章：使用搜索框按标题或内容搜索',
            '筛选文章：按状态或分类筛选文章',
          ],
        },
        {
          title: '文章分类和标签',
          content: '使用分类和标签组织您的文章：',
          items: [
            '分类：用于大的主题分类，每篇文章只能属于一个分类',
            '标签：用于细粒度的主题标记，一篇文章可以有多个标签',
            '示例：分类可以是"教程"、"新闻"，标签可以是"React"、"入门"',
          ],
        },
        {
          title: 'SEO优化建议',
          content: '让您的文章更容易被搜索引擎发现：',
          items: [
            '使用描述性的标题',
            '编写有意义的摘要',
            '合理使用分类和标签',
            '添加相关标签',
          ],
        },
      ],
    },
    {
      id: 'pages',
      icon: BookOpen,
      title: '页面管理',
      tone: 'neutral',
      articles: [
        {
          title: '创建静态页面',
          content: '页面适合创建长期存在的内容，如：',
          items: [
            '关于我们 - 介绍您的组织或团队',
            '联系我们 - 提供联系方式',
            '服务条款 - 法律声明',
            '隐私政策 - 隐私保护说明',
          ],
        },
        {
          title: '自定义页面URL',
          content: '每个页面都有独特的URL地址：',
          items: [
            'URL自动从标题生成',
            '可以手动修改URL',
            '建议使用简短的英文或拼音',
            '示例：about、contact-us',
          ],
        },
      ],
    },
    {
      id: 'media',
      icon: Image,
      title: '媒体库',
      tone: 'neutral',
      articles: [
        {
          title: '上传和管理图片',
          content: '媒体库帮助您管理网站的所有图片：',
          items: [
            '上传图片：点击"上传媒体"按钮',
            '支持格式：JPG、PNG、GIF、WebP',
            '删除图片：点击删除按钮',
            '下载图片：点击下载按钮保存到本地',
          ],
        },
        {
          title: '最佳实践',
          content: '为了获得最佳性能：',
          items: [
            '在上传前压缩图片',
            '使用适当的图片尺寸',
            '建议单张图片不超过2MB',
          ],
        },
      ],
    },
    {
      id: 'themes',
      icon: Palette,
      title: '主题定制',
      tone: 'neutral',
      articles: [
        {
          title: '选择和自定义主题',
          content: '让您的网站与众不同：',
          items: [
            '预设主题：选择我们精心设计的主题',
            '自定义颜色：调整主色、副色、强调色',
            '字体选择：选择适合您网站的字体',
            '布局设置：宽屏、盒式或全屏布局',
          ],
        },
        {
          title: '颜色搭配建议',
          content: '选择协调的颜色组合：',
          items: [
            '主色：品牌的主要颜色，用于按钮和链接',
            '副色：次要强调色，用于图标和装饰',
            '强调色：用于重点突出的元素',
            '背景色：页面背景颜色',
          ],
        },
      ],
    },
    {
      id: 'users',
      icon: Users,
      title: '用户管理',
      tone: 'neutral',
      articles: [
        {
          title: '管理团队成员',
          content: '为您的网站添加团队成员：',
          items: [
            '管理员：完全控制网站所有功能',
            '编辑：可以管理所有内容',
            '作者：只能管理自己的内容',
          ],
        },
        {
          title: '用户权限说明',
          content: '不同角色有不同的权限：',
          items: [
            '管理员：所有权限，包括网站设置',
            '编辑：管理所有文章和页面',
            '作者：只管理自己的文章',
          ],
        },
      ],
    },
    {
      id: 'settings',
      icon: Settings,
      title: '系统设置',
      tone: 'neutral',
      articles: [
        {
          title: '常规设置',
          content: '配置网站基本信息：',
          items: [
            '网站名称：显示在浏览器标签和网站各处',
            '网站描述：用于SEO和分享',
            '管理员邮箱：接收系统通知',
            '时区和语言：确保正确的时间显示',
          ],
        },
        {
          title: '评论设置',
          content: '管理访客评论：',
          items: [
            '评论审核：开启后新评论需要审核',
            '这有助于防止垃圾评论',
          ],
        },
        {
          title: '注册设置',
          content: '控制用户注册：',
          items: [
            '开放注册：允许访客注册成为用户',
            '关闭注册：只有管理员可以添加用户',
          ],
        },
      ],
    },
  ];

  const toggleCategory = (id) => {
    setExpandedCategory(expandedCategory === id ? null : id);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-fg">帮助中心</h1>
        <p className="text-muted mt-1">查找使用指南和常见问题解答</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-surface rounded-xl shadow-sm border border-line p-4 sticky top-6">
            <h3 className="font-semibold text-fg mb-4">目录</h3>
            <nav className="space-y-2">
              {helpCategories.map((category) => {
                const Icon = category.icon;
                return (
                  <a
                    key={category.id}
                    href={`#${category.id}`}
                    className="flex items-center gap-3 px-3 py-2 text-sm text-muted  hover:bg-surface-2 rounded-lg transition-colors"
                  >
                    <Icon className="w-4 h-4" />
                    <span>{category.title}</span>
                  </a>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {helpCategories.map((category) => {
            const Icon = category.icon;
            const isExpanded = expandedCategory === category.id;

            return (
              <div key={category.id} id={category.id} className="bg-surface rounded-xl shadow-sm border border-line overflow-hidden">
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="w-full flex items-center justify-between p-6 hover:bg-surface-2 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center${toneChip(category.tone)}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <h2 className="text-lg font-semibold text-fg">{category.title}</h2>
                      <p className="text-sm text-muted">{category.articles.length} 篇文章</p>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-muted" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted" />
                  )}
                </button>

                {isExpanded && (
                  <div className="border-t border-line">
                    {category.articles.map((article) => (
                      <div key={article.title} className="p-6 border-b border-line last:border-b-0">
                        <h3 className="text-lg font-semibold text-fg mb-3">
                          {article.title}
                        </h3>
                        <p className="text-muted  mb-4">
                          {article.content}
                        </p>
                        {article.steps && (
                          <ol className="list-decimal list-inside space-y-2 text-muted">
                            {article.steps.map((step, stepIndex) => (
                              <li key={stepIndex}>{step.length > 3 ? step.slice(3) : step}</li>
                            ))}
                          </ol>
                        )}
                        {article.items && (
                          <ul className="space-y-2 text-muted">
                            {article.items.map((item, itemIndex) => (
                              <li key={itemIndex} className="flex items-start gap-2">
                                <span className="text-accent mt-1">•</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Contact Section */}
          <div className="bg-accent-50 rounded-xl p-6 border border-accent/40">
            <h3 className="text-lg font-semibold text-fg mb-2">
              需要更多帮助？
            </h3>
            <p className="text-muted  mb-4">
              如果您有任何问题或建议，欢迎联系我们。
            </p>
            <div className="flex gap-3">
              <a
                href="mailto:support@happyhome.com"
                className="px-4 py-2 bg-accent-700 text-accent-fg rounded-lg font-medium hover:bg-accent-700 transition-colors"
              >
                发送邮件
              </a>
              <a
                href="#"
                className="px-4 py-2 bg-surface text-fg rounded-lg font-medium hover:bg-surface-2 transition-colors flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                查看文档
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
