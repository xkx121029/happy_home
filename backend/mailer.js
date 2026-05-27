const nodemailer = require('nodemailer');
const { dbHelpers } = require('./db');

let transporter = null;

function getSmtpSettings() {
  const settings = dbHelpers.getSettings();
  return {
    host: settings.smtpHost || 'smtp.example.com',
    port: settings.smtpPort || 587,
    secure: settings.smtpSecure === 'true' || settings.smtpSecure === true,
    auth: {
      user: settings.smtpUser || '',
      pass: settings.smtpPass || ''
    },
    from: settings.smtpFrom || 'no-reply@happyhome.com'
  };
}

function createTransporter() {
  const smtpSettings = getSmtpSettings();
  
  if (!smtpSettings.host || !smtpSettings.auth.user || !smtpSettings.auth.pass) {
    console.warn('SMTP settings not configured, using mock mailer');
    return null;
  }

  const port = parseInt(smtpSettings.port);
  const isSecure = port === 465;

  transporter = nodemailer.createTransport({
    host: smtpSettings.host,
    port: port,
    secure: isSecure,
    auth: smtpSettings.auth,
    tls: {
      rejectUnauthorized: false,
      minVersion: 'TLSv1.2',
      ciphers: 'DEFAULT:@SECLEVEL=0'
    }
  });

  return transporter;
}

function getTransporter() {
  if (!transporter) {
    return createTransporter();
  }
  return transporter;
}

async function sendMail(options) {
  const transporter = getTransporter();
  
  if (!transporter) {
    console.log('Mock email sent (SMTP not configured):');
    console.log('To:', options.to);
    console.log('Subject:', options.subject);
    console.log('Text:', options.text);
    return { success: true, message: '邮件已发送（模拟模式）' };
  }

  try {
    const smtpSettings = getSmtpSettings();
    const info = await transporter.sendMail({
      from: smtpSettings.from,
      ...options
    });

    console.log('Email sent:', info.messageId);
    return { success: true, message: '邮件发送成功', info };
  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false, message: error.message };
  }
}

async function sendVerificationCode(email, code) {
  const subject = 'HappyHome - 密码重置验证码';
  const text = `您的密码重置验证码是：${code}\n\n此验证码有效期为10分钟，请尽快使用。\n\n如果您没有请求重置密码，请忽略此邮件。`;
  const html = `
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
      <div style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); padding: 20px; border-radius: 8px; color: white; text-align: center;">
        <h1>HappyHome</h1>
        <p>密码重置验证码</p>
      </div>
      <div style="padding: 20px; background: #f8fafc;">
        <p style="font-size: 16px; color: #334155;">您的验证码是：</p>
        <div style="font-size: 36px; font-weight: bold; color: #3b82f6; text-align: center; margin: 20px 0;">
          ${code}
        </div>
        <p style="font-size: 14px; color: #64748b;">此验证码有效期为10分钟，请尽快使用。</p>
        <p style="font-size: 14px; color: #64748b;">如果您没有请求重置密码，请忽略此邮件。</p>
      </div>
    </div>
  `;

  return await sendMail({
    to: email,
    subject,
    text,
    html
  });
}

async function sendWelcomeEmail(email, username) {
  const subject = '欢迎加入 HappyHome';
  const text = `欢迎加入 HappyHome！\n\n用户名：${username}\n\n祝您使用愉快！\n\nHappyHome 团队`;
  const html = `
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
      <div style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); padding: 20px; border-radius: 8px; color: white; text-align: center;">
        <h1>HappyHome</h1>
        <p>欢迎加入</p>
      </div>
      <div style="padding: 20px; background: #f8fafc;">
        <p style="font-size: 16px; color: #334155;">尊敬的 <strong>${username}</strong>，</p>
        <p style="font-size: 16px; color: #334155;">欢迎加入 HappyHome！我们很高兴您选择使用我们的平台。</p>
        <p style="font-size: 16px; color: #334155;">现在您可以开始创建精彩的内容了。</p>
        <div style="margin-top: 20px; padding: 15px; background: white; border-radius: 8px; border: 1px solid #e2e8f0;">
          <p style="font-size: 14px; color: #64748b;"><strong>用户名：</strong>${username}</p>
        </div>
        <p style="font-size: 14px; color: #64748b; margin-top: 20px;">祝您使用愉快！</p>
        <p style="font-size: 14px; color: #64748b;">HappyHome 团队</p>
      </div>
    </div>
  `;

  return await sendMail({
    to: email,
    subject,
    text,
    html
  });
}

async function sendVerificationEmail(email, username, code) {
  const subject = 'HappyHome - 请验证您的邮箱';
  const text = `您好 ${username}，\n\n请使用以下验证码完成邮箱验证：${code}\n\n此验证码有效期为10分钟，请尽快使用。\n\n如果您没有注册 HappyHome，请忽略此邮件。\n\nHappyHome 团队`;
  const html = `
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
      <div style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); padding: 20px; border-radius: 8px; color: white; text-align: center;">
        <h1>HappyHome</h1>
        <p>邮箱验证</p>
      </div>
      <div style="padding: 20px; background: #f8fafc;">
        <p style="font-size: 16px; color: #334155;">尊敬的 <strong>${username}</strong>，</p>
        <p style="font-size: 16px; color: #334155;">感谢您注册 HappyHome！请使用以下验证码完成邮箱验证。</p>
        <div style="margin-top: 20px; padding: 20px; background: white; border-radius: 8px; border: 2px solid #3b82f6; text-align: center;">
          <p style="font-size: 14px; color: #64748b; margin-bottom: 10px;">您的验证码</p>
          <div style="font-size: 48px; font-weight: bold; color: #3b82f6; letter-spacing: 8px;">
            ${code}
          </div>
        </div>
        <p style="font-size: 14px; color: #64748b; margin-top: 20px;">此验证码有效期为10分钟，请尽快使用。</p>
        <p style="font-size: 14px; color: #64748b;">如果您没有注册 HappyHome，请忽略此邮件。</p>
        <p style="font-size: 14px; color: #64748b; margin-top: 20px;">祝您使用愉快！</p>
        <p style="font-size: 14px; color: #64748b;">HappyHome 团队</p>
      </div>
    </div>
  `;

  return await sendMail({
    to: email,
    subject,
    text,
    html
  });
}

async function testConnection() {
  const transporter = getTransporter();
  
  if (!transporter) {
    return { success: false, message: 'SMTP 配置不完整' };
  }

  try {
    await transporter.verify();
    return { success: true, message: 'SMTP 连接测试成功' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

async function testConnectionWithConfig(config) {
  if (!config.host || !config.user || !config.pass) {
    return { success: false, message: 'SMTP 配置不完整（需要主机、用户名和密码）' };
  }

  const port = parseInt(config.port) || 587;
  const isSecure = port === 465;

  const testTransporter = nodemailer.createTransport({
    host: config.host,
    port: port,
    secure: isSecure,
    auth: {
      user: config.user,
      pass: config.pass
    },
    tls: {
      rejectUnauthorized: false,
      minVersion: 'TLSv1.2',
      ciphers: 'DEFAULT:@SECLEVEL=0'
    }
  });

  try {
    await testTransporter.verify();
    return { success: true, message: 'SMTP 连接测试成功' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

module.exports = {
  sendMail,
  sendVerificationCode,
  sendWelcomeEmail,
  sendVerificationEmail,
  testConnection,
  testConnectionWithConfig,
  createTransporter
};