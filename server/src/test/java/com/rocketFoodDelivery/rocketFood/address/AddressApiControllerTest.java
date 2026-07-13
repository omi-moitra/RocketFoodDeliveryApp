package com.rocketFoodDelivery.rocketFood.address;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.JsonPath;
import com.rocketFoodDelivery.rocketFood.dtos.address.ApiAddressDTO;

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
public class AddressApiControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    // ==================== GET /api/addresses ====================

    @Test
    public void testGetAllAddresses_Success() throws Exception {
        mockMvc.perform(get("/api/addresses"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Success"))
                .andExpect(jsonPath("$.data").isArray());
    }

    // ==================== GET /api/addresses/{id} ====================

    @Test
    public void testGetAddressById_Success() throws Exception {
        mockMvc.perform(get("/api/addresses/{id}", 1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Success"))
                .andExpect(jsonPath("$.data.id").value(1));
    }

    @Test
    public void testGetAddressById_Failure_NotFound() throws Exception {
        mockMvc.perform(get("/api/addresses/{id}", 999999))
                .andExpect(status().isNotFound());
    }

    // ==================== POST /api/addresses ====================

    @Test
    public void testCreateAddress_Success() throws Exception {
        ApiAddressDTO addressDTO = new ApiAddressDTO(0, "100 Test Blvd.", "Montreal", "H2X1Y1");

        mockMvc.perform(post("/api/addresses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(addressDTO)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message").value("Success"))
                .andExpect(jsonPath("$.data.street_address").value("100 Test Blvd."))
                .andExpect(jsonPath("$.data.city").value("Montreal"));
    }

    @Test
    public void testCreateAddress_Failure_MissingFields() throws Exception {
        ApiAddressDTO addressDTO = new ApiAddressDTO(0, null, null, null);

        mockMvc.perform(post("/api/addresses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(addressDTO)))
                .andExpect(status().isBadRequest());
    }

    // ==================== PUT /api/addresses/{id} ====================

    @Test
    public void testUpdateAddress_Success() throws Exception {
        ApiAddressDTO update = new ApiAddressDTO(0, "200 Updated St.", "Quebec", "G1A2B3");

        mockMvc.perform(put("/api/addresses/{id}", 1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Success"))
                .andExpect(jsonPath("$.data.id").value(1))
                .andExpect(jsonPath("$.data.street_address").value("200 Updated St."));
    }

    @Test
    public void testUpdateAddress_Failure_NotFound() throws Exception {
        ApiAddressDTO update = new ApiAddressDTO(0, "Ghost St.", "Nowhere", "X0X0X0");

        mockMvc.perform(put("/api/addresses/{id}", 999999)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isNotFound());
    }

    // ==================== DELETE /api/addresses/{id} ====================

    @Test
    public void testDeleteAddress_Success() throws Exception {
        // Create a fresh address to safely delete
        ApiAddressDTO addressDTO = new ApiAddressDTO(0, "999 Delete Ave.", "TestCity", "D3L3T3");

        MvcResult createResult = mockMvc.perform(post("/api/addresses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(addressDTO)))
                .andExpect(status().isCreated())
                .andReturn();

        int id = JsonPath.read(createResult.getResponse().getContentAsString(), "$.data.id");

        mockMvc.perform(delete("/api/addresses/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Success"));
    }

    @Test
    public void testDeleteAddress_Failure_NotFound() throws Exception {
        mockMvc.perform(delete("/api/addresses/{id}", 999999))
                .andExpect(status().isNotFound());
    }
}
