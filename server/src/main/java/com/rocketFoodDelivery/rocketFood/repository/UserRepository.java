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
import com.rocketFoodDelivery.rocketFood.models.User;

// Repository interface that provides CRUD operations for database access
@Repository
public interface UserRepository extends JpaRepository<User, Integer> {
    // Spring Data JPA automatically implements CRUD operations inherited from JpaRepository.
    // save(), findAll(), findById(), deleteById()

    // ==================== Native SQL CRUD Queries ====================

    // CREATE - Insert a new user
    @Modifying
    @Transactional
    @Query(value = """
            INSERT INTO users (name, email, password)
            VALUES (:name, :email, :password)
            """, nativeQuery = true)
    void saveUser(@Param("name") String name, @Param("email") String email, @Param("password") String password);

    // READ - Find all users
    @Query(value = """
            SELECT *
            FROM users
            """, nativeQuery = true)
    List<User> findAllUsers();

    // READ - Find user by ID
    @Query(value = """
            SELECT *
            FROM users
            WHERE id = :id
            """, nativeQuery = true)
    Optional<User> findUserById(@Param("id") int id);

    // READ - Find user by email
    @Query(value = """
            SELECT *
            FROM users
            WHERE email = :email
            """, nativeQuery = true)
    Optional<User> findUserByEmail(@Param("email") String email);

    // UPDATE - Update a user by ID
    @Modifying
    @Transactional
    @Query(value = """
            UPDATE users
            SET name = :name, email = :email, password = :password
            WHERE id = :id
            """, nativeQuery = true)
    void updateUser(@Param("id") int id, @Param("name") String name, @Param("email") String email, @Param("password") String password);

    // DELETE - Delete a user by ID
    @Modifying
    @Transactional
    @Query(value = """
            DELETE FROM users
            WHERE id = :id
            """, nativeQuery = true)
    int deleteUserById(@Param("id") int id);

    // READ - Get last auto-incremented ID
    @Query(value = """
            SELECT LAST_INSERT_ID()
            """, nativeQuery = true)
    int getLastInsertedId();
}
