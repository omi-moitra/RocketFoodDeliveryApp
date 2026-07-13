package com.rocketFoodDelivery.rocketFood.dtos.product;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class ApiCreateProductDTO {
    @JsonProperty("restaurant_id")
    private int restaurantId;

    @NotNull
    private String name;

    private String description;

    private int cost;
}
