package com.centinela360.security;

import com.centinela360.domain.Role;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;

@Service
public class JwtService {

    // TODO (Fase 11): mover esta clave a variable de entorno, nunca hardcodeada en producción
    private final SecretKey key = Keys.hmacShaKeyFor(
            "centinela360-dev-secret-key-cambiar-en-produccion-1234567890".getBytes()
    );

    public String generateToken(String subject, Role role) {
        return Jwts.builder()
                .subject(subject)
                .claim("role", role.name())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 3600_000)) // 1 hora
                .signWith(key)
                .compact();
    }

    public io.jsonwebtoken.Claims parseToken(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}