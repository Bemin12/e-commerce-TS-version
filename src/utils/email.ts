import nodemailer from 'nodemailer';
import { htmlToText } from 'html-to-text';
import pug from 'pug';
import { IUser } from '../models/userModel.js';

export default class {
  private to: string;
  private from: string;

  constructor(
    private user: IUser,
    private code: string | number,
  ) {
    this.to = this.user.email;
    this.from = `E-Shop <${process.env.EMAIL_FROM}>`;
  }

  createTransport() {
    // Service that will send the email
    if (process.env.NODE_ENV === 'production') {
      return nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD,
        },
      });
    }

    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT!),
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async send(template: string, subject: string) {
    const html = pug.renderFile(`${__dirname}/../templates/${template}.pug`, { code: this.code });

    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText(html),
    };

    await this.createTransport().sendMail(mailOptions);
  }

  async sendVerifyEmail() {
    const subject = 'Your password reset token (valid for only 10 mins)';
    await this.send('verifyEmail', subject);
  }

  async sendPasswordReset() {
    const subject = 'Your password reset token (valid for only 10 mins)';
    await this.send('resetPassword', subject);
  }
}
