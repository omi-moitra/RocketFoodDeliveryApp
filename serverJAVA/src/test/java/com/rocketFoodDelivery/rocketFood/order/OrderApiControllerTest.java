package com.rocketFoodDelivery.rocketFood.order;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.JsonPath;
import com.rocketFoodDelivery.rocketFood.dtos.order.ApiCreateOrderDTO;
import com.rocketFoodDelivery.rocketFood.dtos.order.ApiUpdateOrderDTO;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
public class OrderApiControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    // ==================== GET /api/orders ====================

    @Test
    public void testGetOrders_Success() throws Exception {
        mockMvc.perform(get("/api/orders")
                        .param("type", "customer")
                        .param("id", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    public void testGetOrders_Failure_InvalidType() throws Exception {
        mockMvc.perform(get("/api/orders")
                        .param("type", "invalid")
                        .param("id", "1"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Bad Request"));
    }

    // ==================== POST /api/orders ====================

    @Test
    public void testCreateOrder_Success() throws Exception {
        ApiCreateOrderDTO request = new ApiCreateOrderDTO();
        request.setRestaurantId(1);
        request.setCustomerId(1);
        ApiCreateOrderDTO.ProductItem item = new ApiCreateOrderDTO.ProductItem();
        item.setId(1);
        item.setQuantity(2);
        request.setProducts(List.of(item));

        mockMvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(new ObjectMapper().writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.id").exists())
                .andExpect(jsonPath("$.data.customer_id").exists())
                .andExpect(jsonPath("$.data.restaurant_id").exists())
                .andExpect(jsonPath("$.data.status").value("pending"))
                .andExpect(jsonPath("$.data.products").isArray())
                .andExpect(jsonPath("$.data.total_cost").isNumber());
    }

    @Test
    public void testCreateOrder_Failure_InvalidData() throws Exception {
        ApiCreateOrderDTO request = new ApiCreateOrderDTO();
        request.setRestaurantId(999999);
        request.setCustomerId(999999);
        request.setProducts(List.of());

        mockMvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(new ObjectMapper().writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Bad Request"));
    }

    // ==================== PUT /api/orders/{id} ====================

    @Test
    public void testUpdateOrder_Success() throws Exception {
        ApiUpdateOrderDTO update = new ApiUpdateOrderDTO(1, 1, 1, null);

        mockMvc.perform(put("/api/orders/{id}", 1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Success"))
                .andExpect(jsonPath("$.data.id").value(1));
    }

    @Test
    public void testUpdateOrder_Failure_NotFound() throws Exception {
        ApiUpdateOrderDTO update = new ApiUpdateOrderDTO(1, 1, 1, null);

        mockMvc.perform(put("/api/orders/{id}", 999999)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isNotFound());
    }

    // ==================== DELETE /api/orders/{id} ====================

    @Test
    public void testDeleteOrder_Success() throws Exception {
        // Create a fresh order to safely delete
        ApiCreateOrderDTO request = new ApiCreateOrderDTO();
        request.setRestaurantId(1);
        request.setCustomerId(1);
        ApiCreateOrderDTO.ProductItem item = new ApiCreateOrderDTO.ProductItem();
        item.setId(1);
        item.setQuantity(1);
        request.setProducts(List.of(item));

        MvcResult createResult = mockMvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();

        int id = JsonPath.read(createResult.getResponse().getContentAsString(), "$.data.id");

        mockMvc.perform(delete("/api/orders/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Success"));
    }

    @Test
    public void testDeleteOrder_Failure_NotFound() throws Exception {
        mockMvc.perform(delete("/api/orders/{id}", 999999))
                .andExpect(status().isNotFound());
    }
}
