import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

import { appConfig } from '../config';
import { AppConfig } from '../config/app.config';
import { Types } from 'mongoose';
import { CredentialService } from '../credential/credential.service';
import { Credential } from '../credential/schema/credential.schema';

@Injectable()
export class MailService {
    private readonly transporter: (
        host: string,
        port: string,
        user: string,
        password: string,
    ) => nodemailer.Transporter;
    private readonly config: AppConfig;
    constructor(private readonly credentialService: CredentialService) {
        const config = appConfig();
        this.config = config;
        this.transporter = (host: string, port: string, user: string, pass: string) =>
            nodemailer.createTransport({
                host,
                port,
                secure: port === '465' ? true : false,
                auth: { user, pass },
            } as unknown as SMTPTransport.Options);
    }

    private mailTransporter(smtpCredential: Credential) {
        if (smtpCredential) {
            return this.transporter(
                smtpCredential.smtp.host,
                smtpCredential.smtp.port,
                smtpCredential.smtp.username,
                smtpCredential.smtp.password,
            );
        }
        //default email config
        return this.transporter(
            this.config.smtp_host,
            this.config.smtp_port,
            this.config.smtp_support_email,
            this.config.smtp_support_password,
        );
    }

    // private authTransporter() {
    //     return this.transporter(this.config.smtp_auth_email, this.config.smtp_auth_password);
    // }

    // private infoTransporter() {
    //     return this.transporter(this.config.smtp_info_email, this.config.smtp_info_password);
    // }

    // private supportTransporter() {
    //     return this.transporter(this.config.smtp_support_email, this.config.smtp_support_password);
    // }

    // private invoiceTransporter() {
    //     return this.transporter(this.config.smtp_invoice_email, this.config.smtp_invoice_password);
    // }

    private emailTemplate(title: string, supportMail: string, content: string) {
        // <img src="https://admin.ai-tuningfiles.com/Assets/logo.png" alt="Tuning Logo">
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
                <p>© 2025 All Rights Reserved.</p>
            </td>
        </tr>
    </table>
</body>
</html>
`;
    }

    private adminEmailTemplate(title: string, content: string) {
        // <img src="https://admin.ai-tuningfiles.com/Assets/logo.png" alt="Tuning Logo">
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
            
                <h1>${title}</h1>
            </td>
        </tr>
        <tr>${content}</tr>
        <tr>
            <td class="email-footer">
                <p>© 2025 All Rights Reserved.</p>
            </td>
        </tr>
    </table>
</body>
</html>
`;
    }

    async testCredential(data: { adminId: Types.ObjectId; receiver: string }) {
        const credential = await this.credentialService.findByAdmin(data.adminId, 'smtp');

        const senderEmail = credential.smtp.from;
        const senderName = credential.smtp.senderName;

        const mailOptions = {
            from: `${senderName} <${senderEmail}>`,
            to: data.receiver,
            subject: 'Test Mail',
            html: this.adminEmailTemplate(
                'Test Mail',
                `<td class="email-content">
                <h2>Hello, There!</h2>
                <p>Your email configuration is ready to use.</p>
            </td>`,
            ),
        };

        await this.mailTransporter(credential).sendMail(mailOptions);
    }

