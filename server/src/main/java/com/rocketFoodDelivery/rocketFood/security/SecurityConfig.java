package com.rocketFoodDelivery.rocketFood.security;

import com.rocketFoodDelivery.rocketFood.models.User;
import com.rocketFoodDelivery.rocketFood.repository.UserRepository;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.NoOpPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.core.annotation.Order;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final UserRepository userRepository;
    private final JwtTokenFilter jwtTokenFilter;

    public SecurityConfig(UserRepository userRepository, JwtTokenFilter jwtTokenFilter) {
        this.userRepository = userRepository;
        this.jwtTokenFilter = jwtTokenFilter;
    }

    @Bean
    public UserDetailsService userDetailsService() {
        return email -> {
            User user = userRepository.findUserByEmail(email)
                    .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
            return user;
        };
    }

    @SuppressWarnings("deprecation")
    @Bean
    public PasswordEncoder passwordEncoder() {
        // Passwords are stored as plain text in the seeder — use NoOpPasswordEncoder for dev
        return NoOpPasswordEncoder.getInstance();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    // API security filter chain — JWT-based, stateless, no CSRF
    @Bean
    @Order(1)
    public SecurityFilterChain apiFilterChain(HttpSecurity http) throws Exception {
        http
            .securityMatcher("/api/**")
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth").permitAll()
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtTokenFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // Backoffice security filter chain — form login, session-based
    @Bean
    @Order(2)
    public SecurityFilterChain backofficeFilterChain(HttpSecurity http) throws Exception {
        http
            .securityMatcher("/backoffice/**")
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/backoffice/login").permitAll()
                .requestMatchers("/backoffice/**").authenticated()
            )
            .formLogin(form -> form
                .loginPage("/backoffice/login")
                .loginProcessingUrl("/backoffice/login")
                .defaultSuccessUrl("/backoffice/", true)
                .failureUrl("/backoffice/login?error=true")
                .usernameParameter("email")
                .passwordParameter("password")
                .permitAll()
            )
            .logout(logout -> logout
                .logoutUrl("/backoffice/logout")
                .logoutSuccessUrl("/backoffice/login?logout=true")
                .permitAll()
            );

        return http.build();
    }

    // Default filter chain — permit all other routes (static resources, etc.)
    @Bean
    @Order(3)
    public SecurityFilterChain defaultFilterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                .anyRequest().permitAll()
            )
            .csrf(csrf -> csrf.disable());

        return http.build();
    }
}
