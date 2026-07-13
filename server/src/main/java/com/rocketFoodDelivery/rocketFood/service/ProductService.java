package com.rocketFoodDelivery.rocketFood.service;

// Java standard library
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

// Spring Framework
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// Project models
import com.rocketFoodDelivery.rocketFood.models.Product;
import com.rocketFoodDelivery.rocketFood.models.Restaurant;

// Project DTOs
import com.rocketFoodDelivery.rocketFood.dtos.product.ApiCreateProductDTO;
import com.rocketFoodDelivery.rocketFood.dtos.product.ApiProductDTO;

// Project repositories
import com.rocketFoodDelivery.rocketFood.repository.ProductRepository;

@Service       
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    // Constructor
    public ProductService(ProductRepository productRepository){
        this.productRepository = productRepository;
    }

    // ==================== JPA CRUD Service Methods ====================

    // CREATE / UPDATE - Save entity using JPA
    public Product saveProduct(Product product) {
        return productRepository.save(product);
    }

    // READ - Find all products using JPA
    public List<Product> findAllProducts() {
        return productRepository.findAll();
    }

    // READ - Find a product by ID using JPA
    public Optional<Product> findProductById(int id) {
        return productRepository.findById(id);
    }

    // READ - Find products by restaurant ID using native SQL
    public List<Product> findProductsByRestaurantId(int restaurantId) {
        return productRepository.findProductsByRestaurantId(restaurantId);
    }

    // DELETE - Delete a product by ID using JPA
    public void deleteProductById(int id) {
        productRepository.deleteById(id);
    }

    // ==================== DTO-Based Service Methods ====================

    public List<ApiProductDTO> getProductDTOs(Integer restaurantId) {
        List<Product> products;
        if (restaurantId != null) {
            products = this.findProductsByRestaurantId(restaurantId);
        } else {
            products = this.findAllProducts();
        }
        List<ApiProductDTO> dtos = new ArrayList<>();
        for (Product p : products) {
            dtos.add(mapProductToDTO(p));
        }
        return dtos;
    }

    public Optional<ApiProductDTO> getProductDTOById(int id) {
        return this.findProductById(id).map(this::mapProductToDTO);
    }

    @Transactional
    public ApiProductDTO createProduct(ApiCreateProductDTO dto) {
        Product product = new Product();
        product.setRestaurant(Restaurant.builder().id(dto.getRestaurantId()).build());
        product.setName(dto.getName());
        product.setDescription(dto.getDescription());
        product.setCost(dto.getCost());
        Product saved = this.saveProduct(product);
        return mapProductToDTO(saved);
    }

    @Transactional
    public Optional<ApiProductDTO> updateProduct(int id, ApiCreateProductDTO dto) {
        Optional<Product> existing = this.findProductById(id);
        if (existing.isEmpty()) return Optional.empty();
        Product product = existing.get();
        product.setRestaurant(Restaurant.builder().id(dto.getRestaurantId()).build());
        product.setName(dto.getName());
        product.setDescription(dto.getDescription());
        product.setCost(dto.getCost());
        this.saveProduct(product);
        ApiProductDTO response = new ApiProductDTO();
        response.setId(id);
        response.setRestaurantId(dto.getRestaurantId());
        response.setName(dto.getName());
        response.setDescription(dto.getDescription());
        response.setCost(dto.getCost());
        return Optional.of(response);
    }

    @Transactional
    public boolean deleteProductIfExists(int id) {
        Optional<Product> existing = this.findProductById(id);
        if (existing.isEmpty()) return false;
        this.deleteProductById(id);
        return true;
    }

    private ApiProductDTO mapProductToDTO(Product product) {
        ApiProductDTO dto = new ApiProductDTO();
        dto.setId(product.getId());
        dto.setRestaurantId(product.getRestaurant() != null ? product.getRestaurant().getId() : 0);
        dto.setName(product.getName());
        dto.setDescription(product.getDescription());
        dto.setCost(product.getCost());
        return dto;
    }
}