    async sendLoginCode(data: { adminId: Types.ObjectId; receiver: string; code: string; name: string }) {
        const credential = await this.credentialService.findByAdmin(data.adminId, 'smtp');

        const senderEmail = credential.smtp.from || this.config.smtp_auth_email;
        const senderName = credential.smtp.senderName || 'Tuning Files';
        const supportEmail = credential.smtp.support || this.config.smtp_support_email;

        const mailOptions = {
            from: `${senderName} <${senderEmail}>`,
            to: data.receiver,
            subject: 'Verify your email address',
            html: this.emailTemplate(
                'Verify your email address',
                supportEmail,
                `<td class="email-content">
                <h2>Hello, ${data.name}!</h2>
                <p>Thank you for signing up with Tuning Files. To ensure the security of your account, we require you to verify your email address.</p>
                <div class="highlight">
                    <strong>Details:</strong>
                    <p>Please use the code provided in below to verify your email address and activate your account.</p>
                   <h3>  Your code is ${data.code}</h3>
                </div>
                <p>If you didn’t sign up for this account, please ignore this email or contact our support team.</p>
            </td>`,
            ),
        };

        await this.mailTransporter(credential).sendMail(mailOptions);
    }
    async resetPassword(data: { adminId: Types.ObjectId; receiver: string; code: string; name: string }) {
        const credential = await this.credentialService.findByAdmin(data.adminId, 'smtp');

        const senderEmail = credential.smtp.from || this.config.smtp_auth_email;
        const senderName = credential.smtp.senderName || 'Tuning Files';

        const supportEmail = credential.smtp.support || this.config.smtp_support_email;

        const mailOptions = {
            from: `${senderName} <${senderEmail}>`,
            to: data.receiver,
            subject: 'Reset your password',
            html: this.emailTemplate(
                'Password Reset Request',
                supportEmail,
                `<td class="email-content">
                <h2>Hello, ${data.name}!</h2>
                <div class="highlight">
                    <strong>Details:</strong>
                    <p>Please use the code provided in below to reset your password.</p>
                   <h3>  Your code is ${data.code}</h3>
                </div>
                <p>If you didn't request a password reset, please ignore this email or contact our support team.</p>
            </td>`,
            ),
        };
        await this.mailTransporter(credential).sendMail(mailOptions);
    }

    async sendWelcomeMail(data: { adminId: Types.ObjectId; receiver: string; name: string }) {
        const credential = await this.credentialService.findByAdmin(data.adminId, 'smtp');

        const senderEmail = credential.smtp.from || this.config.smtp_auth_email;
        const senderName = credential.smtp.senderName || 'Tuning Files';

        const supportEmail = credential.smtp.support || this.config.smtp_support_email;

        const mailOptions = {
            from: `${senderName} <${senderEmail}>`, // this.config.smtp_auth_email,
            to: data.receiver,
            subject: 'Welcome to Tuning Files',
            html: this.emailTemplate(
                'Welcome to Tuning Files',
                supportEmail,
                `<td class="email-content">
                  <h2>Hello,${data.name}!</h2>
                  <p>Thank you for signing up with Tuning Files. </p>
                  <div class="highlight">
                    <p>Enjoy the best service from Tuning Files</p>
                </div>
              </td>`,
            ),
        };
        await this.mailTransporter(credential).sendMail(mailOptions);
    }
    async fileReady(data: { adminId: Types.ObjectId; receiver: string; name: string; uniqueId: string }) {
        const credential = await this.credentialService.findByAdmin(data.adminId, 'smtp');

        const senderEmail = credential.smtp.from || this.config.smtp_auth_email;
        const senderName = credential.smtp.senderName || 'Tuning Files';

        const supportEmail = credential.smtp.support || this.config.smtp_support_email;

        const mailOptions = {
            from: `${senderName} <${senderEmail}>`, // this.config.smtp_auth_email,
            to: data.receiver,
            subject: 'Your file is ready',
            html: this.emailTemplate(
                'Your file is ready',
                supportEmail,
                `<td class="email-content">
                  <h2>Hello,${data.name}!</h2>
                  <p>Thank you for your uploaded file ID: ${data.uniqueId}. Your file is ready to download.</p>
                  <div class="highlight">
                    <p>Enjoy the best service from Tuning Files</p>
                </div>
              </td>`,
            ),
        };
        await this.mailTransporter(credential).sendMail(mailOptions);
    }
    async requestedForSolution(data: { adminId: Types.ObjectId; receiver: string; name: string; uniqueId: string }) {
        const credential = await this.credentialService.findByAdmin(data.adminId, 'smtp');

        const senderEmail = credential.smtp.from || this.config.smtp_auth_email;
        const senderName = credential.smtp.senderName || 'Tuning Files';

        const supportEmail = credential.smtp.support || this.config.smtp_support_email;

        const mailOptions = {
            from: `${senderName} <${senderEmail}>`, // this.config.smtp_auth_email,
            to: data.receiver,
            subject: 'New File uploaded',
            html: this.emailTemplate(
                'New File uploaded',
                supportEmail,
                `<td class="email-content">
                  <h2>Hello,${data.name}!</h2>
                  <p>Thank you for your uploaded file ID: ${data.uniqueId}. we will start asap with your ModFile.</p>
                  <div class="highlight">
                    <p>Enjoy the best service from Tuning Files</p>
                </div>
              </td>`,
            ),
        };
        await this.mailTransporter(credential).sendMail(mailOptions);
    }

