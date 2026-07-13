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
import com.rocketFoodDelivery.rocketFood.models.Restaurant;

// Repository interface that provides CRUD operations for database access
@Repository
public interface RestaurantRepository extends JpaRepository<Restaurant, Integer> {
    // Spring Data JPA automatically implements CRUD operations inherited from JpaRepository.
    // save(), findAll(), findById(), deleteById()

    // ==================== Native SQL CRUD Queries ====================

    // CREATE - See saveRestaurant() native query below
    // UPDATE - See updateRestaurant() native query below

    // READ - Find restaurant with average rating by ID
    @Query(value = """
            SELECT r.id, r.name, r.price_range, COALESCE(CEIL(SUM(o.restaurant_rating) / NULLIF(COUNT(o.id), 0)), 0) AS rating
            FROM restaurants r
            LEFT JOIN orders o ON r.id = o.restaurant_id
            WHERE r.id = :restaurantId
            GROUP BY r.id
            """, nativeQuery = true)
    List<Object[]> findRestaurantWithAverageRatingById(@Param("restaurantId") int restaurantId);

    // READ - Find restaurants by rating and price range
    @Query(value = """
            SELECT * FROM (
            SELECT r.id, r.name, r.price_range, COALESCE(CEIL(SUM(o.restaurant_rating) / NULLIF(COUNT(o.id), 0)), 0) AS rating
            FROM restaurants r
            LEFT JOIN orders o ON r.id = o.restaurant_id
            WHERE (:priceRange IS NULL OR r.price_range = :priceRange)
            GROUP BY r.id
            ) AS result
            WHERE (:rating IS NULL OR result.rating = :rating)
            """, nativeQuery = true)
    List<Object[]> findRestaurantsByRatingAndPriceRange(@Param("rating") Integer rating, @Param("priceRange") Integer priceRange);

    // READ - Find all restaurants
    @Query(value = """
            SELECT *
            FROM restaurants
            """, nativeQuery = true)
    List<Restaurant> findAllRestaurants();

    // READ - Find restaurant by ID
    @Query(value = """
            SELECT *
            FROM restaurants
            WHERE id = :id
            """, nativeQuery = true)
    Optional<Restaurant> findRestaurantById(@Param("id") int id);

    // CREATE - Insert a new restaurant
    @Modifying
    @Transactional
    @Query(value = """
            INSERT INTO restaurants (user_id, address_id, name, price_range, phone, email) VALUES (:userId, :addressId, :name, :priceRange, :phone, :email)
            """, nativeQuery = true)
    void saveRestaurant(long userId, long addressId, String name, int priceRange, String phone, String email);

    // UPDATE - Update an existing restaurant
    @Modifying
    @Transactional
    @Query(value = """
            UPDATE restaurants
            SET user_id = :userId, address_id = :addressId, name = :name, price_range = :priceRange,
                phone = :phone, email = :email, active = :active
            WHERE id = :id
            """, nativeQuery = true)
    void updateRestaurant(@Param("id") int id, @Param("userId") int userId, @Param("addressId") int addressId, @Param("name") String name, @Param("priceRange") int priceRange, @Param("phone") String phone, @Param("email") String email, @Param("active") boolean active);

    // READ - Get the last inserted restaurant ID
    @Query(value = """
            SELECT LAST_INSERT_ID() AS id
            """, nativeQuery = true)
    int getLastInsertedId();

    // DELETE - Delete a restaurant by ID
    @Modifying
    @Transactional
    @Query(value = """
            DELETE FROM restaurants
            WHERE id = :id
            """, nativeQuery = true)
    int deleteRestaurantById(@Param("id") int id);
}