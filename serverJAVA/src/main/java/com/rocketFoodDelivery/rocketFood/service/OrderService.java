package com.rocketFoodDelivery.rocketFood.service;

// Java standard library
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

// Spring Framework
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// JPA
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

// Project models
import com.rocketFoodDelivery.rocketFood.models.Courier;
import com.rocketFoodDelivery.rocketFood.models.Customer;
import com.rocketFoodDelivery.rocketFood.models.Order;
import com.rocketFoodDelivery.rocketFood.models.OrderStatus;
import com.rocketFoodDelivery.rocketFood.models.Product;
import com.rocketFoodDelivery.rocketFood.models.ProductOrder;
import com.rocketFoodDelivery.rocketFood.models.Restaurant;

// Project DTOs
import com.rocketFoodDelivery.rocketFood.dtos.order.ApiAssignCourierDTO;
import com.rocketFoodDelivery.rocketFood.dtos.order.ApiOrderDTO;
import com.rocketFoodDelivery.rocketFood.dtos.order.ApiCreateOrderDTO;
import com.rocketFoodDelivery.rocketFood.dtos.order.ApiUpdateOrderDTO;
import com.rocketFoodDelivery.rocketFood.dtos.order.ApiUpdateRatingDTO;
import com.rocketFoodDelivery.rocketFood.dtos.product.ApiProductForOrderApiDTO;

// Project repositories
import com.rocketFoodDelivery.rocketFood.repository.CourierRepository;
import com.rocketFoodDelivery.rocketFood.repository.OrderRepository;
import com.rocketFoodDelivery.rocketFood.repository.OrderStatusRepository;
import com.rocketFoodDelivery.rocketFood.repository.ProductRepository;
import com.rocketFoodDelivery.rocketFood.repository.ProductOrderRepository;