    async newFileUploadAdmin(data: { adminId: Types.ObjectId; receiver: string; name: string; uniqueId: string }) {
        const credential = await this.credentialService.findByAdmin(data.adminId, 'smtp');

        const senderEmail = credential.smtp.from || this.config.smtp_auth_email;
        const senderName = credential.smtp.senderName || 'Tuning Files';

        const mailOptions = {
            from: `${senderName} <${senderEmail}>`, // this.config.smtp_auth_email,
            to: data.receiver,
            subject: 'New File uploaded',
            html: this.adminEmailTemplate(
                'New File uploaded',
                `<td class="email-content">
                  <h2>Hello There</h2>
                  <p>A new file was uploaded from ${data.name}</p>
                  <div class="highlight">
                    <p>ID : ${data.uniqueId}</p>
                </div>
              </td>`,
            ),
        };
        await this.mailTransporter(credential).sendMail(mailOptions);
    }

    async refundFileService(data: {
        adminId: Types.ObjectId;
        receiver: string;
        credits: number;
        name: string;
        uniqueId: string;
    }) {
        const credential = await this.credentialService.findByAdmin(data.adminId, 'smtp');

        const senderEmail = credential.smtp.from || this.config.smtp_auth_email;
        const senderName = credential.smtp.senderName || 'Tuning Files';

        const supportEmail = credential.smtp.support || this.config.smtp_support_email;

        const mailOptions = {
            from: `${senderName} <${senderEmail}>`,
            to: data.receiver,
            subject: 'File Service Refunded',
            html: this.emailTemplate(
                'File Service Refunded',
                supportEmail,
                `<td class="email-content">
                  <h2>Hello ${data.name}</h2>
                  <p>${data.credits} credits was refunded for the file service.</p>
                  <div class="highlight">
                    <p>ID : ${data.uniqueId}</p>
                </div>
              </td>`,
            ),
        };
        await this.mailTransporter(credential).sendMail(mailOptions);
    }

    async closeFileService(data: { adminId: Types.ObjectId; receiver: string; name: string; uniqueId: string }) {
        const credential = await this.credentialService.findByAdmin(data.adminId, 'smtp');

        const senderEmail = credential.smtp.from || this.config.smtp_auth_email;
        const senderName = credential.smtp.senderName || 'Tuning Files';

        const supportEmail = credential.smtp.support || this.config.smtp_support_email;

        const mailOptions = {
            from: `${senderName} <${senderEmail}>`, // this.config.smtp_auth_email,
            to: data.receiver,
            subject: 'File Service Closed',
            html: this.emailTemplate(
                'File Service Closed',
                supportEmail,
                `<td class="email-content">
                  <h2>Hello ${data.name}</h2>
                  <p>File service was closed </p>
                  <div class="highlight">
                    <p>ID : ${data.uniqueId}</p>
                </div>
              </td>`,
            ),
        };
        await this.mailTransporter(credential).sendMail(mailOptions);
    }

    async fileServiceReopen(data: { adminId: Types.ObjectId; receiver: string; name: string; uniqueId: string }) {
        const credential = await this.credentialService.findByAdmin(data.adminId, 'smtp');

        const senderEmail = credential.smtp.from || this.config.smtp_auth_email;
        const senderName = credential.smtp.senderName || 'Tuning Files';

        const supportEmail = credential.smtp.support || this.config.smtp_support_email;

        const mailOptions = {
            from: `${senderName} <${senderEmail}>`,
            to: data.receiver,
            subject: 'File Service ReOpen',
            html: this.emailTemplate(
                'File Service ReOpen',
                supportEmail,
                `<td class="email-content">
                  <h2>Hello ${data.name}</h2>
                  <p>File service was re-opened </p>
                  <div class="highlight">
                    <p>ID : ${data.uniqueId}</p>
                </div>
              </td>`,
            ),
        };
        await this.mailTransporter(credential).sendMail(mailOptions);
    }

