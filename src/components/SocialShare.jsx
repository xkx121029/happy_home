import { useState } from 'react';
import { Link2, Check, Share2, ExternalLink } from 'lucide-react';

// 使用通用图标替代不存在的社交图标
const sharePlatforms = {
  wechat: {
    name: '微信',
    icon: Share2,
    color: '#07c160',
    getUrl: (url, title, excerpt) => `weixin://dlchat/?https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(url)}`,
    isQR: true,
  },
  weibo: {
    name: '微博',
    icon: Share2,
    color: '#e6162d',
    getUrl: (url, title, excerpt) => `http://service.weibo.com/share/share.php?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
    isQR: false,
  },
  qq: {
    name: 'QQ',
    icon: Share2,
    color: '#1296db',
    getUrl: (url, title, excerpt) => `http://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&summary=${encodeURIComponent(excerpt)}`,
    isQR: false,
  },
  qzone: {
    name: 'QQ空间',
    icon: Share2,
    color: '#ffc107',
    getUrl: (url, title, excerpt) => `http://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&summary=${encodeURIComponent(excerpt)}`,
    isQR: false,
  },
  facebook: {
    name: 'Facebook',
    icon: ExternalLink,
    color: '#1877f2',
    getUrl: (url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    isQR: false,
  },
  twitter: {
    name: 'Twitter',
    icon: ExternalLink,
    color: '#1da1f2',
    getUrl: (url, title) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    isQR: false,
  },
  linkedin: {
    name: 'LinkedIn',
    icon: ExternalLink,
    color: '#0a66c2',
    getUrl: (url, title, excerpt) => `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&summary=${encodeURIComponent(excerpt)}`,
    isQR: false,
  },
};

export default function SocialShare({
  url,
  enabledPlatforms = ['wechat', 'weibo', 'qq', 'qzone', 'facebook', 'twitter', 'linkedin'],
  style = 'circle',
  showLabel = false,
  size = 'medium',
  position = 'bottom',
}) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(null);

  const handleShare = (platform) => {
    const platformInfo = sharePlatforms[platform];
    if (!platformInfo) return;

    if (platform === 'wechat') {
      setShowQR(platform);
      return;
    }

    const shareUrl = platformInfo.getUrl(url, title, excerpt);
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-10 h-10',
    large: 'w-12 h-12',
  };

  const iconSizes = {
    small: 'w-4 h-4',
    medium: 'w-5 h-5',
    large: 'w-6 h-6',
  };

  const qrCodeUrl = url ? `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(url)}` : '';

  return (
    <div className={position === 'top' ? 'mb-6' : 'mt-8'}>
      <div className="flex items-center gap-3 flex-wrap">
        {showLabel && (
          <span className="text-sm text-muted mr-2">分享到：</span>
        )}

        {enabledPlatforms.map(platform => {
          const platformInfo = sharePlatforms[platform];
          if (!platformInfo) return null;
          const Icon = platformInfo.icon;
          const isActive = showQR === platform;

          return (
            <div key={platform} className="relative">
              <button
                onClick={() => handleShare(platform)}
                onMouseEnter={() => platform === 'wechat' && setShowQR('wechat')}
                onMouseLeave={() => setShowQR(null)}
                className={`flex items-center justify-center${sizeClasses[size]} ${
                  style === 'circle' ? 'rounded-full' : 'rounded-lg'
                } bg-surface-2 hover:bg-line transition-colors group`}
                title={platformInfo.name}
              >
                <Icon
                  className={`${iconSizes[size]} text-muted group-hover:text-fg transition-colors`}
                  style={isActive ? { color: platformInfo.color } : {}}
                />
              </button>

              {/* QR Code Tooltip for WeChat */}
              {platform === 'wechat' && showQR === 'wechat' && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-surface rounded-lg shadow-lg z-10 border border-line">
                  <img
                    src={qrCodeUrl}
                    alt="QR Code"
                    className="w-32 h-32"
                  />
                  <p className="text-xs text-center text-muted mt-1">扫码分享到微信</p>
                </div>
              )}
            </div>
          );
        })}

        {/* Copy Link Button */}
        <button
          onClick={handleCopyLink}
          className={`flex items-center justify-center${sizeClasses[size]} ${
            style === 'circle' ? 'rounded-full' : 'rounded-lg'
          } bg-surface-2 hover:bg-line transition-colors group`}
          title="复制链接"
        >
          {copied ? (
            <Check className={`${iconSizes[size]} text-success`} />
          ) : (
            <Link2 className={`${iconSizes[size]} text-muted group-hover:text-fg transition-colors`} />
          )}
        </button>
      </div>

      {/* QR Code Modal for WeChat */}
      {showQR === 'wechat' && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowQR(null)}
        >
          <div
            className="bg-surface rounded-xl p-6 max-w-sm w-full mx-4"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-fg mb-4 text-center">
              微信分享
            </h3>
            <div className="flex justify-center mb-4">
              <img
                src={qrCodeUrl}
                alt="QR Code"
                className="w-48 h-48"
              />
            </div>
            <p className="text-sm text-muted text-center">
              使用微信扫描二维码分享
            </p>
            <button
              onClick={() => setShowQR(null)}
              className="mt-4 w-full px-4 py-2 bg-surface-2 text-fg rounded-lg hover:bg-line transition-colors"
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export { sharePlatforms };
