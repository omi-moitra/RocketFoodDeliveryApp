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
import com.rocketFoodDelivery.rocketFood.models.Order;
import com.rocketFoodDelivery.rocketFood.models.Product;
import com.rocketFoodDelivery.rocketFood.models.ProductOrder;

// Project DTOs
import com.rocketFoodDelivery.rocketFood.dtos.productOrder.ApiProductOrderDTO;

// Project repositories
import com.rocketFoodDelivery.rocketFood.repository.ProductOrderRepository;

@Service       
public class ProductOrderService {

    @Autowired
    private ProductOrderRepository productOrderRepository;

    // Constructor
    public ProductOrderService(ProductOrderRepository productOrderRepository){
        this.productOrderRepository = productOrderRepository;
    }

    // ==================== JPA CRUD Service Methods ====================

    // CREATE / UPDATE - Save entity using JPA
    public ProductOrder saveProductOrder(ProductOrder productOrder) {
        return productOrderRepository.save(productOrder);
    }

    // READ - Find all product orders using JPA
    public List<ProductOrder> findAllProductOrders() {
        return productOrderRepository.findAll();
    }

    // READ - Find a product order by ID using JPA
    public Optional<ProductOrder> findProductOrderById(int id) {
        return productOrderRepository.findById(id);
    }

    // DELETE - Delete a product order by ID using JPA
    public void deleteProductOrderById(int id) {
        productOrderRepository.deleteById(id);
    }

    // DELETE - Delete product orders by order ID using native SQL
    @Transactional
    public void deleteProductOrdersByOrderId(int orderId) {
        productOrderRepository.deleteProductOrdersByOrderId(orderId);
    }

    // ==================== Custom Business Logic Methods ====================

    // CREATE - Insert a new product order with business rule validation
    // Business Rule 1: Cannot create two product_orders with the same product_id for the same order.
    // Business Rule 2: Each product_order must belong to the same restaurant as the associated order.
    @Transactional
    public ProductOrder createProductOrder(int productId, int orderId, int productQuantity, int productUnitCost) {
        validateBusinessRules(0, productId, orderId);
        ProductOrder po = new ProductOrder();
        po.setProduct(Product.builder().id(productId).build());
        po.setOrder(Order.builder().id(orderId).build());
        po.setProductQuantity(productQuantity);
        po.setProductUnitCost(productUnitCost);
        return this.saveProductOrder(po);
    }

    // UPDATE - Update a product order with business rule validation
    // Business Rule 1: Cannot create two product_orders with the same product_id for the same order.
    // Business Rule 2: Each product_order must belong to the same restaurant as the associated order.
    @Transactional
    public void updateProductOrder(int id, int productId, int orderId, int productQuantity, int productUnitCost) {
        validateBusinessRules(id, productId, orderId);
        ProductOrder po = this.findProductOrderById(id)
                .orElseThrow(() -> new IllegalArgumentException("Product order not found"));
        po.setProduct(Product.builder().id(productId).build());
        po.setOrder(Order.builder().id(orderId).build());
        po.setProductQuantity(productQuantity);
        po.setProductUnitCost(productUnitCost);
        this.saveProductOrder(po);
    }

    // Validate business rules for product orders
    private void validateBusinessRules(int excludeId, int productId, int orderId) {
        // Rule 1: Check for duplicate product in the same order
        int duplicateCount = productOrderRepository.countDuplicateProductOrder(productId, orderId, excludeId);
        if (duplicateCount > 0) {
            throw new IllegalArgumentException("Cannot create two product_orders with the same product_id for the same order.");
        }

        // Rule 2: Product must belong to the same restaurant as the order
        Integer productRestaurantId = productOrderRepository.findRestaurantIdByProductId(productId);
        Integer orderRestaurantId = productOrderRepository.findRestaurantIdByOrderId(orderId);
        if (productRestaurantId == null || orderRestaurantId == null || !productRestaurantId.equals(orderRestaurantId)) {
            throw new IllegalArgumentException("Each product_order must belong to the same restaurant as the associated order.");
        }
    }

    // ==================== DTO-Based Service Methods ====================

    public List<ApiProductOrderDTO> getAllProductOrderDTOs() {
        List<ProductOrder> productOrders = this.findAllProductOrders();
        List<ApiProductOrderDTO> dtos = new ArrayList<>();
        for (ProductOrder po : productOrders) {
            dtos.add(mapProductOrderToDTO(po));
        }
        return dtos;
    }

    public Optional<ApiProductOrderDTO> getProductOrderDTOById(int id) {
        return this.findProductOrderById(id).map(this::mapProductOrderToDTO);
    }

    @Transactional
    public ApiProductOrderDTO createProductOrder(ApiProductOrderDTO dto) {
        ProductOrder saved = this.createProductOrder(dto.getProductId(), dto.getOrderId(),
                dto.getProductQuantity(), dto.getProductUnitCost());
        dto.setId(saved.getId());
        return dto;
    }

    @Transactional
    public Optional<ApiProductOrderDTO> updateProductOrder(int id, ApiProductOrderDTO dto) {
        Optional<ProductOrder> existing = this.findProductOrderById(id);
        if (existing.isEmpty()) return Optional.empty();
        this.updateProductOrder(id, dto.getProductId(), dto.getOrderId(),
                dto.getProductQuantity(), dto.getProductUnitCost());
        dto.setId(id);
        return Optional.of(dto);
    }

    @Transactional
    public boolean deleteProductOrderIfExists(int id) {
        Optional<ProductOrder> existing = this.findProductOrderById(id);
        if (existing.isEmpty()) return false;
        this.deleteProductOrderById(id);
        return true;
    }

    private ApiProductOrderDTO mapProductOrderToDTO(ProductOrder po) {
        ApiProductOrderDTO dto = new ApiProductOrderDTO();
        dto.setId(po.getId());
        dto.setProductId(po.getProduct() != null ? po.getProduct().getId() : 0);
        dto.setOrderId(po.getOrder() != null ? po.getOrder().getId() : 0);
        dto.setProductQuantity(po.getProductQuantity());
        dto.setProductUnitCost(po.getProductUnitCost());
        return dto;
    }
}
