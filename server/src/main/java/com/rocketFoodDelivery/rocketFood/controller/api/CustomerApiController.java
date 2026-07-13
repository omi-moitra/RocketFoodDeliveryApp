package com.rocketFoodDelivery.rocketFood.controller.api;

import com.rocketFoodDelivery.rocketFood.dtos.customer.ApiCustomerDTO;
import com.rocketFoodDelivery.rocketFood.exception.ResourceNotFoundException;
import com.rocketFoodDelivery.rocketFood.service.CustomerService;
import com.rocketFoodDelivery.rocketFood.util.ResponseBuilder;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
public class CustomerApiController {
    private final CustomerService customerService;

    public CustomerApiController(CustomerService customerService) {
        this.customerService = customerService;
    }

    @GetMapping("/api/customers")
    public ResponseEntity<Object> getAllCustomers() {
        return ResponseBuilder.buildOkResponse(customerService.getAllCustomerDTOs());
    }

    @GetMapping("/api/customers/{id}")
    public ResponseEntity<Object> getCustomerById(@PathVariable int id) {
        ApiCustomerDTO dto = customerService.getCustomerDTOById(id)
                .orElseThrow(() -> new ResourceNotFoundException(String.format("Customer with id %d not found", id)));
        return ResponseBuilder.buildOkResponse(dto);
    }

    @PostMapping("/api/customers")
    public ResponseEntity<Object> createCustomer(@RequestBody ApiCustomerDTO customerDTO) {
        return ResponseBuilder.buildCreatedResponse(customerService.createCustomer(customerDTO));
    }

    @PutMapping("/api/customers/{id}")
    public ResponseEntity<Object> updateCustomer(@PathVariable int id, @RequestBody ApiCustomerDTO customerDTO) {
        ApiCustomerDTO updated = customerService.updateCustomer(id, customerDTO)
                .orElseThrow(() -> new ResourceNotFoundException(String.format("Customer with id %d not found", id)));
        return ResponseBuilder.buildOkResponse(updated);
    }

    @DeleteMapping("/api/customers/{id}")
    public ResponseEntity<Object> deleteCustomer(@PathVariable int id) {
        if (!customerService.deleteCustomerIfExists(id))
            throw new ResourceNotFoundException(String.format("Customer with id %d not found", id));
        return ResponseBuilder.buildOkResponse(null);
    }
}
