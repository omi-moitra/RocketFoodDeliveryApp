package com.rocketFoodDelivery.rocketFood.employee;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.JsonPath;
import com.rocketFoodDelivery.rocketFood.dtos.employee.ApiEmployeeDTO;
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
public class EmployeeApiControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    // ==================== GET /api/employees ====================

    @Test
    public void testGetAllEmployees_Success() throws Exception {
        mockMvc.perform(get("/api/employees"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Success"))
                .andExpect(jsonPath("$.data").isArray());
    }

    // ==================== GET /api/employees/{id} ====================

    @Test
    public void testGetEmployeeById_Success() throws Exception {
        mockMvc.perform(get("/api/employees/{id}", 1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Success"))
                .andExpect(jsonPath("$.data.id").value(1));
    }

    @Test
    public void testGetEmployeeById_Failure_NotFound() throws Exception {
        mockMvc.perform(get("/api/employees/{id}", 999999))
                .andExpect(status().isNotFound());
    }

    // ==================== POST /api/employees ====================

    private int createFreshUserId(String prefix) throws Exception {
        String uniqueEmail = prefix + System.nanoTime() + "@test.com";
        ApiCreateUserDTO userDTO = new ApiCreateUserDTO("Test User", uniqueEmail, "password123");
        MvcResult result = mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userDTO)))
                .andExpect(status().isCreated())
                .andReturn();
        return JsonPath.read(result.getResponse().getContentAsString(), "$.data.id");
    }

    @Test
    public void testCreateEmployee_Success() throws Exception {
        int freshUserId = createFreshUserId("em_create_");
        ApiEmployeeDTO employeeDTO = new ApiEmployeeDTO(0, freshUserId, 1, "5140000051", "testemployee@test.com");

        mockMvc.perform(post("/api/employees")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(employeeDTO)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message").value("Success"))
                .andExpect(jsonPath("$.data.phone").value("5140000051"))
                .andExpect(jsonPath("$.data.email").value("testemployee@test.com"));
    }

    @Test
    public void testCreateEmployee_Failure_InvalidData() throws Exception {
        mockMvc.perform(post("/api/employees")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    // ==================== PUT /api/employees/{id} ====================

    @Test
    public void testUpdateEmployee_Success() throws Exception {
        ApiEmployeeDTO update = new ApiEmployeeDTO(0, 1, 1, "5140000062", "employeeupdated@test.com");

        mockMvc.perform(put("/api/employees/{id}", 1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Success"))
                .andExpect(jsonPath("$.data.id").value(1))
                .andExpect(jsonPath("$.data.phone").value("5140000062"));
    }

    @Test
    public void testUpdateEmployee_Failure_NotFound() throws Exception {
        ApiEmployeeDTO update = new ApiEmployeeDTO(0, 1, 1, "0000000000", "notfound@test.com");

        mockMvc.perform(put("/api/employees/{id}", 999999)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isNotFound());
    }

    // ==================== DELETE /api/employees/{id} ====================

    @Test
    public void testDeleteEmployee_Success() throws Exception {
        // Create a fresh user and employee to safely delete
        int freshUserId = createFreshUserId("em_delete_");
        ApiEmployeeDTO employeeDTO = new ApiEmployeeDTO(0, freshUserId, 1, "5140000079", "tobedeleted_employee@test.com");

        MvcResult createResult = mockMvc.perform(post("/api/employees")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(employeeDTO)))
                .andExpect(status().isCreated())
                .andReturn();

        int id = JsonPath.read(createResult.getResponse().getContentAsString(), "$.data.id");

        mockMvc.perform(delete("/api/employees/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Success"));
    }

    @Test
    public void testDeleteEmployee_Failure_NotFound() throws Exception {
        mockMvc.perform(delete("/api/employees/{id}", 999999))
                .andExpect(status().isNotFound());
    }
}
