package com.rocketFoodDelivery.rocketFood.controller.api;

import com.rocketFoodDelivery.rocketFood.dtos.user.ApiAccountDTO;
import com.rocketFoodDelivery.rocketFood.dtos.user.ApiCreateUserDTO;
import com.rocketFoodDelivery.rocketFood.dtos.user.ApiPostAccountDTO;
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

    // The official mobile URL also sends ?type=customer|courier. Spring safely ignores that
    // unbound query for this retained endpoint; the client then verifies the requested nested
    // role ID against its authenticated session before displaying role-specific contact data.
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

    // Official-shaped account update: POST /api/account/{id} with the role type in the body
    // ({ account_type, account_email, account_phone }). Delegates to the same updateAccount service
    // as the PUT endpoint above, which is retained unchanged for backward compatibility. Only the
    // selected role's email/phone are touched; the primary user email is never modified here.
    @PostMapping("/api/account/{id}")
    public ResponseEntity<Object> postAccount(
            @PathVariable int id,
            @RequestBody ApiPostAccountDTO postDTO) {
        String type = postDTO.getAccount_type();
        if (type == null || (!type.equals("customer") && !type.equals("courier") && !type.equals("employee"))) {
            throw new BadRequestException("account_type must be 'customer', 'courier', or 'employee'");
        }
        ApiUpdateAccountDTO updateDTO =
                new ApiUpdateAccountDTO(postDTO.getAccount_email(), postDTO.getAccount_phone());
        ApiAccountDTO dto = userService.updateAccount(id, type, updateDTO)
                .orElseThrow(() -> new ResourceNotFoundException(
                        String.format("User with id %d or %s role not found", id, type)));
        return ResponseBuilder.buildOkResponse(dto);
    }
}
