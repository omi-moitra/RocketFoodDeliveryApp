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
public class ApiUpdateRatingDTO {
    @JsonProperty("restaurant_rating")
    private int restaurantRating;
}
