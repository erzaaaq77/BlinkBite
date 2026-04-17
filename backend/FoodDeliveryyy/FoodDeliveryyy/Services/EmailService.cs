using MailKit.Net.Smtp;
using MimeKit;
using MailKit.Security;
using Microsoft.Extensions.Options;
using FoodDeliveryyy.Models.DTOs;


namespace FoodDeliveryyy.Services;

public class EmailService : IEmailService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IConfiguration configuration, ILogger<EmailService> logger)

    { 
        _configuration = configuration;
        _logger = logger;
    }

    public async Task SendEmailAsync(string to, string subject, string body) {

        try {

            var email = new MimeMessage();
            email.From.Add(MailboxAddress.Parse(_configuration["EmailSettings:SenderEmail"]));
            email.To.Add(MailboxAddress.Parse(to));
            email.Subject = subject;
            email.Body = new TextPart("html") { Text = body };

            using var smtp = new SmtpClient();
            await smtp.ConnectAsync(
                _configuration["EmailSettings:SmtpServer"],
                int.Parse(_configuration["EmailSettings:Port"]),
                SecureSocketOptions.StartTls
                );
            await smtp.AuthenticateAsync(
                _configuration["EmailSettings:SenderEmail"],
                _configuration["EmailSettings:SenderPassword"]
                );

            await smtp.SendAsync(email);
            await smtp.DisconnectAsync(true);

            _logger.LogInformation("Email sent to {To}", to);

        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {To}", to);
        }
        }

    public  async Task SendOrderStatusUpdateEmailAsync (string to, string customerName,int orderId,string oldStatus, string newStatus)
    {
        var subject = $"Order#{orderId} Status Update - {newStatus}";

        var body= $@"

        <html>
 <body style='font-family: Arial;'>
            <h2>Hello {customerName},</h2>
            <p>Your order <strong>#{orderId}</strong> status has been updated:</p>
            
            <div style='background-color: #f0f0f0; padding: 15px; border-radius: 5px;'>
                <p><strong>Old Status:</strong> {oldStatus}</p>
                <p><strong>New Status:</strong> {newStatus}</p>
                <p><strong>Time:</strong> {DateTime.Now:yyyy-MM-dd HH:mm:ss}</p>
            </div>
            
            <br/>
            <p>Track your order in real-time:</p>
            <a href='http://localhost:5173/orders/{orderId}' style='background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>
                Track Order
            </a>
            
            <br/><br/>
            <p>Thank you for choosing FoodDeliveryyy!</p>
            <p>Best regards,<br/>FoodDeliveryyy Team</p>
        </body>
        </html>";

        await SendEmailAsync(to, subject, body);
    }
}