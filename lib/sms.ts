/**
 * SMS Service Library
 * Handles sending SMS via Twilio
 */

import { logger } from './logger';

export interface SMSConfig {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
}

export interface SMSOptions {
  to: string;
  message: string;
}

/**
 * SMS Service Class using Twilio
 */
export class SMSService {
  private config: SMSConfig;
  private isConfigured: boolean = false;
  // private client: Twilio | null = null;

  constructor() {
    this.config = this.loadConfig();
    this.isConfigured = this.validateConfig();

    // TODO: Initialize Twilio client
    // if (this.isConfigured) {
    //   this.client = require('twilio')(this.config.accountSid, this.config.authToken);
    // }
  }

  private loadConfig(): SMSConfig {
    return {
      accountSid: process.env.TWILIO_ACCOUNT_SID || '',
      authToken: process.env.TWILIO_AUTH_TOKEN || '',
      phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
    };
  }

  private validateConfig(): boolean {
    if (!this.config.accountSid || !this.config.authToken || !this.config.phoneNumber) {
      logger.warn('SMS service not configured, SMS sending will be skipped');
      return false;
    }
    return true;
  }

  /**
   * Format phone number to E.164 format
   */
  private formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');

    // Add + if not present and starts with country code
    if (!cleaned.startsWith('+')) {
      // Assume US/Canada if 10 digits
      if (cleaned.length === 10) {
        cleaned = '+1' + cleaned;
      } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
        cleaned = '+' + cleaned;
      } else {
        cleaned = '+' + cleaned;
      }
    }

    return cleaned;
  }

  /**
   * Send SMS
   * TODO: Integrate with Twilio SDK for actual SMS sending
   */
  async sendSMS(options: SMSOptions): Promise<boolean> {
    if (!this.isConfigured) {
      logger.warn('SMS not sent - service not configured', { to: options.to });
      return false;
    }

    try {
      const formattedPhone = this.formatPhoneNumber(options.to);

      // TODO: Replace with actual Twilio implementation
      // const message = await this.client!.messages.create({
      //   body: options.message,
      //   from: this.config.phoneNumber,
      //   to: formattedPhone,
      // });

      logger.info('SMS sent (simulated)', {
        to: formattedPhone,
        messageLength: options.message.length,
        // sid: message.sid,
      });

      return true;
    } catch (error) {
      logger.error('Failed to send SMS', error as Error, {
        to: options.to,
      });
      return false;
    }
  }

  /**
   * Send appointment confirmation SMS
   */
  async sendAppointmentConfirmation(
    to: string,
    appointmentDetails: {
      patientName: string;
      doctorName: string;
      date: string;
      time: string;
    }
  ): Promise<boolean> {
    const message = `Hi ${appointmentDetails.patientName}, your appointment with Dr. ${appointmentDetails.doctorName} is confirmed for ${appointmentDetails.date} at ${appointmentDetails.time}. Medical Brothers Clinic.`;

    return this.sendSMS({ to, message });
  }

  /**
   * Send appointment reminder SMS
   */
  async sendAppointmentReminder(
    to: string,
    appointmentDetails: {
      patientName: string;
      doctorName: string;
      time: string;
      hoursUntil: number;
    }
  ): Promise<boolean> {
    const message = `Reminder: ${appointmentDetails.patientName}, you have an appointment with Dr. ${appointmentDetails.doctorName} in ${appointmentDetails.hoursUntil} hours at ${appointmentDetails.time}. Medical Brothers Clinic.`;

    return this.sendSMS({ to, message });
  }

  /**
   * Send test results notification SMS
   */
  async sendTestResultsNotification(
    to: string,
    patientName: string
  ): Promise<boolean> {
    const message = `Hi ${patientName}, your test results are ready. Please log in to your patient portal to view them. Medical Brothers Clinic.`;

    return this.sendSMS({ to, message });
  }

  /**
   * Send verification code SMS
   */
  async sendVerificationCode(
    to: string,
    code: string
  ): Promise<boolean> {
    const message = `Your Medical Brothers verification code is: ${code}. This code will expire in 10 minutes.`;

    return this.sendSMS({ to, message });
  }

  /**
   * Send prescription ready SMS
   */
  async sendPrescriptionReady(
    to: string,
    patientName: string,
    pharmacyName: string
  ): Promise<boolean> {
    const message = `Hi ${patientName}, your prescription is ready for pickup at ${pharmacyName}. Medical Brothers Clinic.`;

    return this.sendSMS({ to, message });
  }

  /**
   * Send general notification SMS
   */
  async sendNotification(
    to: string,
    title: string,
    body: string
  ): Promise<boolean> {
    const message = `${title}: ${body} - Medical Brothers Clinic`;

    return this.sendSMS({ to, message });
  }

  /**
   * Check if SMS service is configured
   */
  isServiceConfigured(): boolean {
    return this.isConfigured;
  }
}

// Export singleton instance
export const smsService = new SMSService();
