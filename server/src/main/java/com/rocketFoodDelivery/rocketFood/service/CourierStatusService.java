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
import com.rocketFoodDelivery.rocketFood.models.CourierStatus;

// Project DTOs
import com.rocketFoodDelivery.rocketFood.dtos.courierStatus.ApiCourierStatusDTO;

// Project repositories
import com.rocketFoodDelivery.rocketFood.repository.CourierStatusRepository;

@Service       
public class CourierStatusService {

    @Autowired
    private CourierStatusRepository courierStatusRepository;

    // Constructor
    public CourierStatusService(CourierStatusRepository courierStatusRepository){
        this.courierStatusRepository = courierStatusRepository;
    }

    // ==================== JPA CRUD Service Methods ====================

    // CREATE / UPDATE - Save entity using JPA
    public CourierStatus saveCourierStatus(CourierStatus courierStatus) {
        return courierStatusRepository.save(courierStatus);
    }

    // READ - Find all courier statuses using JPA
    public List<CourierStatus> findAllCourierStatuses() {
        return courierStatusRepository.findAll();
    }

    // READ - Find a courier status by ID using JPA
    public Optional<CourierStatus> findCourierStatusById(int id) {
        return courierStatusRepository.findById(id);
    }

    // DELETE - Delete a courier status by ID using JPA
    public void deleteCourierStatusById(int id) {
        courierStatusRepository.deleteById(id);
    }

    // ==================== DTO-Based Service Methods ====================

    public List<ApiCourierStatusDTO> getAllCourierStatusDTOs() {
        List<CourierStatus> statuses = this.findAllCourierStatuses();
        List<ApiCourierStatusDTO> dtos = new ArrayList<>();
        for (CourierStatus s : statuses) {
            dtos.add(mapCourierStatusToDTO(s));
        }
        return dtos;
    }

    public Optional<ApiCourierStatusDTO> getCourierStatusDTOById(int id) {
        return this.findCourierStatusById(id).map(this::mapCourierStatusToDTO);
    }

    @Transactional
    public ApiCourierStatusDTO createCourierStatusDTO(ApiCourierStatusDTO dto) {
        CourierStatus courierStatus = new CourierStatus();
        courierStatus.setName(dto.getName());
        CourierStatus saved = this.saveCourierStatus(courierStatus);
        dto.setId(saved.getId());
        return dto;
    }

    @Transactional
    public Optional<ApiCourierStatusDTO> updateCourierStatusDTO(int id, ApiCourierStatusDTO dto) {
        Optional<CourierStatus> existing = this.findCourierStatusById(id);
        if (existing.isEmpty()) return Optional.empty();
        CourierStatus courierStatus = existing.get();
        courierStatus.setName(dto.getName());
        this.saveCourierStatus(courierStatus);
        dto.setId(id);
        return Optional.of(dto);
    }

    @Transactional
    public boolean deleteCourierStatusIfExists(int id) {
        Optional<CourierStatus> existing = this.findCourierStatusById(id);
        if (existing.isEmpty()) return false;
        this.deleteCourierStatusById(id);
        return true;
    }

    private ApiCourierStatusDTO mapCourierStatusToDTO(CourierStatus status) {
        ApiCourierStatusDTO dto = new ApiCourierStatusDTO();
        dto.setId(status.getId());
        dto.setName(status.getName());
        return dto;
    }
}
