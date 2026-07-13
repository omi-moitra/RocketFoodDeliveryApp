package com.rocketFoodDelivery.rocketFood.models;

// Java standard library
import java.time.LocalDateTime;

// Jakarta EE - Persistence & Validation
import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;

// Hibernate annotations
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

// Lombok - Code generation
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "products")
public class Product {    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @ManyToOne
    @JoinColumn(name = "restaurant_id", nullable = false)
    @NotNull(message = "Restaurant is required")
    private Restaurant restaurant;

    @Column(name = "name", nullable = false)
    @NotBlank(message = "Product name is required")
    private String name;

    @Column(name = "description")
    private String description;

    @Column(name = "cost", nullable = false)
    @NotNull(message = "Cost is required")
    @Min(value = 0, message = "Cost must be greater than or equal to 0")
    private Integer cost;

    @CreationTimestamp
    private LocalDateTime createdOn;

    @UpdateTimestamp
    private LocalDateTime updateOn;
}