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
import com.rocketFoodDelivery.rocketFood.models.Employee;
import com.rocketFoodDelivery.rocketFood.models.User;

// Project DTOs
import com.rocketFoodDelivery.rocketFood.dtos.employee.ApiEmployeeDTO;

// Project repositories
import com.rocketFoodDelivery.rocketFood.repository.EmployeeRepository;

@Service       
public class EmployeeService {

    @Autowired
    private EmployeeRepository employeeRepository;

    // Constructor
    public EmployeeService(EmployeeRepository employeeRepository){
        this.employeeRepository = employeeRepository;
    }

    // ==================== JPA CRUD Service Methods ====================

    // CREATE / UPDATE - Save entity using JPA
    public Employee saveEmployee(Employee employee) {
        return employeeRepository.save(employee);
    }

    // READ - Find all employees using JPA
    public List<Employee> findAllEmployees() {
        return employeeRepository.findAll();
    }

    // READ - Find an employee by ID using JPA
    public Optional<Employee> findEmployeeById(int id) {
        return employeeRepository.findById(id);
    }

    // READ - Find an employee by user ID
    public Optional<Employee> findEmployeeByUserId(int userId) {
        return employeeRepository.findEmployeeByUserId(userId);
    }

    // DELETE - Delete an employee by ID using JPA
    public void deleteEmployeeById(int id) {
        employeeRepository.deleteById(id);
    }

    // ==================== DTO-Based Service Methods ====================

    public List<ApiEmployeeDTO> getAllEmployeeDTOs() {
        List<Employee> employees = this.findAllEmployees();
        List<ApiEmployeeDTO> dtos = new ArrayList<>();
        for (Employee e : employees) {
            dtos.add(mapEmployeeToDTO(e));
        }
        return dtos;
    }

    public Optional<ApiEmployeeDTO> getEmployeeDTOById(int id) {
        return this.findEmployeeById(id).map(this::mapEmployeeToDTO);
    }

    @Transactional
    public ApiEmployeeDTO createEmployee(ApiEmployeeDTO dto) {
        Employee employee = new Employee();
        employee.setUser(User.builder().id(dto.getUserId()).build());
        employee.setAddress(Address.builder().id(dto.getAddressId()).build());
        employee.setPhone(dto.getPhone());
        employee.setEmail(dto.getEmail());
        Employee saved = this.saveEmployee(employee);
        dto.setId(saved.getId());
        return dto;
    }

    @Transactional
    public Optional<ApiEmployeeDTO> updateEmployee(int id, ApiEmployeeDTO dto) {
        Optional<Employee> existing = this.findEmployeeById(id);
        if (existing.isEmpty()) return Optional.empty();
        Employee employee = existing.get();
        employee.setUser(User.builder().id(dto.getUserId()).build());
        employee.setAddress(Address.builder().id(dto.getAddressId()).build());
        employee.setPhone(dto.getPhone());
        employee.setEmail(dto.getEmail());
        this.saveEmployee(employee);
        dto.setId(id);
        return Optional.of(dto);
    }

    @Transactional
    public boolean deleteEmployeeIfExists(int id) {
        Optional<Employee> existing = this.findEmployeeById(id);
        if (existing.isEmpty()) return false;
        this.deleteEmployeeById(id);
        return true;
    }

    private ApiEmployeeDTO mapEmployeeToDTO(Employee employee) {
        ApiEmployeeDTO dto = new ApiEmployeeDTO();
        dto.setId(employee.getId());
        dto.setUserId(employee.getUser() != null ? employee.getUser().getId() : 0);
        dto.setAddressId(employee.getAddress() != null ? employee.getAddress().getId() : 0);
        dto.setPhone(employee.getPhone());
        dto.setEmail(employee.getEmail());
        return dto;
    }
}
