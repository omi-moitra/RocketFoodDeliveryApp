package com.rocketFoodDelivery.rocketFood.repository;

// Java standard library
import java.util.List;
import java.util.Optional;

// Spring Framework
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

// Project models
import com.rocketFoodDelivery.rocketFood.models.ProductOrder;

// Repository interface that provides CRUD operations for database access
@Repository
public interface ProductOrderRepository extends JpaRepository<ProductOrder, Integer> {
    // Spring Data JPA automatically implements CRUD operations inherited from JpaRepository.
    // save(), findAll(), findById(), deleteById()

    // ==================== Native SQL CRUD Queries ====================

    // CREATE - Insert a new product order
    @Modifying
    @Transactional
    @Query(value = """
            INSERT INTO product_orders (product_id, order_id, product_quantity, product_unit_cost)
            VALUES (:productId, :orderId, :productQuantity, :productUnitCost)
            """, nativeQuery = true)
    void saveProductOrder(@Param("productId") int productId, @Param("orderId") int orderId, @Param("productQuantity") int productQuantity, @Param("productUnitCost") int productUnitCost);

    // READ - Find all product orders
    @Query(value = """
            SELECT *
            FROM product_orders
            """, nativeQuery = true)
    List<ProductOrder> findAllProductOrders();

    // READ - Find product order by ID
    @Query(value = """
            SELECT *
            FROM product_orders
            WHERE id = :id
            """, nativeQuery = true)
    Optional<ProductOrder> findProductOrderById(@Param("id") int id);

    // UPDATE - Update a product order by ID
    @Modifying
    @Transactional
    @Query(value = """
            UPDATE product_orders
            SET product_id = :productId, order_id = :orderId,
                product_quantity = :productQuantity, product_unit_cost = :productUnitCost
            WHERE id = :id
            """, nativeQuery = true)
    void updateProductOrder(@Param("id") int id, @Param("productId") int productId, @Param("orderId") int orderId, @Param("productQuantity") int productQuantity, @Param("productUnitCost") int productUnitCost);

    // DELETE - Delete a product order by ID
    @Modifying
    @Transactional
    @Query(value = """
            DELETE FROM product_orders
            WHERE id = :id
            """, nativeQuery = true)
    int deleteProductOrderById(@Param("id") int id);

    // DELETE - Delete product orders by order ID
    @Modifying
    @Transactional
    @Query(value = """
            DELETE FROM product_orders WHERE order_id = :orderId
            """, nativeQuery = true)
    void deleteProductOrdersByOrderId(@Param("orderId") int orderId);

    // ==================== Native SQL Business Rule Helper Queries ====================

    // COUNT - Check for duplicate product in the same order (excluding a specific ID)
    @Query(value = """
            SELECT COUNT(*) FROM product_orders
            WHERE order_id = :orderId AND product_id = :productId AND id != :excludeId
            """, nativeQuery = true)
    int countDuplicateProductOrder(@Param("productId") int productId, @Param("orderId") int orderId, @Param("excludeId") int excludeId);

    // READ - Get restaurant_id from a product
    @Query(value = """
            SELECT restaurant_id FROM products WHERE id = :productId
            """, nativeQuery = true)
    Integer findRestaurantIdByProductId(@Param("productId") int productId);

    // READ - Get restaurant_id from an order
    @Query(value = """
            SELECT restaurant_id FROM orders WHERE id = :orderId
            """, nativeQuery = true)
    Integer findRestaurantIdByOrderId(@Param("orderId") int orderId);
}
