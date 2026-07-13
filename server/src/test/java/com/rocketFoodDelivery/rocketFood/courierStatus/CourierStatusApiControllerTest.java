package com.rocketFoodDelivery.rocketFood.courierStatus;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.JsonPath;
import com.rocketFoodDelivery.rocketFood.dtos.courierStatus.ApiCourierStatusDTO;

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
public class CourierStatusApiControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    // ==================== GET /api/courier-statuses ====================

    @Test
    public void testGetAllCourierStatuses_Success() throws Exception {
        mockMvc.perform(get("/api/courier-statuses"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Success"))
                .andExpect(jsonPath("$.data").isArray());
    }

    // ==================== GET /api/courier-statuses/{id} ====================

    @Test
    public void testGetCourierStatusById_Success() throws Exception {
        mockMvc.perform(get("/api/courier-statuses/{id}", 1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Success"))
                .andExpect(jsonPath("$.data.id").value(1));
    }

    @Test
    public void testGetCourierStatusById_Failure_NotFound() throws Exception {
        mockMvc.perform(get("/api/courier-statuses/{id}", 999999))
                .andExpect(status().isNotFound());
    }

    // ==================== POST /api/courier-statuses ====================

    @Test
    public void testCreateCourierStatus_Success() throws Exception {
        ApiCourierStatusDTO statusDTO = new ApiCourierStatusDTO(0, "test_status");

        mockMvc.perform(post("/api/courier-statuses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(statusDTO)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message").value("Success"))
                .andExpect(jsonPath("$.data.name").value("test_status"));
    }

    @Test
    public void testCreateCourierStatus_Failure_InvalidData() throws Exception {
        mockMvc.perform(post("/api/courier-statuses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    // ==================== PUT /api/courier-statuses/{id} ====================

    @Test
    public void testUpdateCourierStatus_Success() throws Exception {
        ApiCourierStatusDTO update = new ApiCourierStatusDTO(0, "updated_status");

        mockMvc.perform(put("/api/courier-statuses/{id}", 1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Success"))
                .andExpect(jsonPath("$.data.id").value(1))
                .andExpect(jsonPath("$.data.name").value("updated_status"));
    }

    @Test
    public void testUpdateCourierStatus_Failure_NotFound() throws Exception {
        ApiCourierStatusDTO update = new ApiCourierStatusDTO(0, "ghost_status");

        mockMvc.perform(put("/api/courier-statuses/{id}", 999999)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isNotFound());
    }

    // ==================== DELETE /api/courier-statuses/{id} ====================

    @Test
    public void testDeleteCourierStatus_Success() throws Exception {
        // Create a fresh courier status to safely delete
        ApiCourierStatusDTO statusDTO = new ApiCourierStatusDTO(0, "to_be_deleted");

        MvcResult createResult = mockMvc.perform(post("/api/courier-statuses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(statusDTO)))
                .andExpect(status().isCreated())
                .andReturn();

        int id = JsonPath.read(createResult.getResponse().getContentAsString(), "$.data.id");

        mockMvc.perform(delete("/api/courier-statuses/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Success"));
    }

    @Test
    public void testDeleteCourierStatus_Failure_NotFound() throws Exception {
        mockMvc.perform(delete("/api/courier-statuses/{id}", 999999))
                .andExpect(status().isNotFound());
    }
}
