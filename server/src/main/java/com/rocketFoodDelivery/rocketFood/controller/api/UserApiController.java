package com.rocketFoodDelivery.rocketFood.controller.api;

import com.rocketFoodDelivery.rocketFood.dtos.user.ApiAccountDTO;
import com.rocketFoodDelivery.rocketFood.dtos.user.ApiCreateUserDTO;
import com.rocketFoodDelivery.rocketFood.dtos.user.ApiUpdateAccountDTO;
import com.rocketFoodDelivery.rocketFood.dtos.user.ApiUserDTO;
import com.rocketFoodDelivery.rocketFood.exception.BadRequestException;
import com.rocketFoodDelivery.rocketFood.exception.ResourceNotFoundException;
import com.rocketFoodDelivery.rocketFood.exception.ValidationException;
import com.rocketFoodDelivery.rocketFood.service.UserService;
import com.rocketFoodDelivery.rocketFood.util.ResponseBuilder;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

@RestController
public class UserApiController {
    private final UserService userService;

    public UserApiController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/api/users")
    public ResponseEntity<Object> getAllUsers() {
        return ResponseBuilder.buildOkResponse(userService.getAllUserDTOs());
    }

    @GetMapping("/api/users/{id}")
    public ResponseEntity<Object> getUserById(@PathVariable int id) {
        ApiUserDTO dto = userService.getUserDTOById(id)
                .orElseThrow(() -> new ResourceNotFoundException(String.format("User with id %d not found", id)));
        return ResponseBuilder.buildOkResponse(dto);
    }

    @PostMapping("/api/users")
    public ResponseEntity<Object> createUser(@Valid @RequestBody ApiCreateUserDTO userDTO, BindingResult result) {
        if (result.hasErrors()) throw new ValidationException(result);
        if (userDTO.getName() == null || userDTO.getEmail() == null || userDTO.getPassword() == null) {
            throw new BadRequestException("Name, email, and password are required");
        }
        return ResponseBuilder.buildCreatedResponse(userService.createUser(userDTO));
    }

    @PutMapping("/api/users/{id}")
    public ResponseEntity<Object> updateUser(@PathVariable int id, @Valid @RequestBody ApiCreateUserDTO userDTO, BindingResult result) {
        if (result.hasErrors()) throw new ValidationException(result);
        ApiUserDTO updated = userService.updateUser(id, userDTO)
                .orElseThrow(() -> new ResourceNotFoundException(String.format("User with id %d not found", id)));
        return ResponseBuilder.buildOkResponse(updated);
    }

    @DeleteMapping("/api/users/{id}")
    public ResponseEntity<Object> deleteUser(@PathVariable int id) {
        if (!userService.deleteUserIfExists(id))
            throw new ResourceNotFoundException(String.format("User with id %d not found", id));
        return ResponseBuilder.buildOkResponse(null);
    }

    @GetMapping("/api/account/{id}")
    public ResponseEntity<Object> getAccount(@PathVariable int id) {
        ApiAccountDTO dto = userService.getAccountDTO(id)
                .orElseThrow(() -> new ResourceNotFoundException(String.format("User with id %d not found", id)));
        return ResponseBuilder.buildOkResponse(dto);
    }

    @PutMapping("/api/account/{id}")
    public ResponseEntity<Object> updateAccount(
            @PathVariable int id,
            @RequestParam(name = "type") String type,
            @RequestBody ApiUpdateAccountDTO updateDTO) {
        if (!type.equals("customer") && !type.equals("courier") && !type.equals("employee")) {
            throw new BadRequestException("Type must be 'customer', 'courier', or 'employee'");
        }
        ApiAccountDTO dto = userService.updateAccount(id, type, updateDTO)
                .orElseThrow(() -> new ResourceNotFoundException(
                        String.format("User with id %d or %s role not found", id, type)));
        return ResponseBuilder.buildOkResponse(dto);
    }
}
