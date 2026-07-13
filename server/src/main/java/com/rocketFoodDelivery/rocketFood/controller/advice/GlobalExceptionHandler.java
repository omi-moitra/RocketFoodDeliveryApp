package com.rocketFoodDelivery.rocketFood.controller.advice;

import org.springframework.http.HttpStatus;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;

import jakarta.servlet.http.HttpServletRequest;

@ControllerAdvice
public class GlobalExceptionHandler {

    // Handle 400 - Bad Request (e.g., invalid input)
    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public String handleBadRequest(IllegalArgumentException ex, Model model, HttpServletRequest request) {
        model.addAttribute("status", 400);
        model.addAttribute("error", "Bad Request");
        model.addAttribute("message", ex.getMessage());
        model.addAttribute("path", request.getRequestURI());
        return "error/4xx";
    }

    // Handle 403 - Access Denied / Forbidden
    @ExceptionHandler(SecurityException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public String handleAccessDenied(SecurityException ex, Model model, HttpServletRequest request) {
        model.addAttribute("status", 403);
        model.addAttribute("error", "Forbidden");
        model.addAttribute("message", "You don't have permission to access this resource.");
        model.addAttribute("path", request.getRequestURI());
        return "error/4xx";
    }

    // Handle resource not found (e.g., restaurant ID doesn't exist)
    @ExceptionHandler(RuntimeException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public String handleResourceNotFound(RuntimeException ex, Model model, HttpServletRequest request) {
        // Only handle if message indicates "not found"
        if (ex.getMessage() != null && ex.getMessage().toLowerCase().contains("not found")) {
            model.addAttribute("status", 404);
            model.addAttribute("error", "Not Found");
            model.addAttribute("message", ex.getMessage());
            model.addAttribute("path", request.getRequestURI());
            return "error/4xx";
        }
        // Otherwise, treat as internal server error
        return handleInternalError(ex, model, request);
    }

    // Handle 500 - Internal Server Error (catch-all for unhandled exceptions)
    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public String handleInternalError(Exception ex, Model model, HttpServletRequest request) {
        model.addAttribute("status", 500);
        model.addAttribute("error", "Internal Server Error");
        model.addAttribute("message", "An unexpected error occurred. Please try again later.");
        model.addAttribute("path", request.getRequestURI());
        
        // Include stack trace only in development (remove in production)
        model.addAttribute("trace", ex.getMessage());
        
        // Log the exception for debugging
        ex.printStackTrace(); // Replace with proper logging in production
        
        return "error/5xx";
    }
}