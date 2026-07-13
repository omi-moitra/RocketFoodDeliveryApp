package com.rocketFoodDelivery.rocketFood.orderStatus;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.JsonPath;
import com.rocketFoodDelivery.rocketFood.dtos.orderStatus.ApiOrderStatusCrudDTO;
import com.rocketFoodDelivery.rocketFood.dtos.orderStatus.ApiOrderStatusDTO;

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
public class OrderStatusApiControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    // ==================== POST /api/order/{order_id}/status ====================

    @Test
    public void testUpdateOrderStatus_Success() throws Exception {
        ApiOrderStatusDTO statusDTO = new ApiOrderStatusDTO();
        statusDTO.setStatus("in progress");

        mockMvc.perform(post("/api/order/{order_id}/status", 1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(statusDTO)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Success"))
                .andExpect(jsonPath("$.data.status").value("in progress"));
    }

    @Test
    public void testUpdateOrderStatus_Failure_InvalidStatus() throws Exception {
        ApiOrderStatusDTO statusDTO = new ApiOrderStatusDTO();
        statusDTO.setStatus("nonexistent_status");

        mockMvc.perform(post("/api/order/{order_id}/status", 1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(statusDTO)))
                .andExpect(status().isBadRequest());
    }

    @Test
    public void testUpdateOrderStatus_Failure_MissingStatus() throws Exception {
        mockMvc.perform(post("/api/order/{order_id}/status", 1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    // ==================== GET /api/order-statuses ====================

    @Test
    public void testGetAllOrderStatuses_Success() throws Exception {
        mockMvc.perform(get("/api/order-statuses"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Success"))
                .andExpect(jsonPath("$.data").isArray());
    }

    // ==================== GET /api/order-statuses/{id} ====================

    @Test
    public void testGetOrderStatusById_Success() throws Exception {
        mockMvc.perform(get("/api/order-statuses/{id}", 1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Success"))
                .andExpect(jsonPath("$.data.id").value(1));
    }

    @Test
    public void testGetOrderStatusById_Failure_NotFound() throws Exception {
        mockMvc.perform(get("/api/order-statuses/{id}", 999999))
                .andExpect(status().isNotFound());
    }

    // ==================== POST /api/order-statuses ====================

    @Test
    public void testCreateOrderStatus_Success() throws Exception {
        ApiOrderStatusCrudDTO statusDTO = new ApiOrderStatusCrudDTO(0, "test_order_status");

        mockMvc.perform(post("/api/order-statuses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(statusDTO)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message").value("Success"))
                .andExpect(jsonPath("$.data.name").value("test_order_status"));
    }

    @Test
    public void testCreateOrderStatus_Failure_InvalidData() throws Exception {
        mockMvc.perform(post("/api/order-statuses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    // ==================== PUT /api/order-statuses/{id} ====================

    @Test
    public void testUpdateOrderStatusEntity_Success() throws Exception {
        // Create a fresh entity to update (avoid modifying seeded "pending" status)
        ApiOrderStatusCrudDTO createDTO = new ApiOrderStatusCrudDTO(0, "to_be_updated_status");
        MvcResult createResult = mockMvc.perform(post("/api/order-statuses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createDTO)))
                .andExpect(status().isCreated())
                .andReturn();
        int statusId = JsonPath.read(createResult.getResponse().getContentAsString(), "$.data.id");

        ApiOrderStatusCrudDTO update = new ApiOrderStatusCrudDTO(0, "updated_order_status");

        mockMvc.perform(put("/api/order-statuses/{id}", statusId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Success"))
                .andExpect(jsonPath("$.data.id").value(statusId))
                .andExpect(jsonPath("$.data.name").value("updated_order_status"));
    }

    @Test
    public void testUpdateOrderStatusEntity_Failure_NotFound() throws Exception {
        ApiOrderStatusCrudDTO update = new ApiOrderStatusCrudDTO(0, "ghost_status");

        mockMvc.perform(put("/api/order-statuses/{id}", 999999)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isNotFound());
    }

    // ==================== DELETE /api/order-statuses/{id} ====================

    @Test
    public void testDeleteOrderStatus_Success() throws Exception {
        // Create a fresh order status to safely delete
        ApiOrderStatusCrudDTO statusDTO = new ApiOrderStatusCrudDTO(0, "to_be_deleted_os");

        MvcResult createResult = mockMvc.perform(post("/api/order-statuses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(statusDTO)))
                .andExpect(status().isCreated())
                .andReturn();

        int id = JsonPath.read(createResult.getResponse().getContentAsString(), "$.data.id");

        mockMvc.perform(delete("/api/order-statuses/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Success"));
    }

    @Test
    public void testDeleteOrderStatus_Failure_NotFound() throws Exception {
        mockMvc.perform(delete("/api/order-statuses/{id}", 999999))
                .andExpect(status().isNotFound());
    }
}
