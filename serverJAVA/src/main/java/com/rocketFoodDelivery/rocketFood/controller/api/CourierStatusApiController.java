package com.rocketFoodDelivery.rocketFood.controller.api;

import com.rocketFoodDelivery.rocketFood.dtos.courierStatus.ApiCourierStatusDTO;
import com.rocketFoodDelivery.rocketFood.exception.ResourceNotFoundException;
import com.rocketFoodDelivery.rocketFood.service.CourierStatusService;
import com.rocketFoodDelivery.rocketFood.util.ResponseBuilder;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
public class CourierStatusApiController {
    private final CourierStatusService courierStatusService;

    public CourierStatusApiController(CourierStatusService courierStatusService) {
        this.courierStatusService = courierStatusService;
    }

    @GetMapping("/api/courier-statuses")
    public ResponseEntity<Object> getAllCourierStatuses() {
        return ResponseBuilder.buildOkResponse(courierStatusService.getAllCourierStatusDTOs());
    }

    @GetMapping("/api/courier-statuses/{id}")
    public ResponseEntity<Object> getCourierStatusById(@PathVariable int id) {
        ApiCourierStatusDTO dto = courierStatusService.getCourierStatusDTOById(id)
                .orElseThrow(() -> new ResourceNotFoundException(String.format("Courier status with id %d not found", id)));
        return ResponseBuilder.buildOkResponse(dto);
    }

    @PostMapping("/api/courier-statuses")
    public ResponseEntity<Object> createCourierStatus(@RequestBody ApiCourierStatusDTO statusDTO) {
        return ResponseBuilder.buildCreatedResponse(courierStatusService.createCourierStatusDTO(statusDTO));
    }

    @PutMapping("/api/courier-statuses/{id}")
    public ResponseEntity<Object> updateCourierStatus(@PathVariable int id, @RequestBody ApiCourierStatusDTO statusDTO) {
        ApiCourierStatusDTO updated = courierStatusService.updateCourierStatusDTO(id, statusDTO)
                .orElseThrow(() -> new ResourceNotFoundException(String.format("Courier status with id %d not found", id)));
        return ResponseBuilder.buildOkResponse(updated);
    }

    @DeleteMapping("/api/courier-statuses/{id}")
    public ResponseEntity<Object> deleteCourierStatus(@PathVariable int id) {
        if (!courierStatusService.deleteCourierStatusIfExists(id))
            throw new ResourceNotFoundException(String.format("Courier status with id %d not found", id));
        return ResponseBuilder.buildOkResponse(null);
    }
}
