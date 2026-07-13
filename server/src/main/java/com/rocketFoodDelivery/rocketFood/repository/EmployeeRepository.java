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
import com.rocketFoodDelivery.rocketFood.models.Employee;

// Repository interface that provides CRUD operations for database access
@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Integer> {
    // Spring Data JPA automatically implements CRUD operations inherited from JpaRepository.
    // save(), findAll(), findById(), deleteById()

    // ==================== Native SQL CRUD Queries ====================

    // CREATE - Insert a new employee
    @Modifying
    @Transactional
    @Query(value = """
            INSERT INTO employees (user_id, address_id, phone, email)
            VALUES (:userId, :addressId, :phone, :email)
            """, nativeQuery = true)
    void saveEmployee(@Param("userId") int userId, @Param("addressId") int addressId, @Param("phone") String phone, @Param("email") String email);

    // READ - Find all employees
    @Query(value = """
            SELECT *
            FROM employees
            """, nativeQuery = true)
    List<Employee> findAllEmployees();

    // READ - Find employee by ID
    @Query(value = """
            SELECT *
            FROM employees
            WHERE id = :id
            """, nativeQuery = true)
    Optional<Employee> findEmployeeById(@Param("id") int id);

    // UPDATE - Update an employee by ID
    @Modifying
    @Transactional
    @Query(value = """
            UPDATE employees
            SET user_id = :userId, address_id = :addressId, phone = :phone, email = :email
            WHERE id = :id
            """, nativeQuery = true)
    void updateEmployee(@Param("id") int id, @Param("userId") int userId, @Param("addressId") int addressId, @Param("phone") String phone, @Param("email") String email);

    // DELETE - Delete an employee by ID
    @Modifying
    @Transactional
    @Query(value = """
            DELETE FROM employees
            WHERE id = :id
            """, nativeQuery = true)
    int deleteEmployeeById(@Param("id") int id);

    // READ - Find employee by user ID
    @Query(value = """
            SELECT *
            FROM employees
            WHERE user_id = :userId
            """, nativeQuery = true)
    Optional<Employee> findEmployeeByUserId(@Param("userId") int userId);
}
