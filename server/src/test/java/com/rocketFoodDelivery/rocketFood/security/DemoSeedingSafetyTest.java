package com.rocketFoodDelivery.rocketFood.security;

import com.rocketFoodDelivery.rocketFood.DataSeeder;
import com.rocketFoodDelivery.rocketFood.repository.*;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

class DemoSeedingSafetyTest {
    private final ApplicationContextRunner context = new ApplicationContextRunner()
            .withUserConfiguration(DataSeeder.class)
            .withBean(UserRepository.class, () -> mock(UserRepository.class))
            .withBean(RestaurantRepository.class, () -> mock(RestaurantRepository.class))
            .withBean(ProductOrderRepository.class, () -> mock(ProductOrderRepository.class))
            .withBean(ProductRepository.class, () -> mock(ProductRepository.class))
            .withBean(OrderStatusRepository.class, () -> mock(OrderStatusRepository.class))
            .withBean(OrderRepository.class, () -> mock(OrderRepository.class))
            .withBean(EmployeeRepository.class, () -> mock(EmployeeRepository.class))
            .withBean(CustomerRepository.class, () -> mock(CustomerRepository.class))
            .withBean(AddressRepository.class, () -> mock(AddressRepository.class))
            .withBean(CourierStatusRepository.class, () -> mock(CourierStatusRepository.class))
            .withBean(CourierRepository.class, () -> mock(CourierRepository.class));

    @Test
    void seedingIsDisabledByDefault() {
        context.run(c -> assertThat(c).doesNotHaveBean(DataSeeder.class));
    }

    @Test
    void demoProfileAloneDoesNotEnableSeeding() {
        context.withPropertyValues("spring.profiles.active=demo")
                .run(c -> assertThat(c).doesNotHaveBean(DataSeeder.class));
    }

    @Test
    void enabledFlagOutsideDemoProfileDoesNotEnableSeeding() {
        context.withPropertyValues("app.demo.enabled=true")
                .run(c -> assertThat(c).doesNotHaveBean(DataSeeder.class));
    }

    @Test
    void explicitDemoModeRejectsShortPasswordsBeforeSeeding() {
        context.withPropertyValues("spring.profiles.active=demo", "app.demo.enabled=true",
                        "app.demo.password=short")
                .run(c -> {
                    assertThat(c).hasFailed();
                    assertThat(c.getStartupFailure()).hasRootCauseInstanceOf(IllegalStateException.class)
                            .hasStackTraceContaining("at least 16 characters");
                });
    }
}