    async ticketOpen(data: { adminId: Types.ObjectId; receiver: string; name: string; uniqueId: string }) {
        const credential = await this.credentialService.findByAdmin(data.adminId, 'smtp');

        const senderEmail = credential.smtp.from || this.config.smtp_auth_email;
        const senderName = credential.smtp.senderName || 'Tuning Files';

        const supportEmail = credential.smtp.support || this.config.smtp_support_email;

        const mailOptions = {
            from: `${senderName} <${senderEmail}>`,
            to: data.receiver,
            subject: 'Ticket Open',
            html: this.emailTemplate(
                'Support Ticket Open',
                supportEmail,
                `<td class="email-content">
                  <h2>Hello ${data.name}</h2>
                  <p>A Support ticket was opened </p>
                  <div class="highlight">
                    <p>ID : ${data.uniqueId}</p>
                </div>
              </td>`,
            ),
        };
        await this.mailTransporter(credential).sendMail(mailOptions);
    }

    async newTicketOpenForAdmin(data: { adminId: Types.ObjectId; receiver: string; name: string; uniqueId: string }) {
        const credential = await this.credentialService.findByAdmin(data.adminId, 'smtp');

        const senderEmail = credential.smtp.from || this.config.smtp_auth_email;
        const senderName = credential.smtp.senderName || 'Tuning Files';

        const mailOptions = {
            from: `${senderName} <${senderEmail}>`,
            to: data.receiver,
            subject: 'New Support Ticket Open',
            html: this.adminEmailTemplate(
                'New Support Ticket Open',
                `<td class="email-content">
                  <h2>Hello There</h2>
                  <p>A support ticket was opened from ${data.name}</p>
                  <div class="highlight">
                    <p>ID : ${data.uniqueId}</p>
                </div>
              </td>`,
            ),
        };
        await this.mailTransporter(credential).sendMail(mailOptions);
    }

    async closeSupportTicket(data: { adminId: Types.ObjectId; receiver: string; name: string; uniqueId: string }) {
        const credential = await this.credentialService.findByAdmin(data.adminId, 'smtp');

        const senderEmail = credential.smtp.from || this.config.smtp_auth_email;
        const senderName = credential.smtp.senderName || 'Tuning Files';

        const supportEmail = credential.smtp.support || this.config.smtp_support_email;

        const mailOptions = {
            from: `${senderName} <${senderEmail}>`,
            to: data.receiver,
            subject: 'Ticket Closed',
            html: this.emailTemplate(
                'Your ticket was closed',
                supportEmail,
                `<td class="email-content">
                  <h2>Hello ${data.name}</h2>
                  <p>Your support ticket was closed</p>
                  <div class="highlight">
                    <p>ID : ${data.uniqueId}</p>
                </div>
              </td>`,
            ),
        };
        await this.mailTransporter(credential).sendMail(mailOptions);
    }

    async ticketReopen(data: { adminId: Types.ObjectId; receiver: string; name: string; uniqueId: string }) {
        const credential = await this.credentialService.findByAdmin(data.adminId, 'smtp');

        const senderEmail = credential.smtp.from || this.config.smtp_auth_email;
        const senderName = credential.smtp.senderName || 'Tuning Files';

        const supportEmail = credential.smtp.support || this.config.smtp_support_email;

        const mailOptions = {
            from: `${senderName} <${senderEmail}>`,
            to: data.receiver,
            subject: 'Ticket Re-Open',
            html: this.emailTemplate(
                'Support Ticket Re-Open',
                supportEmail,
                `<td class="email-content">
                  <h2>Hello ${data.name}</h2>
                  <p>A ticket was re-opened </p>
                  <div class="highlight">
                    <p>ID : ${data.uniqueId}</p>
                </div>
              </td>`,
            ),
        };
        await this.mailTransporter(credential).sendMail(mailOptions);
    }
}
