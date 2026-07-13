package com.rocketFoodDelivery.rocketFood.controller.api;

import com.rocketFoodDelivery.rocketFood.dtos.product.ApiCreateProductDTO;
import com.rocketFoodDelivery.rocketFood.dtos.product.ApiProductDTO;
import com.rocketFoodDelivery.rocketFood.exception.ResourceNotFoundException;
import com.rocketFoodDelivery.rocketFood.service.ProductService;
import com.rocketFoodDelivery.rocketFood.util.ResponseBuilder;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
public class ProductApiController {
    private final ProductService productService;

    public ProductApiController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping("/api/products")
    public ResponseEntity<Object> getProducts(@RequestParam(name = "restaurant", required = false) Integer restaurantId) {
        return ResponseBuilder.buildOkResponse(productService.getProductDTOs(restaurantId));
    }

    @GetMapping("/api/products/{id}")
    public ResponseEntity<Object> getProductById(@PathVariable int id) {
        ApiProductDTO dto = productService.getProductDTOById(id)
                .orElseThrow(() -> new ResourceNotFoundException(String.format("Product with id %d not found", id)));
        return ResponseBuilder.buildOkResponse(dto);
    }

    @PostMapping("/api/products")
    public ResponseEntity<Object> createProduct(@RequestBody ApiCreateProductDTO productDTO) {
        return ResponseBuilder.buildCreatedResponse(productService.createProduct(productDTO));
    }

    @PutMapping("/api/products/{id}")
    public ResponseEntity<Object> updateProduct(@PathVariable int id, @RequestBody ApiCreateProductDTO productDTO) {
        ApiProductDTO updated = productService.updateProduct(id, productDTO)
                .orElseThrow(() -> new ResourceNotFoundException(String.format("Product with id %d not found", id)));
        return ResponseBuilder.buildOkResponse(updated);
    }

    @DeleteMapping("/api/products/{id}")
    public ResponseEntity<Object> deleteProduct(@PathVariable int id) {
        if (!productService.deleteProductIfExists(id))
            throw new ResourceNotFoundException(String.format("Product with id %d not found", id));
        return ResponseBuilder.buildOkResponse(null);
    }
}
