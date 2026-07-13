package com.rocketFoodDelivery.rocketFood.user;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.JsonPath;
import com.rocketFoodDelivery.rocketFood.dtos.user.ApiCreateUserDTO;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
public class UserApiControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    // ==================== GET /api/users ====================

    @Test
    public void testGetAllUsers_Success() throws Exception {
        mockMvc.perform(get("/api/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Success"))
                .andExpect(jsonPath("$.data").isArray());
    }

    // ==================== GET /api/users/{id} ====================

    @Test
    public void testGetUserById_Success() throws Exception {
        mockMvc.perform(get("/api/users/{id}", 1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Success"))
                .andExpect(jsonPath("$.data.id").value(1));
    }

    @Test
    public void testGetUserById_Failure_NotFound() throws Exception {
        mockMvc.perform(get("/api/users/{id}", 999999))
                .andExpect(status().isNotFound());
    }

    // ==================== POST /api/users ====================

    @Test
    public void testCreateUser_Success() throws Exception {
        String uniqueEmail = "testuser_" + System.nanoTime() + "@test.com";
        ApiCreateUserDTO userDTO = new ApiCreateUserDTO("Test User", uniqueEmail, "password123");

        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userDTO)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message").value("Success"))
                .andExpect(jsonPath("$.data.name").value("Test User"))
                .andExpect(jsonPath("$.data.email").value(uniqueEmail));
    }

    @Test
    public void testCreateUser_Failure_MissingFields() throws Exception {
        // Missing password
        ApiCreateUserDTO userDTO = new ApiCreateUserDTO("No Password User", "nopassword@test.com", null);

        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userDTO)))
                .andExpect(status().isBadRequest());
    }

    @Test
    public void testCreateUser_Failure_InvalidEmail() throws Exception {
        ApiCreateUserDTO userDTO = new ApiCreateUserDTO("Bad Email User", "not-an-email", "password123");

        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userDTO)))
                .andExpect(status().isBadRequest());
    }

    // ==================== PUT /api/users/{id} ====================

    @Test
    public void testUpdateUser_Success() throws Exception {
        ApiCreateUserDTO update = new ApiCreateUserDTO("Updated Name", "updated@test.com", "newpassword");

        mockMvc.perform(put("/api/users/{id}", 4)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Success"))
                .andExpect(jsonPath("$.data.id").value(4))
                .andExpect(jsonPath("$.data.name").value("Updated Name"))
                .andExpect(jsonPath("$.data.email").value("updated@test.com"));
    }

    @Test
    public void testUpdateUser_Failure_NotFound() throws Exception {
        ApiCreateUserDTO update = new ApiCreateUserDTO("Ghost User", "ghost@test.com", "password");

        mockMvc.perform(put("/api/users/{id}", 999999)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isNotFound());
    }

    // ==================== DELETE /api/users/{id} ====================

    @Test
    public void testDeleteUser_Success() throws Exception {
        // Create a fresh user to safely delete
        ApiCreateUserDTO userDTO = new ApiCreateUserDTO("Delete Me User", "tobedeleted_user@test.com", "password123");

        MvcResult createResult = mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userDTO)))
                .andExpect(status().isCreated())
                .andReturn();

        int id = JsonPath.read(createResult.getResponse().getContentAsString(), "$.data.id");

        mockMvc.perform(delete("/api/users/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Success"));
    }

    @Test
    public void testDeleteUser_Failure_NotFound() throws Exception {
        mockMvc.perform(delete("/api/users/{id}", 999999))
                .andExpect(status().isNotFound());
    }
}
