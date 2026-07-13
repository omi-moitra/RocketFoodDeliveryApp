package com.rocketFoodDelivery.rocketFood.dtos.user;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class ApiAccountDTO {
    private int id;
    private String name;
    private String email;

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private RoleDetail customer;

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private RoleDetail courier;

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private RoleDetail employee;

    @Getter
    @Setter
    @AllArgsConstructor
    @NoArgsConstructor
    public static class RoleDetail {
        private int id;
        private String phone;
        private String email;
        private String address;
    }
}
