package com.rocketFoodDelivery.rocketFood.exception;

import com.rocketFoodDelivery.rocketFood.dtos.response.ApiErrorDTO;

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@Order(Ordered.HIGHEST_PRECEDENCE)
@RestControllerAdvice(basePackages = "com.rocketFoodDelivery.rocketFood.controller.api")
public class ApiExceptionHandler {

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ApiErrorDTO> handleBadRequest(BadRequestException ex) {
        ApiErrorDTO error = new ApiErrorDTO();
        error.setError("Bad Request");
        error.setDetails(ex.getMessage());
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiErrorDTO> handleNotFound(ResourceNotFoundException ex) {
        ApiErrorDTO error = new ApiErrorDTO();
        error.setError("Not Found");
        error.setDetails(ex.getMessage());
        return new ResponseEntity<>(error, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<ApiErrorDTO> handleValidation(ValidationException ex) {
        ApiErrorDTO error = new ApiErrorDTO();
        error.setError("Validation Error");
        error.setDetails(ex.getBindingResult().getAllErrors().get(0).getDefaultMessage());
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorDTO> handleMethodArgumentNotValid(MethodArgumentNotValidException ex) {
        ApiErrorDTO error = new ApiErrorDTO();
        error.setError("Validation Error");
        error.setDetails(ex.getBindingResult().getAllErrors().get(0).getDefaultMessage());
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiErrorDTO> handleIllegalArgument(IllegalArgumentException ex) {
        ApiErrorDTO error = new ApiErrorDTO();
        error.setError("Bad Request");
        error.setDetails(ex.getMessage());
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<ApiErrorDTO> handleDataAccessException(DataAccessException ex) {
        ApiErrorDTO error = new ApiErrorDTO();
        error.setError("Bad Request");
        error.setDetails("Data integrity violation");
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(jakarta.validation.ConstraintViolationException.class)
    public ResponseEntity<ApiErrorDTO> handleConstraintViolation(jakarta.validation.ConstraintViolationException ex) {
        ApiErrorDTO error = new ApiErrorDTO();
        error.setError("Bad Request");
        error.setDetails("Validation constraint violation");
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorDTO> handleGeneral(Exception ex) {
        ApiErrorDTO error = new ApiErrorDTO();
        error.setError("Internal Server Error");
        error.setDetails("An unexpected error occurred");
        return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
