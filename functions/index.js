// ============================================
// 檔案名稱: index.js
// 路徑: functions/index.js
// 用途: Cloud Functions — 新留言被檢舉時寄送 email 通知給管理員
// ============================================
const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();

const ADMIN_EMAIL = "du88215@gmail.com";

const REPORT_REASON_LABELS = {
  spam: "垃圾訊息",
  inappropriate: "不當內容",
  harassment: "騷擾行為",
  other: "其他",
};

exports.onNewReport = functions.firestore
  .document("reports/{reportId}")
  .onCreate(async (snap) => {
  const report = snap.data();

  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_PASS;

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: gmailUser,
      pass: gmailPass,
    },
  });

  const reasonLabel = REPORT_REASON_LABELS[report.reason] || report.reason;

  const reportTime = report.createdAt?.toDate
    ? report.createdAt
        .toDate()
        .toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })
    : "未知時間";

  const html = `
    <div style="font-family: 'Helvetica Neue', sans-serif; max-width: 600px; margin: 0 auto; color: #2D3436;">
      <div style="background: linear-gradient(135deg, #6C5CE7, #A29BFE); padding: 24px; border-radius: 12px 12px 0 0;">
        <h2 style="color: white; margin: 0; font-size: 20px;">📚 PR小說網 — 新留言檢舉通知</h2>
      </div>
      <div style="background: white; padding: 24px; border: 1px solid #eee; border-top: none; border-radius: 0 0 12px 12px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px 8px; border-bottom: 1px solid #f0f0f0; color: #888; width: 110px; font-size: 14px;">小說</td>
            <td style="padding: 10px 8px; border-bottom: 1px solid #f0f0f0; font-size: 14px;">${report.novelTitle || report.novelId}</td>
          </tr>
          <tr>
            <td style="padding: 10px 8px; border-bottom: 1px solid #f0f0f0; color: #888; font-size: 14px;">章節</td>
            <td style="padding: 10px 8px; border-bottom: 1px solid #f0f0f0; font-size: 14px;">${report.chapterNumber ? `第 ${report.chapterNumber} 章` : "目錄頁"}</td>
          </tr>
          <tr>
            <td style="padding: 10px 8px; border-bottom: 1px solid #f0f0f0; color: #888; font-size: 14px; vertical-align: top;">被檢舉留言</td>
            <td style="padding: 10px 8px; border-bottom: 1px solid #f0f0f0; background: #f9f9f9; font-size: 14px; border-radius: 4px;">${report.reportedContent}</td>
          </tr>
          <tr>
            <td style="padding: 10px 8px; border-bottom: 1px solid #f0f0f0; color: #888; font-size: 14px;">留言者</td>
            <td style="padding: 10px 8px; border-bottom: 1px solid #f0f0f0; font-size: 14px;">${report.reportedAuthorName}</td>
          </tr>
          <tr>
            <td style="padding: 10px 8px; border-bottom: 1px solid #f0f0f0; color: #888; font-size: 14px;">檢舉原因</td>
            <td style="padding: 10px 8px; border-bottom: 1px solid #f0f0f0; font-size: 14px; color: #e17055; font-weight: 600;">${reasonLabel}</td>
          </tr>
          <tr>
            <td style="padding: 10px 8px; border-bottom: 1px solid #f0f0f0; color: #888; font-size: 14px; vertical-align: top;">詳細說明</td>
            <td style="padding: 10px 8px; border-bottom: 1px solid #f0f0f0; font-size: 14px;">${report.detail || "（未填寫）"}</td>
          </tr>
          <tr>
            <td style="padding: 10px 8px; border-bottom: 1px solid #f0f0f0; color: #888; font-size: 14px;">檢舉者</td>
            <td style="padding: 10px 8px; border-bottom: 1px solid #f0f0f0; font-size: 14px;">${report.reporterName}</td>
          </tr>
          <tr>
            <td style="padding: 10px 8px; color: #888; font-size: 14px;">時間</td>
            <td style="padding: 10px 8px; font-size: 14px; color: #888;">${reportTime}</td>
          </tr>
        </table>
        <div style="margin-top: 20px; padding: 12px; background: #f8f9fa; border-radius: 8px; font-size: 13px; color: #666;">
          請前往 PR小說網 審查並決定是否刪除此留言。
        </div>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"PR小說網通知" <${gmailUser}>`,
      to: ADMIN_EMAIL,
      subject: `[PR小說網] 新留言被檢舉 — ${report.novelTitle || "未知小說"}`,
      html,
    });
    console.log("✅ 檢舉通知 email 已發送");
  } catch (error) {
    console.error("❌ 發送 email 失敗:", error);
  }
});
