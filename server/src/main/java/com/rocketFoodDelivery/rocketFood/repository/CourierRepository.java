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
import com.rocketFoodDelivery.rocketFood.models.Courier;

// Repository interface that provides CRUD operations for database access
@Repository
public interface CourierRepository extends JpaRepository<Courier, Integer> {
    // Spring Data JPA automatically implements CRUD operations inherited from JpaRepository.
    // save(), findAll(), findById(), deleteById()

    // ==================== Native SQL CRUD Queries ====================

    // CREATE - Insert a new courier
    @Modifying
    @Transactional
    @Query(value = """
            INSERT INTO couriers (user_id, address_id, courier_status_id, phone, email, active)
            VALUES (:userId, :addressId, :courierStatusId, :phone, :email, :active)
            """, nativeQuery = true)
    void saveCourier(@Param("userId") int userId, @Param("addressId") int addressId, @Param("courierStatusId") int courierStatusId, @Param("phone") String phone, @Param("email") String email, @Param("active") boolean active);

    // READ - Find all couriers
    @Query(value = """
            SELECT *
            FROM couriers
            """, nativeQuery = true)
    List<Courier> findAllCouriers();

    // READ - Find courier by ID
    @Query(value = """
            SELECT *
            FROM couriers
            WHERE id = :id
            """, nativeQuery = true)
    Optional<Courier> findCourierById(@Param("id") int id);

    // UPDATE - Update a courier by ID
    @Modifying
    @Transactional
    @Query(value = """
            UPDATE couriers
            SET user_id = :userId, address_id = :addressId, courier_status_id = :courierStatusId,
                phone = :phone, email = :email, active = :active
            WHERE id = :id
            """, nativeQuery = true)
    void updateCourier(@Param("id") int id, @Param("userId") int userId, @Param("addressId") int addressId, @Param("courierStatusId") int courierStatusId, @Param("phone") String phone, @Param("email") String email, @Param("active") boolean active);

    // READ - Find courier by user ID
    @Query(value = """
            SELECT *
            FROM couriers
            WHERE user_id = :userId
            """, nativeQuery = true)
    Optional<Courier> findCourierByUserId(@Param("userId") int userId);

    // DELETE - Delete a courier by ID
    @Modifying
    @Transactional
    @Query(value = """
            DELETE FROM couriers
            WHERE id = :id
            """, nativeQuery = true)
    int deleteCourierById(@Param("id") int id);
}
