package com.rocketFoodDelivery.rocketFood.dtos.order;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
//this is for the get order api.
public class ApiOrderRequestDTO {
    int id;
    String type;
}
