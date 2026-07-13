package com.rocketFoodDelivery.rocketFood.controller.backoffice;

// Java standard library
import java.util.List;
import java.util.Optional;

// Jakarta EE
import jakarta.validation.Valid;

// Spring Framework
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

// Project models
import com.rocketFoodDelivery.rocketFood.models.Employee;

// Project services
import com.rocketFoodDelivery.rocketFood.service.AddressService;
import com.rocketFoodDelivery.rocketFood.service.EmployeeService;
import com.rocketFoodDelivery.rocketFood.service.UserService;

@Controller
@RequestMapping("/backoffice/employees")
public class EmployeeController {

    @Autowired
    private EmployeeService employeeService;

    @Autowired
    private UserService userService;

    @Autowired
    private AddressService addressService;

    // READ - List all employees
    @GetMapping
    public String listEmployees(Model model, RedirectAttributes redirectAttributes) {
        try {
            List<Employee> employees = employeeService.findAllEmployees();
            model.addAttribute("employees", employees);
            return "employee/employeeList";
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Error loading employees: " + e.getMessage());
            return "redirect:/backoffice";
        }
    }

    // CREATE - Show empty form to create new employee
    @GetMapping("/new")
    public String showCreateForm(Model model, RedirectAttributes redirectAttributes) {
        try {
            model.addAttribute("employee", new Employee());
            model.addAttribute("users", userService.findAllUsers());
            model.addAttribute("addresses", addressService.findAllAddresses());
            return "employee/employeeForm";
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Error loading form: " + e.getMessage());
            return "redirect:/backoffice/employees";
        }
    }

    // CREATE - Process form submission to save new employee
    @PostMapping
    public String createEmployee(@Valid @ModelAttribute Employee employee,
                                 BindingResult result,
                                 Model model,
                                 RedirectAttributes redirectAttributes) {
        if (result.hasErrors()) {
            try {
                model.addAttribute("users", userService.findAllUsers());
                model.addAttribute("addresses", addressService.findAllAddresses());
            } catch (Exception e) {
                redirectAttributes.addFlashAttribute("errorMessage", "Error loading form data");
                return "redirect:/backoffice/employees";
            }
            return "employee/employeeForm";
        }

        try {
            employeeService.saveEmployee(employee);
            redirectAttributes.addFlashAttribute("successMessage", "Employee created successfully!");
            return "redirect:/backoffice/employees";
        } catch (DataIntegrityViolationException e) {
            redirectAttributes.addFlashAttribute("errorMessage", "This user is already assigned to an employee!");
            return "redirect:/backoffice/employees/new";
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Error creating employee: " + e.getMessage());
            return "redirect:/backoffice/employees/new";
        }
    }

    // READ - View details of specific employee
    @GetMapping("/{id}")
    public String viewEmployee(@PathVariable int id, Model model, RedirectAttributes redirectAttributes) {
        try {
            Optional<Employee> employee = employeeService.findEmployeeById(id);
            if (employee.isPresent()) {
                model.addAttribute("employee", employee.get());
                return "employee/employeeView";
            } else {
                redirectAttributes.addFlashAttribute("errorMessage", "Employee with ID " + id + " not found!");
                return "redirect:/backoffice/employees";
            }
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Error loading employee: " + e.getMessage());
            return "redirect:/backoffice/employees";
        }
    }

    // UPDATE - Show pre-filled form to edit existing employee
    @GetMapping("/{id}/edit")
    public String showEditForm(@PathVariable int id, Model model, RedirectAttributes redirectAttributes) {
        try {
            Optional<Employee> employee = employeeService.findEmployeeById(id);
            if (employee.isEmpty()) {
                redirectAttributes.addFlashAttribute("errorMessage", "Employee not found!");
                return "redirect:/backoffice/employees";
            }

            model.addAttribute("employee", employee.get());
            model.addAttribute("users", userService.findAllUsers());
            model.addAttribute("addresses", addressService.findAllAddresses());
            return "employee/employeeForm";
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Error loading edit form: " + e.getMessage());
            return "redirect:/backoffice/employees";
        }
    }

    // UPDATE - Process form submission to update employee
    @PostMapping("/{id}")
    public String updateEmployee(@PathVariable int id,
                                 @Valid @ModelAttribute Employee employee,
                                 BindingResult result,
                                 Model model,
                                 RedirectAttributes redirectAttributes) {
        if (result.hasErrors()) {
            try {
                model.addAttribute("users", userService.findAllUsers());
                model.addAttribute("addresses", addressService.findAllAddresses());
            } catch (Exception e) {
                redirectAttributes.addFlashAttribute("errorMessage", "Error loading form data");
                return "redirect:/backoffice/employees";
            }
            return "employee/employeeForm";
        }

        try {
            Optional<Employee> existingOpt = employeeService.findEmployeeById(id);
            if (existingOpt.isEmpty()) {
                redirectAttributes.addFlashAttribute("errorMessage", "Employee not found!");
                return "redirect:/backoffice/employees";
            }

            Employee existing = existingOpt.get();
            existing.setUser(employee.getUser());
            existing.setAddress(employee.getAddress());
            existing.setPhone(employee.getPhone());
            existing.setEmail(employee.getEmail());
            employeeService.saveEmployee(existing);

            redirectAttributes.addFlashAttribute("successMessage", "Employee updated successfully!");
            return "redirect:/backoffice/employees";
        } catch (DataIntegrityViolationException e) {
            redirectAttributes.addFlashAttribute("errorMessage", "This user is already assigned to another employee!");
            return "redirect:/backoffice/employees/" + id + "/edit";
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Error updating employee: " + e.getMessage());
            return "redirect:/backoffice/employees/" + id + "/edit";
        }
    }

    // DELETE - Delete specific employee
    @PostMapping("/{id}/delete")
    public String deleteEmployee(@PathVariable int id, RedirectAttributes redirectAttributes) {
        try {
            employeeService.deleteEmployeeById(id);
            redirectAttributes.addFlashAttribute("successMessage", "Employee deleted successfully!");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Error deleting employee: " + e.getMessage());
        }
        return "redirect:/backoffice/employees";
    }
}
