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
import com.rocketFoodDelivery.rocketFood.models.Customer;
import com.rocketFoodDelivery.rocketFood.models.User;

// Project DTOs
import com.rocketFoodDelivery.rocketFood.dtos.customer.ApiCustomerDTO;

// Project repositories
import com.rocketFoodDelivery.rocketFood.repository.CustomerRepository;

@Service       
public class CustomerService {

    @Autowired
    private CustomerRepository customerRepository;

    // Constructor
    public CustomerService(CustomerRepository customerRepository){
        this.customerRepository = customerRepository;
    }

    // ==================== JPA CRUD Service Methods ====================

    // CREATE / UPDATE - Save entity using JPA
    public Customer saveCustomer(Customer customer) {
        return customerRepository.save(customer);
    }

    // READ - Find all customers using JPA
    public List<Customer> findAllCustomers() {
        return customerRepository.findAll();
    }

    // READ - Find a customer by ID using JPA
    public Optional<Customer> findCustomerById(int id) {
        return customerRepository.findById(id);
    }

    // READ - Find a customer by user ID using native SQL
    public Optional<Customer> findCustomerByUserId(int userId) {
        return customerRepository.findCustomerByUserId(userId);
    }

    // DELETE - Delete a customer by ID using JPA
    public void deleteCustomerById(int id) {
        customerRepository.deleteById(id);
    }

    // ==================== DTO-Based Service Methods ====================

    public List<ApiCustomerDTO> getAllCustomerDTOs() {
        List<Customer> customers = this.findAllCustomers();
        List<ApiCustomerDTO> dtos = new ArrayList<>();
        for (Customer c : customers) {
            dtos.add(mapCustomerToDTO(c));
        }
        return dtos;
    }

    public Optional<ApiCustomerDTO> getCustomerDTOById(int id) {
        return this.findCustomerById(id).map(this::mapCustomerToDTO);
    }

    @Transactional
    public ApiCustomerDTO createCustomer(ApiCustomerDTO dto) {
        Customer customer = new Customer();
        customer.setUser(User.builder().id(dto.getUserId()).build());
        customer.setAddress(Address.builder().id(dto.getAddressId()).build());
        customer.setPhone(dto.getPhone());
        customer.setEmail(dto.getEmail());
        customer.setActive(dto.isActive());
        Customer saved = this.saveCustomer(customer);
        dto.setId(saved.getId());
        return dto;
    }

    @Transactional
    public Optional<ApiCustomerDTO> updateCustomer(int id, ApiCustomerDTO dto) {
        Optional<Customer> existing = this.findCustomerById(id);
        if (existing.isEmpty()) return Optional.empty();
        Customer customer = existing.get();
        customer.setUser(User.builder().id(dto.getUserId()).build());
        customer.setAddress(Address.builder().id(dto.getAddressId()).build());
        customer.setPhone(dto.getPhone());
        customer.setEmail(dto.getEmail());
        customer.setActive(dto.isActive());
        this.saveCustomer(customer);
        dto.setId(id);
        return Optional.of(dto);
    }

    @Transactional
    public boolean deleteCustomerIfExists(int id) {
        Optional<Customer> existing = this.findCustomerById(id);
        if (existing.isEmpty()) return false;
        this.deleteCustomerById(id);
        return true;
    }

    private ApiCustomerDTO mapCustomerToDTO(Customer customer) {
        ApiCustomerDTO dto = new ApiCustomerDTO();
        dto.setId(customer.getId());
        dto.setUserId(customer.getUser() != null ? customer.getUser().getId() : 0);
        dto.setAddressId(customer.getAddress() != null ? customer.getAddress().getId() : 0);
        dto.setPhone(customer.getPhone());
        dto.setEmail(customer.getEmail());
        dto.setActive(customer.getActive());
        return dto;
    }
}
