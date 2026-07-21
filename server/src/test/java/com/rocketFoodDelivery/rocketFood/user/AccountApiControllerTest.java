package com.rocketFoodDelivery.rocketFood.user;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Covers the account endpoints used by the mobile Account Settings feature:
 * GET /api/account/{id} (with the ignored official type query) and the added
 * POST /api/account/{id} official-body update. User 1 (both@gmail.com) is a seeded customer;
 * user 22 is a seeded courier (couriers are seeded from users 21..28).
 */
@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
public class AccountApiControllerTest {

    @Autowired
    private MockMvc mockMvc;

    // ==================== GET /api/account/{id} ====================

    @Test
    public void testGetAccount_Success_IgnoresTypeQuery() throws Exception {
        // The official ?type= query is not declared by the controller, so it is accepted and
        // ignored; the full account (primary email + nested customer) is returned.
        mockMvc.perform(get("/api/account/{id}", 1).param("type", "customer"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Success"))
                .andExpect(jsonPath("$.data.id").value(1))
                .andExpect(jsonPath("$.data.email").isString())
                .andExpect(jsonPath("$.data.customer.email").isString());
    }

    @Test
    public void testGetAccount_NotFound() throws Exception {
        mockMvc.perform(get("/api/account/{id}", 999999))
                .andExpect(status().isNotFound());
    }

    // ==================== POST /api/account/{id} ====================

    @Test
    public void testPostAccount_Customer_Success_PreservesPrimaryEmail() throws Exception {
        mockMvc.perform(post("/api/account/{id}", 1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"account_type\": \"customer\", \"account_email\": \"customer.acct.test@example.com\", \"account_phone\": \"+1-555-9100\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Success"))
                // The role email/phone are updated...
                .andExpect(jsonPath("$.data.customer.email").value("customer.acct.test@example.com"))
                .andExpect(jsonPath("$.data.customer.phone").value("+1-555-9100"))
                // ...but the primary user email is never changed by an account update.
                .andExpect(jsonPath("$.data.email").value("both@gmail.com"));
    }

    @Test
    public void testPostAccount_Courier_Success() throws Exception {
        mockMvc.perform(post("/api/account/{id}", 22)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"account_type\": \"courier\", \"account_email\": \"courier.acct.test@example.com\", \"account_phone\": \"+1-555-9200\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.courier.email").value("courier.acct.test@example.com"))
                .andExpect(jsonPath("$.data.courier.phone").value("+1-555-9200"));
    }

    @Test
    public void testPostAccount_Failure_InvalidType() throws Exception {
        mockMvc.perform(post("/api/account/{id}", 1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"account_type\": \"admin\", \"account_email\": \"x@example.com\", \"account_phone\": \"555\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Bad Request"));
    }

    @Test
    public void testPostAccount_Failure_NotFound() throws Exception {
        mockMvc.perform(post("/api/account/{id}", 999999)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"account_type\": \"customer\", \"account_email\": \"x@example.com\", \"account_phone\": \"555\"}"))
                .andExpect(status().isNotFound());
    }
}
