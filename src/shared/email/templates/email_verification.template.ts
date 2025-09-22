export const getEmailVerificationTemplate = (fullName: string, verificationUrl: string): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Xác thực email</title>
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
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Chào mừng đến với Aikabis!</h1>
      </div>
      <div class="content">
        <h2>Xin chào ${fullName}!</h2>
        <p>Cảm ơn bạn đã đăng ký tài khoản tại Aikabis. Để hoàn tất quá trình đăng ký, vui lòng xác thực email của bạn bằng cách nhấn vào nút bên dưới:</p>
        
        <div style="text-align: center;">
          <a href="${verificationUrl}" class="button">Xác thực email</a>
        </div>
        
        <p>Nếu nút không hoạt động, bạn có thể sao chép và dán liên kết sau vào trình duyệt:</p>
        <p class="url-box">
          ${verificationUrl}
        </p>
        
        <p><strong>Lưu ý:</strong> Liên kết này sẽ hết hạn sau 12 giờ. Nếu bạn không yêu cầu tạo tài khoản này, vui lòng bỏ qua email này.</p>
      </div>
      <div class="footer">
        <p>© 2024 Aikabis. Tất cả quyền được bảo lưu.</p>
        <p>Email này được gửi tự động, vui lòng không trả lời.</p>
      </div>
    </body>
    </html>
  `;
}