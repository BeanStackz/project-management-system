package com.beanstack.project_management_system.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String senderAddress;

    public EmailServiceImpl(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Override
    public void sendEmailWithToken(String userEmail, String link, String projectName) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        String safeProjectName = escapeHtml(projectName);
        String safeLink = escapeHtml(link);
        String html = """
                <!doctype html>
                <html lang="en">
                <body style="margin:0;background:#f4f4fb;color:#17172a;font-family:Arial,Helvetica,sans-serif;">
                  <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="background:#f4f4fb;padding:32px 16px;">
                    <tr><td align="center">
                      <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 12px 40px rgba(37,32,72,.12);">
                        <tr><td style="padding:28px 36px;background:linear-gradient(135deg,#17132f,#432a86 58%%,#7c3aed);color:#fff;">
                          <div style="font-size:22px;font-weight:700;">Orbit<span style="color:#c4b5fd;">.</span></div>
                          <div style="margin-top:42px;font-size:30px;line-height:1.15;font-weight:700;">Build something<br>great together.</div>
                          <div style="margin-top:14px;color:#ddd6fe;font-size:15px;line-height:1.6;">A focused workspace for teams that keep moving.</div>
                        </td></tr>
                        <tr><td style="padding:38px 36px 32px;">
                          <div style="color:#7c3aed;font-size:13px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;">You have been invited</div>
                          <h1 style="margin:12px 0 0;font-size:28px;line-height:1.25;">Join the <span style="color:#6d28d9;">%s</span> team</h1>
                          <p style="margin:18px 0;color:#57566b;font-size:16px;line-height:1.7;">You have been invited to collaborate on this project in Orbit. Join your teammates, follow progress, and help turn the next idea into something real.</p>
                          <div style="margin:26px 0;padding:17px 18px;background:#f5f3ff;border:1px solid #e9d5ff;border-radius:12px;">
                            <div style="color:#6b21a8;font-size:12px;font-weight:700;text-transform:uppercase;">Project</div>
                            <div style="margin-top:5px;color:#2e1065;font-size:17px;font-weight:700;">%s</div>
                          </div>
                          <div style="text-align:center;margin:30px 0;"><a href="%s" style="display:inline-block;padding:14px 26px;border-radius:10px;background:#7c3aed;color:#fff;font-size:15px;font-weight:700;text-decoration:none;">Accept invitation &nbsp;→</a></div>
                          <p style="color:#77758a;font-size:13px;line-height:1.6;">If the button does not work, copy and paste this URL into your browser:</p>
                          <p style="word-break:break-all;color:#6d28d9;font-size:12px;line-height:1.5;">%s</p>
                          <p style="margin-top:28px;padding-top:22px;border-top:1px solid #eeeef5;color:#8a8898;font-size:12px;line-height:1.6;">If you were not expecting this invitation, you can safely ignore this email. Please do not forward this link.</p>
                        </td></tr>
                        <tr><td style="padding:22px 36px;background:#fafafe;color:#8a8898;font-size:12px;line-height:1.6;"><strong style="color:#4b4960;">Orbit</strong> · Project management for teams with momentum.<br>This is an automated message. Please do not reply.</td></tr>
                      </table>
                    </td></tr>
                  </table>
                </body>
                </html>
                """.formatted(safeProjectName, safeProjectName, safeLink, safeLink);
        String plainText = "You have been invited to join " + projectName
                + " on Orbit.\n\nAccept your invitation: " + link
                + "\n\nIf you were not expecting this invitation, you can ignore this email.";

        helper.setSubject("You are invited to join " + projectName + " on Orbit");
        helper.setText(plainText, html);
        helper.setTo(userEmail);
        helper.setFrom(senderAddress);

        try {
            mailSender.send(message);
        } catch (MailException exception) {
            throw new MessagingException("Error occurred while sending email", exception);
        }
    }

    private String escapeHtml(String value) {
        return value.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
