package com.rocketFoodDelivery.rocketFood.models;

// Java standard library
import java.time.LocalDateTime;

/* CURRENTLY UNUSED
* import java.util.List;
*/

// Jakarta EE - Persistence & Validation
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
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
@Table(name = "restaurants")
public class Restaurant {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    @NotNull(message = "User is required")
    private User user;

    @OneToOne
    @JoinColumn(name = "address_id", unique = true, nullable = false)
    @NotNull(message = "Address is required")
    private Address address;

    /* CURRENTLY UNUSED
    * @OneToMany(mappedBy = "restaurant", cascade = CascadeType.ALL, orphanRemoval = true)
    * private List<Order> orders;
    *
    * @OneToMany(mappedBy = "restaurant", cascade = CascadeType.ALL, orphanRemoval = true)
    * private List<Product> products;
    */

    @Column(name = "phone", nullable = false)
    @NotBlank(message = "Phone is required")
    private String phone;

    @Column(name = "email")
    @Email(message = "Email must be valid")
    private String email;

    @Column(name = "name", nullable = false)
    @NotBlank(message = "Name is required")
    private String name;

    @Column(name = "price_range", nullable = false)
    @ColumnDefault("1")
    @NotNull(message = "Price range is required")
    @Min(value = 1, message = "Price range must be between 1 and 3")
    @Max(value = 3, message = "Price range must be between 1 and 3")
    @Builder.Default
    private int priceRange = 1;

    @Column(name = "active", nullable = false)
    @ColumnDefault("true")
    @NotNull(message = "Active status is required")
    @Builder.Default
    private boolean active = true;

    @CreationTimestamp
    private LocalDateTime createdOn;

    @UpdateTimestamp
    private LocalDateTime updateOn;
}