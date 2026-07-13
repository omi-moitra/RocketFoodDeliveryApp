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
import com.rocketFoodDelivery.rocketFood.models.Address;

// Repository interface that provides CRUD operations for database access
@Repository
public interface AddressRepository extends JpaRepository<Address, Integer> {
    // Spring Data JPA automatically implements CRUD operations inherited from JpaRepository.
    // save(), findAll(), findById(), deleteById()

    // ==================== Native SQL CRUD Queries ====================

    // CREATE - Insert a new address
    @Modifying
    @Transactional
    @Query(value = """
            INSERT INTO addresses (street_address, city, postal_code)
            VALUES (:streetAddress, :city, :postalCode)
            """, nativeQuery = true)
    void saveAddress(@Param("streetAddress") String streetAddress, @Param("city") String city, @Param("postalCode") String postalCode);

    // READ - Find all addresses
    @Query(value = """
            SELECT *
            FROM addresses
            """, nativeQuery = true)
    List<Address> findAllAddresses();

    // READ - Find address by ID
    @Query(value = """
            SELECT *
            FROM addresses
            WHERE id = :id
            """, nativeQuery = true)
    Optional<Address> findAddressById(@Param("id") int id);

    // UPDATE - Update an address by ID
    @Modifying
    @Transactional
    @Query(value = """
            UPDATE addresses
            SET street_address = :streetAddress, city = :city, postal_code = :postalCode
            WHERE id = :id
            """, nativeQuery = true)
    void updateAddress(@Param("id") int id, @Param("streetAddress") String streetAddress, @Param("city") String city, @Param("postalCode") String postalCode);

    // DELETE - Delete an address by ID
    @Modifying
    @Transactional
    @Query(value = """
            DELETE FROM addresses
            WHERE id = :id
            """, nativeQuery = true)
    int deleteAddressById(@Param("id") int id);

    // GET - Get the last inserted ID
    @Query(value = """
            SELECT LAST_INSERT_ID() AS id
            """, nativeQuery = true)
    int getLastInsertedId();
}