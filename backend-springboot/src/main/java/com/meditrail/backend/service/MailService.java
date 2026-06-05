package com.meditrail.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class MailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    // Welcome email for patient
    public void sendPatientWelcomeEmail(String toEmail, String patientName, String customUID) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Welcome to MediTrail!");

            String html = """
                <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #ffffff;">
                    <div style="text-align: center; margin-bottom: 40px;">
                        <h1 style="color: #667eea; font-size: 32px; margin: 0;">MediTrail</h1>
                        <p style="color: #666; margin-top: 8px;">Your Medical Records Platform</p>
                    </div>
                    <div style="background: #f8f9fa; border-radius: 16px; padding: 32px; margin-bottom: 24px;">
                        <h2 style="color: #1a1a1a; margin-top: 0;">Welcome, %s! 👋</h2>
                        <p style="color: #444; line-height: 1.6;">Your MediTrail patient account has been created successfully.</p>
                        <div style="background: #ffffff; border-radius: 12px; padding: 20px; margin: 24px 0; border-left: 4px solid #667eea;">
                            <p style="margin: 0; color: #666; font-size: 14px;">Your Unique Patient ID</p>
                            <p style="margin: 8px 0 0 0; color: #667eea; font-size: 24px; font-weight: 700; letter-spacing: 2px;">%s</p>
                        </div>
                        <p style="color: #444; line-height: 1.6;">Share this ID with your doctor so they can upload your medical reports securely.</p>
                    </div>
                    <div style="background: #667eea; border-radius: 16px; padding: 24px; color: white; margin-bottom: 24px;">
                        <h3 style="margin-top: 0;">What you can do:</h3>
                        <ul style="padding-left: 20px; line-height: 2;">
                            <li>View your medical reports</li>
                            <li>Download and share reports</li>
                            <li>Ask AI health questions</li>
                            <li>Manage your health records</li>
                        </ul>
                    </div>
                    <p style="color: #888; font-size: 13px; text-align: center;">
                        © 2026 MediTrail | support@meditrail.com
                    </p>
                </div>
            """.formatted(patientName, customUID);

            helper.setText(html, true);
            mailSender.send(message);
            log.info("Welcome email sent to patient: {}", toEmail);
        } catch (MessagingException e) {
            log.error("Failed to send welcome email to: {}", toEmail, e);
        }
    }

    // Welcome email for doctor
    public void sendDoctorWelcomeEmail(String toEmail, String doctorName, String customUID) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Welcome to MediTrail, Dr. " + doctorName + "!");

            String html = """
                <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #ffffff;">
                    <div style="text-align: center; margin-bottom: 40px;">
                        <h1 style="color: #667eea; font-size: 32px; margin: 0;">MediTrail</h1>
                        <p style="color: #666; margin-top: 8px;">Your Medical Records Platform</p>
                    </div>
                    <div style="background: #f8f9fa; border-radius: 16px; padding: 32px; margin-bottom: 24px;">
                        <h2 style="color: #1a1a1a; margin-top: 0;">Welcome, Dr. %s! 👨‍⚕️</h2>
                        <p style="color: #444; line-height: 1.6;">Your MediTrail doctor account has been created successfully.</p>
                        <div style="background: #ffffff; border-radius: 12px; padding: 20px; margin: 24px 0; border-left: 4px solid #667eea;">
                            <p style="margin: 0; color: #666; font-size: 14px;">Your Unique Doctor ID</p>
                            <p style="margin: 8px 0 0 0; color: #667eea; font-size: 24px; font-weight: 700; letter-spacing: 2px;">%s</p>
                        </div>
                        <p style="color: #444; line-height: 1.6;">You can now search patients and upload their medical reports securely.</p>
                    </div>
                    <div style="background: #667eea; border-radius: 16px; padding: 24px; color: white; margin-bottom: 24px;">
                        <h3 style="margin-top: 0;">What you can do:</h3>
                        <ul style="padding-left: 20px; line-height: 2;">
                            <li>Search patients by UID, Email or Phone</li>
                            <li>Upload medical reports to AWS S3</li>
                            <li>View your upload history</li>
                            <li>Use AI assistant for clinical queries</li>
                        </ul>
                    </div>
                    <p style="color: #888; font-size: 13px; text-align: center;">
                        © 2026 MediTrail | support@meditrail.com
                    </p>
                </div>
            """.formatted(doctorName, customUID);

            helper.setText(html, true);
            mailSender.send(message);
            log.info("Welcome email sent to doctor: {}", toEmail);
        } catch (MessagingException e) {
            log.error("Failed to send welcome email to: {}", toEmail, e);
        }
    }

    // Upload notification email to patient
    public void sendUploadNotificationEmail(String toEmail, String patientName,
            String doctorName, String description, String uploadDate) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("New Medical Report Uploaded - MediTrail 📋");

            String html = """
                <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #ffffff;">
                    <div style="text-align: center; margin-bottom: 40px;">
                        <h1 style="color: #667eea; font-size: 32px; margin: 0;">MediTrail</h1>
                        <p style="color: #666; margin-top: 8px;">Your Medical Records Platform</p>
                    </div>
                    <div style="background: #f8f9fa; border-radius: 16px; padding: 32px; margin-bottom: 24px;">
                        <h2 style="color: #1a1a1a; margin-top: 0;">New Report Available! 📄</h2>
                        <p style="color: #444; line-height: 1.6;">Hi %s, a new medical report has been uploaded to your account.</p>
                        <div style="background: #ffffff; border-radius: 12px; padding: 20px; margin: 24px 0; border: 1px solid #e0e0e0;">
                            <table style="width: 100%%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 10px 0; color: #666; font-size: 14px; width: 40%%;">Doctor</td>
                                    <td style="padding: 10px 0; color: #1a1a1a; font-weight: 600;">Dr. %s</td>
                                </tr>
                                <tr style="border-top: 1px solid #f0f0f0;">
                                    <td style="padding: 10px 0; color: #666; font-size: 14px;">Description</td>
                                    <td style="padding: 10px 0; color: #1a1a1a; font-weight: 600;">%s</td>
                                </tr>
                                <tr style="border-top: 1px solid #f0f0f0;">
                                    <td style="padding: 10px 0; color: #666; font-size: 14px;">Date</td>
                                    <td style="padding: 10px 0; color: #1a1a1a; font-weight: 600;">%s</td>
                                </tr>
                            </table>
                        </div>
                        <p style="color: #444; line-height: 1.6;">Login to MediTrail to view, download or share this report.</p>
                    </div>
                    <div style="text-align: center; margin-bottom: 24px;">
                        <a href="http://localhost:3000/patient/login"
                           style="background: #667eea; color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 15px;">
                            View My Reports
                        </a>
                    </div>
                    <p style="color: #888; font-size: 13px; text-align: center;">
                        © 2026 MediTrail | support@meditrail.com
                    </p>
                </div>
            """.formatted(patientName, doctorName, description, uploadDate);

            helper.setText(html, true);
            mailSender.send(message);
            log.info("Upload notification sent to: {}", toEmail);
        } catch (MessagingException e) {
            log.error("Failed to send upload notification to: {}", toEmail, e);
        }
    }
}