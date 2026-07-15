package com.rocketFoodDelivery.rocketFood.dtos.user;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class ApiUpdateAccountDTO {
    private String email;
    private String phone;
}
