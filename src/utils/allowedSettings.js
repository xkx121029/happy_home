const ALLOWED_SETTING_KEYS = [
  'siteName', 'siteDescription', 'siteUrl', 'tagline', 'adminEmail',
  'timezone', 'language', 'dateFormat', 'timeFormat',
  'theme', 'primaryColor', 'secondaryColor', 'accentColor',
  'backgroundColor', 'textColor', 'fontFamily', 'fontSize', 'lineHeight',
  'layout', 'sidebarPosition',
  'postsPerPage', 'postsPerFeed', 'excerptLength', 'enableComments',
  'commentsModeration', 'allowGuestComments', 'requireNameEmail',
  'autoApproval', 'enableRevisions', 'revisionLimit', 'defaultPostStatus',
  'enablePingbacks',
  'registrationEnabled', 'defaultRole', 'emailVerification',
  'moderateNewUsers', 'enableAvatars', 'avatarType', 'enableProfileFields',
  'enableUserBio',
  'showQuickLoginButton', 'twoFactorAuth', 'loginLimit', 'sessionTimeout',
  'enableSSL', 'allowFileEdits', 'enableDebug', 'errorReporting',
  'notifyNewComment', 'notifyNewUser', 'notifyPostApproval', 'notifyUpdates',
  'notifySecurity', 'emailFormat', 'emailFromName', 'emailFromAddress',
  'maxUploadSize', 'allowedFileTypes', 'autoResizeImages', 'maxImageWidth',
  'maxImageHeight', 'imageQuality', 'generateThumbnails',
  'smtpHost', 'smtpPort', 'smtpUser', 'smtpPass', 'smtpSecure', 'smtpFrom',
  'enableCaching', 'cacheDuration', 'minifyHTML', 'minifyCSS', 'minifyJS',
  'lazyLoadImages', 'enableGzip',
  'metaTitle', 'metaDescription', 'metaKeywords', 'canonicalUrl',
  'twitterCard', 'twitterSite', 'twitterCreator',
  'ogTitle', 'ogDescription', 'ogType', 'ogImage',
  'googleAnalytics', 'googleTagManager', 'hotjar', 'matomo',
  'enableBackup', 'backupSchedule', 'backupRetention',
  'twitterEnabled', 'twitterConsumerKey', 'twitterConsumerSecret',
  'facebookEnabled', 'facebookAppId', 'facebookPageId',
];

export function filterSettings(settings) {
  const filtered = {};
  ALLOWED_SETTING_KEYS.forEach(key => {
    if (settings && settings[key] !== undefined) {
      filtered[key] = settings[key];
    }
  });
  return filtered;
}

export default ALLOWED_SETTING_KEYS;
