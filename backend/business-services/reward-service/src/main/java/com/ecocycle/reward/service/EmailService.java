package com.ecocycle.reward.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    public void sendRewardEmail(String to, String citizenName, String rewardTitle) {
        if (fromEmail == null || fromEmail.isBlank()) {
            log.warn("Chưa cấu hình SPRING_MAIL_USERNAME, bỏ qua việc gửi email thật cho {} về {}", to, rewardTitle);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject("EcoCycle - Đổi thưởng thành công: " + rewardTitle);

            String htmlMsg = "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;'>"
                    + "<h2 style='color: #10b981; text-align: center;'>Đổi thưởng thành công! 🎉</h2>"
                    + "<p>Chào <b>" + citizenName + "</b>,</p>"
                    + "<p>Chúc mừng bạn đã đổi thành công phần quà: <b>" + rewardTitle + "</b> từ hệ thống EcoCycle.</p>"
                    + "<p>Cảm ơn bạn đã đồng hành cùng EcoCycle trong việc bảo vệ môi trường! Điểm thưởng của bạn đã được trừ tương ứng.</p>"
                    + "<div style='background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin-top: 24px; text-align: center;'>"
                    + "  <h3 style='margin: 0; color: #374151;'>EcoCycle Team</h3>"
                    + "  <p style='margin: 8px 0 0; font-size: 14px; color: #6b7280;'>Chung tay vì một thành phố xanh sạch đẹp</p>"
                    + "</div>"
                    + "</div>";

            helper.setText(htmlMsg, true);

            mailSender.send(message);
            log.info("Đã gửi email đổi thưởng thành công tới {}", to);

        } catch (MessagingException e) {
            log.error("Lỗi khi gửi email đổi thưởng tới {}: {}", to, e.getMessage());
        } catch (Exception e) {
            log.error("Lỗi không xác định khi gửi email: {}", e.getMessage());
        }
    }
}
