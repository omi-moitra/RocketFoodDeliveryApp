package com.rocketFoodDelivery.rocketFood.product;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.JsonPath;
import com.rocketFoodDelivery.rocketFood.dtos.product.ApiCreateProductDTO;

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
public class ProductApiControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    // ==================== GET /api/products ====================

    @Test
    public void testGetAllProducts_Success() throws Exception {
        mockMvc.perform(get("/api/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Success"))
                .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    public void testGetProductsByRestaurant_Success() throws Exception {
        mockMvc.perform(get("/api/products").param("restaurant", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Success"))
                .andExpect(jsonPath("$.data").isArray());
    }

    // ==================== GET /api/products/{id} ====================

    @Test
    public void testGetProductById_Success() throws Exception {
        mockMvc.perform(get("/api/products/{id}", 1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Success"))
                .andExpect(jsonPath("$.data.id").value(1));
    }

    @Test
    public void testGetProductById_Failure_NotFound() throws Exception {
        mockMvc.perform(get("/api/products/{id}", 999999))
                .andExpect(status().isNotFound());
    }

    // ==================== POST /api/products ====================

    @Test
    public void testCreateProduct_Success() throws Exception {
        ApiCreateProductDTO productDTO = new ApiCreateProductDTO(1, "Test Burger", "A delicious test burger", 1299);

        mockMvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(productDTO)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message").value("Success"))
                .andExpect(jsonPath("$.data.name").value("Test Burger"))
                .andExpect(jsonPath("$.data.cost").value(1299));
    }

    @Test
    public void testCreateProduct_Failure_MissingName() throws Exception {
        ApiCreateProductDTO productDTO = new ApiCreateProductDTO(1, null, "No name product", 500);

        mockMvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(productDTO)))
                .andExpect(status().isBadRequest());
    }

    // ==================== PUT /api/products/{id} ====================

    @Test
    public void testUpdateProduct_Success() throws Exception {
        ApiCreateProductDTO update = new ApiCreateProductDTO(1, "Updated Burger", "New description", 1499);

        mockMvc.perform(put("/api/products/{id}", 1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Success"))
                .andExpect(jsonPath("$.data.id").value(1))
                .andExpect(jsonPath("$.data.name").value("Updated Burger"))
                .andExpect(jsonPath("$.data.cost").value(1499));
    }

    @Test
    public void testUpdateProduct_Failure_NotFound() throws Exception {
        ApiCreateProductDTO update = new ApiCreateProductDTO(1, "Ghost Product", "Does not exist", 100);

        mockMvc.perform(put("/api/products/{id}", 999999)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isNotFound());
    }

    // ==================== DELETE /api/products/{id} ====================

    @Test
    public void testDeleteProduct_Success() throws Exception {
        // Create a fresh product to safely delete
        ApiCreateProductDTO productDTO = new ApiCreateProductDTO(1, "To Be Deleted Product", "Delete me", 999);

        MvcResult createResult = mockMvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(productDTO)))
                .andExpect(status().isCreated())
                .andReturn();

        int id = JsonPath.read(createResult.getResponse().getContentAsString(), "$.data.id");

        mockMvc.perform(delete("/api/products/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Success"));
    }

    @Test
    public void testDeleteProduct_Failure_NotFound() throws Exception {
        mockMvc.perform(delete("/api/products/{id}", 999999))
                .andExpect(status().isNotFound());
    }
}
