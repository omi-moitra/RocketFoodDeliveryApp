package com.rocketFoodDelivery.rocketFood.dtos.product;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class ApiProductDTO {
    private int id;

    @JsonProperty("restaurant_id")
    private int restaurantId;

    private String name;
    private String description;
    private int cost;
}
