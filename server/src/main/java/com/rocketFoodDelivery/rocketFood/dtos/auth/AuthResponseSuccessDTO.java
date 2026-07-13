package com.rocketFoodDelivery.rocketFood.dtos.auth;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class AuthResponseSuccessDTO {
    private String accessToken;
    private boolean success;
    private int user_id;
    private Integer customer_id;
    private Integer courier_id;
}
