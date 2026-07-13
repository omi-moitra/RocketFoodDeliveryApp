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
import com.rocketFoodDelivery.rocketFood.models.Courier;
import com.rocketFoodDelivery.rocketFood.models.CourierStatus;
import com.rocketFoodDelivery.rocketFood.models.User;

// Project DTOs
import com.rocketFoodDelivery.rocketFood.dtos.courier.ApiCourierDTO;

// Project repositories
import com.rocketFoodDelivery.rocketFood.repository.CourierRepository;

@Service       
public class CourierService {

    @Autowired
    private CourierRepository courierRepository;

    // Constructor
    public CourierService(CourierRepository courierRepository){
        this.courierRepository = courierRepository;
    }

    // ==================== JPA CRUD Service Methods ====================

    // CREATE / UPDATE - Save entity using JPA
    public Courier saveCourier(Courier courier) {
        return courierRepository.save(courier);
    }

    // READ - Find all couriers using JPA
    public List<Courier> findAllCouriers() {
        return courierRepository.findAll();
    }

    // READ - Find a courier by ID using JPA
    public Optional<Courier> findCourierById(int id) {
        return courierRepository.findById(id);
    }

    // READ - Find a courier by user ID using native SQL
    public Optional<Courier> findCourierByUserId(int userId) {
        return courierRepository.findCourierByUserId(userId);
    }

    // DELETE - Delete a courier by ID using JPA
    public void deleteCourierById(int id) {
        courierRepository.deleteById(id);
    }

    // ==================== DTO-Based Service Methods ====================

    public List<ApiCourierDTO> getAllCourierDTOs() {
        List<Courier> couriers = this.findAllCouriers();
        List<ApiCourierDTO> dtos = new ArrayList<>();
        for (Courier c : couriers) {
            dtos.add(mapCourierToDTO(c));
        }
        return dtos;
    }

    public Optional<ApiCourierDTO> getCourierDTOById(int id) {
        return this.findCourierById(id).map(this::mapCourierToDTO);
    }

    @Transactional
    public ApiCourierDTO createCourier(ApiCourierDTO dto) {
        Courier courier = new Courier();
        courier.setUser(User.builder().id(dto.getUserId()).build());
        courier.setAddress(Address.builder().id(dto.getAddressId()).build());
        courier.setCourierStatus(CourierStatus.builder().id(dto.getCourierStatusId()).build());
        courier.setPhone(dto.getPhone());
        courier.setEmail(dto.getEmail());
        courier.setActive(dto.isActive());
        Courier saved = this.saveCourier(courier);
        dto.setId(saved.getId());
        return dto;
    }

    @Transactional
    public Optional<ApiCourierDTO> updateCourier(int id, ApiCourierDTO dto) {
        Optional<Courier> existing = this.findCourierById(id);
        if (existing.isEmpty()) return Optional.empty();
        Courier courier = existing.get();
        courier.setUser(User.builder().id(dto.getUserId()).build());
        courier.setAddress(Address.builder().id(dto.getAddressId()).build());
        courier.setCourierStatus(CourierStatus.builder().id(dto.getCourierStatusId()).build());
        courier.setPhone(dto.getPhone());
        courier.setEmail(dto.getEmail());
        courier.setActive(dto.isActive());
        this.saveCourier(courier);
        dto.setId(id);
        return Optional.of(dto);
    }

    @Transactional
    public boolean deleteCourierIfExists(int id) {
        Optional<Courier> existing = this.findCourierById(id);
        if (existing.isEmpty()) return false;
        this.deleteCourierById(id);
        return true;
    }

    private ApiCourierDTO mapCourierToDTO(Courier courier) {
        ApiCourierDTO dto = new ApiCourierDTO();
        dto.setId(courier.getId());
        dto.setUserId(courier.getUser() != null ? courier.getUser().getId() : 0);
        dto.setAddressId(courier.getAddress() != null ? courier.getAddress().getId() : 0);
        dto.setCourierStatusId(courier.getCourierStatus() != null ? courier.getCourierStatus().getId() : 0);
        dto.setPhone(courier.getPhone());
        dto.setEmail(courier.getEmail());
        dto.setActive(courier.getActive());
        return dto;
    }
}
