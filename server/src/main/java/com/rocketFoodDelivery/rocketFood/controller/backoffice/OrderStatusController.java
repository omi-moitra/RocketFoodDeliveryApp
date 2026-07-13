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
import com.rocketFoodDelivery.rocketFood.models.OrderStatus;

// Project services
import com.rocketFoodDelivery.rocketFood.service.OrderStatusService;

@Controller
@RequestMapping("/backoffice/order-statuses")
public class OrderStatusController {

    @Autowired
    private OrderStatusService orderStatusService;

    // READ - List all order statuses
    @GetMapping
    public String listOrderStatuses(Model model, RedirectAttributes redirectAttributes) {
        try {
            List<OrderStatus> orderStatuses = orderStatusService.findAllOrderStatuses();
            model.addAttribute("orderStatuses", orderStatuses);
            return "orderStatus/orderStatusList";
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Error loading order statuses: " + e.getMessage());
            return "redirect:/backoffice";
        }
    }

    // CREATE - Show empty form to create new order status
    @GetMapping("/new")
    public String showCreateForm(Model model, RedirectAttributes redirectAttributes) {
        try {
            model.addAttribute("orderStatus", new OrderStatus());
            return "orderStatus/orderStatusForm";
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Error loading form: " + e.getMessage());
            return "redirect:/backoffice/order-statuses";
        }
    }

    // CREATE - Process form submission to save new order status
    @PostMapping
    public String createOrderStatus(@Valid @ModelAttribute OrderStatus orderStatus,
                                    BindingResult result,
                                    Model model,
                                    RedirectAttributes redirectAttributes) {
        if (result.hasErrors()) {
            return "orderStatus/orderStatusForm";
        }

        try {
            orderStatusService.saveOrderStatus(orderStatus);
            redirectAttributes.addFlashAttribute("successMessage", "Order status created successfully!");
            return "redirect:/backoffice/order-statuses";
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Error creating order status: " + e.getMessage());
            return "redirect:/backoffice/order-statuses/new";
        }
    }

    // READ - View details of specific order status
    @GetMapping("/{id}")
    public String viewOrderStatus(@PathVariable int id, Model model, RedirectAttributes redirectAttributes) {
        try {
            Optional<OrderStatus> orderStatus = orderStatusService.findOrderStatusById(id);
            if (orderStatus.isPresent()) {
                model.addAttribute("orderStatus", orderStatus.get());
                return "orderStatus/orderStatusView";
            } else {
                redirectAttributes.addFlashAttribute("errorMessage", "Order status with ID " + id + " not found!");
                return "redirect:/backoffice/order-statuses";
            }
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Error loading order status: " + e.getMessage());
            return "redirect:/backoffice/order-statuses";
        }
    }

    // UPDATE - Show pre-filled form to edit existing order status
    @GetMapping("/{id}/edit")
    public String showEditForm(@PathVariable int id, Model model, RedirectAttributes redirectAttributes) {
        try {
            Optional<OrderStatus> orderStatus = orderStatusService.findOrderStatusById(id);
            if (orderStatus.isEmpty()) {
                redirectAttributes.addFlashAttribute("errorMessage", "Order status not found!");
                return "redirect:/backoffice/order-statuses";
            }

            model.addAttribute("orderStatus", orderStatus.get());
            return "orderStatus/orderStatusForm";
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Error loading edit form: " + e.getMessage());
            return "redirect:/backoffice/order-statuses";
        }
    }

    // UPDATE - Process form submission to update order status
    @PostMapping("/{id}")
    public String updateOrderStatus(@PathVariable int id,
                                    @Valid @ModelAttribute OrderStatus orderStatus,
                                    BindingResult result,
                                    Model model,
                                    RedirectAttributes redirectAttributes) {
        if (result.hasErrors()) {
            return "orderStatus/orderStatusForm";
        }

        try {
            Optional<OrderStatus> existingOpt = orderStatusService.findOrderStatusById(id);
            if (existingOpt.isEmpty()) {
                redirectAttributes.addFlashAttribute("errorMessage", "Order status not found!");
                return "redirect:/backoffice/order-statuses";
            }

            OrderStatus existing = existingOpt.get();
            existing.setName(orderStatus.getName());
            orderStatusService.saveOrderStatus(existing);

            redirectAttributes.addFlashAttribute("successMessage", "Order status updated successfully!");
            return "redirect:/backoffice/order-statuses";
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Error updating order status: " + e.getMessage());
            return "redirect:/backoffice/order-statuses/" + id + "/edit";
        }
    }

    // DELETE - Delete specific order status
    @PostMapping("/{id}/delete")
    public String deleteOrderStatus(@PathVariable int id, RedirectAttributes redirectAttributes) {
        try {
            orderStatusService.deleteOrderStatusById(id);
            redirectAttributes.addFlashAttribute("successMessage", "Order status deleted successfully!");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Cannot delete order status with existing orders!");
        }
        return "redirect:/backoffice/order-statuses";
    }
}
