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
import com.rocketFoodDelivery.rocketFood.models.ProductOrder;

// Project services
import com.rocketFoodDelivery.rocketFood.service.OrderService;
import com.rocketFoodDelivery.rocketFood.service.ProductOrderService;
import com.rocketFoodDelivery.rocketFood.service.ProductService;

@Controller
@RequestMapping("/backoffice/product-orders")
public class ProductOrderController {

    @Autowired
    private ProductOrderService productOrderService;

    @Autowired
    private ProductService productService;

    @Autowired
    private OrderService orderService;

    // READ - List all product orders
    @GetMapping
    public String listProductOrders(Model model, RedirectAttributes redirectAttributes) {
        try {
            List<ProductOrder> productOrders = productOrderService.findAllProductOrders();
            model.addAttribute("productOrders", productOrders);
            return "productOrder/productOrderList";
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Error loading product orders: " + e.getMessage());
            return "redirect:/backoffice";
        }
    }

    // CREATE - Show empty form to create new product order
    @GetMapping("/new")
    public String showCreateForm(Model model, RedirectAttributes redirectAttributes) {
        try {
            model.addAttribute("productOrder", new ProductOrder());
            model.addAttribute("products", productService.findAllProducts());
            model.addAttribute("orders", orderService.findAllOrders());
            return "productOrder/productOrderForm";
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Error loading form: " + e.getMessage());
            return "redirect:/backoffice/product-orders";
        }
    }

    // CREATE - Process form submission to save new product order
    // Business Rule 1: Cannot create two product_orders with the same product_id for the same order.
    // Business Rule 2: Each product_order must belong to the same restaurant as the associated order.
    @PostMapping
    public String createProductOrder(@Valid @ModelAttribute ProductOrder productOrder,
                                     BindingResult result,
                                     Model model,
                                     RedirectAttributes redirectAttributes) {
        if (result.hasErrors()) {
            try {
                model.addAttribute("products", productService.findAllProducts());
                model.addAttribute("orders", orderService.findAllOrders());
            } catch (Exception e) {
                redirectAttributes.addFlashAttribute("errorMessage", "Error loading form data");
                return "redirect:/backoffice/product-orders";
            }
            return "productOrder/productOrderForm";
        }

        try {
            productOrderService.createProductOrder(productOrder.getProduct().getId(), productOrder.getOrder().getId(), productOrder.getProductQuantity(), productOrder.getProductUnitCost());
            redirectAttributes.addFlashAttribute("successMessage", "Product order created successfully!");
            return "redirect:/backoffice/product-orders";
        } catch (IllegalArgumentException e) {
            redirectAttributes.addFlashAttribute("errorMessage", e.getMessage());
            return "redirect:/backoffice/product-orders/new";
        } catch (DataIntegrityViolationException e) {
            redirectAttributes.addFlashAttribute("errorMessage", "This product is already in the order!");
            return "redirect:/backoffice/product-orders/new";
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Error creating product order: " + e.getMessage());
            return "redirect:/backoffice/product-orders/new";
        }
    }

    // READ - View details of specific product order
    @GetMapping("/{id}")
    public String viewProductOrder(@PathVariable int id, Model model, RedirectAttributes redirectAttributes) {
        try {
            Optional<ProductOrder> productOrder = productOrderService.findProductOrderById(id);
            if (productOrder.isPresent()) {
                model.addAttribute("productOrder", productOrder.get());
                return "productOrder/productOrderView";
            } else {
                redirectAttributes.addFlashAttribute("errorMessage", "Product order with ID " + id + " not found!");
                return "redirect:/backoffice/product-orders";
            }
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Error loading product order: " + e.getMessage());
            return "redirect:/backoffice/product-orders";
        }
    }

    // UPDATE - Show pre-filled form to edit existing product order
    @GetMapping("/{id}/edit")
    public String showEditForm(@PathVariable int id, Model model, RedirectAttributes redirectAttributes) {
        try {
            Optional<ProductOrder> productOrder = productOrderService.findProductOrderById(id);
            if (productOrder.isEmpty()) {
                redirectAttributes.addFlashAttribute("errorMessage", "Product order not found!");
                return "redirect:/backoffice/product-orders";
            }

            model.addAttribute("productOrder", productOrder.get());
            model.addAttribute("products", productService.findAllProducts());
            model.addAttribute("orders", orderService.findAllOrders());
            return "productOrder/productOrderForm";
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Error loading edit form: " + e.getMessage());
            return "redirect:/backoffice/product-orders";
        }
    }

    // UPDATE - Process form submission to update product order
    // Business Rule 1: Cannot create two product_orders with the same product_id for the same order.
    // Business Rule 2: Each product_order must belong to the same restaurant as the associated order.
    @PostMapping("/{id}")
    public String updateProductOrder(@PathVariable int id,
                                     @Valid @ModelAttribute ProductOrder productOrder,
                                     BindingResult result,
                                     Model model,
                                     RedirectAttributes redirectAttributes) {
        if (result.hasErrors()) {
            try {
                model.addAttribute("products", productService.findAllProducts());
                model.addAttribute("orders", orderService.findAllOrders());
            } catch (Exception e) {
                redirectAttributes.addFlashAttribute("errorMessage", "Error loading form data");
                return "redirect:/backoffice/product-orders";
            }
            return "productOrder/productOrderForm";
        }

        try {
            Optional<ProductOrder> existingOpt = productOrderService.findProductOrderById(id);
            if (existingOpt.isEmpty()) {
                redirectAttributes.addFlashAttribute("errorMessage", "Product order not found!");
                return "redirect:/backoffice/product-orders";
            }

            productOrderService.updateProductOrder(id, productOrder.getProduct().getId(), productOrder.getOrder().getId(), productOrder.getProductQuantity(), productOrder.getProductUnitCost());

            redirectAttributes.addFlashAttribute("successMessage", "Product order updated successfully!");
            return "redirect:/backoffice/product-orders";
        } catch (IllegalArgumentException e) {
            redirectAttributes.addFlashAttribute("errorMessage", e.getMessage());
            return "redirect:/backoffice/product-orders/" + id + "/edit";
        } catch (DataIntegrityViolationException e) {
            redirectAttributes.addFlashAttribute("errorMessage", "This product is already in the order!");
            return "redirect:/backoffice/product-orders/" + id + "/edit";
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Error updating product order: " + e.getMessage());
            return "redirect:/backoffice/product-orders/" + id + "/edit";
        }
    }

    // DELETE - Delete specific product order
    @PostMapping("/{id}/delete")
    public String deleteProductOrder(@PathVariable int id, RedirectAttributes redirectAttributes) {
        try {
            productOrderService.deleteProductOrderById(id);
            redirectAttributes.addFlashAttribute("successMessage", "Product order deleted successfully!");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Error deleting product order: " + e.getMessage());
        }
        return "redirect:/backoffice/product-orders";
    }
}
