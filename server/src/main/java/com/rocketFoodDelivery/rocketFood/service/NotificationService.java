package com.rocketFoodDelivery.rocketFood.service;

// Jakarta EE
import jakarta.annotation.PostConstruct;

// Spring Framework
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

// Twilio
import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;

// Project models
import com.rocketFoodDelivery.rocketFood.models.Customer;
import com.rocketFoodDelivery.rocketFood.models.Order;

@Service
public class NotificationService {

    private static final Logger logger = LoggerFactory.getLogger(NotificationService.class);

    @Value("${twilio.account-sid:}")
    private String twilioAccountSid;

    @Value("${twilio.auth-token:}")
    private String twilioAuthToken;

    @Value("${twilio.from-number:}")
    private String twilioFromNumber;

    @Value("${notify.api-url:https://api.notify.eu/notification/send}")
    private String notifyApiUrl;

    @Value("${notify.client-id:}")
    private String notifyClientId;

    @Value("${notify.secret-key:}")
    private String notifySecretKey;

    @Value("${notify.template-id:}")
    private String notifyTemplateId;

    @Value("${notify.language:en}")
    private String notifyLanguage;

    private final RestTemplate restTemplate = new RestTemplate();

    @PostConstruct
    public void initTwilio() {
        if (!twilioAccountSid.isBlank() && !twilioAuthToken.isBlank()) {
            Twilio.init(twilioAccountSid, twilioAuthToken);
        }
    }

    public void sendSms(Order order, Customer customer) {
        String phone = customer.getPhone();
        if (phone == null || phone.isBlank()) {
            logger.warn("SMS skipped: customer {} has no phone number", customer.getId());
            return;
        }
        try {
            String toPhone = phone.startsWith("+") ? phone : "+1" + phone;
            String body = "Your RocketFood order #" + order.getId() + " has been received! Thank you for ordering with us.";
            Message.creator(new PhoneNumber(toPhone), new PhoneNumber(twilioFromNumber), body).create();
            logger.info("SMS sent successfully to {} for order {}", toPhone, order.getId());
        } catch (Exception e) {
            logger.error("SMS failed for order {}: {}", order.getId(), e.getMessage());
        }
    }

    public void sendEmail(Order order, Customer customer) {
        String email = customer.getEmail();
        if (email == null || email.isBlank()) {
            if (customer.getUser() != null && customer.getUser().getEmail() != null && !customer.getUser().getEmail().isBlank()) {
                email = customer.getUser().getEmail();
            } else {
                logger.warn("Email skipped: customer {} has no email address", customer.getId());
                return;
            }
        }
        if (notifyClientId.isBlank() || notifySecretKey.isBlank()) {
            logger.warn("Email skipped: Notify.eu credentials not configured");
            return;
        }

        String customerName = (customer.getUser() != null
                && customer.getUser().getName() != null
                && !customer.getUser().getName().isBlank())
                ? customer.getUser().getName() : "Valued Customer";

        String restaurantName = (order.getRestaurant() != null) ? order.getRestaurant().getName() : "";

        int totalCostRaw = (order.getProductOrders() == null) ? 0 :
                order.getProductOrders().stream()
                        .mapToInt(po -> po.getProductQuantity() * po.getProductUnitCost())
                        .sum();
        String totalCost = String.format("$%.2f", (double) totalCostRaw);

        String requestBody = "{"
                + "\"message\": {"
                + "  \"notificationType\": \"" + notifyTemplateId + "\","
                + "  \"language\": \"" + notifyLanguage + "\","
                + "  \"params\": {"
                + "    \"firstName\": \"" + customerName + "\","
                + "    \"order_id\": \"" + order.getId() + "\","
                + "    \"restaurant_name\": \"" + restaurantName + "\","
                + "    \"order_total_cost\": \"" + totalCost + "\""
                + "  },"
                + "  \"transport\": [{"
                + "    \"type\": \"SMTP\","
                + "    \"recipients\": {"
                + "      \"to\": [{"
                + "        \"name\": \"" + customerName + "\","
                + "        \"recipient\": \"" + email + "\""
                + "      }]"
                + "    }"
                + "  }]"
                + "}"
                + "}";

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("X-ClientId", notifyClientId);
            headers.set("X-SecretKey", notifySecretKey);

            HttpEntity<String> request = new HttpEntity<>(requestBody, headers);
            restTemplate.postForEntity(notifyApiUrl, request, String.class);
            logger.info("Email sent via Notify.eu to {} for order {}", email, order.getId());
        } catch (Exception e) {
            logger.error("Email failed for order {}: {}", order.getId(), e.getMessage());
        }
    }
}
