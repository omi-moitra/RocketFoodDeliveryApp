package com.rocketFoodDelivery.rocketFood.restaurant;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.JsonPath;
import com.rocketFoodDelivery.rocketFood.dtos.address.ApiAddressDTO;
import com.rocketFoodDelivery.rocketFood.dtos.restaurant.ApiCreateRestaurantDTO;

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
public class RestaurantApiControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    // ==================== GET /api/restaurants ====================

    @Test
    public void testGetAllRestaurants_Success() throws Exception {
        mockMvc.perform(get("/api/restaurants"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Success"))
                .andExpect(jsonPath("$.data").isArray());
    }

    // ==================== GET /api/restaurants/{id} ====================

    @Test
    public void testGetRestaurantById_Success() throws Exception {
        mockMvc.perform(get("/api/restaurants/{id}", 1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Success"))
                .andExpect(jsonPath("$.data.id").value(1));
    }

    @Test
    public void testGetRestaurantById_Failure_NotFound() throws Exception {
        mockMvc.perform(get("/api/restaurants/{id}", 999999))
                .andExpect(status().isNotFound());
    }

    // ==================== POST /api/restaurants ====================

    @Test
    public void testCreateRestaurant_Success() throws Exception {
        ApiAddressDTO address = new ApiAddressDTO(0, "123 Test St.", "Montreal", "H1H1H1");
        ApiCreateRestaurantDTO restaurant = new ApiCreateRestaurantDTO(0, 1, "Test Restaurant", 2, "5140000001", "testcreate@restaurant.com", address);

        mockMvc.perform(post("/api/restaurants")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(restaurant)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message").value("Success"))
                .andExpect(jsonPath("$.data.id").exists())
                .andExpect(jsonPath("$.data.name").value("Test Restaurant"))
                .andExpect(jsonPath("$.data.price_range").value(2))
                .andExpect(jsonPath("$.data.user_id").value(1));
    }

    @Test
    public void testCreateRestaurant_Failure_MissingAddress() throws Exception {
        ApiCreateRestaurantDTO restaurant = new ApiCreateRestaurantDTO(0, 1, "Test Restaurant", 2, "5140000002", "testfail@restaurant.com", null);

        mockMvc.perform(post("/api/restaurants")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(restaurant)))
                .andExpect(status().isBadRequest());
    }

    // ==================== PUT /api/restaurants/{id} ====================

    @Test
    public void testUpdateRestaurant_Success() throws Exception {
        ApiCreateRestaurantDTO update = new ApiCreateRestaurantDTO();
        update.setUserId(1);
        update.setName("Updated Restaurant");
        update.setPriceRange(3);
        update.setPhone("5140000003");
        update.setEmail("testupdated@restaurant.com");

        mockMvc.perform(put("/api/restaurants/{id}", 1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Success"))
                .andExpect(jsonPath("$.data.id").value(1))
                .andExpect(jsonPath("$.data.name").value("Updated Restaurant"))
                .andExpect(jsonPath("$.data.price_range").value(3));
    }

    @Test
    public void testUpdateRestaurant_Failure_NotFound() throws Exception {
        ApiCreateRestaurantDTO update = new ApiCreateRestaurantDTO();
        update.setName("Should Not Exist");
        update.setPriceRange(1);
        update.setPhone("0000000000");
        update.setEmail("notfound@test.com");

        mockMvc.perform(put("/api/restaurants/{id}", 999999)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isNotFound());
    }

    // ==================== DELETE /api/restaurants/{id} ====================

    @Test
    public void testDeleteRestaurant_Success() throws Exception {
        // Create a fresh restaurant to safely delete
        ApiAddressDTO address = new ApiAddressDTO(0, "999 Delete St.", "TestCity", "D3L3T3");
        ApiCreateRestaurantDTO restaurant = new ApiCreateRestaurantDTO(0, 1, "To Be Deleted", 1, "5140000099", "tobedeleted@test.com", address);

        MvcResult createResult = mockMvc.perform(post("/api/restaurants")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(restaurant)))
                .andExpect(status().isCreated())
                .andReturn();

        int id = JsonPath.read(createResult.getResponse().getContentAsString(), "$.data.id");

        mockMvc.perform(delete("/api/restaurants/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Success"));
    }

    @Test
    public void testDeleteRestaurant_Failure_NotFound() throws Exception {
        mockMvc.perform(delete("/api/restaurants/{id}", 999999))
                .andExpect(status().isNotFound());
    }
}