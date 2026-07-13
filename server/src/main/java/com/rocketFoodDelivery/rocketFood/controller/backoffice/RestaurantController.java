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
import com.rocketFoodDelivery.rocketFood.models.Restaurant;

// Project services
import com.rocketFoodDelivery.rocketFood.service.AddressService;
import com.rocketFoodDelivery.rocketFood.service.RestaurantService;
import com.rocketFoodDelivery.rocketFood.service.UserService;

@Controller
@RequestMapping("/backoffice/restaurants")
public class RestaurantController {
    
    @Autowired
    private RestaurantService restaurantService;
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private AddressService addressService;

    // READ - List all restaurants (index/list view)
    @GetMapping
    public String listRestaurants(Model model, RedirectAttributes redirectAttributes) {
        try {
            List<Restaurant> restaurants = restaurantService.findAllRestaurants();
            model.addAttribute("restaurants", restaurants);
            return "restaurant/restaurantList";
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Error loading restaurants: " + e.getMessage());
            return "redirect:/backoffice";
        }
    }

    // CREATE - Show empty form to create new restaurant
    @GetMapping("/new")
    public String showCreateForm(Model model, RedirectAttributes redirectAttributes) {
        try {
            model.addAttribute("restaurant", new Restaurant());
            model.addAttribute("users", userService.findAllUsers());
            model.addAttribute("addresses", addressService.findAvailableAddresses(null));
            return "restaurant/restaurantForm";
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Error loading form: " + e.getMessage());
            return "redirect:/backoffice/restaurants";
        }
    }

    // CREATE - Process form submission to save new restaurant
    @PostMapping
    public String createRestaurant(@Valid @ModelAttribute Restaurant restaurant, 
                                   BindingResult result,
                                   Model model,
                                   RedirectAttributes redirectAttributes) {
        if (result.hasErrors()) {
            try {
                model.addAttribute("users", userService.findAllUsers());
                model.addAttribute("addresses", addressService.findAvailableAddresses(null));
            } catch (Exception e) {
                redirectAttributes.addFlashAttribute("errorMessage", "Error loading form data");
                return "redirect:/backoffice/restaurants";
            }
            return "restaurant/restaurantForm";
        }
        
        try {
            restaurantService.saveRestaurant(restaurant);
            redirectAttributes.addFlashAttribute("successMessage", "Restaurant created successfully!");
            return "redirect:/backoffice/restaurants";
        } catch (DataIntegrityViolationException e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Restaurant with this address already exists!");
            return "redirect:/backoffice/restaurants/new";
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Error creating restaurant: " + e.getMessage());
            return "redirect:/backoffice/restaurants/new";
        }
    }

    // READ - View details of specific restaurant
    @GetMapping("/{id}")
    public String viewRestaurant(@PathVariable int id, Model model, RedirectAttributes redirectAttributes) {
        try {
            Optional<Restaurant> restaurant = restaurantService.findRestaurantById(id);
            if (restaurant.isPresent()) {
                model.addAttribute("restaurant", restaurant.get());
                return "restaurant/restaurantView";
            } else {
                redirectAttributes.addFlashAttribute("errorMessage", "Restaurant with ID " + id + " not found!");
                return "redirect:/backoffice/restaurants";
            }
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Error loading restaurant: " + e.getMessage());
            return "redirect:/backoffice/restaurants";
        }
    }

    // UPDATE - Show pre-filled form to edit existing restaurant
    @GetMapping("/{id}/edit")
    public String showEditForm(@PathVariable int id, Model model, RedirectAttributes redirectAttributes) {
        try {
            Optional<Restaurant> restaurant = restaurantService.findRestaurantById(id);
            if (restaurant.isEmpty()) {
                redirectAttributes.addFlashAttribute("errorMessage", "Restaurant not found!");
                return "redirect:/backoffice/restaurants";
            }
            
            model.addAttribute("restaurant", restaurant.get());
            model.addAttribute("users", userService.findAllUsers());
            model.addAttribute("addresses", addressService.findAvailableAddresses(id));
            
            return "restaurant/restaurantForm";
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Error loading edit form: " + e.getMessage());
            return "redirect:/backoffice/restaurants";
        }
    }

    // UPDATE - Process form submission to update restaurant
    @PostMapping("/{id}")
    public String updateRestaurant(@PathVariable int id, 
                                   @Valid @ModelAttribute Restaurant restaurant,
                                   BindingResult result,
                                   Model model,
                                   RedirectAttributes redirectAttributes) {
        if (result.hasErrors()) {
            try {
                model.addAttribute("users", userService.findAllUsers());
                model.addAttribute("addresses", addressService.findAvailableAddresses(id));
            } catch (Exception e) {
                redirectAttributes.addFlashAttribute("errorMessage", "Error loading form data");
                return "redirect:/backoffice/restaurants";
            }
            return "restaurant/restaurantForm";
        }
        
        try {
            Optional<Restaurant> existingOpt = restaurantService.findRestaurantById(id);
            if (existingOpt.isEmpty()) {
                redirectAttributes.addFlashAttribute("errorMessage", "Restaurant not found!");
                return "redirect:/backoffice/restaurants";
            }

            Restaurant existing = existingOpt.get();
            existing.setUser(restaurant.getUser());
            existing.setAddress(restaurant.getAddress());
            existing.setName(restaurant.getName());
            existing.setPriceRange(restaurant.getPriceRange());
            existing.setPhone(restaurant.getPhone());
            existing.setEmail(restaurant.getEmail());
            existing.setActive(restaurant.isActive());
            restaurantService.saveRestaurant(existing);
            
            redirectAttributes.addFlashAttribute("successMessage", "Restaurant updated successfully!");
            return "redirect:/backoffice/restaurants";
        } catch (DataIntegrityViolationException e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Address already assigned to another restaurant!");
            return "redirect:/backoffice/restaurants/" + id + "/edit";
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Error updating restaurant: " + e.getMessage());
            return "redirect:/backoffice/restaurants/" + id + "/edit";
        }
    }

    // DELETE - Delete specific restaurant
    @PostMapping("/{id}/delete")
    public String deleteRestaurant(@PathVariable int id, RedirectAttributes redirectAttributes) {
        try {
            restaurantService.deleteRestaurantById(id);
            redirectAttributes.addFlashAttribute("successMessage", "Restaurant deleted successfully!");
        } catch (DataIntegrityViolationException e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Cannot delete restaurant with existing orders!");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Error deleting restaurant: " + e.getMessage());
        }
        return "redirect:/backoffice/restaurants";
    }
}