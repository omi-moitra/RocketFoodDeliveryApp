package com.rocketFoodDelivery.rocketFood.dtos.customer;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class ApiCustomerDTO {
    private int id;

    @JsonProperty("user_id")
    private int userId;

    @JsonProperty("address_id")
    private int addressId;

    private String phone;
    private String email;
    private boolean active;
}
