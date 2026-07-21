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
    // Exposed so a client can read the current rating and echo it back through the broad order
    // update (PUT /api/orders/{id}), which overwrites this field. Without it a courier status
    // change would have to send null and erase the rating. Nullable: an order may have no rating.
    Integer restaurant_rating;
    List <ApiProductForOrderApiDTO> products;
    long total_cost;
    LocalDateTime created_on;
}
