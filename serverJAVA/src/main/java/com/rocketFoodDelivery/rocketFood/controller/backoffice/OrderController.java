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
import com.rocketFoodDelivery.rocketFood.models.Order;

// Project services
import com.rocketFoodDelivery.rocketFood.service.CustomerService;
import com.rocketFoodDelivery.rocketFood.service.OrderService;
import com.rocketFoodDelivery.rocketFood.service.OrderStatusService;
import com.rocketFoodDelivery.rocketFood.service.RestaurantService;

@Controller
@RequestMapping("/backoffice/orders")
public class OrderController {

    @Autowired
    private OrderService orderService;

    @Autowired
    private RestaurantService restaurantService;

    @Autowired
    private CustomerService customerService;

    @Autowired
    private OrderStatusService orderStatusService;

    // READ - List all orders
    @GetMapping
    public String listOrders(Model model, RedirectAttributes redirectAttributes) {
        try {
            List<Order> orders = orderService.findAllOrders();
            model.addAttribute("orders", orders);
            return "order/orderList";
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Error loading orders: " + e.getMessage());
            return "redirect:/backoffice";
        }
    }

    // CREATE - Show empty form to create new order
    @GetMapping("/new")
    public String showCreateForm(Model model, RedirectAttributes redirectAttributes) {
        try {
            model.addAttribute("order", new Order());
            model.addAttribute("restaurants", restaurantService.findAllRestaurants());
            model.addAttribute("customers", customerService.findAllCustomers());
            model.addAttribute("orderStatuses", orderStatusService.findAllOrderStatuses());
            return "order/orderForm";
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Error loading form: " + e.getMessage());
            return "redirect:/backoffice/orders";
        }
    }

    // CREATE - Process form submission to save new order
    @PostMapping
    public String createOrder(@Valid @ModelAttribute Order order,
                              BindingResult result,
                              Model model,
                              RedirectAttributes redirectAttributes) {
        if (result.hasErrors()) {
            try {
                model.addAttribute("restaurants", restaurantService.findAllRestaurants());
                model.addAttribute("customers", customerService.findAllCustomers());
                model.addAttribute("orderStatuses", orderStatusService.findAllOrderStatuses());
            } catch (Exception e) {
                redirectAttributes.addFlashAttribute("errorMessage", "Error loading form data");
                return "redirect:/backoffice/orders";
            }
            return "order/orderForm";
        }

        try {
            orderService.saveOrder(order);
            redirectAttributes.addFlashAttribute("successMessage", "Order created successfully!");
            return "redirect:/backoffice/orders";
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Error creating order: " + e.getMessage());
            return "redirect:/backoffice/orders/new";
        }
    }

    // READ - View details of specific order
    @GetMapping("/{id}")
    public String viewOrder(@PathVariable int id, Model model, RedirectAttributes redirectAttributes) {
        try {
            Optional<Order> order = orderService.findOrderById(id);
            if (order.isPresent()) {
                model.addAttribute("order", order.get());
                return "order/orderView";
            } else {
                redirectAttributes.addFlashAttribute("errorMessage", "Order with ID " + id + " not found!");
                return "redirect:/backoffice/orders";
            }
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Error loading order: " + e.getMessage());
            return "redirect:/backoffice/orders";
        }
    }

    // UPDATE - Show pre-filled form to edit existing order
    @GetMapping("/{id}/edit")
    public String showEditForm(@PathVariable int id, Model model, RedirectAttributes redirectAttributes) {
        try {
            Optional<Order> order = orderService.findOrderById(id);
            if (order.isEmpty()) {
                redirectAttributes.addFlashAttribute("errorMessage", "Order not found!");
                return "redirect:/backoffice/orders";
            }

            model.addAttribute("order", order.get());
            model.addAttribute("restaurants", restaurantService.findAllRestaurants());
            model.addAttribute("customers", customerService.findAllCustomers());
            model.addAttribute("orderStatuses", orderStatusService.findAllOrderStatuses());
            return "order/orderForm";
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Error loading edit form: " + e.getMessage());
            return "redirect:/backoffice/orders";
        }
    }

    // UPDATE - Process form submission to update order
    @PostMapping("/{id}")
    public String updateOrder(@PathVariable int id,
                              @Valid @ModelAttribute Order order,
                              BindingResult result,
                              Model model,
                              RedirectAttributes redirectAttributes) {
        if (result.hasErrors()) {
            try {
                model.addAttribute("restaurants", restaurantService.findAllRestaurants());
                model.addAttribute("customers", customerService.findAllCustomers());
                model.addAttribute("orderStatuses", orderStatusService.findAllOrderStatuses());
            } catch (Exception e) {
                redirectAttributes.addFlashAttribute("errorMessage", "Error loading form data");
                return "redirect:/backoffice/orders";
            }
            return "order/orderForm";
        }

        try {
            Optional<Order> existingOpt = orderService.findOrderById(id);
            if (existingOpt.isEmpty()) {
                redirectAttributes.addFlashAttribute("errorMessage", "Order not found!");
                return "redirect:/backoffice/orders";
            }

            Order existing = existingOpt.get();
            existing.setRestaurant(order.getRestaurant());
            existing.setCustomer(order.getCustomer());
            existing.setOrderStatus(order.getOrderStatus());
            existing.setRestaurantRating(order.getRestaurantRating());
            orderService.saveOrder(existing);

            redirectAttributes.addFlashAttribute("successMessage", "Order updated successfully!");
            return "redirect:/backoffice/orders";
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Error updating order: " + e.getMessage());
            return "redirect:/backoffice/orders/" + id + "/edit";
        }
    }

    // DELETE - Delete specific order (CASCADE deletes product_orders)
    @PostMapping("/{id}/delete")
    public String deleteOrder(@PathVariable int id, RedirectAttributes redirectAttributes) {
        try {
            orderService.deleteOrderById(id);
            redirectAttributes.addFlashAttribute("successMessage", "Order deleted successfully!");
        } catch (DataIntegrityViolationException e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Cannot delete order with existing associations!");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Error deleting order: " + e.getMessage());
        }
        return "redirect:/backoffice/orders";
    }
}
