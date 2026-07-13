package com.rocketFoodDelivery.rocketFood.models;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "couriers")
public class Courier {
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

    @ManyToOne
    @JoinColumn(name = "courier_status_id", nullable = false)
    @NotNull(message = "Courier status is required")
    private CourierStatus courierStatus;

    @Column(name = "phone", nullable = false)
    @NotBlank(message = "Phone is required")
    private String phone;

    @Column(name = "email")
    @Email(message = "Email must be valid")
    private String email;

    @Builder.Default
    @Column(name = "active", nullable = false)
    private Boolean active = true;

    @CreationTimestamp
    private LocalDateTime createdOn;

    @UpdateTimestamp
    private LocalDateTime updateOn;
}
