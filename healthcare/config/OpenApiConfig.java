package com.example.healthcare.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Swagger UI: http://localhost:8080/swagger-ui.html
 *
 * To authenticate:
 * 1. Call POST /api/auth/login (or /api/auth/register) to obtain a JWT.
 * 2. Click the "Authorize" button in Swagger UI.
 * 3. Enter: Bearer <token>
 * 4. All subsequent requests will include the Authorization header automatically.
 */
@Configuration
public class OpenApiConfig {

    private static final String SCHEME_NAME = "bearerAuth";

    @Bean
    public OpenAPI healthcareOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("HealthCare Appointment Management System API")
                        .description("REST API for managing patients, doctors and appointments at Square Health Ltd.")
                        .version("v1.0.0")
                        .contact(new Contact().name("Square Health Ltd.").email("engineering@squarehealth.example")))
                .addSecurityItem(new SecurityRequirement().addList(SCHEME_NAME))
                .components(new Components()
                        .addSecuritySchemes(SCHEME_NAME, new SecurityScheme()
                                .name(SCHEME_NAME)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")));
    }
}
