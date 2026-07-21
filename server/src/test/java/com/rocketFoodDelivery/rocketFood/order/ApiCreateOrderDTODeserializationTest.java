package com.rocketFoodDelivery.rocketFood.order;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rocketFoodDelivery.rocketFood.dtos.order.ApiCreateOrderDTO;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Verifies the notification-key contract on ApiCreateOrderDTO: the official camelCase
 * sendSMS/sendEmail keys deserialize and serialize, legacy snake_case keys are not mapped,
 * and both values default to false when absent.
 */
public class ApiCreateOrderDTODeserializationTest {

    // Spring Boot disables FAIL_ON_UNKNOWN_PROPERTIES; mirror that so unrelated keys never fail here.
    private final ObjectMapper objectMapper =
            new ObjectMapper().configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

    @Test
    public void camelCaseKeysDeserializeNotificationFlags() throws Exception {
        ApiCreateOrderDTO dto = objectMapper.readValue(
                "{\"restaurant_id\":1,\"customer_id\":1,\"sendSMS\":true,\"sendEmail\":true}",
                ApiCreateOrderDTO.class);

        assertTrue(dto.isSendSms(), "sendSMS should map to sendSms");
        assertTrue(dto.isSendEmail(), "sendEmail should map to sendEmail");
    }

    @Test
    public void snakeCaseKeysDoNotDeserializeNotificationFlags() throws Exception {
        ApiCreateOrderDTO dto = objectMapper.readValue(
                "{\"restaurant_id\":1,\"customer_id\":1,\"send_sms\":true,\"send_email\":true}",
                ApiCreateOrderDTO.class);

        assertFalse(dto.isSendSms(), "send_sms is not part of the camelCase API contract");
        assertFalse(dto.isSendEmail(), "send_email is not part of the camelCase API contract");
    }

    @Test
    public void missingNotificationKeysDefaultToFalse() throws Exception {
        ApiCreateOrderDTO dto = objectMapper.readValue(
                "{\"restaurant_id\":1,\"customer_id\":1}",
                ApiCreateOrderDTO.class);

        assertFalse(dto.isSendSms());
        assertFalse(dto.isSendEmail());
    }

    @Test
    public void notificationFlagsSerializeWithOfficialCamelCaseKeys() throws Exception {
        ApiCreateOrderDTO dto = objectMapper.readValue(
                "{\"restaurant_id\":1,\"customer_id\":1,\"sendSMS\":true,\"sendEmail\":true}",
                ApiCreateOrderDTO.class);

        String json = objectMapper.writeValueAsString(dto);

        assertTrue(objectMapper.readTree(json).get("sendSMS").asBoolean());
        assertTrue(objectMapper.readTree(json).get("sendEmail").asBoolean());
        assertFalse(objectMapper.readTree(json).has("send_sms"));
        assertFalse(objectMapper.readTree(json).has("send_email"));
    }
}
