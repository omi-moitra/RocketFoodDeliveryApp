package com.rocketFoodDelivery.rocketFood.dtos.restaurant;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import com.rocketFoodDelivery.rocketFood.dtos.address.ApiAddressDTO;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class ApiCreateRestaurantDTO {
    private int id;

    @JsonProperty("user_id")
    private int userId;

    private String name;

    @JsonProperty("price_range")
    @Min(1)
    @Max(3)
    private int priceRange;

    private String phone;

    @Email
    private String email;

    private ApiAddressDTO address;
}
