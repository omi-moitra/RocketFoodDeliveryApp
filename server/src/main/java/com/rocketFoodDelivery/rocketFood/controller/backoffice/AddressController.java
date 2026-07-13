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
import com.rocketFoodDelivery.rocketFood.models.Address;

// Project services
import com.rocketFoodDelivery.rocketFood.service.AddressService;

@Controller
@RequestMapping("/backoffice/addresses")
public class AddressController {

    @Autowired
    private AddressService addressService;

    // READ - List all addresses
    @GetMapping
    public String listAddresses(Model model, RedirectAttributes redirectAttributes) {
        try {
            List<Address> addresses = addressService.findAllAddresses();
            model.addAttribute("addresses", addresses);
            return "address/addressList";
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Error loading addresses: " + e.getMessage());
            return "redirect:/backoffice";
        }
    }

    // CREATE - Show empty form to create new address
    @GetMapping("/new")
    public String showCreateForm(Model model, RedirectAttributes redirectAttributes) {
        try {
            model.addAttribute("address", new Address());
            return "address/addressForm";
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Error loading form: " + e.getMessage());
            return "redirect:/backoffice/addresses";
        }
    }

    // CREATE - Process form submission to save new address
    @PostMapping
    public String createAddress(@Valid @ModelAttribute Address address,
                                BindingResult result,
                                Model model,
                                RedirectAttributes redirectAttributes) {
        if (result.hasErrors()) {
            return "address/addressForm";
        }

        try {
            addressService.saveAddress(address);
            redirectAttributes.addFlashAttribute("successMessage", "Address created successfully!");
            return "redirect:/backoffice/addresses";
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Error creating address: " + e.getMessage());
            return "redirect:/backoffice/addresses/new";
        }
    }

    // READ - View details of specific address
    @GetMapping("/{id}")
    public String viewAddress(@PathVariable int id, Model model, RedirectAttributes redirectAttributes) {
        try {
            Optional<Address> address = addressService.findAddressById(id);
            if (address.isPresent()) {
                model.addAttribute("address", address.get());
                return "address/addressView";
            } else {
                redirectAttributes.addFlashAttribute("errorMessage", "Address with ID " + id + " not found!");
                return "redirect:/backoffice/addresses";
            }
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Error loading address: " + e.getMessage());
            return "redirect:/backoffice/addresses";
        }
    }

    // UPDATE - Show pre-filled form to edit existing address
    @GetMapping("/{id}/edit")
    public String showEditForm(@PathVariable int id, Model model, RedirectAttributes redirectAttributes) {
        try {
            Optional<Address> address = addressService.findAddressById(id);
            if (address.isEmpty()) {
                redirectAttributes.addFlashAttribute("errorMessage", "Address not found!");
                return "redirect:/backoffice/addresses";
            }

            model.addAttribute("address", address.get());
            return "address/addressForm";
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Error loading edit form: " + e.getMessage());
            return "redirect:/backoffice/addresses";
        }
    }

    // UPDATE - Process form submission to update address
    @PostMapping("/{id}")
    public String updateAddress(@PathVariable int id,
                                @Valid @ModelAttribute Address address,
                                BindingResult result,
                                Model model,
                                RedirectAttributes redirectAttributes) {
        if (result.hasErrors()) {
            return "address/addressForm";
        }

        try {
            Optional<Address> existingOpt = addressService.findAddressById(id);
            if (existingOpt.isEmpty()) {
                redirectAttributes.addFlashAttribute("errorMessage", "Address not found!");
                return "redirect:/backoffice/addresses";
            }

            Address existing = existingOpt.get();
            existing.setStreetAddress(address.getStreetAddress());
            existing.setCity(address.getCity());
            existing.setPostalCode(address.getPostalCode());
            addressService.saveAddress(existing);

            redirectAttributes.addFlashAttribute("successMessage", "Address updated successfully!");
            return "redirect:/backoffice/addresses";
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Error updating address: " + e.getMessage());
            return "redirect:/backoffice/addresses/" + id + "/edit";
        }
    }

    // DELETE - Delete specific address
    @PostMapping("/{id}/delete")
    public String deleteAddress(@PathVariable int id, RedirectAttributes redirectAttributes) {
        try {
            addressService.deleteAddressById(id);
            redirectAttributes.addFlashAttribute("successMessage", "Address deleted successfully!");
        } catch (DataIntegrityViolationException e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Cannot delete address with existing associations!");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Error deleting address: " + e.getMessage());
        }
        return "redirect:/backoffice/addresses";
    }
}
