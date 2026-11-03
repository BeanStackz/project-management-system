package com.beanstack.project_management_system.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.MailException;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    public EmailServiceImpl(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }
    
    @Override
    public void sendEmailWithToken(String userEmail, String link) throws MessagingException {
        // Implement the logic to send an email with the provided token link
        // You can use JavaMailSender or any other email sending library here
        // For example:
        // SimpleMailMessage message = new SimpleMailMessage();
        // message.setTo(userEmail);
        // message.setSubject("Password Reset Request");
        // message.setText("Click the following link to reset your password: " + link);
        // mailSender.send(message);

        MimeMessage mimeMessage = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "utf-8");

        String subject = "Join Our Project Team Invitation";
        String content = "<p>Dear User,</p>"
                + "<p>You have been invited to join our project team. Please click the link below to accept the invitation:</p>"
                + "<p><a href=\"" + link + "\">Accept Invitation</a></p>"
                + "<br>"
                + "<p>If you did not expect this invitation, please ignore this email.</p>";

        helper.setSubject(subject);
        helper.setText(content, true);
        helper.setTo(userEmail);

        try{
            mailSender.send(mimeMessage);
        } catch (MailSendException e) {
            throw new MessagingException("Error occurred while sending email", e);
        }
    }
}
