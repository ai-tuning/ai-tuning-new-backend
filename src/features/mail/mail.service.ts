import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

import { appConfig } from '../config';
import { AppConfig } from '../config/app.config';

@Injectable()
export class MailService {
  private readonly transporter: (
    user: string,
    password: string,
  ) => nodemailer.Transporter;
  private readonly config: AppConfig;
  constructor() {
    const config = appConfig();
    this.config = config;
    this.transporter = (user: string, pass: string) =>
      nodemailer.createTransport({
        host: config.smtp_host,
        port: config.smtp_port,
        secure: true,
        auth: { user, pass },
      } as unknown as SMTPTransport.Options);
  }

  private authTransporter() {
    return this.transporter(
      this.config.smtp_auth_email,
      this.config.smtp_auth_password,
    );
  }

  private infoTransporter() {
    return this.transporter(
      this.config.smtp_info_email,
      this.config.smtp_info_password,
    );
  }

  private supportTransporter() {
    return this.transporter(
      this.config.smtp_support_email,
      this.config.smtp_support_password,
    );
  }

  private invoiceTransporter() {
    return this.transporter(
      this.config.smtp_invoice_email,
      this.config.smtp_invoice_password,
    );
  }

  private emailTemplate(title: string, supportMail: string, content: string) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <title>Action Required: ${title}</title>
    <style>
      
        body {
            margin: 0;
            padding: 0;
            background-color: #f7f9fc;
            font-family: 'Arial', sans-serif, 'Helvetica Neue', Helvetica;
            color: #444444;
        }
        table {
            border-spacing: 0;
            width: 100%;
        }
        td {
            padding: 0;
        }

        .email-container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
            overflow: hidden;
            border: 1px solid #e0e7ff;
        }

        .email-header {
            background: #f3faff;
            padding: 20px;
            text-align: center;
            color: #ffffff;
        }
        .email-header img {
            max-width: 180px;
            height: auto;
        }
        .email-header h1 {
            font-size: 26px;
            margin: 10px 0;
            font-weight: bold;
            color:#1e90ff;
        }

     
        .email-content {
            padding: 30px;
            text-align: left;
            color: #555555;
            font-size: 16px;
            line-height: 1.8;
        }
        .email-content h2 {
            color: #1e90ff;
            font-size: 22px;
            margin-bottom: 20px;
        }
        .email-content p {
            margin: 10px 0;
        }
        .email-content .highlight {
            background-color: #f3faff;
            border-left: 4px solid #1e90ff;
            padding: 15px 20px;
            border-radius: 5px;
            margin: 20px 0;
        }

      
        .button-container {
            text-align: center;
            margin: 30px 0;
        }
        .button-container a {
            background: linear-gradient(135deg, #1e90ff, #4682b4);
            color: #ffffff;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 50px;
            font-size: 16px;
            font-weight: bold;
            transition: background 0.3s ease;
        }
        .button-container a:hover {
            background: linear-gradient(135deg, #4682b4, #1e90ff);
        }

    
        .email-footer {
            background-color: #f7f9fc;
            text-align: center;
            padding: 20px 15px;
            color: #777777;
            font-size: 14px;
        }
        .email-footer a {
            color: #1e90ff;
            text-decoration: none;
        }
        .email-footer .social-icons img {
            width: 24px;
            margin: 0 5px;
        }


        @media (max-width: 600px) {
            .email-content {
                padding: 20px;
            }
            .email-header h1 {
                font-size: 22px;
            }
        }
    </style>
</head>
<body>
    <table class="email-container" align="center">
        <tr>
            <td class="email-header">
                <img src="https://admin.ai-tuningfiles.com/Assets/logo.png" alt="AI Tuning Logo">
                <h1>${title}</h1>
            </td>
        </tr>
        <tr>${content}</tr>
        <tr>
            <td class="email-footer">
                <p>
                    Need help? Contact us at 
                    <a href="mailto:${supportMail}">${supportMail}</a>.
                </p>
                <p>© 2024 AI Tuning Files. All Rights Reserved.</p>
            </td>
        </tr>
    </table>
</body>
</html>
`;
  }

  async sendAuthMail(to: string, code: string) {
    const mailOptions = {
      from: this.config.smtp_auth_email,
      to,
      subject: 'Verify your email address',
      html: this.emailTemplate(
        'Verify your email address',
        'support@ai-tuningfiles.com',
        `<td class="email-content">
                <h2>Hello, Nahid!</h2>
                <p>Thank you for signing up with AI Tuning Files. To ensure the security of your account, we require you to verify your email address.</p>
                <div class="highlight">
                    <strong>Details:</strong>
                    <p>Please use the code provided in below to verify your email address and activate your account.</p>
                   <h3>  Your code is ${code}</h3>
                </div>
                <p>If you didn’t sign up for this account, please ignore this email or contact our support team.</p>
            </td>`,
      ),
    };
    await this.authTransporter().sendMail(mailOptions);
  }
}