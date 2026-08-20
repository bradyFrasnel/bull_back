import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor() {
    // For development, we use ethereal mail if no SMTP is configured in .env
    this.initTransporter();
  }

  private async initTransporter() {
    try {
      if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });
        this.logger.log('MailService initialized with SMTP credentials from .env');
      } else {
        // Fallback to Ethereal for testing
        const testAccount = await nodemailer.createTestAccount();
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false, // true for 465, false for other ports
          auth: {
            user: testAccount.user, // generated ethereal user
            pass: testAccount.pass, // generated ethereal password
          },
        });
        this.logger.log(`MailService initialized with Ethereal test account: ${testAccount.user}`);
      }
    } catch (err) {
      this.logger.error('Failed to initialize MailService', err);
    }
  }

  async sendCredentials(to: string, nom: string, prenom: string, motDePasse: string, role: string) {
    try {
      if (!this.transporter) {
        this.logger.warn('Transporter is not initialized, skipping email sending.');
        return;
      }

      const info = await this.transporter.sendMail({
        from: '"Plateforme ASUR" <noreply@asur-app.com>',
        to: to,
        subject: `Vos identifiants de connexion - Plateforme ASUR`,
        text: `Bonjour ${prenom} ${nom},\n\nVotre compte ${role} a été créé avec succès.\n\nVoici vos identifiants pour vous connecter :\n- Email : ${to}\n- Mot de passe : ${motDePasse}\n\nVeuillez changer votre mot de passe lors de votre première connexion.\n\nCordialement,\nL'équipe ASUR`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
            <h2 style="color: #4f46e5;">Bienvenue sur la plateforme ASUR</h2>
            <p>Bonjour <strong>${prenom} ${nom}</strong>,</p>
            <p>Votre compte <strong>${role}</strong> a été créé avec succès.</p>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0;"><strong>Vos identifiants de connexion :</strong></p>
              <ul style="margin: 0; padding-left: 20px;">
                <li>Email : <strong>${to}</strong></li>
                <li>Mot de passe : <strong>${motDePasse}</strong></li>
              </ul>
            </div>
            <p style="color: #d97706; font-size: 0.9em;"><em>Note : Nous vous recommandons de changer votre mot de passe lors de votre première connexion pour des raisons de sécurité.</em></p>
            <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
            <p style="color: #6b7280; font-size: 0.8em; margin: 0;">Ceci est un email automatique, merci de ne pas y répondre.</p>
          </div>
        `,
      });

      this.logger.log(`Credentials email sent to ${to}. Message ID: ${info.messageId}`);
      if (info.messageId && (this.transporter.options as any).host === 'smtp.ethereal.email') {
        this.logger.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
      }
      
      return { success: true, messageId: info.messageId, previewUrl: nodemailer.getTestMessageUrl(info) };
    } catch (error) {
      this.logger.error(`Error sending credentials email to ${to}:`, error);
      return { success: false, error };
    }
  }
}
