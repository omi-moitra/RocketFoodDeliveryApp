package com.rocketFoodDelivery.rocketFood.dtos.product;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
// the order api has a prodect. and this is for that
public class ApiProductForOrderApiDTO {
    @JsonProperty("product_id")
    int id;
    String product_name;
    int quantity;
    int unit_cost;
    int total_cost;
}
