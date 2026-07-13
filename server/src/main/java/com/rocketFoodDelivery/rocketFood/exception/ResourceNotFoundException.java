package com.rocketFoodDelivery.rocketFood.exception;

public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message != null ? message : "Resource not found");
    }
}
