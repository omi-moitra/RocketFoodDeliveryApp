package com.rocketFoodDelivery.rocketFood.controller.api;

import com.rocketFoodDelivery.rocketFood.dtos.courier.ApiCourierDTO;
import com.rocketFoodDelivery.rocketFood.exception.ResourceNotFoundException;
import com.rocketFoodDelivery.rocketFood.service.CourierService;
import com.rocketFoodDelivery.rocketFood.util.ResponseBuilder;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
public class CourierApiController {
    private final CourierService courierService;

    public CourierApiController(CourierService courierService) {
        this.courierService = courierService;
    }

    @GetMapping("/api/couriers")
    public ResponseEntity<Object> getAllCouriers() {
        return ResponseBuilder.buildOkResponse(courierService.getAllCourierDTOs());
    }

    @GetMapping("/api/couriers/{id}")
    public ResponseEntity<Object> getCourierById(@PathVariable int id) {
        ApiCourierDTO dto = courierService.getCourierDTOById(id)
                .orElseThrow(() -> new ResourceNotFoundException(String.format("Courier with id %d not found", id)));
        return ResponseBuilder.buildOkResponse(dto);
    }

    @PostMapping("/api/couriers")
    public ResponseEntity<Object> createCourier(@RequestBody ApiCourierDTO courierDTO) {
        return ResponseBuilder.buildCreatedResponse(courierService.createCourier(courierDTO));
    }

    @PutMapping("/api/couriers/{id}")
    public ResponseEntity<Object> updateCourier(@PathVariable int id, @RequestBody ApiCourierDTO courierDTO) {
        ApiCourierDTO updated = courierService.updateCourier(id, courierDTO)
                .orElseThrow(() -> new ResourceNotFoundException(String.format("Courier with id %d not found", id)));
        return ResponseBuilder.buildOkResponse(updated);
    }

    @DeleteMapping("/api/couriers/{id}")
    public ResponseEntity<Object> deleteCourier(@PathVariable int id) {
        if (!courierService.deleteCourierIfExists(id))
            throw new ResourceNotFoundException(String.format("Courier with id %d not found", id));
        return ResponseBuilder.buildOkResponse(null);
    }
}
