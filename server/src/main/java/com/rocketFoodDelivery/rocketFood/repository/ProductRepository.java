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
import com.rocketFoodDelivery.rocketFood.models.Product;

// Repository interface that provides CRUD operations for database access
@Repository
public interface ProductRepository extends JpaRepository<Product, Integer> {
    // Spring Data JPA automatically implements CRUD operations inherited from JpaRepository.
    // save(), findAll(), findById(), deleteById()

    // ==================== Native SQL CRUD Queries ====================

    // CREATE - Insert a new product
    @Modifying
    @Transactional
    @Query(value = """
            INSERT INTO products (restaurant_id, name, description, cost)
            VALUES (:restaurantId, :name, :description, :cost)
            """, nativeQuery = true)
    void saveProduct(@Param("restaurantId") int restaurantId, @Param("name") String name, @Param("description") String description, @Param("cost") int cost);

    // READ - Find all products
    @Query(value = """
            SELECT *
            FROM products
            """, nativeQuery = true)
    List<Product> findAllProducts();

    // READ - Find product by ID
    @Query(value = """
            SELECT *
            FROM products
            WHERE id = :id
            """, nativeQuery = true)
    Optional<Product> findProductById(@Param("id") int id);

    // READ - Find products by restaurant ID
    @Query(value = """
            SELECT *
            FROM products
            WHERE restaurant_id = :restaurantId
            """, nativeQuery = true)
    List<Product> findProductsByRestaurantId(@Param("restaurantId") int restaurantId);

    // UPDATE - Update a product by ID
    @Modifying
    @Transactional
    @Query(value = """
            UPDATE products
            SET restaurant_id = :restaurantId, name = :name, description = :description, cost = :cost
            WHERE id = :id
            """, nativeQuery = true)
    void updateProduct(@Param("id") int id, @Param("restaurantId") int restaurantId, @Param("name") String name, @Param("description") String description, @Param("cost") int cost);

    // DELETE - Delete a product by ID
    @Modifying
    @Transactional
    @Query(value = """
            DELETE FROM products
            WHERE id = :id
            """, nativeQuery = true)
    int deleteProductById(@Param("id") int id);

    // DELETE - Delete products by restaurant ID
    @Modifying
    @Transactional
    @Query(value = """
            DELETE FROM products WHERE restaurant_id = :restaurantId
            """, nativeQuery = true)
    void deleteProductsByRestaurantId(@Param("restaurantId") int restaurantId);
}
