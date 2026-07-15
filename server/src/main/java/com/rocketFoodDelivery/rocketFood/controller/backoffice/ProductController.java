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
import com.rocketFoodDelivery.rocketFood.models.Product;

// Project services
import com.rocketFoodDelivery.rocketFood.service.ProductService;
import com.rocketFoodDelivery.rocketFood.service.RestaurantService;

@Controller
@RequestMapping("/backoffice/products")
public class ProductController {

    @Autowired
    private ProductService productService;

    @Autowired
    private RestaurantService restaurantService;

    // READ - List all products
    @GetMapping
    public String listProducts(Model model, RedirectAttributes redirectAttributes) {
        try {
            List<Product> products = productService.findAllProducts();
            model.addAttribute("products", products);
            return "product/productList";
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Error loading products: " + e.getMessage());
            return "redirect:/backoffice";
        }
    }

    // CREATE - Show empty form to create new product
    @GetMapping("/new")
    public String showCreateForm(Model model, RedirectAttributes redirectAttributes) {
        try {
            model.addAttribute("product", new Product());
            model.addAttribute("restaurants", restaurantService.findAllRestaurants());
            return "product/productForm";
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Error loading form: " + e.getMessage());
            return "redirect:/backoffice/products";
        }
    }

    // CREATE - Process form submission to save new product
    @PostMapping
    public String createProduct(@Valid @ModelAttribute Product product,
                                BindingResult result,
                                Model model,
                                RedirectAttributes redirectAttributes) {
        if (result.hasErrors()) {
            try {
                model.addAttribute("restaurants", restaurantService.findAllRestaurants());
            } catch (Exception e) {
                redirectAttributes.addFlashAttribute("errorMessage", "Error loading form data");
                return "redirect:/backoffice/products";
            }
            return "product/productForm";
        }

        try {
            productService.saveProduct(product);
            redirectAttributes.addFlashAttribute("successMessage", "Product created successfully!");
            return "redirect:/backoffice/products";
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Error creating product: " + e.getMessage());
            return "redirect:/backoffice/products/new";
        }
    }

    // READ - View details of specific product
    @GetMapping("/{id}")
    public String viewProduct(@PathVariable int id, Model model, RedirectAttributes redirectAttributes) {
        try {
            Optional<Product> product = productService.findProductById(id);
            if (product.isPresent()) {
                model.addAttribute("product", product.get());
                return "product/productView";
            } else {
                redirectAttributes.addFlashAttribute("errorMessage", "Product with ID " + id + " not found!");
                return "redirect:/backoffice/products";
            }
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Error loading product: " + e.getMessage());
            return "redirect:/backoffice/products";
        }
    }

    // UPDATE - Show pre-filled form to edit existing product
    @GetMapping("/{id}/edit")
    public String showEditForm(@PathVariable int id, Model model, RedirectAttributes redirectAttributes) {
        try {
            Optional<Product> product = productService.findProductById(id);
            if (product.isEmpty()) {
                redirectAttributes.addFlashAttribute("errorMessage", "Product not found!");
                return "redirect:/backoffice/products";
            }

            model.addAttribute("product", product.get());
            model.addAttribute("restaurants", restaurantService.findAllRestaurants());
            return "product/productForm";
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Error loading edit form: " + e.getMessage());
            return "redirect:/backoffice/products";
        }
    }

    // UPDATE - Process form submission to update product
    @PostMapping("/{id}")
    public String updateProduct(@PathVariable int id,
                                @Valid @ModelAttribute Product product,
                                BindingResult result,
                                Model model,
                                RedirectAttributes redirectAttributes) {
        if (result.hasErrors()) {
            try {
                model.addAttribute("restaurants", restaurantService.findAllRestaurants());
            } catch (Exception e) {
                redirectAttributes.addFlashAttribute("errorMessage", "Error loading form data");
                return "redirect:/backoffice/products";
            }
            return "product/productForm";
        }

        try {
            Optional<Product> existingOpt = productService.findProductById(id);
            if (existingOpt.isEmpty()) {
                redirectAttributes.addFlashAttribute("errorMessage", "Product not found!");
                return "redirect:/backoffice/products";
            }

            Product existing = existingOpt.get();
            existing.setRestaurant(product.getRestaurant());
            existing.setName(product.getName());
            existing.setDescription(product.getDescription());
            existing.setCost(product.getCost());
            productService.saveProduct(existing);

            redirectAttributes.addFlashAttribute("successMessage", "Product updated successfully!");
            return "redirect:/backoffice/products";
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Error updating product: " + e.getMessage());
            return "redirect:/backoffice/products/" + id + "/edit";
        }
    }

    // DELETE - Delete specific product (CASCADE from restaurant)
    @PostMapping("/{id}/delete")
    public String deleteProduct(@PathVariable int id, RedirectAttributes redirectAttributes) {
        try {
            productService.deleteProductById(id);
            redirectAttributes.addFlashAttribute("successMessage", "Product deleted successfully!");
        } catch (DataIntegrityViolationException e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Cannot delete product with existing orders!");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Error deleting product: " + e.getMessage());
        }
        return "redirect:/backoffice/products";
    }
}
