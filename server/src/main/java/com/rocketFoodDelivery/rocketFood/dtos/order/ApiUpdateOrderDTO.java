package com.rocketFoodDelivery.rocketFood.dtos.order;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class ApiUpdateOrderDTO {
    @JsonProperty("restaurant_id")
    private int restaurantId;

    @JsonProperty("customer_id")
    private int customerId;

    @JsonProperty("order_status_id")
    private int orderStatusId;

    @JsonProperty("restaurant_rating")
    private Integer restaurantRating;
}
