package com.beanstack.project_management_system.controller;

import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.beanstack.project_management_system.model.PlanType;
import com.beanstack.project_management_system.model.User;
import com.beanstack.project_management_system.response.PaymentLinkResponse;
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

    public PaymentController(UserService userService) {
        this.userService = userService;
    }

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

            JSONObject customer = new JSONObject();
            customer.put("name", user.getFullName());
            customer.put("email", user.getEmail());
            paymentLinkRequest.put("customer", customer);

            JSONObject notify = new JSONObject();
            notify.put("sms", true);
            paymentLinkRequest.put("notify", notify);

            paymentLinkRequest.put("callback_url", baseUrlFrontend + "/upgrade_plan/success?planType="+planType);

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
}
