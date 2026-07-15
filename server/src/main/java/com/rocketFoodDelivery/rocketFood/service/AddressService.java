package com.rocketFoodDelivery.rocketFood.service;

// Java standard library
import java.util.ArrayList;
import java.util.Set;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

// Spring Framework
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// Project models
import com.rocketFoodDelivery.rocketFood.models.Address;

// Project DTOs
import com.rocketFoodDelivery.rocketFood.dtos.address.ApiAddressDTO;

// Project repositories
import com.rocketFoodDelivery.rocketFood.repository.AddressRepository;
import com.rocketFoodDelivery.rocketFood.repository.RestaurantRepository;

@Service       
public class AddressService {

    @Autowired
    private AddressRepository addressRepository;

    @Autowired
    private RestaurantRepository restaurantRepository;

    // Constructor
    public AddressService(AddressRepository addressRepository, RestaurantRepository restaurantRepository){
        this.addressRepository = addressRepository;
        this.restaurantRepository = restaurantRepository;
    }

    // ==================== JPA CRUD Service Methods ====================

    // CREATE / UPDATE - Save entity using JPA
    public Address saveAddress(Address address) {
        return addressRepository.save(address);
    }

    // READ - Find all addresses using JPA
    public List<Address> findAllAddresses() {
        return addressRepository.findAll();
    }

    // READ - Find an address by ID using JPA
    public Optional<Address> findAddressById(int id) {
        return addressRepository.findById(id);
    }

    // DELETE - Delete an address by ID using JPA
    public void deleteAddressById(int id) {
        addressRepository.deleteById(id);
    }

    // ==================== Custom Business Logic Methods ====================

    // Find addresses not assigned to any restaurant
    public List<Address> findAvailableAddresses(Integer currentRestaurantId) {
        List<Address> allAddresses = addressRepository.findAll();
        Set<Integer> usedAddressIds = restaurantRepository.findAll().stream()
            .filter(restaurant -> restaurant.getAddress() != null)
            .filter(restaurant -> currentRestaurantId == null || restaurant.getId() != currentRestaurantId)
            .map(restaurant -> restaurant.getAddress().getId())
            .collect(Collectors.toSet());
        return allAddresses.stream()
            .filter(address -> !usedAddressIds.contains(address.getId()))
            .toList();
    }

    // ==================== DTO-Based Service Methods (used by API controller) ====================

    // READ - Get all addresses as DTOs
    public List<ApiAddressDTO> getAllAddressDTOs() {
        List<Address> addresses = this.findAllAddresses();
        List<ApiAddressDTO> dtos = new ArrayList<>();
        for (Address a : addresses) {
            dtos.add(mapAddressToDTO(a));
        }
        return dtos;
    }

    // READ - Get an address by ID as DTO
    public Optional<ApiAddressDTO> getAddressDTOById(int id) {
        Optional<Address> address = this.findAddressById(id);
        return address.map(this::mapAddressToDTO);
    }

    // CREATE - Create an address from DTO
    @Transactional
    public ApiAddressDTO createAddress(ApiAddressDTO dto) {
        Address address = new Address();
        address.setStreetAddress(dto.getStreetAddress());
        address.setCity(dto.getCity());
        address.setPostalCode(dto.getPostalCode());
        Address saved = this.saveAddress(address);
        dto.setId(saved.getId());
        return dto;
    }

    // UPDATE - Update an address from DTO
    @Transactional
    public Optional<ApiAddressDTO> updateAddress(int id, ApiAddressDTO dto) {
        Optional<Address> existing = this.findAddressById(id);
        if (existing.isEmpty()) return Optional.empty();
        Address address = existing.get();
        address.setStreetAddress(dto.getStreetAddress());
        address.setCity(dto.getCity());
        address.setPostalCode(dto.getPostalCode());
        this.saveAddress(address);
        dto.setId(id);
        return Optional.of(dto);
    }

    // DELETE - Delete an address by ID, return true if found
    @Transactional
    public boolean deleteAddressIfExists(int id) {
        Optional<Address> existing = this.findAddressById(id);
        if (existing.isEmpty()) return false;
        this.deleteAddressById(id);
        return true;
    }

    private ApiAddressDTO mapAddressToDTO(Address address) {
        ApiAddressDTO dto = new ApiAddressDTO();
        dto.setId(address.getId());
        dto.setStreetAddress(address.getStreetAddress());
        dto.setCity(address.getCity());
        dto.setPostalCode(address.getPostalCode());
        return dto;
    }
}