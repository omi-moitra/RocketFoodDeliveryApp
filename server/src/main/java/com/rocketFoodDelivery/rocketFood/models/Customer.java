package com.rocketFoodDelivery.rocketFood.models;

// Java standard library
import java.time.LocalDateTime;
import java.util.List;

// Jakarta EE - Persistence & Validation
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

// Hibernate annotations
import org.hibernate.annotations.ColumnDefault;
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
@Table(name = "customers")
public class Customer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @OneToOne
    @JoinColumn(name = "user_id", unique = true, nullable = false)
    @NotNull(message = "User is required")
    private User user;

    @ManyToOne
    @JoinColumn(name = "address_id", nullable = false)
    @NotNull(message = "Address is required")
    private Address address;

    @OneToMany(mappedBy = "customer")
    private List<Order> orders;

    @Column(name = "phone", nullable = false)
    @NotBlank(message = "Phone is required")
    private String phone;
    
    @Column(name = "email")
    @Email(message = "Email must be valid")
    private String email;

    @Column(name = "active", nullable = false)
    @ColumnDefault("true")
    @NotNull(message = "Active status is required")
    @Builder.Default
    private Boolean active = true;

    @CreationTimestamp
    private LocalDateTime createdOn;

    @UpdateTimestamp
    private LocalDateTime updateOn;
}