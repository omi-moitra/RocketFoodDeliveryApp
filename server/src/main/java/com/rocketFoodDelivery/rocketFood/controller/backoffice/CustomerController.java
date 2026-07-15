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
import com.rocketFoodDelivery.rocketFood.models.Customer;

// Project services
import com.rocketFoodDelivery.rocketFood.service.AddressService;
import com.rocketFoodDelivery.rocketFood.service.CustomerService;
import com.rocketFoodDelivery.rocketFood.service.UserService;

@Controller
@RequestMapping("/backoffice/customers")
public class CustomerController {

    @Autowired
    private CustomerService customerService;

    @Autowired
    private UserService userService;

    @Autowired
    private AddressService addressService;

    // READ - List all customers
    @GetMapping
    public String listCustomers(Model model, RedirectAttributes redirectAttributes) {
        try {
            List<Customer> customers = customerService.findAllCustomers();
            model.addAttribute("customers", customers);
            return "customer/customerList";
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Error loading customers: " + e.getMessage());
            return "redirect:/backoffice";
        }
    }

    // CREATE - Show empty form to create new customer
    @GetMapping("/new")
    public String showCreateForm(Model model, RedirectAttributes redirectAttributes) {
        try {
            model.addAttribute("customer", new Customer());
            model.addAttribute("users", userService.findAllUsers());
            model.addAttribute("addresses", addressService.findAllAddresses());
            return "customer/customerForm";
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Error loading form: " + e.getMessage());
            return "redirect:/backoffice/customers";
        }
    }

    // CREATE - Process form submission to save new customer
    @PostMapping
    public String createCustomer(@Valid @ModelAttribute Customer customer,
                                 BindingResult result,
                                 Model model,
                                 RedirectAttributes redirectAttributes) {
        if (result.hasErrors()) {
            try {
                model.addAttribute("users", userService.findAllUsers());
                model.addAttribute("addresses", addressService.findAllAddresses());
            } catch (Exception e) {
                redirectAttributes.addFlashAttribute("errorMessage", "Error loading form data");
                return "redirect:/backoffice/customers";
            }
            return "customer/customerForm";
        }

        try {
            customerService.saveCustomer(customer);
            redirectAttributes.addFlashAttribute("successMessage", "Customer created successfully!");
            return "redirect:/backoffice/customers";
        } catch (DataIntegrityViolationException e) {
            redirectAttributes.addFlashAttribute("errorMessage", "This user is already assigned to a customer!");
            return "redirect:/backoffice/customers/new";
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Error creating customer: " + e.getMessage());
            return "redirect:/backoffice/customers/new";
        }
    }

    // READ - View details of specific customer
    @GetMapping("/{id}")
    public String viewCustomer(@PathVariable int id, Model model, RedirectAttributes redirectAttributes) {
        try {
            Optional<Customer> customer = customerService.findCustomerById(id);
            if (customer.isPresent()) {
                model.addAttribute("customer", customer.get());
                return "customer/customerView";
            } else {
                redirectAttributes.addFlashAttribute("errorMessage", "Customer with ID " + id + " not found!");
                return "redirect:/backoffice/customers";
            }
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Error loading customer: " + e.getMessage());
            return "redirect:/backoffice/customers";
        }
    }

    // UPDATE - Show pre-filled form to edit existing customer
    @GetMapping("/{id}/edit")
    public String showEditForm(@PathVariable int id, Model model, RedirectAttributes redirectAttributes) {
        try {
            Optional<Customer> customer = customerService.findCustomerById(id);
            if (customer.isEmpty()) {
                redirectAttributes.addFlashAttribute("errorMessage", "Customer not found!");
                return "redirect:/backoffice/customers";
            }

            model.addAttribute("customer", customer.get());
            model.addAttribute("users", userService.findAllUsers());
            model.addAttribute("addresses", addressService.findAllAddresses());
            return "customer/customerForm";
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Error loading edit form: " + e.getMessage());
            return "redirect:/backoffice/customers";
        }
    }

    // UPDATE - Process form submission to update customer
    @PostMapping("/{id}")
    public String updateCustomer(@PathVariable int id,
                                 @Valid @ModelAttribute Customer customer,
                                 BindingResult result,
                                 Model model,
                                 RedirectAttributes redirectAttributes) {
        if (result.hasErrors()) {
            try {
                model.addAttribute("users", userService.findAllUsers());
                model.addAttribute("addresses", addressService.findAllAddresses());
            } catch (Exception e) {
                redirectAttributes.addFlashAttribute("errorMessage", "Error loading form data");
                return "redirect:/backoffice/customers";
            }
            return "customer/customerForm";
        }

        try {
            Optional<Customer> existingOpt = customerService.findCustomerById(id);
            if (existingOpt.isEmpty()) {
                redirectAttributes.addFlashAttribute("errorMessage", "Customer not found!");
                return "redirect:/backoffice/customers";
            }

            Customer existing = existingOpt.get();
            existing.setUser(customer.getUser());
            existing.setAddress(customer.getAddress());
            existing.setPhone(customer.getPhone());
            existing.setEmail(customer.getEmail());
            existing.setActive(customer.getActive());
            customerService.saveCustomer(existing);

            redirectAttributes.addFlashAttribute("successMessage", "Customer updated successfully!");
            return "redirect:/backoffice/customers";
        } catch (DataIntegrityViolationException e) {
            redirectAttributes.addFlashAttribute("errorMessage", "This user is already assigned to another customer!");
            return "redirect:/backoffice/customers/" + id + "/edit";
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Error updating customer: " + e.getMessage());
            return "redirect:/backoffice/customers/" + id + "/edit";
        }
    }

    // DELETE - Delete specific customer
    @PostMapping("/{id}/delete")
    public String deleteCustomer(@PathVariable int id, RedirectAttributes redirectAttributes) {
        try {
            customerService.deleteCustomerById(id);
            redirectAttributes.addFlashAttribute("successMessage", "Customer deleted successfully!");
        } catch (DataIntegrityViolationException e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Cannot delete customer with existing orders!");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Error deleting customer: " + e.getMessage());
        }
        return "redirect:/backoffice/customers";
    }
}
