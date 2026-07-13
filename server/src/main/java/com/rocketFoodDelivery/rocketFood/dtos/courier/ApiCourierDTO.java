package com.rocketFoodDelivery.rocketFood.dtos.courier;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class ApiCourierDTO {
    private int id;

    @JsonProperty("user_id")
    private int userId;

    @JsonProperty("address_id")
    private int addressId;

    @JsonProperty("courier_status_id")
    private int courierStatusId;

    private String phone;
    private String email;
    private boolean active;
}
