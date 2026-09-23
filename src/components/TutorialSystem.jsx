import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  FileText, 
  Image, 
  Palette, 
  Users, 
  CheckCircle, 
  Circle,
  ChevronRight,
  X,
  Lightbulb
} from 'lucide-react';
import { tutorialAPI } from '../lib/tutorialProgress';
import { ADMIN_PATHS } from '../routes/paths';
import { useAuth } from '../state/AuthContext';

export default function TutorialSystem() {
  const [showTutorial, setShowTutorial] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [tutorial, setTutorial] = useState(null);
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // 检查是否已设置"不再显示"
    const neverShowAgain = localStorage.getItem('tutorial_never_show');
    if (neverShowAgain === 'true') {
      return;
    }

    // 检查用户是否为管理员
    if (!currentUser || currentUser.role !== 'administrator') {
      return;
    }

    const tutorialData = tutorialAPI.get();
    setTutorial(tutorialData);
    
    // 如果教程未完成，显示教程
    if (!tutorialData.completed) {
      const timer = setTimeout(() => setShowTutorial(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [currentUser]);

  const tutorialSteps = [
    {
      id: 'createPost',
      icon: FileText,
      title: '创建您的第一篇文章',
      description: '点击左侧菜单的"文章"，然后点击"新建文章"按钮开始创作。',
      action: () => {
        navigate('/admin/posts/new');
        setShowTutorial(false);
      },
      buttonText: '去创建文章',
    },
    {
      id: 'createPage',
      icon: BookOpen,
      title: '创建静态页面',
      description: '页面用于创建"关于我们"、"联系我们"等静态内容。',
      action: () => {
        navigate('/admin/pages/new');
        setShowTutorial(false);
      },
      buttonText: '去创建页面',
    },
    {
      id: 'uploadMedia',
      icon: Image,
      title: '上传媒体文件',
      description: '在媒体库中上传图片，为您的内容添加强大的视觉效果。',
      action: () => {
        navigate('/admin/media');
        setShowTutorial(false);
      },
      buttonText: '去上传媒体',
    },
    {
      id: 'customizeTheme',
      icon: Palette,
      title: '定制网站主题',
      description: '在主题设置中自定义颜色、字体和布局，打造独特的网站风格。',
      action: () => {
        // 主题页现在挂在「外观」分组下：/admin/settings/appearance
        navigate(ADMIN_PATHS.themes);
        setShowTutorial(false);
      },
      buttonText: '去定制主题',
    },
    {
      id: 'createUser',
      icon: Users,
      title: '添加团队成员',
      description: '为您的网站添加编辑和作者，让他们帮助您管理内容。',
      action: () => {
        navigate('/admin/users/new');
        setShowTutorial(false);
      },
      buttonText: '去添加用户',
    },
  ];

  const incompleteSteps = tutorialSteps.filter(
    step => !tutorial?.steps[step.id]
  );

  const handleCompleteStep = (stepId) => {
    const updated = tutorialAPI.completeStep(stepId);
    setTutorial(updated);
    
    // 如果所有步骤完成
    if (updated.completed) {
      setShowTutorial(false);
    }
  };

  if (!showTutorial || !tutorial) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
      <div className="bg-surface rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-accent p-6 text-accent-fg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Lightbulb className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">欢迎使用 HappyHome！</h2>
                <p className="opacity-90">让我们一起开始创建您的网站吧</p>
              </div>
            </div>
            <button
              onClick={() => setShowTutorial(false)}
              className="p-2 hover:bg-surface/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="px-6 py-4 bg-bg border-b border-line">
          <div className="flex items-center justify-between text-sm text-muted mb-2">
            <span>教程进度</span>
            <span>{tutorialSteps.length - incompleteSteps.length} / {tutorialSteps.length}</span>
          </div>
          <div className="w-full bg-surface-2 rounded-full h-2">
            <div
              className="bg-accent h-2 rounded-full transition-colors duration-100"
              style={{
                width: `${((tutorialSteps.length - incompleteSteps.length) / tutorialSteps.length) * 100}%`
              }}
            />
          </div>
        </div>

        {/* Steps */}
        <div className="p-6 max-h-96 overflow-y-auto">
          <div className="space-y-4">
            {tutorialSteps.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = tutorial?.steps[step.id];
              const isCurrent = currentStep === index && !isCompleted;

              return (
                <div
                  key={step.id}
                  className={`p-4 rounded-xl border-2 transition-all${
                    isCompleted
                      ? 'border-success/40 bg-success/12'
                      : isCurrent
                      ? 'border-accent/40 bg-accent/12'
                      : 'border-line bg-surface hover:border-line'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center${
                      isCompleted
                        ? 'bg-success text-success-fg'
                        : 'bg-accent/12 text-accent'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="w-6 h-6" />
                      ) : (
                        <Icon className="w-6 h-6" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-fg">{step.title}</h3>
                        {isCompleted && (
                          <span className="px-2 py-0.5 bg-success/12 text-success text-xs rounded-full">
                            已完成
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted mb-3">{step.description}</p>
                      <div className="flex gap-2">
                        {!isCompleted && (
                          <>
                            <button
                              onClick={() => {
                                step.action();
                                handleCompleteStep(step.id);
                              }}
                              className="px-4 py-2 bg-accent-700 text-accent-fg rounded-lg text-sm font-medium hover:bg-accent-700 transition-colors"
                            >
                              {step.buttonText}
                            </button>
                            <button
                              onClick={() => handleCompleteStep(step.id)}
                              className="px-4 py-2 bg-surface-2 text-fg rounded-lg text-sm font-medium hover:bg-line transition-colors"
                            >
                              跳过
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-bg border-t border-line">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                tutorialAPI.reset();
                const resetData = tutorialAPI.get();
                setTutorial(resetData);
                setCurrentStep(0);
              }}
              className="text-sm text-muted hover:text-fg"
            >
              重新开始教程
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  localStorage.setItem('tutorial_never_show', 'true');
                  setShowTutorial(false);
                }}
                className="text-sm text-muted hover:text-fg"
              >
                不再显示
              </button>
              <button
                onClick={() => setShowTutorial(false)}
                className="px-6 py-2 bg-fg text-bg rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                稍后再说
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 新手提示组件 - 用于各个页面的引导
export function PageTutorial({ pageKey, children }) {
  const [showTip, setShowTip] = useState(false);
  const [tutorial, setTutorial] = useState(null);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    // 检查是否已设置"不再显示"
    const neverShowAgain = localStorage.getItem('tutorial_never_show');
    if (neverShowAgain === 'true') {
      return;
    }

    // 检查用户是否为管理员
    if (!currentUser || currentUser.role !== 'administrator') {
      return;
    }

    const tutorialData = tutorialAPI.get();
    setTutorial(tutorialData);
  }, [currentUser]);

  const pageTips = {
    posts: {
      title: '创建您的第一篇文章',
      content: '点击右上角的"新建文章"按钮开始创作。富文本编辑器支持多种格式，让您的文章更加丰富多彩。',
    },
    pages: {
      title: '创建静态页面',
      content: '页面适合创建"关于我们"、"服务条款"等长期存在的内容。您可以设置自定义URL方便访问。',
    },
    media: {
      title: '上传媒体文件',
      content: '拖拽或点击上传按钮添加图片。支持 JPG、PNG、GIF 等常见格式。图片可用于文章和页面中。',
    },
    themes: {
      title: '定制网站外观',
      content: '选择预设主题或自定义颜色搭配。您可以调整主色、副色、强调色，打造独特的品牌风格。',
    },
    users: {
      title: '管理团队成员',
      content: '添加编辑和作者，让他们帮助您管理网站内容。不同的角色有不同的权限。',
    },
    settings: {
      title: '配置网站设置',
      content: '在这里设置网站的基本信息、评论规则、邮件通知等。所有设置会立即生效。',
    },
  };

  if (!tutorial?.steps[pageKey] && !tutorial?.completed) {
    const tip = pageTips[pageKey];
    if (tip && !showTip) {
      return (
        <>
          {children}
          <div className="fixed bottom-6 right-6 max-w-sm bg-surface rounded-xl shadow-2xl border border-line p-4 z-40">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-accent/12 rounded-lg flex items-center justify-center flex-shrink-0">
                <Lightbulb className="w-5 h-5 text-accent" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-fg mb-1">{tip.title}</h4>
                <p className="text-sm text-muted mb-3">{tip.content}</p>
                <button
                  onClick={() => setShowTip(true)}
                  className="text-sm text-accent hover:text-accent font-medium"
                >
                  知道了
                </button>
              </div>
            </div>
          </div>
        </>
      );
    }
  }

  return children;
}
