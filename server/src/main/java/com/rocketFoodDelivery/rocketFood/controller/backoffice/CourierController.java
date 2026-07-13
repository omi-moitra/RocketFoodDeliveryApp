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
import com.rocketFoodDelivery.rocketFood.models.Courier;

// Project services
import com.rocketFoodDelivery.rocketFood.service.AddressService;
import com.rocketFoodDelivery.rocketFood.service.CourierService;
import com.rocketFoodDelivery.rocketFood.service.CourierStatusService;
import com.rocketFoodDelivery.rocketFood.service.UserService;

@Controller
@RequestMapping("/backoffice/couriers")
public class CourierController {

    @Autowired
    private CourierService courierService;

    @Autowired
    private UserService userService;

    @Autowired
    private AddressService addressService;

    @Autowired
    private CourierStatusService courierStatusService;

    // READ - List all couriers
    @GetMapping
    public String listCouriers(Model model, RedirectAttributes redirectAttributes) {
        try {
            List<Courier> couriers = courierService.findAllCouriers();
            model.addAttribute("couriers", couriers);
            return "courier/courierList";
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Error loading couriers: " + e.getMessage());
            return "redirect:/backoffice";
        }
    }

    // CREATE - Show empty form to create new courier
    @GetMapping("/new")
    public String showCreateForm(Model model, RedirectAttributes redirectAttributes) {
        try {
            model.addAttribute("courier", new Courier());
            model.addAttribute("users", userService.findAllUsers());
            model.addAttribute("addresses", addressService.findAllAddresses());
            model.addAttribute("courierStatuses", courierStatusService.findAllCourierStatuses());
            return "courier/courierForm";
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Error loading form: " + e.getMessage());
            return "redirect:/backoffice/couriers";
        }
    }

    // CREATE - Process form submission to save new courier
    @PostMapping
    public String createCourier(@Valid @ModelAttribute Courier courier,
                                BindingResult result,
                                Model model,
                                RedirectAttributes redirectAttributes) {
        if (result.hasErrors()) {
            try {
                model.addAttribute("users", userService.findAllUsers());
                model.addAttribute("addresses", addressService.findAllAddresses());
                model.addAttribute("courierStatuses", courierStatusService.findAllCourierStatuses());
            } catch (Exception e) {
                redirectAttributes.addFlashAttribute("errorMessage", "Error loading form data");
                return "redirect:/backoffice/couriers";
            }
            return "courier/courierForm";
        }

        try {
            courierService.saveCourier(courier);
            redirectAttributes.addFlashAttribute("successMessage", "Courier created successfully!");
            return "redirect:/backoffice/couriers";
        } catch (DataIntegrityViolationException e) {
            redirectAttributes.addFlashAttribute("errorMessage", "This user is already assigned to a courier!");
            return "redirect:/backoffice/couriers/new";
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Error creating courier: " + e.getMessage());
            return "redirect:/backoffice/couriers/new";
        }
    }

    // READ - View details of specific courier
    @GetMapping("/{id}")
    public String viewCourier(@PathVariable int id, Model model, RedirectAttributes redirectAttributes) {
        try {
            Optional<Courier> courier = courierService.findCourierById(id);
            if (courier.isPresent()) {
                model.addAttribute("courier", courier.get());
                return "courier/courierView";
            } else {
                redirectAttributes.addFlashAttribute("errorMessage", "Courier with ID " + id + " not found!");
                return "redirect:/backoffice/couriers";
            }
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Error loading courier: " + e.getMessage());
            return "redirect:/backoffice/couriers";
        }
    }

    // UPDATE - Show pre-filled form to edit existing courier
    @GetMapping("/{id}/edit")
    public String showEditForm(@PathVariable int id, Model model, RedirectAttributes redirectAttributes) {
        try {
            Optional<Courier> courier = courierService.findCourierById(id);
            if (courier.isEmpty()) {
                redirectAttributes.addFlashAttribute("errorMessage", "Courier not found!");
                return "redirect:/backoffice/couriers";
            }

            model.addAttribute("courier", courier.get());
            model.addAttribute("users", userService.findAllUsers());
            model.addAttribute("addresses", addressService.findAllAddresses());
            model.addAttribute("courierStatuses", courierStatusService.findAllCourierStatuses());
            return "courier/courierForm";
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Error loading edit form: " + e.getMessage());
            return "redirect:/backoffice/couriers";
        }
    }

    // UPDATE - Process form submission to update courier
    @PostMapping("/{id}")
    public String updateCourier(@PathVariable int id,
                                @Valid @ModelAttribute Courier courier,
                                BindingResult result,
                                Model model,
                                RedirectAttributes redirectAttributes) {
        if (result.hasErrors()) {
            try {
                model.addAttribute("users", userService.findAllUsers());
                model.addAttribute("addresses", addressService.findAllAddresses());
                model.addAttribute("courierStatuses", courierStatusService.findAllCourierStatuses());
            } catch (Exception e) {
                redirectAttributes.addFlashAttribute("errorMessage", "Error loading form data");
                return "redirect:/backoffice/couriers";
            }
            return "courier/courierForm";
        }

        try {
            Optional<Courier> existingOpt = courierService.findCourierById(id);
            if (existingOpt.isEmpty()) {
                redirectAttributes.addFlashAttribute("errorMessage", "Courier not found!");
                return "redirect:/backoffice/couriers";
            }

            Courier existing = existingOpt.get();
            existing.setUser(courier.getUser());
            existing.setAddress(courier.getAddress());
            existing.setCourierStatus(courier.getCourierStatus());
            existing.setPhone(courier.getPhone());
            existing.setEmail(courier.getEmail());
            existing.setActive(courier.getActive());
            courierService.saveCourier(existing);

            redirectAttributes.addFlashAttribute("successMessage", "Courier updated successfully!");
            return "redirect:/backoffice/couriers";
        } catch (DataIntegrityViolationException e) {
            redirectAttributes.addFlashAttribute("errorMessage", "This user is already assigned to another courier!");
            return "redirect:/backoffice/couriers/" + id + "/edit";
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Error updating courier: " + e.getMessage());
            return "redirect:/backoffice/couriers/" + id + "/edit";
        }
    }

    // DELETE - Delete specific courier
    @PostMapping("/{id}/delete")
    public String deleteCourier(@PathVariable int id, RedirectAttributes redirectAttributes) {
        try {
            courierService.deleteCourierById(id);
            redirectAttributes.addFlashAttribute("successMessage", "Courier deleted successfully!");
        } catch (DataIntegrityViolationException e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Cannot delete courier with existing references!");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Error deleting courier: " + e.getMessage());
        }
        return "redirect:/backoffice/couriers";
    }
}
