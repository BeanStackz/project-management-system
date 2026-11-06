package com.beanstack.project_management_system.config;

import java.util.Arrays;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;

import jakarta.servlet.http.HttpServletRequest;

@Configuration 
@EnableWebSecurity 
public class AppConfig {

    @Value("${pms.mail.base-url-frontend}")
    private String baseUrlFrontend;
    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        
        http.sessionManagement(Management -> Management.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(authorize -> authorize.requestMatchers("/api/pricing").permitAll()
        .requestMatchers("/api/**").authenticated()
        .anyRequest().permitAll())
        .httpBasic(basic -> basic.disable())
        .addFilterBefore(new JwtTokenValidator(), BasicAuthenticationFilter.class)
        .csrf( csrf -> csrf.disable())
        .cors(cors -> cors.configurationSource(new CorsConfigurationSource() {
            @Override
            public CorsConfiguration getCorsConfiguration(HttpServletRequest request) {
                CorsConfiguration config = new CorsConfiguration();
                config.setAllowedOrigins(Arrays.asList("http://localhost:3000", "http://localhost:4200", "http://localhost:5173", baseUrlFrontend));
                config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE"));
                config.setAllowedHeaders(Arrays.asList("*"));
                config.setAllowCredentials(true);
                config.setMaxAge(3600L);
                config.setExposedHeaders(Arrays.asList("Authorization", "Content-Type"));
                return config;
            }
        }));
        return http.build();
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

   
    
}

