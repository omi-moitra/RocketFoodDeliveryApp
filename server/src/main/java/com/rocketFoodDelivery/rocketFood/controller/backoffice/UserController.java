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
import com.rocketFoodDelivery.rocketFood.models.User;

// Project services
import com.rocketFoodDelivery.rocketFood.service.UserService;

@Controller
@RequestMapping("/backoffice/users")
public class UserController {

    @Autowired
    private UserService userService;

    // READ - List all users
    @GetMapping
    public String listUsers(Model model, RedirectAttributes redirectAttributes) {
        try {
            List<User> users = userService.findAllUsers();
            model.addAttribute("users", users);
            return "user/userList";
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Error loading users: " + e.getMessage());
            return "redirect:/backoffice";
        }
    }

    // CREATE - Show empty form to create new user
    @GetMapping("/new")
    public String showCreateForm(Model model, RedirectAttributes redirectAttributes) {
        try {
            model.addAttribute("user", new User());
            return "user/userForm";
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Error loading form: " + e.getMessage());
            return "redirect:/backoffice/users";
        }
    }

    // CREATE - Process form submission to save new user
    @PostMapping
    public String createUser(@Valid @ModelAttribute User user,
                             BindingResult result,
                             Model model,
                             RedirectAttributes redirectAttributes) {
        if (result.hasErrors()) {
            return "user/userForm";
        }

        try {
            userService.saveUser(user);
            redirectAttributes.addFlashAttribute("successMessage", "User created successfully!");
            return "redirect:/backoffice/users";
        } catch (DataIntegrityViolationException e) {
            redirectAttributes.addFlashAttribute("errorMessage", "A user with this email already exists!");
            return "redirect:/backoffice/users/new";
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Error creating user: " + e.getMessage());
            return "redirect:/backoffice/users/new";
        }
    }

    // READ - View details of specific user
    @GetMapping("/{id}")
    public String viewUser(@PathVariable int id, Model model, RedirectAttributes redirectAttributes) {
        try {
            Optional<User> user = userService.findUserById(id);
            if (user.isPresent()) {
                model.addAttribute("user", user.get());
                return "user/userView";
            } else {
                redirectAttributes.addFlashAttribute("errorMessage", "User with ID " + id + " not found!");
                return "redirect:/backoffice/users";
            }
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Error loading user: " + e.getMessage());
            return "redirect:/backoffice/users";
        }
    }

    // UPDATE - Show pre-filled form to edit existing user
    @GetMapping("/{id}/edit")
    public String showEditForm(@PathVariable int id, Model model, RedirectAttributes redirectAttributes) {
        try {
            Optional<User> user = userService.findUserById(id);
            if (user.isEmpty()) {
                redirectAttributes.addFlashAttribute("errorMessage", "User not found!");
                return "redirect:/backoffice/users";
            }

            model.addAttribute("user", user.get());
            return "user/userForm";
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Error loading edit form: " + e.getMessage());
            return "redirect:/backoffice/users";
        }
    }

    // UPDATE - Process form submission to update user
    @PostMapping("/{id}")
    public String updateUser(@PathVariable int id,
                             @Valid @ModelAttribute User user,
                             BindingResult result,
                             Model model,
                             RedirectAttributes redirectAttributes) {
        if (result.hasErrors()) {
            return "user/userForm";
        }

        try {
            Optional<User> existingOpt = userService.findUserById(id);
            if (existingOpt.isEmpty()) {
                redirectAttributes.addFlashAttribute("errorMessage", "User not found!");
                return "redirect:/backoffice/users";
            }

            User existing = existingOpt.get();
            existing.setName(user.getName());
            existing.setEmail(user.getEmail());
            existing.setPassword(user.getPassword());
            userService.saveUser(existing);

            redirectAttributes.addFlashAttribute("successMessage", "User updated successfully!");
            return "redirect:/backoffice/users";
        } catch (DataIntegrityViolationException e) {
            redirectAttributes.addFlashAttribute("errorMessage", "A user with this email already exists!");
            return "redirect:/backoffice/users/" + id + "/edit";
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Error updating user: " + e.getMessage());
            return "redirect:/backoffice/users/" + id + "/edit";
        }
    }

    // DELETE - Delete specific user
    @PostMapping("/{id}/delete")
    public String deleteUser(@PathVariable int id, RedirectAttributes redirectAttributes) {
        try {
            userService.deleteUserById(id);
            redirectAttributes.addFlashAttribute("successMessage", "User deleted successfully!");
        } catch (DataIntegrityViolationException e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Cannot delete user with existing associations!");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Error deleting user: " + e.getMessage());
        }
        return "redirect:/backoffice/users";
    }
}
