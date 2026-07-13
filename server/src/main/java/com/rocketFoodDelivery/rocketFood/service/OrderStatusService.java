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
import com.rocketFoodDelivery.rocketFood.models.Order;
import com.rocketFoodDelivery.rocketFood.models.OrderStatus;

// Project DTOs
import com.rocketFoodDelivery.rocketFood.dtos.orderStatus.ApiOrderStatusCrudDTO;
import com.rocketFoodDelivery.rocketFood.dtos.orderStatus.ApiOrderStatusDTO;

// Project repositories
import com.rocketFoodDelivery.rocketFood.repository.OrderRepository;
import com.rocketFoodDelivery.rocketFood.repository.OrderStatusRepository;

@Service       
public class OrderStatusService {

    @Autowired
    private OrderStatusRepository orderStatusRepository;

    @Autowired
    private OrderRepository orderRepository;

    // Constructor
    public OrderStatusService(OrderStatusRepository orderStatusRepository, OrderRepository orderRepository){
        this.orderStatusRepository = orderStatusRepository;
        this.orderRepository = orderRepository;
    }

    // ==================== JPA CRUD Service Methods ====================

    // CREATE / UPDATE - Save entity using JPA
    public OrderStatus saveOrderStatus(OrderStatus orderStatus) {
        return orderStatusRepository.save(orderStatus);
    }

    // READ - Find all order statuses using JPA
    public List<OrderStatus> findAllOrderStatuses() {
        return orderStatusRepository.findAll();
    }

    // READ - Find an order status by ID using JPA
    public Optional<OrderStatus> findOrderStatusById(int id) {
        return orderStatusRepository.findById(id);
    }

    // READ - Find an order status by name using native SQL
    public Optional<OrderStatus> findOrderStatusByName(String name) {
        return orderStatusRepository.findOrderStatusByName(name);
    }

    // DELETE - Delete an order status by ID using JPA
    public void deleteOrderStatusById(int id) {
        orderStatusRepository.deleteById(id);
    }

    // ==================== DTO-Based Service Methods ====================

    public List<ApiOrderStatusCrudDTO> getAllOrderStatusDTOs() {
        List<OrderStatus> statuses = this.findAllOrderStatuses();
        List<ApiOrderStatusCrudDTO> dtos = new ArrayList<>();
        for (OrderStatus s : statuses) {
            dtos.add(mapOrderStatusToDTO(s));
        }
        return dtos;
    }

    public Optional<ApiOrderStatusCrudDTO> getOrderStatusDTOById(int id) {
        return this.findOrderStatusById(id).map(this::mapOrderStatusToDTO);
    }

    @Transactional
    public ApiOrderStatusCrudDTO createOrderStatusDTO(ApiOrderStatusCrudDTO dto) {
        OrderStatus orderStatus = new OrderStatus();
        orderStatus.setName(dto.getName());
        OrderStatus saved = this.saveOrderStatus(orderStatus);
        dto.setId(saved.getId());
        return dto;
    }

    @Transactional
    public Optional<ApiOrderStatusCrudDTO> updateOrderStatusDTO(int id, ApiOrderStatusCrudDTO dto) {
        Optional<OrderStatus> existing = this.findOrderStatusById(id);
        if (existing.isEmpty()) return Optional.empty();
        OrderStatus orderStatus = existing.get();
        orderStatus.setName(dto.getName());
        this.saveOrderStatus(orderStatus);
        dto.setId(id);
        return Optional.of(dto);
    }

    @Transactional
    public boolean deleteOrderStatusIfExists(int id) {
        Optional<OrderStatus> existing = this.findOrderStatusById(id);
        if (existing.isEmpty()) return false;
        this.deleteOrderStatusById(id);
        return true;
    }

    @Transactional
    public Optional<ApiOrderStatusDTO> updateOrderStatusForOrder(int orderId, String statusName) {
        Optional<Order> order = orderRepository.findOrderById(orderId);
        if (order.isEmpty()) return Optional.empty();

        Optional<OrderStatus> status = this.findOrderStatusByName(statusName);
        if (status.isEmpty()) return Optional.empty();

        orderRepository.updateOrderStatus(orderId, status.get().getId());
        ApiOrderStatusDTO response = new ApiOrderStatusDTO();
        response.setStatus(status.get().getName());
        return Optional.of(response);
    }

    private ApiOrderStatusCrudDTO mapOrderStatusToDTO(OrderStatus status) {
        ApiOrderStatusCrudDTO dto = new ApiOrderStatusCrudDTO();
        dto.setId(status.getId());
        dto.setName(status.getName());
        return dto;
    }
}
