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
import com.rocketFoodDelivery.rocketFood.models.Order;

// Repository interface that provides CRUD operations for database access
@Repository
public interface OrderRepository extends JpaRepository<Order, Integer> {
    // Spring Data JPA automatically implements CRUD operations inherited from JpaRepository.
    // save(), findAll(), findById(), deleteById()

    // ==================== Native SQL CRUD Queries ====================

    // CREATE - Insert a new order
    @Modifying
    @Transactional
    @Query(value = """
            INSERT INTO orders (restaurant_id, customer_id, order_status_id, restaurant_rating)
            VALUES (:restaurantId, :customerId, :orderStatusId, :restaurantRating)
            """, nativeQuery = true)
    void saveOrder(@Param("restaurantId") int restaurantId, @Param("customerId") int customerId, @Param("orderStatusId") int orderStatusId, @Param("restaurantRating") Integer restaurantRating);

    // READ - Find all orders
    @Query(value = """
            SELECT *
            FROM orders
            """, nativeQuery = true)
    List<Order> findAllOrders();

    // READ - Find order by ID
    @Query(value = """
            SELECT *
            FROM orders
            WHERE id = :id
            """, nativeQuery = true)
    Optional<Order> findOrderById(@Param("id") int id);

    // READ - Find orders by restaurant ID
    @Query(value = """            
            SELECT * FROM orders WHERE restaurant_id = :restaurantId
            """, nativeQuery = true)
    List<Order> findOrdersByRestaurantId(@Param("restaurantId") int restaurantId);

    // UPDATE - Update an order by ID
    @Modifying
    @Transactional
    @Query(value = """
            UPDATE orders
            SET restaurant_id = :restaurantId, customer_id = :customerId,
                order_status_id = :orderStatusId, restaurant_rating = :restaurantRating
            WHERE id = :id
            """, nativeQuery = true)
    void updateOrder(@Param("id") int id, @Param("restaurantId") int restaurantId, @Param("customerId") int customerId, @Param("orderStatusId") int orderStatusId, @Param("restaurantRating") Integer restaurantRating);

    // READ - Find orders by customer ID
    @Query(value = """
            SELECT * FROM orders WHERE customer_id = :customerId
            """, nativeQuery = true)
    List<Order> findOrdersByCustomerId(@Param("customerId") int customerId);

    // READ - Find orders by courier ID
    @Query(value = """
            SELECT * FROM orders WHERE courier_id = :courierId
            """, nativeQuery = true)
    List<Order> findOrdersByCourierId(@Param("courierId") int courierId);

    // READ - Find all pending orders (order_status_id = 1 / not yet assigned)
    @Query(value = """
            SELECT * FROM orders WHERE order_status_id = 1
            """, nativeQuery = true)
    List<Order> findPendingOrders();

    // READ - Find orders by courier (via order_status matching courier assignments)
    // Note: orders table doesn't have courier_id directly; courier is assigned at delivery
    // This returns orders where the courier delivered them (joined through a subquery)

    // READ - Get the last inserted order ID
    @Query(value = """
            SELECT LAST_INSERT_ID() AS id
            """, nativeQuery = true)
    int getLastInsertedId();

    // UPDATE - Update only order status
    @Modifying
    @Transactional
    @Query(value = """
            UPDATE orders SET order_status_id = :orderStatusId WHERE id = :id
            """, nativeQuery = true)
    void updateOrderStatus(@Param("id") int id, @Param("orderStatusId") int orderStatusId);

    // DELETE - Delete an order by ID
    @Modifying
    @Transactional
    @Query(value = """
            DELETE FROM orders
            WHERE id = :id
            """, nativeQuery = true)
    int deleteOrderById(@Param("id") int id);
}
