package com.rocketFoodDelivery.rocketFood.controller.api;

import com.rocketFoodDelivery.rocketFood.dtos.auth.AuthRequestDTO;
import com.rocketFoodDelivery.rocketFood.dtos.auth.AuthResponseErrorDTO;
import com.rocketFoodDelivery.rocketFood.dtos.auth.AuthResponseSuccessDTO;
import com.rocketFoodDelivery.rocketFood.models.Courier;
import com.rocketFoodDelivery.rocketFood.models.Customer;
import com.rocketFoodDelivery.rocketFood.models.User;
import com.rocketFoodDelivery.rocketFood.service.CourierService;
import com.rocketFoodDelivery.rocketFood.service.CustomerService;
import com.rocketFoodDelivery.rocketFood.security.JwtUtil;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;


@RestController
public class AuthApiController {
    private final CourierService courierService;
    private final CustomerService customerService;
    @Autowired
    AuthenticationManager authManager;
    @Autowired
    JwtUtil jwtUtil;
    public AuthApiController(CourierService courierService, CustomerService customerService){
        this.courierService = courierService;
        this.customerService = customerService;
    }
    @PostMapping("/api/auth")
    public ResponseEntity<?> authenticate(@RequestBody @Valid AuthRequestDTO request){
        try {
            Authentication authentication = authManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail(), request.getPassword())
            );
            User user = (User) authentication.getPrincipal();
            String accessToken = jwtUtil.generateAccessToken(user);
            Optional<Courier> courier = courierService.findCourierByUserId(user.getId());
            Optional<Customer> customer = customerService.findCustomerByUserId(user.getId());

            AuthResponseSuccessDTO response = new AuthResponseSuccessDTO();
            if(courier.isPresent()){
                response.setCourier_id(courier.get().getId());
            }
            if (customer.isPresent()){
                response.setCustomer_id(customer.get().getId());
            }
            response.setSuccess(true);
            response.setAccessToken(accessToken);
            response.setUser_id(user.getId());
            return ResponseEntity.ok().body(response);
        } catch (BadCredentialsException e) {
            AuthResponseErrorDTO response = new AuthResponseErrorDTO();
            response.setSuccess(false);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }
    }
}
