package com.beanstack.project_management_system.controller;

import java.util.UUID;

import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import com.beanstack.project_management_system.model.PlanType;
import com.beanstack.project_management_system.model.User;
import com.beanstack.project_management_system.response.PaymentLinkResponse;
import com.beanstack.project_management_system.service.SubscriptionService;
import com.beanstack.project_management_system.service.UserService;
import com.razorpay.PaymentLink;
import com.razorpay.RazorpayClient;

@RestController 
@RequestMapping ("/api/payments")
public class PaymentController {
    
    @Value ("${razorpay.api.key}")
    private String razorpayApiKey;

    @Value ("${razorpay.api.secret}")
    private String razorpayApiSecret;

    @Value("${pms.mail.base-url-frontend}")
    private String baseUrlFrontend;

    
    private UserService userService;
    private SubscriptionService subscriptionService;

    public PaymentController(UserService userService, SubscriptionService subscriptionService) {
        this.userService = userService;
        this.subscriptionService = subscriptionService;
    }

    @PostMapping("/{planType}")
    public ResponseEntity<PaymentLinkResponse> createPaymentLink(
        @RequestHeader("Authorization") String jwt, @PathVariable PlanType planType) throws Exception {
        jwt = jwt.replace("Bearer ", "");
        User user = userService.findUserProfileByJwt(jwt);
        int amount = 799*100; // Amount in paise (₹799)
        if(planType.equals(PlanType.ANNUALLY)) {
            amount = amount*12; 
            amount = (int) (amount*(0.7)); // 30% discount for annual plan
        } 

        try{
            RazorpayClient razorpay = new RazorpayClient(razorpayApiKey,razorpayApiSecret);

            JSONObject paymentLinkRequest = new JSONObject();
            paymentLinkRequest.put("amount", amount);
            paymentLinkRequest.put("currency", "INR");
            // Razorpay requires a unique reference of no more than 40 characters.
            // User and plan ownership are retained in the notes below.
            paymentLinkRequest.put("reference_id", UUID.randomUUID().toString().replace("-", ""));

            JSONObject customer = new JSONObject();
            customer.put("name", user.getFullName());
            customer.put("email", user.getEmail());
            paymentLinkRequest.put("customer", customer);

            JSONObject notify = new JSONObject();
            notify.put("sms", true);
            paymentLinkRequest.put("notify", notify);

            paymentLinkRequest.put("callback_url", baseUrlFrontend + "/upgrade_plan/success?planType="+planType);
            paymentLinkRequest.put("callback_method", "get");

            JSONObject notes = new JSONObject();
            notes.put("user_id", user.getId());
            notes.put("plan_type", planType.name());
            paymentLinkRequest.put("notes", notes);

            PaymentLink payment = razorpay.paymentLink.create(paymentLinkRequest);
            
            String paymentLinkId = payment.get("id");
            String paymentLinkUrl = payment.get("short_url");
            PaymentLinkResponse response = new PaymentLinkResponse();
            response.setPaymentLinkUrl(paymentLinkUrl);
            response.setPaymentId(paymentLinkId);

            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } catch (Exception e) {
            throw new IllegalStateException("Unable to create payment link", e);
        }
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verifyPayment(
        @RequestHeader("Authorization") String jwt,
        @RequestParam String paymentLinkId,
        @RequestParam PlanType planType) throws Exception {
        jwt = jwt.replace("Bearer ", "");
        User user = userService.findUserProfileByJwt(jwt);

        try {
            RazorpayClient razorpay = new RazorpayClient(razorpayApiKey, razorpayApiSecret);
            PaymentLink paymentLink = razorpay.paymentLink.fetch(paymentLinkId);
            String status = paymentLink.get("status");
            JSONObject notes = paymentLink.get("notes");

            if (!"paid".equalsIgnoreCase(status)
                || notes == null
                || !String.valueOf(user.getId()).equals(String.valueOf(notes.opt("user_id")))
                || !planType.name().equals(String.valueOf(notes.opt("plan_type")))) {
                return ResponseEntity.badRequest().body("Payment has not been completed or does not match this account.");
            }

            return ResponseEntity.ok(subscriptionService.upgradeSubscription(user.getId(), planType.name()));
        } catch (Exception e) {
            throw new IllegalStateException("Unable to verify payment", e);
        }
    }
}
