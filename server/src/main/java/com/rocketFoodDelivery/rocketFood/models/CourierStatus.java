package com.rocketFoodDelivery.rocketFood.models;

// Java standard library
import java.time.LocalDateTime;

// Jakarta EE - Persistence & Validation
import jakarta.persistence.*;
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
@Table(name = "courier_statuses")
public class CourierStatus {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @Column(name = "name", nullable = false)
    @NotBlank(message = "Status name is required")
    private String name;

    @CreationTimestamp
    private LocalDateTime createdOn;

    @UpdateTimestamp
    private LocalDateTime updateOn;
}
