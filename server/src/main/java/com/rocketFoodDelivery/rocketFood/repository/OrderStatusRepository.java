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
import com.rocketFoodDelivery.rocketFood.models.OrderStatus;

// Repository interface that provides CRUD operations for database access
@Repository
public interface OrderStatusRepository extends JpaRepository<OrderStatus, Integer> {
    // Spring Data JPA automatically implements CRUD operations inherited from JpaRepository.
    // save(), findAll(), findById(), deleteById()

    // ==================== Native SQL CRUD Queries ====================

    // CREATE - Insert a new order status
    @Modifying
    @Transactional
    @Query(value = """
            INSERT INTO order_statuses (name)
            VALUES (:name)
            """, nativeQuery = true)
    void saveOrderStatus(@Param("name") String name);

    // READ - Find all order statuses
    @Query(value = """
            SELECT *
            FROM order_statuses
            """, nativeQuery = true)
    List<OrderStatus> findAllOrderStatuses();

    // READ - Find order status by ID
    @Query(value = """
            SELECT *
            FROM order_statuses
            WHERE id = :id
            """, nativeQuery = true)
    Optional<OrderStatus> findOrderStatusById(@Param("id") int id);

    // READ - Find order status by name
    @Query(value = """
            SELECT *
            FROM order_statuses
            WHERE name = :name
            """, nativeQuery = true)
    Optional<OrderStatus> findOrderStatusByName(@Param("name") String name);

    // UPDATE - Update an order status by ID
    @Modifying
    @Transactional
    @Query(value = """
            UPDATE order_statuses
            SET name = :name
            WHERE id = :id
            """, nativeQuery = true)
    void updateOrderStatus(@Param("id") int id, @Param("name") String name);

    // DELETE - Delete an order status by ID
    @Modifying
    @Transactional
    @Query(value = """
            DELETE FROM order_statuses
            WHERE id = :id
            """, nativeQuery = true)
    int deleteOrderStatusById(@Param("id") int id);
}
