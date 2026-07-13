package com.rocketFoodDelivery.rocketFood.controller.backoffice;

// Java standard library
import java.util.List;
import java.util.Optional;

// Jakarta EE
import jakarta.validation.Valid;

// Spring Framework
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

// Project models
import com.rocketFoodDelivery.rocketFood.models.CourierStatus;

// Project services
import com.rocketFoodDelivery.rocketFood.service.CourierStatusService;

@Controller
@RequestMapping("/backoffice/courier-statuses")
public class CourierStatusController {

    @Autowired
    private CourierStatusService courierStatusService;

    // READ - List all courier statuses
    @GetMapping
    public String listCourierStatuses(Model model, RedirectAttributes redirectAttributes) {
        try {
            List<CourierStatus> courierStatuses = courierStatusService.findAllCourierStatuses();
            model.addAttribute("courierStatuses", courierStatuses);
            return "courierStatus/courierStatusList";
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Error loading courier statuses: " + e.getMessage());
            return "redirect:/backoffice";
        }
    }

    // CREATE - Show empty form to create new courier status
    @GetMapping("/new")
    public String showCreateForm(Model model, RedirectAttributes redirectAttributes) {
        try {
            model.addAttribute("courierStatus", new CourierStatus());
            return "courierStatus/courierStatusForm";
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Error loading form: " + e.getMessage());
            return "redirect:/backoffice/courier-statuses";
        }
    }

    // CREATE - Process form submission to save new courier status
    @PostMapping
    public String createCourierStatus(@Valid @ModelAttribute CourierStatus courierStatus,
                                      BindingResult result,
                                      Model model,
                                      RedirectAttributes redirectAttributes) {
        if (result.hasErrors()) {
            return "courierStatus/courierStatusForm";
        }

        try {
            courierStatusService.saveCourierStatus(courierStatus);
            redirectAttributes.addFlashAttribute("successMessage", "Courier status created successfully!");
            return "redirect:/backoffice/courier-statuses";
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Error creating courier status: " + e.getMessage());
            return "redirect:/backoffice/courier-statuses/new";
        }
    }

    // READ - View details of specific courier status
    @GetMapping("/{id}")
    public String viewCourierStatus(@PathVariable int id, Model model, RedirectAttributes redirectAttributes) {
        try {
            Optional<CourierStatus> courierStatus = courierStatusService.findCourierStatusById(id);
            if (courierStatus.isPresent()) {
                model.addAttribute("courierStatus", courierStatus.get());
                return "courierStatus/courierStatusView";
            } else {
                redirectAttributes.addFlashAttribute("errorMessage", "Courier status with ID " + id + " not found!");
                return "redirect:/backoffice/courier-statuses";
            }
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Error loading courier status: " + e.getMessage());
            return "redirect:/backoffice/courier-statuses";
        }
    }

    // UPDATE - Show pre-filled form to edit existing courier status
    @GetMapping("/{id}/edit")
    public String showEditForm(@PathVariable int id, Model model, RedirectAttributes redirectAttributes) {
        try {
            Optional<CourierStatus> courierStatus = courierStatusService.findCourierStatusById(id);
            if (courierStatus.isEmpty()) {
                redirectAttributes.addFlashAttribute("errorMessage", "Courier status not found!");
                return "redirect:/backoffice/courier-statuses";
            }

            model.addAttribute("courierStatus", courierStatus.get());
            return "courierStatus/courierStatusForm";
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Error loading edit form: " + e.getMessage());
            return "redirect:/backoffice/courier-statuses";
        }
    }

    // UPDATE - Process form submission to update courier status
    @PostMapping("/{id}")
    public String updateCourierStatus(@PathVariable int id,
                                      @Valid @ModelAttribute CourierStatus courierStatus,
                                      BindingResult result,
                                      Model model,
                                      RedirectAttributes redirectAttributes) {
        if (result.hasErrors()) {
            return "courierStatus/courierStatusForm";
        }

        try {
            Optional<CourierStatus> existingOpt = courierStatusService.findCourierStatusById(id);
            if (existingOpt.isEmpty()) {
                redirectAttributes.addFlashAttribute("errorMessage", "Courier status not found!");
                return "redirect:/backoffice/courier-statuses";
            }

            CourierStatus existing = existingOpt.get();
            existing.setName(courierStatus.getName());
            courierStatusService.saveCourierStatus(existing);

            redirectAttributes.addFlashAttribute("successMessage", "Courier status updated successfully!");
            return "redirect:/backoffice/courier-statuses";
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Error updating courier status: " + e.getMessage());
            return "redirect:/backoffice/courier-statuses/" + id + "/edit";
        }
    }

    // DELETE - Delete specific courier status
    @PostMapping("/{id}/delete")
    public String deleteCourierStatus(@PathVariable int id, RedirectAttributes redirectAttributes) {
        try {
            courierStatusService.deleteCourierStatusById(id);
            redirectAttributes.addFlashAttribute("successMessage", "Courier status deleted successfully!");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Cannot delete courier status with existing couriers!");
        }
        return "redirect:/backoffice/courier-statuses";
    }
}
