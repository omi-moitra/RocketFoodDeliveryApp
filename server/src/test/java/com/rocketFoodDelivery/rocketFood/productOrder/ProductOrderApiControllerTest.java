package com.rocketFoodDelivery.rocketFood.productOrder;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.JsonPath;
import com.rocketFoodDelivery.rocketFood.dtos.order.ApiCreateOrderDTO;
import com.rocketFoodDelivery.rocketFood.dtos.product.ApiCreateProductDTO;
import com.rocketFoodDelivery.rocketFood.dtos.productOrder.ApiProductOrderDTO;

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
public class ProductOrderApiControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    // ==================== GET /api/product-orders ====================

    @Test
    public void testGetAllProductOrders_Success() throws Exception {
        mockMvc.perform(get("/api/product-orders"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Success"))
                .andExpect(jsonPath("$.data").isArray());
    }

    // ==================== GET /api/product-orders/{id} ====================

    @Test
    public void testGetProductOrderById_Success() throws Exception {
        mockMvc.perform(get("/api/product-orders/{id}", 1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Success"))
                .andExpect(jsonPath("$.data.id").value(1));
    }

    @Test
    public void testGetProductOrderById_Failure_NotFound() throws Exception {
        mockMvc.perform(get("/api/product-orders/{id}", 999999))
                .andExpect(status().isNotFound());
    }

    // ==================== POST /api/product-orders ====================

    /**
     * Creates a fresh order for restaurant 1 with product 1, plus a fresh product
     * for restaurant 1 that is NOT in the order. Returns [freshProductId, freshOrderId].
     */
    private int[] createFreshOrderAndProduct() throws Exception {
        // Create a fresh product belonging to restaurant 1
        ApiCreateProductDTO productDTO = new ApiCreateProductDTO(1, "PO Test Product", "For PO testing", 200);
        MvcResult productResult = mockMvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(productDTO)))
                .andExpect(status().isCreated())
                .andReturn();
        int freshProductId = JsonPath.read(productResult.getResponse().getContentAsString(), "$.data.id");

        // Create a fresh order for restaurant 1 with product 1 (known to be restaurant 1)
        ApiCreateOrderDTO orderRequest = new ApiCreateOrderDTO();
        orderRequest.setRestaurantId(1);
        orderRequest.setCustomerId(1);
        ApiCreateOrderDTO.ProductItem item = new ApiCreateOrderDTO.ProductItem();
        item.setId(1);
        item.setQuantity(1);
        orderRequest.setProducts(List.of(item));

        MvcResult orderResult = mockMvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(orderRequest)))
                .andExpect(status().isCreated())
                .andReturn();
        int freshOrderId = JsonPath.read(orderResult.getResponse().getContentAsString(), "$.data.id");

        return new int[]{freshProductId, freshOrderId};
    }

    @Test
    public void testCreateProductOrder_Success() throws Exception {
        int[] ids = createFreshOrderAndProduct();
        int freshProductId = ids[0];
        int freshOrderId = ids[1];

        ApiProductOrderDTO poDTO = new ApiProductOrderDTO(0, freshProductId, freshOrderId, 3, 500);

        mockMvc.perform(post("/api/product-orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(poDTO)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message").value("Success"))
                .andExpect(jsonPath("$.data.product_quantity").value(3))
                .andExpect(jsonPath("$.data.product_unit_cost").value(500));
    }

    @Test
    public void testCreateProductOrder_Failure_InvalidData() throws Exception {
        // Product and order from different restaurants should fail
        ApiProductOrderDTO poDTO = new ApiProductOrderDTO(0, 999999, 999999, 1, 100);

        mockMvc.perform(post("/api/product-orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(poDTO)))
                .andExpect(status().isBadRequest());
    }

    // ==================== PUT /api/product-orders/{id} ====================

    @Test
    public void testUpdateProductOrder_Success() throws Exception {
        // Create fresh data and a product order to update
        int[] ids = createFreshOrderAndProduct();
        int freshProductId = ids[0];
        int freshOrderId = ids[1];

        ApiProductOrderDTO createDTO = new ApiProductOrderDTO(0, freshProductId, freshOrderId, 1, 100);
        MvcResult createResult = mockMvc.perform(post("/api/product-orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createDTO)))
                .andExpect(status().isCreated())
                .andReturn();
        int poId = JsonPath.read(createResult.getResponse().getContentAsString(), "$.data.id");

        // Update quantity and cost (keep same product/order to satisfy business rules)
        ApiProductOrderDTO update = new ApiProductOrderDTO(0, freshProductId, freshOrderId, 5, 600);

        mockMvc.perform(put("/api/product-orders/{id}", poId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Success"))
                .andExpect(jsonPath("$.data.id").value(poId))
                .andExpect(jsonPath("$.data.product_quantity").value(5));
    }

    @Test
    public void testUpdateProductOrder_Failure_NotFound() throws Exception {
        ApiProductOrderDTO update = new ApiProductOrderDTO(0, 1, 1, 1, 100);

        mockMvc.perform(put("/api/product-orders/{id}", 999999)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isNotFound());
    }

    // ==================== DELETE /api/product-orders/{id} ====================

    @Test
    public void testDeleteProductOrder_Success() throws Exception {
        // Create fresh data and a product order to delete
        int[] ids = createFreshOrderAndProduct();
        int freshProductId = ids[0];
        int freshOrderId = ids[1];

        ApiProductOrderDTO poDTO = new ApiProductOrderDTO(0, freshProductId, freshOrderId, 1, 100);

        MvcResult createResult = mockMvc.perform(post("/api/product-orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(poDTO)))
                .andExpect(status().isCreated())
                .andReturn();

        int id = JsonPath.read(createResult.getResponse().getContentAsString(), "$.data.id");

        mockMvc.perform(delete("/api/product-orders/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Success"));
    }

    @Test
    public void testDeleteProductOrder_Failure_NotFound() throws Exception {
        mockMvc.perform(delete("/api/product-orders/{id}", 999999))
                .andExpect(status().isNotFound());
    }
}