@Service       
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderStatusRepository orderStatusRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductOrderRepository productOrderRepository;

    @Autowired
    private CourierRepository courierRepository;

    @Autowired
    private NotificationService notificationService;

    @PersistenceContext
    private EntityManager entityManager;

    // Constructor
    public OrderService(OrderRepository orderRepository, OrderStatusRepository orderStatusRepository,
                        ProductRepository productRepository, ProductOrderRepository productOrderRepository,
                        CourierRepository courierRepository, NotificationService notificationService){
        this.orderRepository = orderRepository;
        this.orderStatusRepository = orderStatusRepository;
        this.productRepository = productRepository;
        this.productOrderRepository = productOrderRepository;
        this.courierRepository = courierRepository;
        this.notificationService = notificationService;
    }

    // ==================== JPA CRUD Service Methods ====================

    // CREATE / UPDATE - Save entity using JPA
    public Order saveOrder(Order order) {
        return orderRepository.save(order);
    }

    // READ - Find all orders using JPA
    public List<Order> findAllOrders() {
        return orderRepository.findAll();
    }

    // READ - Find an order by ID using JPA
    public Optional<Order> findOrderById(int id) {
        return orderRepository.findById(id);
    }

    // READ - Find orders by restaurant ID using native SQL
    public List<Order> findOrdersByRestaurantId(int restaurantId) {
        return orderRepository.findOrdersByRestaurantId(restaurantId);
    }

    // READ - Find orders by customer ID using native SQL
    public List<Order> findOrdersByCustomerId(int customerId) {
        return orderRepository.findOrdersByCustomerId(customerId);
    }

    // READ - Find orders by courier ID using native SQL
    public List<Order> findOrdersByCourierId(int courierId) {
        return orderRepository.findOrdersByCourierId(courierId);
    }

    // READ - Find all pending orders using native SQL
    public List<Order> findPendingOrders() {
        return orderRepository.findPendingOrders();
    }

    // UPDATE - Update only order status using native SQL
    @Transactional
    public void updateOrderStatus(int id, int orderStatusId) {
        orderRepository.updateOrderStatus(id, orderStatusId);
    }

    // DELETE - Delete an order by ID using JPA
    public void deleteOrderById(int id) {
        orderRepository.deleteById(id);
    }

    // ==================== DTO-Based Service Methods (used by API controller) ====================

    // READ - Get orders by type (customer/restaurant) as DTOs
    public List<ApiOrderDTO> getOrderDTOs(String type, int id) {
        List<Order> orders;
        if (type.equals("customer")) {
            orders = this.findOrdersByCustomerId(id);
        } else if (type.equals("courier")) {
            orders = this.findOrdersByCourierId(id);
        } else {
            orders = this.findOrdersByRestaurantId(id);
        }
        List<ApiOrderDTO> dtos = new ArrayList<>();
        for (Order order : orders) {
            dtos.add(mapOrderToDTO(order));
        }
        return dtos;
    }

    // READ - Get all pending orders as DTOs
    public List<ApiOrderDTO> getPendingOrderDTOs() {
        List<Order> orders = this.findPendingOrders();
        List<ApiOrderDTO> dtos = new ArrayList<>();
        for (Order order : orders) {
            dtos.add(mapOrderToDTO(order));
        }
        return dtos;
    }

    // CREATE - Create an order from DTO
    @Transactional
    public Optional<ApiOrderDTO> createOrder(ApiCreateOrderDTO createOrderDTO) {
        Optional<OrderStatus> pendingStatus = orderStatusRepository.findOrderStatusByName("pending");
        if (pendingStatus.isEmpty()) return Optional.empty();

        Order order = new Order();
        order.setRestaurant(Restaurant.builder().id(createOrderDTO.getRestaurantId()).build());
        order.setCustomer(Customer.builder().id(createOrderDTO.getCustomerId()).build());
        order.setOrderStatus(pendingStatus.get());
        order.setRestaurantRating(null);
        order.setSendEmail(createOrderDTO.isSendEmail());
        order.setSendSms(createOrderDTO.isSendSms());
        Order saved = this.saveOrder(order);
        int orderId = saved.getId();

        if (createOrderDTO.getProducts() != null) {
            for (ApiCreateOrderDTO.ProductItem item : createOrderDTO.getProducts()) {
                Optional<Product> product = productRepository.findById(item.getId());
                if (product.isEmpty()) return Optional.empty();
                ProductOrder po = new ProductOrder();
                po.setProduct(Product.builder().id(item.getId()).build());
                po.setOrder(Order.builder().id(orderId).build());
                po.setProductQuantity(item.getQuantity());
                po.setProductUnitCost(product.get().getCost());
                productOrderRepository.save(po);
            }
        }

        entityManager.flush();
        entityManager.clear();

        Optional<Order> createdOrder = this.findOrderById(orderId);
        if (createdOrder.isEmpty()) return Optional.empty();

        Order finalOrder = createdOrder.get();
        Customer customer = finalOrder.getCustomer();

        if (createOrderDTO.isSendEmail()) {
            notificationService.sendEmail(finalOrder, customer);
        }
        if (createOrderDTO.isSendSms()) {
            notificationService.sendSms(finalOrder, customer);
        }

        return Optional.of(mapOrderToDTO(finalOrder));
    }

    // UPDATE - Update an order from DTO
    @Transactional
    public Optional<ApiOrderDTO> updateOrderFromDTO(int id, ApiUpdateOrderDTO updateDTO) {
        Optional<Order> existing = this.findOrderById(id);
        if (existing.isEmpty()) return Optional.empty();
        Order order = existing.get();
        order.setRestaurant(Restaurant.builder().id(updateDTO.getRestaurantId()).build());
        order.setCustomer(Customer.builder().id(updateDTO.getCustomerId()).build());
        order.setOrderStatus(OrderStatus.builder().id(updateDTO.getOrderStatusId()).build());
        order.setRestaurantRating(updateDTO.getRestaurantRating());
        this.saveOrder(order);
        entityManager.flush();
        entityManager.clear();
        Optional<Order> updated = this.findOrderById(id);
        return updated.map(this::mapOrderToDTO);
    }

    // UPDATE - Assign a courier to an order
    @Transactional
    public Optional<ApiOrderDTO> assignCourier(int orderId, ApiAssignCourierDTO dto) {
        Optional<Order> existing = this.findOrderById(orderId);
        if (existing.isEmpty()) return Optional.empty();
        Optional<Courier> courier = courierRepository.findById(dto.getCourierId());
        if (courier.isEmpty()) return Optional.empty();
        Order order = existing.get();
        order.setCourier(courier.get());
        this.saveOrder(order);
        entityManager.flush();
        entityManager.clear();
        Optional<Order> updated = this.findOrderById(orderId);
        return updated.map(this::mapOrderToDTO);
    }

    // UPDATE - Update restaurant rating on an order
    @Transactional
    public Optional<ApiOrderDTO> updateRating(int orderId, ApiUpdateRatingDTO dto) {
        Optional<Order> existing = this.findOrderById(orderId);
        if (existing.isEmpty()) return Optional.empty();
        Order order = existing.get();
        order.setRestaurantRating(dto.getRestaurantRating());
        this.saveOrder(order);
        entityManager.flush();
        entityManager.clear();
        Optional<Order> updated = this.findOrderById(orderId);
        return updated.map(this::mapOrderToDTO);
    }

    // DELETE - Delete an order by ID (with product orders), return true if found
    @Transactional
    public boolean deleteOrderIfExists(int id) {
        Optional<Order> existing = this.findOrderById(id);
        if (existing.isEmpty()) return false;
        productOrderRepository.deleteProductOrdersByOrderId(id);
        this.deleteOrderById(id);
        return true;
    }

    private ApiOrderDTO mapOrderToDTO(Order order) {
        ApiOrderDTO dto = new ApiOrderDTO();
        dto.setId(order.getId());

        if (order.getCustomer() != null) {
            dto.setCustomer_id(order.getCustomer().getId());
            if (order.getCustomer().getUser() != null) {
                dto.setCustomer_name(order.getCustomer().getUser().getName());
            }
            if (order.getCustomer().getAddress() != null) {
                dto.setCustomer_address(order.getCustomer().getAddress().getStreetAddress());
            }
        }

        if (order.getRestaurant() != null) {
            dto.setRestaurant_id(order.getRestaurant().getId());
            dto.setRestaurant_name(order.getRestaurant().getName());
            if (order.getRestaurant().getAddress() != null) {
                dto.setRestaurant_address(order.getRestaurant().getAddress().getStreetAddress());
            }
        }

        if (order.getOrderStatus() != null) {
            dto.setStatus(order.getOrderStatus().getName());
        }

        if (order.getCourier() != null) {
            dto.setCourier_id(order.getCourier().getId());
            if (order.getCourier().getUser() != null) {
                dto.setCourier_name(order.getCourier().getUser().getName());
            }
        }

        List<ApiProductForOrderApiDTO> productDtos = new ArrayList<>();
        long totalCost = 0;
        if (order.getProductOrders() != null) {
            for (ProductOrder po : order.getProductOrders()) {
                ApiProductForOrderApiDTO pDto = new ApiProductForOrderApiDTO();
                pDto.setId(po.getProduct().getId());
                pDto.setProduct_name(po.getProduct().getName());
                pDto.setQuantity(po.getProductQuantity());
                pDto.setUnit_cost(po.getProductUnitCost());
                pDto.setTotal_cost(po.getProductQuantity() * po.getProductUnitCost());
                productDtos.add(pDto);
                totalCost += (long) po.getProductQuantity() * po.getProductUnitCost();
            }
        }
        dto.setProducts(productDtos);
        dto.setTotal_cost(totalCost);
        dto.setCreated_on(order.getCreatedOn());

        return dto;
    }
}
