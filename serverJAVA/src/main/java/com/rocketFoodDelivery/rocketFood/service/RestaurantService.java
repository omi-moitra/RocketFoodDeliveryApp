package com.rocketFoodDelivery.rocketFood.service;

// Java standard library
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

// Spring Framework
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// Project models
import com.rocketFoodDelivery.rocketFood.models.Address;
import com.rocketFoodDelivery.rocketFood.models.Restaurant;
import com.rocketFoodDelivery.rocketFood.models.User;

// Project DTOs
import com.rocketFoodDelivery.rocketFood.dtos.restaurant.ApiCreateRestaurantDTO;
import com.rocketFoodDelivery.rocketFood.dtos.restaurant.ApiRestaurantDTO;
import com.rocketFoodDelivery.rocketFood.dtos.address.ApiAddressDTO;

// Project repositories
import com.rocketFoodDelivery.rocketFood.repository.AddressRepository;
import com.rocketFoodDelivery.rocketFood.repository.RestaurantRepository;

@Service       
public class RestaurantService {

    @Autowired
    private RestaurantRepository restaurantRepository;

    @Autowired
    private AddressRepository addressRepository;

    // Constructor
    public RestaurantService(RestaurantRepository restaurantRepository, AddressRepository addressRepository){
        this.restaurantRepository = restaurantRepository;
        this.addressRepository = addressRepository;
    }

    // ==================== JPA CRUD Service Methods ====================

    // CREATE / UPDATE - Save entity using JPA
    public Restaurant saveRestaurant(Restaurant restaurant) {
        return restaurantRepository.save(restaurant);
    }

    // READ - Find all restaurants using JPA
    public List<Restaurant> findAllRestaurants() {
        return restaurantRepository.findAll();
    }

    // READ - Find a restaurant by ID using JPA
    public Optional<Restaurant> findRestaurantById(int id) {
        return restaurantRepository.findById(id);
    }

    // READ - Find a restaurant with average rating by ID using native SQL
    public List<Object[]> findRestaurantWithAverageRatingById(int restaurantId) {
        return restaurantRepository.findRestaurantWithAverageRatingById(restaurantId);
    }

    // READ - Find restaurants by rating and price range using native SQL
    public List<Object[]> findRestaurantsByRatingAndPriceRange(Integer rating, Integer priceRange) {
        return restaurantRepository.findRestaurantsByRatingAndPriceRange(rating, priceRange);
    }

    // DELETE - Delete a restaurant by ID using JPA
    public void deleteRestaurantById(int id) {
        restaurantRepository.deleteById(id);
    }

    // ==================== DTO-Based Service Methods (used by API controller) ====================

    // DELETE - Delete a restaurant by ID, return true if found
    @Transactional
    public boolean deleteRestaurantIfExists(int id) {
        Optional<Restaurant> existing = this.findRestaurantById(id);
        if (existing.isEmpty()) return false;
        this.deleteRestaurantById(id);
        return true;
    }

    // CREATE - Save address + restaurant, return populated DTO
    @Transactional
    public Optional<ApiCreateRestaurantDTO> createRestaurant(ApiCreateRestaurantDTO dto) {
        ApiAddressDTO addr = dto.getAddress();
        if (addr == null) return Optional.empty();

        Address address = new Address();
        address.setStreetAddress(addr.getStreetAddress());
        address.setCity(addr.getCity());
        address.setPostalCode(addr.getPostalCode());
        Address savedAddress = addressRepository.save(address);
        int addressId = savedAddress.getId();

        Restaurant restaurant = new Restaurant();
        restaurant.setUser(User.builder().id(dto.getUserId()).build());
        restaurant.setAddress(Address.builder().id(addressId).build());
        restaurant.setName(dto.getName());
        restaurant.setPriceRange(dto.getPriceRange());
        restaurant.setPhone(dto.getPhone());
        restaurant.setEmail(dto.getEmail());
        Restaurant saved = this.saveRestaurant(restaurant);

        dto.setId(saved.getId());
        addr.setId(addressId);
        return Optional.of(dto);
    }

    // UPDATE - Update address + restaurant, return populated DTO
    @Transactional
    public Optional<ApiCreateRestaurantDTO> updateRestaurant(int id, ApiCreateRestaurantDTO dto) {
        Optional<Restaurant> existing = this.findRestaurantById(id);
        if (existing.isEmpty()) return Optional.empty();

        Restaurant restaurant = existing.get();
        int addressId = restaurant.getAddress().getId();

        ApiAddressDTO addr = dto.getAddress();
        if (addr != null) {
            Address address = addressRepository.findById(addressId).orElse(new Address());
            address.setStreetAddress(addr.getStreetAddress());
            address.setCity(addr.getCity());
            address.setPostalCode(addr.getPostalCode());
            addressRepository.save(address);
            addr.setId(addressId);
        }

        if (dto.getUserId() != 0) {
            restaurant.setUser(User.builder().id(dto.getUserId()).build());
        }
        if (dto.getName() != null) restaurant.setName(dto.getName());
        if (dto.getPriceRange() != 0) restaurant.setPriceRange(dto.getPriceRange());
        if (dto.getPhone() != null) restaurant.setPhone(dto.getPhone());
        if (dto.getEmail() != null) restaurant.setEmail(dto.getEmail());
        this.saveRestaurant(restaurant);

        dto.setId(id);
        return Optional.of(dto);
    }

    // ==================== DTO-Based Read Methods (used by API controller) ====================

    // READ - Get restaurant with average rating as DTO
    public Optional<ApiRestaurantDTO> getRestaurantWithRating(int id) {
        List<Object[]> rows = this.findRestaurantWithAverageRatingById(id);
        if (rows.isEmpty()) return Optional.empty();
        return Optional.of(mapRowToRestaurantDTO(rows.get(0)));
    }

    // READ - Get restaurants filtered by rating and price range as DTOs
    public List<ApiRestaurantDTO> getRestaurantsByRatingAndPriceRange(Integer rating, Integer priceRange) {
        List<Object[]> rows = this.findRestaurantsByRatingAndPriceRange(rating, priceRange);
        List<ApiRestaurantDTO> dtos = new ArrayList<>();
        for (Object[] row : rows) {
            dtos.add(mapRowToRestaurantDTO(row));
        }
        return dtos;
    }

    private ApiRestaurantDTO mapRowToRestaurantDTO(Object[] row) {
        ApiRestaurantDTO dto = new ApiRestaurantDTO();
        dto.setId(((Number) row[0]).intValue());
        dto.setName((String) row[1]);
        dto.setPriceRange(((Number) row[2]).intValue());
        dto.setRating(((Number) row[3]).intValue());
        return dto;
    }
}