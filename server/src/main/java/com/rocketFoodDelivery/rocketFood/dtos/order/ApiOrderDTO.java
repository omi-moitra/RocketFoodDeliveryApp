package com.rocketFoodDelivery.rocketFood.dtos.order;

import com.rocketFoodDelivery.rocketFood.dtos.product.ApiProductForOrderApiDTO;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
//this is a class created to process the order details for the order api from postman.
public class ApiOrderDTO {
    int id ;
    int customer_id;
    String customer_name;
    String customer_address;
    int restaurant_id;
    String restaurant_name;
    String restaurant_address;
    Integer courier_id;
    String courier_name;
    String status;
    List <ApiProductForOrderApiDTO> products;
    long total_cost;
    LocalDateTime created_on;
}
