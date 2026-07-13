package com.rocketFoodDelivery.rocketFood.models;

// Java standard library
import java.time.LocalDateTime;

// Jakarta EE - Persistence & Validation
import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

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
@Table(name = "product_orders", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"product_id", "order_id"})
})
public class ProductOrder {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @ManyToOne
    @JoinColumn(name = "product_id", nullable = false)
    @NotNull(message = "Product is required")
    private Product product;

    @ManyToOne
    @JoinColumn(name = "order_id", nullable = false)
    @NotNull(message = "Order is required")
    private Order order;

    @Column(name = "product_quantity", nullable = false)
    @NotNull(message = "Product quantity is required")
    @Min(value = 1, message = "Product quantity must be at least 1")
    private Integer productQuantity;

    @Column(name = "product_unit_cost", nullable = false)
    @NotNull(message = "Product unit cost is required")
    @Min(value = 0, message = "Product unit cost must be greater than or equal to 0")
    private Integer productUnitCost;

    @CreationTimestamp
    private LocalDateTime createdOn;

    @UpdateTimestamp
    private LocalDateTime updateOn;
}