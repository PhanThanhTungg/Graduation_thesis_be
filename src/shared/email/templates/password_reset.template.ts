export const getPasswordResetTemplate = (fullName: string, resetUrl: string): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Đặt lại mật khẩu</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: black !important;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }

        a {
          color: black !important;
        }
        .header {
          border: 1px solid black;
          color: black;
          padding: 30px;
          text-align: center;
          border-radius: 10px 10px 10px 10px;
        }
        .content {
          color: black !important;
          padding: 30px;
          border-radius: 0 0 10px 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .button {
          display: inline-block;
          border: 1px solid black;
          color: black !important;
          padding: 15px 30px;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
          font-weight: bold;
          transition: background-color 0.3s;
        }
        .button:hover {
          background: black;
          color: white !important;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          color: black;
          font-size: 14px;
        }
        .url-box {
          word-break: break-all;
          background: #f8f9fa;
          color: black;
          padding: 15px;
          border-radius: 5px;
          border: 1px solid #e9ecef;
          font-family: monospace;
        }
        .warning {
          background: #fff3cd;
          border: 1px solid #ffc107;
          padding: 15px;
          border-radius: 5px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Đặt lại mật khẩu</h1>
      </div>
      <div class="content">
        <h2>Xin chào ${fullName}!</h2>
        <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn tại Aikabis. Để tiếp tục, vui lòng nhấn vào nút bên dưới:</p>
        
        <div style="text-align: center;">
          <a href="${resetUrl}" class="button">Đặt lại mật khẩu</a>
        </div>
        
        <p>Nếu nút không hoạt động, bạn có thể sao chép và dán liên kết sau vào trình duyệt:</p>
        <p class="url-box">
          ${resetUrl}
        </p>
        
        <div class="warning">
          <p><strong>⚠️ Lưu ý quan trọng:</strong></p>
          <ul>
            <li>Liên kết này sẽ hết hạn sau <strong>1 giờ</strong></li>
            <li>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này</li>
            <li>Không chia sẻ liên kết này với bất kỳ ai</li>
          </ul>
        </div>
        
        <p>Nếu bạn gặp bất kỳ vấn đề nào, vui lòng liên hệ với đội ngũ hỗ trợ của chúng tôi.</p>
      </div>
      <div class="footer">
        <p>© 2024 Aikabis. Tất cả quyền được bảo lưu.</p>
        <p>Email này được gửi tự động, vui lòng không trả lời.</p>
      </div>
    </body>
    </html>
  `;
}
