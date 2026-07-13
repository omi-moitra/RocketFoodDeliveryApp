package com.rocketFoodDelivery.rocketFood.dtos.productOrder;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class ApiProductOrderDTO {
    private int id;

    @JsonProperty("product_id")
    private int productId;

    @JsonProperty("order_id")
    private int orderId;

    @JsonProperty("product_quantity")
    private int productQuantity;

    @JsonProperty("product_unit_cost")
    private int productUnitCost;
}
