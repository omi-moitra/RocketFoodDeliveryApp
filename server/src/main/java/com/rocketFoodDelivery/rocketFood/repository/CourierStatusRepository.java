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
import com.rocketFoodDelivery.rocketFood.models.CourierStatus;

// Repository interface that provides CRUD operations for database access
@Repository
public interface CourierStatusRepository extends JpaRepository<CourierStatus, Integer> {
    // Spring Data JPA automatically implements CRUD operations inherited from JpaRepository.
    // save(), findAll(), findById(), deleteById()

    // ==================== Native SQL CRUD Queries ====================

    // CREATE - Insert a new courier status
    @Modifying
    @Transactional
    @Query(value = """
            INSERT INTO courier_statuses (name)
            VALUES (:name)
            """, nativeQuery = true)
    void saveCourierStatus(@Param("name") String name);

    // READ - Find all courier statuses
    @Query(value = """
            SELECT *
            FROM courier_statuses
            """, nativeQuery = true)
    List<CourierStatus> findAllCourierStatuses();

    // READ - Find courier status by ID
    @Query(value = """
            SELECT *
            FROM courier_statuses
            WHERE id = :id
            """, nativeQuery = true)
    Optional<CourierStatus> findCourierStatusById(@Param("id") int id);

    // UPDATE - Update a courier status by ID
    @Modifying
    @Transactional
    @Query(value = """
            UPDATE courier_statuses
            SET name = :name
            WHERE id = :id
            """, nativeQuery = true)
    void updateCourierStatus(@Param("id") int id, @Param("name") String name);

    // DELETE - Delete a courier status by ID
    @Modifying
    @Transactional
    @Query(value = """
            DELETE FROM courier_statuses
            WHERE id = :id
            """, nativeQuery = true)
    int deleteCourierStatusById(@Param("id") int id);
}
