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
import com.rocketFoodDelivery.rocketFood.models.Customer;

// Repository interface that provides CRUD operations for database access
@Repository
public interface CustomerRepository extends JpaRepository<Customer, Integer> {
    // Spring Data JPA automatically implements CRUD operations inherited from JpaRepository.
    // save(), findAll(), findById(), deleteById()

    // ==================== Native SQL CRUD Queries ====================

    // CREATE - Insert a new customer
    @Modifying
    @Transactional
    @Query(value = """
            INSERT INTO customers (user_id, address_id, phone, email, active)
            VALUES (:userId, :addressId, :phone, :email, :active)
            """, nativeQuery = true)
    void saveCustomer(@Param("userId") int userId, @Param("addressId") int addressId, @Param("phone") String phone, @Param("email") String email, @Param("active") boolean active);

    // READ - Find all customers
    @Query(value = """
            SELECT *
            FROM customers
            """, nativeQuery = true)
    List<Customer> findAllCustomers();

    // READ - Find customer by ID
    @Query(value = """
            SELECT *
            FROM customers
            WHERE id = :id
            """, nativeQuery = true)
    Optional<Customer> findCustomerById(@Param("id") int id);

    // UPDATE - Update a customer by ID
    @Modifying
    @Transactional
    @Query(value = """
            UPDATE customers
            SET user_id = :userId, address_id = :addressId, phone = :phone, email = :email, active = :active
            WHERE id = :id
            """, nativeQuery = true)
    void updateCustomer(@Param("id") int id, @Param("userId") int userId, @Param("addressId") int addressId, @Param("phone") String phone, @Param("email") String email, @Param("active") boolean active);

    // READ - Find customer by user ID
    @Query(value = """
            SELECT *
            FROM customers
            WHERE user_id = :userId
            """, nativeQuery = true)
    Optional<Customer> findCustomerByUserId(@Param("userId") int userId);

    // DELETE - Delete a customer by ID
    @Modifying
    @Transactional
    @Query(value = """
            DELETE FROM customers
            WHERE id = :id
            """, nativeQuery = true)
    int deleteCustomerById(@Param("id") int id);
}
