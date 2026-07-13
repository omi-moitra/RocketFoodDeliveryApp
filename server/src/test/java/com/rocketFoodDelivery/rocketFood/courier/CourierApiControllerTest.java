package com.rocketFoodDelivery.rocketFood.courier;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.JsonPath;
import com.rocketFoodDelivery.rocketFood.dtos.courier.ApiCourierDTO;
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
public class CourierApiControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    // ==================== GET /api/couriers ====================

    @Test
    public void testGetAllCouriers_Success() throws Exception {
        mockMvc.perform(get("/api/couriers"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Success"))
                .andExpect(jsonPath("$.data").isArray());
    }

    // ==================== GET /api/couriers/{id} ====================

    @Test
    public void testGetCourierById_Success() throws Exception {
        mockMvc.perform(get("/api/couriers/{id}", 1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Success"))
                .andExpect(jsonPath("$.data.id").value(1));
    }

    @Test
    public void testGetCourierById_Failure_NotFound() throws Exception {
        mockMvc.perform(get("/api/couriers/{id}", 999999))
                .andExpect(status().isNotFound());
    }

    // ==================== POST /api/couriers ====================

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
    public void testCreateCourier_Success() throws Exception {
        int freshUserId = createFreshUserId("cr_create_");
        ApiCourierDTO courierDTO = new ApiCourierDTO(0, freshUserId, 1, 1, "5140000011", "testcourier@test.com", true);

        mockMvc.perform(post("/api/couriers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(courierDTO)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message").value("Success"))
                .andExpect(jsonPath("$.data.phone").value("5140000011"))
                .andExpect(jsonPath("$.data.email").value("testcourier@test.com"));
    }

    @Test
    public void testCreateCourier_Failure_InvalidData() throws Exception {
        // Send empty body → missing required fields
        mockMvc.perform(post("/api/couriers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    // ==================== PUT /api/couriers/{id} ====================

    @Test
    public void testUpdateCourier_Success() throws Exception {
        // Create a fresh courier to update
        int freshUserId = createFreshUserId("cr_update_");
        ApiCourierDTO createDTO = new ApiCourierDTO(0, freshUserId, 1, 1, "5140000020", "courierold@test.com", true);
        MvcResult createResult = mockMvc.perform(post("/api/couriers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createDTO)))
                .andExpect(status().isCreated())
                .andReturn();
        int courierId = JsonPath.read(createResult.getResponse().getContentAsString(), "$.data.id");

        ApiCourierDTO update = new ApiCourierDTO(0, freshUserId, 1, 1, "5140000022", "courierupdate@test.com", true);

        mockMvc.perform(put("/api/couriers/{id}", courierId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Success"))
                .andExpect(jsonPath("$.data.id").value(courierId))
                .andExpect(jsonPath("$.data.phone").value("5140000022"));
    }

    @Test
    public void testUpdateCourier_Failure_NotFound() throws Exception {
        ApiCourierDTO update = new ApiCourierDTO(0, 1, 1, 1, "0000000000", "notfound@test.com", false);

        mockMvc.perform(put("/api/couriers/{id}", 999999)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isNotFound());
    }

    // ==================== DELETE /api/couriers/{id} ====================

    @Test
    public void testDeleteCourier_Success() throws Exception {
        // Create a fresh user and courier to safely delete
        int freshUserId = createFreshUserId("cr_delete_");
        ApiCourierDTO courierDTO = new ApiCourierDTO(0, freshUserId, 1, 1, "5140000099", "tobedeleted_courier@test.com", true);

        MvcResult createResult = mockMvc.perform(post("/api/couriers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(courierDTO)))
                .andExpect(status().isCreated())
                .andReturn();

        int id = JsonPath.read(createResult.getResponse().getContentAsString(), "$.data.id");

        mockMvc.perform(delete("/api/couriers/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Success"));
    }

    @Test
    public void testDeleteCourier_Failure_NotFound() throws Exception {
        mockMvc.perform(delete("/api/couriers/{id}", 999999))
                .andExpect(status().isNotFound());
    }
}
