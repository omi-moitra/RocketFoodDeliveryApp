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
import com.rocketFoodDelivery.rocketFood.models.Courier;
import com.rocketFoodDelivery.rocketFood.models.Customer;
import com.rocketFoodDelivery.rocketFood.models.Employee;
import com.rocketFoodDelivery.rocketFood.models.User;

// Project DTOs
import com.rocketFoodDelivery.rocketFood.dtos.user.ApiAccountDTO;
import com.rocketFoodDelivery.rocketFood.dtos.user.ApiCreateUserDTO;
import com.rocketFoodDelivery.rocketFood.dtos.user.ApiUpdateAccountDTO;
import com.rocketFoodDelivery.rocketFood.dtos.user.ApiUserDTO;

// Project repositories
import com.rocketFoodDelivery.rocketFood.repository.UserRepository;

@Service       
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CourierService courierService;

    @Autowired
    private CustomerService customerService;

    @Autowired
    private EmployeeService employeeService;

    // Constructor
    public UserService(UserRepository userRepository){
        this.userRepository = userRepository;
    }

    // ==================== JPA CRUD Service Methods ====================

    // CREATE / UPDATE - Save entity using JPA
    public User saveUser(User user) {
        return userRepository.save(user);
    }

    // READ - Find all users using JPA
    public List<User> findAllUsers() {
        return userRepository.findAll();
    }

    // READ - Find a user by ID using JPA
    public Optional<User> findUserById(int id) {
        return userRepository.findById(id);
    }

    // DELETE - Delete a user by ID using JPA
    public void deleteUserById(int id) {
        userRepository.deleteById(id);
    }

    // ==================== DTO-Based Service Methods ====================

    public List<ApiUserDTO> getAllUserDTOs() {
        List<User> users = this.findAllUsers();
        List<ApiUserDTO> dtos = new ArrayList<>();
        for (User u : users) {
            dtos.add(mapUserToDTO(u));
        }
        return dtos;
    }

    public Optional<ApiUserDTO> getUserDTOById(int id) {
        return this.findUserById(id).map(this::mapUserToDTO);
    }

    @Transactional
    public ApiUserDTO createUser(ApiCreateUserDTO dto) {
        User user = new User();
        user.setName(dto.getName());
        user.setEmail(dto.getEmail());
        user.setPassword(dto.getPassword());
        User saved = this.saveUser(user);
        ApiUserDTO response = new ApiUserDTO();
        response.setId(saved.getId());
        response.setName(saved.getName());
        response.setEmail(saved.getEmail());
        return response;
    }

    @Transactional
    public Optional<ApiUserDTO> updateUser(int id, ApiCreateUserDTO dto) {
        Optional<User> existing = this.findUserById(id);
        if (existing.isEmpty()) return Optional.empty();
        User user = existing.get();
        user.setName(dto.getName());
        user.setEmail(dto.getEmail());
        user.setPassword(dto.getPassword());
        this.saveUser(user);
        ApiUserDTO response = new ApiUserDTO();
        response.setId(id);
        response.setName(dto.getName());
        response.setEmail(dto.getEmail());
        return Optional.of(response);
    }

    @Transactional
    public boolean deleteUserIfExists(int id) {
        Optional<User> existing = this.findUserById(id);
        if (existing.isEmpty()) return false;
        this.deleteUserById(id);
        return true;
    }

    private ApiUserDTO mapUserToDTO(User user) {
        ApiUserDTO dto = new ApiUserDTO();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        return dto;
    }

    public Optional<ApiAccountDTO> getAccountDTO(int userId) {
        Optional<User> userOpt = this.findUserById(userId);
        if (userOpt.isEmpty()) return Optional.empty();
        User user = userOpt.get();

        ApiAccountDTO dto = new ApiAccountDTO();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());

        customerService.findCustomerByUserId(userId).ifPresent(c -> {
            ApiAccountDTO.RoleDetail detail = new ApiAccountDTO.RoleDetail();
            detail.setId(c.getId());
            detail.setPhone(c.getPhone());
            detail.setEmail(c.getEmail());
            if (c.getAddress() != null) detail.setAddress(c.getAddress().getStreetAddress());
            dto.setCustomer(detail);
        });

        courierService.findCourierByUserId(userId).ifPresent(c -> {
            ApiAccountDTO.RoleDetail detail = new ApiAccountDTO.RoleDetail();
            detail.setId(c.getId());
            detail.setPhone(c.getPhone());
            detail.setEmail(c.getEmail());
            if (c.getAddress() != null) detail.setAddress(c.getAddress().getStreetAddress());
            dto.setCourier(detail);
        });

        employeeService.findEmployeeByUserId(userId).ifPresent(e -> {
            ApiAccountDTO.RoleDetail detail = new ApiAccountDTO.RoleDetail();
            detail.setId(e.getId());
            detail.setPhone(e.getPhone());
            detail.setEmail(e.getEmail());
            if (e.getAddress() != null) detail.setAddress(e.getAddress().getStreetAddress());
            dto.setEmployee(detail);
        });

        return Optional.of(dto);
    }

    @Transactional
    public Optional<ApiAccountDTO> updateAccount(int userId, String type, ApiUpdateAccountDTO updateDTO) {
        Optional<User> userOpt = this.findUserById(userId);
        if (userOpt.isEmpty()) return Optional.empty();

        switch (type) {
            case "customer" -> {
                Optional<Customer> opt = customerService.findCustomerByUserId(userId);
                if (opt.isEmpty()) return Optional.empty();
                Customer c = opt.get();
                if (updateDTO.getEmail() != null) c.setEmail(updateDTO.getEmail());
                if (updateDTO.getPhone() != null) c.setPhone(updateDTO.getPhone());
                customerService.saveCustomer(c);
            }
            case "courier" -> {
                Optional<Courier> opt = courierService.findCourierByUserId(userId);
                if (opt.isEmpty()) return Optional.empty();
                Courier c = opt.get();
                if (updateDTO.getEmail() != null) c.setEmail(updateDTO.getEmail());
                if (updateDTO.getPhone() != null) c.setPhone(updateDTO.getPhone());
                courierService.saveCourier(c);
            }
            case "employee" -> {
                Optional<Employee> opt = employeeService.findEmployeeByUserId(userId);
                if (opt.isEmpty()) return Optional.empty();
                Employee e = opt.get();
                if (updateDTO.getEmail() != null) e.setEmail(updateDTO.getEmail());
                if (updateDTO.getPhone() != null) e.setPhone(updateDTO.getPhone());
                employeeService.saveEmployee(e);
            }
            default -> {
                return Optional.empty();
            }
        }

        return getAccountDTO(userId);
    }
}