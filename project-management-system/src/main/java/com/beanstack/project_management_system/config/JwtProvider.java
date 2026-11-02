package com.beanstack.project_management_system.config;

import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.security.core.Authentication;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

public class JwtProvider {
    static SecretKey key = Keys.hmacShaKeyFor(JwtConstant.SECRET_KEY.getBytes());

    public static String generateToken(Authentication auth){
        String jwt = Jwts.builder()
            .issuedAt(new Date())
            .claim("email", auth.getName())
            .signWith(key)
            .compact();
        return jwt;
    }

    public static String getEmailFromToken(String token){
        String email = Jwts.parser()
            .verifyWith(key)
            .build()
            .parseSignedClaims(token)
            .getPayload()
            .get("email", String.class);
        return email;
    }
}
