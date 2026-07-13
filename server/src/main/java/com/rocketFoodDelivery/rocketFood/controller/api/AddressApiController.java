package com.rocketFoodDelivery.rocketFood.controller.api;

import com.rocketFoodDelivery.rocketFood.dtos.address.ApiAddressDTO;
import com.rocketFoodDelivery.rocketFood.exception.BadRequestException;
import com.rocketFoodDelivery.rocketFood.exception.ResourceNotFoundException;
import com.rocketFoodDelivery.rocketFood.service.AddressService;
import com.rocketFoodDelivery.rocketFood.util.ResponseBuilder;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
public class AddressApiController {
    private final AddressService addressService;

    public AddressApiController(AddressService addressService) {
        this.addressService = addressService;
    }

    @GetMapping("/api/addresses")
    public ResponseEntity<Object> getAllAddresses() {
        List<ApiAddressDTO> dtos = addressService.getAllAddressDTOs();
        return ResponseBuilder.buildOkResponse(dtos);
    }

    @GetMapping("/api/addresses/{id}")
    public ResponseEntity<Object> getAddressById(@PathVariable int id) {
        Optional<ApiAddressDTO> dto = addressService.getAddressDTOById(id);
        if (dto.isEmpty()) throw new ResourceNotFoundException(String.format("Address with id %d not found", id));
        return ResponseBuilder.buildOkResponse(dto.get());
    }

    @PostMapping("/api/addresses")
    public ResponseEntity<Object> createAddress(@RequestBody ApiAddressDTO addressDTO) {
        if (addressDTO.getStreetAddress() == null || addressDTO.getCity() == null || addressDTO.getPostalCode() == null) {
            throw new BadRequestException("Street address, city, and postal code are required");
        }
        ApiAddressDTO created = addressService.createAddress(addressDTO);
        return ResponseBuilder.buildCreatedResponse(created);
    }

    @PutMapping("/api/addresses/{id}")
    public ResponseEntity<Object> updateAddress(@PathVariable int id, @RequestBody ApiAddressDTO addressDTO) {
        Optional<ApiAddressDTO> updated = addressService.updateAddress(id, addressDTO);
        if (updated.isEmpty()) throw new ResourceNotFoundException(String.format("Address with id %d not found", id));
        return ResponseBuilder.buildOkResponse(updated.get());
    }

    @DeleteMapping("/api/addresses/{id}")
    public ResponseEntity<Object> deleteAddress(@PathVariable int id) {
        boolean deleted = addressService.deleteAddressIfExists(id);
        if (!deleted) throw new ResourceNotFoundException(String.format("Address with id %d not found", id));
        return ResponseBuilder.buildOkResponse(null);
    }
}
