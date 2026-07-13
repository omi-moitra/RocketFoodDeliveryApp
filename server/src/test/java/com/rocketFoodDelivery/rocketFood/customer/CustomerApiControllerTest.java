package com.rocketFoodDelivery.rocketFood.customer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.JsonPath;
import com.rocketFoodDelivery.rocketFood.dtos.customer.ApiCustomerDTO;
import com.rocketFoodDelivery.rocketFood.dtos.user.ApiCreateUserDTO;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
public class CustomerApiControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    // ==================== GET /api/customers ====================

    @Test
    public void testGetAllCustomers_Success() throws Exception {
        mockMvc.perform(get("/api/customers"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Success"))
                .andExpect(jsonPath("$.data").isArray());
    }

    // ==================== GET /api/customers/{id} ====================

    @Test
    public void testGetCustomerById_Success() throws Exception {
        mockMvc.perform(get("/api/customers/{id}", 1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Success"))
                .andExpect(jsonPath("$.data.id").value(1));
    }

    @Test
    public void testGetCustomerById_Failure_NotFound() throws Exception {
        mockMvc.perform(get("/api/customers/{id}", 999999))
                .andExpect(status().isNotFound());
    }

    // ==================== POST /api/customers ====================

    private int createFreshUserId(String prefix) throws Exception {
        String uniqueEmail = prefix + System.nanoTime() + "@test.com";
        ApiCreateUserDTO userDTO = new ApiCreateUserDTO("Test User", uniqueEmail, "password123");
        MvcResult result = mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userDTO)))
                .andExpect(status().isCreated())
                .andReturn();
        return JsonPath.read(result.getResponse().getContentAsString(), "$.data.id");
    }

    @Test
    public void testCreateCustomer_Success() throws Exception {
        int freshUserId = createFreshUserId("cu_create_");
        ApiCustomerDTO customerDTO = new ApiCustomerDTO(0, freshUserId, 1, "5140000031", "testcustomer@test.com", true);

        mockMvc.perform(post("/api/customers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(customerDTO)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message").value("Success"))
                .andExpect(jsonPath("$.data.phone").value("5140000031"))
                .andExpect(jsonPath("$.data.email").value("testcustomer@test.com"));
    }

    @Test
    public void testCreateCustomer_Failure_InvalidData() throws Exception {
        // Send empty body → missing required fields
        mockMvc.perform(post("/api/customers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    // ==================== PUT /api/customers/{id} ====================

    @Test
    public void testUpdateCustomer_Success() throws Exception {
        ApiCustomerDTO update = new ApiCustomerDTO(0, 1, 1, "5140000042", "customerupdate@test.com", true);

        mockMvc.perform(put("/api/customers/{id}", 1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Success"))
                .andExpect(jsonPath("$.data.id").value(1))
                .andExpect(jsonPath("$.data.phone").value("5140000042"));
    }

    @Test
    public void testUpdateCustomer_Failure_NotFound() throws Exception {
        ApiCustomerDTO update = new ApiCustomerDTO(0, 1, 1, "0000000000", "notfound@test.com", false);

        mockMvc.perform(put("/api/customers/{id}", 999999)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isNotFound());
    }

    // ==================== DELETE /api/customers/{id} ====================

    @Test
    public void testDeleteCustomer_Success() throws Exception {
        // Create a fresh user and customer to safely delete
        int freshUserId = createFreshUserId("cu_delete_");
        ApiCustomerDTO customerDTO = new ApiCustomerDTO(0, freshUserId, 1, "5140000089", "tobedeleted_customer@test.com", true);

        MvcResult createResult = mockMvc.perform(post("/api/customers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(customerDTO)))
                .andExpect(status().isCreated())
                .andReturn();

        int id = JsonPath.read(createResult.getResponse().getContentAsString(), "$.data.id");

        mockMvc.perform(delete("/api/customers/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Success"));
    }

    @Test
    public void testDeleteCustomer_Failure_NotFound() throws Exception {
        mockMvc.perform(delete("/api/customers/{id}", 999999))
                .andExpect(status().isNotFound());
    }
}
