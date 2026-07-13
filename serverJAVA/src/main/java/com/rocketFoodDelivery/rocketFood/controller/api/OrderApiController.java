package com.rocketFoodDelivery.rocketFood.controller.api;

import com.rocketFoodDelivery.rocketFood.dtos.order.ApiAssignCourierDTO;
import com.rocketFoodDelivery.rocketFood.dtos.order.ApiCreateOrderDTO;
import com.rocketFoodDelivery.rocketFood.dtos.order.ApiOrderDTO;
import com.rocketFoodDelivery.rocketFood.dtos.order.ApiUpdateOrderDTO;
import com.rocketFoodDelivery.rocketFood.dtos.order.ApiUpdateRatingDTO;
import com.rocketFoodDelivery.rocketFood.exception.BadRequestException;
import com.rocketFoodDelivery.rocketFood.exception.ResourceNotFoundException;
import com.rocketFoodDelivery.rocketFood.service.OrderService;
import com.rocketFoodDelivery.rocketFood.util.ResponseBuilder;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
public class OrderApiController {
    private final OrderService orderService;

    public OrderApiController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping("/api/orders/pending")
    public ResponseEntity<Object> getPendingOrders() {
        List<ApiOrderDTO> dtos = orderService.getPendingOrderDTOs();
        return ResponseBuilder.buildOkResponse(dtos);
    }

    @GetMapping("/api/orders")
    public ResponseEntity<Object> getOrders(
            @RequestParam(name = "type") String type,
            @RequestParam(name = "id") int id) {
        if (!type.equals("customer") && !type.equals("courier") && !type.equals("restaurant")) {
            throw new BadRequestException("Type must be 'customer' or 'courier' or 'restaurant'");
        }
        List<ApiOrderDTO> dtos = orderService.getOrderDTOs(type, id);
        return ResponseBuilder.buildOkResponse(dtos);
    }

    @PostMapping("/api/orders")
    public ResponseEntity<Object> createOrder(@RequestBody ApiCreateOrderDTO createOrderDTO) {
        Optional<ApiOrderDTO> created = orderService.createOrder(createOrderDTO);
        if (created.isEmpty()) throw new BadRequestException("Invalid or missing parameters");
        return ResponseBuilder.buildCreatedResponse(created.get());
    }

    @PutMapping("/api/orders/{id}")
    public ResponseEntity<Object> updateOrder(@PathVariable int id, @RequestBody ApiUpdateOrderDTO updateDTO) {
        Optional<ApiOrderDTO> updated = orderService.updateOrderFromDTO(id, updateDTO);
        if (updated.isEmpty()) throw new ResourceNotFoundException(String.format("Order with id %d not found", id));
        return ResponseBuilder.buildOkResponse(updated.get());
    }

    @DeleteMapping("/api/orders/{id}")
    public ResponseEntity<Object> deleteOrder(@PathVariable int id) {
        boolean deleted = orderService.deleteOrderIfExists(id);
        if (!deleted) throw new ResourceNotFoundException(String.format("Order with id %d not found", id));
        return ResponseBuilder.buildOkResponse(null);
    }

    @PutMapping("/api/order/{id}/courier")
    public ResponseEntity<Object> assignCourier(@PathVariable int id, @RequestBody ApiAssignCourierDTO dto) {
        Optional<ApiOrderDTO> updated = orderService.assignCourier(id, dto);
        if (updated.isEmpty()) throw new ResourceNotFoundException(String.format("Order with id %d or courier not found", id));
        return ResponseBuilder.buildOkResponse(updated.get());
    }

    @PutMapping("/api/order/{id}/rating")
    public ResponseEntity<Object> updateRating(@PathVariable int id, @RequestBody ApiUpdateRatingDTO dto) {
        Optional<ApiOrderDTO> updated = orderService.updateRating(id, dto);
        if (updated.isEmpty()) throw new ResourceNotFoundException(String.format("Order with id %d not found", id));
        return ResponseBuilder.buildOkResponse(updated.get());
    }
}
