package com.rocketFoodDelivery.rocketFood.controller.api;

import com.rocketFoodDelivery.rocketFood.dtos.employee.ApiEmployeeDTO;
import com.rocketFoodDelivery.rocketFood.exception.ResourceNotFoundException;
import com.rocketFoodDelivery.rocketFood.service.EmployeeService;
import com.rocketFoodDelivery.rocketFood.util.ResponseBuilder;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
public class EmployeeApiController {
    private final EmployeeService employeeService;
 
    public EmployeeApiController(EmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    @GetMapping("/api/employees")
    public ResponseEntity<Object> getAllEmployees() {
        return ResponseBuilder.buildOkResponse(employeeService.getAllEmployeeDTOs());
    }

    @GetMapping("/api/employees/{id}")
    public ResponseEntity<Object> getEmployeeById(@PathVariable int id) {
        ApiEmployeeDTO dto = employeeService.getEmployeeDTOById(id)
                .orElseThrow(() -> new ResourceNotFoundException(String.format("Employee with id %d not found", id)));
        return ResponseBuilder.buildOkResponse(dto);
    }

    @PostMapping("/api/employees")
    public ResponseEntity<Object> createEmployee(@RequestBody ApiEmployeeDTO employeeDTO) {
        return ResponseBuilder.buildCreatedResponse(employeeService.createEmployee(employeeDTO));
    }

    @PutMapping("/api/employees/{id}")
    public ResponseEntity<Object> updateEmployee(@PathVariable int id, @RequestBody ApiEmployeeDTO employeeDTO) {
        ApiEmployeeDTO updated = employeeService.updateEmployee(id, employeeDTO)
                .orElseThrow(() -> new ResourceNotFoundException(String.format("Employee with id %d not found", id)));
        return ResponseBuilder.buildOkResponse(updated);
    }

    @DeleteMapping("/api/employees/{id}")
    public ResponseEntity<Object> deleteEmployee(@PathVariable int id) {
        if (!employeeService.deleteEmployeeIfExists(id))
            throw new ResourceNotFoundException(String.format("Employee with id %d not found", id));
        return ResponseBuilder.buildOkResponse(null);
    }
}
