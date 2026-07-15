package com.rocketFoodDelivery.rocketFood.dtos.order;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ApiCreateOrderDTO {
    @JsonProperty("restaurant_id")
    private int restaurantId;

    @JsonProperty("customer_id")
    private int customerId;

    private List<ProductItem> products;

    @JsonProperty("send_email")
    private boolean sendEmail = false;

    @JsonProperty("send_sms")
    private boolean sendSms = false;

    @Getter
    @Setter
    public static class ProductItem {
        private int id;
        private int quantity;
    }
}
