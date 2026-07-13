package com.rocketFoodDelivery.rocketFood.controller.api;

import com.rocketFoodDelivery.rocketFood.dtos.productOrder.ApiProductOrderDTO;
import com.rocketFoodDelivery.rocketFood.exception.ResourceNotFoundException;
import com.rocketFoodDelivery.rocketFood.service.ProductOrderService;
import com.rocketFoodDelivery.rocketFood.util.ResponseBuilder;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
public class ProductOrderApiController {
    private final ProductOrderService productOrderService;

    public ProductOrderApiController(ProductOrderService productOrderService) {
        this.productOrderService = productOrderService;
    }

    @GetMapping("/api/product-orders")
    public ResponseEntity<Object> getAllProductOrders() {
        return ResponseBuilder.buildOkResponse(productOrderService.getAllProductOrderDTOs());
    }

    @GetMapping("/api/product-orders/{id}")
    public ResponseEntity<Object> getProductOrderById(@PathVariable int id) {
        ApiProductOrderDTO dto = productOrderService.getProductOrderDTOById(id)
                .orElseThrow(() -> new ResourceNotFoundException(String.format("Product order with id %d not found", id)));
        return ResponseBuilder.buildOkResponse(dto);
    }

    @PostMapping("/api/product-orders")
    public ResponseEntity<Object> createProductOrder(@RequestBody ApiProductOrderDTO productOrderDTO) {
        return ResponseBuilder.buildCreatedResponse(productOrderService.createProductOrder(productOrderDTO));
    }

    @PutMapping("/api/product-orders/{id}")
    public ResponseEntity<Object> updateProductOrder(@PathVariable int id, @RequestBody ApiProductOrderDTO productOrderDTO) {
        ApiProductOrderDTO updated = productOrderService.updateProductOrder(id, productOrderDTO)
                .orElseThrow(() -> new ResourceNotFoundException(String.format("Product order with id %d not found", id)));
        return ResponseBuilder.buildOkResponse(updated);
    }

    @DeleteMapping("/api/product-orders/{id}")
    public ResponseEntity<Object> deleteProductOrder(@PathVariable int id) {
        if (!productOrderService.deleteProductOrderIfExists(id))
            throw new ResourceNotFoundException(String.format("Product order with id %d not found", id));
        return ResponseBuilder.buildOkResponse(null);
    }
}
