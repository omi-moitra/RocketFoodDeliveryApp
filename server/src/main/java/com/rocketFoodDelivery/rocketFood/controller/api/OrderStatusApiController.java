package com.rocketFoodDelivery.rocketFood.controller.api;

import com.rocketFoodDelivery.rocketFood.dtos.orderStatus.ApiOrderStatusCrudDTO;
import com.rocketFoodDelivery.rocketFood.dtos.orderStatus.ApiOrderStatusDTO;
import com.rocketFoodDelivery.rocketFood.exception.BadRequestException;
import com.rocketFoodDelivery.rocketFood.exception.ResourceNotFoundException;
import com.rocketFoodDelivery.rocketFood.service.OrderStatusService;
import com.rocketFoodDelivery.rocketFood.util.ResponseBuilder;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
public class OrderStatusApiController {
    private final OrderStatusService orderStatusService;

    public OrderStatusApiController(OrderStatusService orderStatusService) {
        this.orderStatusService = orderStatusService;
    }

    // --- Update an order's status ---
    @PostMapping("/api/order/{order_id}/status")
    public ResponseEntity<Object> updateOrderStatus(@PathVariable("order_id") int orderId, @RequestBody ApiOrderStatusDTO statusDTO) {
        if (statusDTO.getStatus() == null || statusDTO.getStatus().isBlank()) {
            throw new BadRequestException("Status is required");
        }
        ApiOrderStatusDTO response = orderStatusService.updateOrderStatusForOrder(orderId, statusDTO.getStatus())
                .orElseThrow(() -> new BadRequestException("Invalid order id or status: " + statusDTO.getStatus()));
        return ResponseBuilder.buildOkResponse(response);
    }

    // --- CRUD for order_statuses table ---
    @GetMapping("/api/order-statuses")
    public ResponseEntity<Object> getAllOrderStatuses() {
        return ResponseBuilder.buildOkResponse(orderStatusService.getAllOrderStatusDTOs());
    }

    @GetMapping("/api/order-statuses/{id}")
    public ResponseEntity<Object> getOrderStatusById(@PathVariable int id) {
        ApiOrderStatusCrudDTO dto = orderStatusService.getOrderStatusDTOById(id)
                .orElseThrow(() -> new ResourceNotFoundException(String.format("Order status with id %d not found", id)));
        return ResponseBuilder.buildOkResponse(dto);
    }

    @PostMapping("/api/order-statuses")
    public ResponseEntity<Object> createOrderStatus(@RequestBody ApiOrderStatusCrudDTO statusDTO) {
        return ResponseBuilder.buildCreatedResponse(orderStatusService.createOrderStatusDTO(statusDTO));
    }

    @PutMapping("/api/order-statuses/{id}")
    public ResponseEntity<Object> updateOrderStatusEntity(@PathVariable int id, @RequestBody ApiOrderStatusCrudDTO statusDTO) {
        ApiOrderStatusCrudDTO updated = orderStatusService.updateOrderStatusDTO(id, statusDTO)
                .orElseThrow(() -> new ResourceNotFoundException(String.format("Order status with id %d not found", id)));
        return ResponseBuilder.buildOkResponse(updated);
    }

    @DeleteMapping("/api/order-statuses/{id}")
    public ResponseEntity<Object> deleteOrderStatus(@PathVariable int id) {
        if (!orderStatusService.deleteOrderStatusIfExists(id))
            throw new ResourceNotFoundException(String.format("Order status with id %d not found", id));
        return ResponseBuilder.buildOkResponse(null);
    }
}
