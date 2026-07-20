package com.rocketFoodDelivery.rocketFood.dtos.order;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Request body for the status-only order update (PUT /api/order/{id}/status).
 * Carries only order_status_id so a status change cannot overwrite the restaurant, customer,
 * rating, or courier fields the broad update (ApiUpdateOrderDTO) requires. @Min(1) rejects a
 * missing/zero/negative status before the service confirms the status exists.
 */
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class ApiUpdateOrderStatusDTO {
    @JsonProperty("order_status_id")
    @Min(value = 1, message = "order_status_id must be a valid status")
    private int orderStatusId;
}
