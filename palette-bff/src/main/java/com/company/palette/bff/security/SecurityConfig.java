package com.company.palette.bff.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.company.palette.bff.config.PaletteProperties;
import com.company.palette.bff.session.TokenRefreshFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JsonAuthenticationEntryPoint authenticationEntryPoint;
    private final JsonAccessDeniedHandler accessDeniedHandler;
    private final PaletteProperties properties;
    private final TokenRefreshFilter tokenRefreshFilter;

    public SecurityConfig(JsonAuthenticationEntryPoint authenticationEntryPoint,
                          JsonAccessDeniedHandler accessDeniedHandler,
                          PaletteProperties properties,
                          TokenRefreshFilter tokenRefreshFilter) {
        this.authenticationEntryPoint = authenticationEntryPoint;
        this.accessDeniedHandler = accessDeniedHandler;
        this.properties = properties;
        this.tokenRefreshFilter = tokenRefreshFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .headers(headers -> headers
                .frameOptions(frame -> frame.deny())
                .contentTypeOptions(content -> {})
                .referrerPolicy(referrer -> {})
                .permissionsPolicy(permissions -> permissions.policy(
                    "geolocation=(), microphone=(), camera=()"))
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
            )
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(
                    "/palette/api/v1/system/health/**",
                    "/palette/api/v1/system/info",
                    "/palette/api/v1/auth/login",
                    "/palette/api/v1/auth/session",
                    "/login/oauth2/**",
                    "/palette/api-docs/**",
                    "/palette/swagger-ui/**",
                    "/palette/swagger-ui.html",
                    "/v3/api-docs/**",
                    "/swagger-ui/**",
                    "/swagger-ui.html",
                    "/actuator/health/**"
                ).permitAll()
                .anyRequest().authenticated()
            )
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint(authenticationEntryPoint)
                .accessDeniedHandler(accessDeniedHandler)
            )
            .oauth2Login(oauth2 -> oauth2
                .loginPage("/palette/api/v1/auth/login")
            );
        // Note: logout is handled by AuthController's POST /palette/api/v1/auth/logout
        // which includes eIDP logout integration and audit logging

        // Register TokenRefreshFilter after OAuth2 login processing
        // so that authentication is established before token refresh is attempted
        http.addFilterAfter(tokenRefreshFilter,
                org.springframework.security.web.authentication.ui.DefaultLoginPageGeneratingFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        PaletteProperties.Cors corsProps = properties.getSecurity().getCors();
        configuration.setAllowedOrigins(java.util.Arrays.asList(corsProps.getAllowedOrigins().split(",")));
        configuration.setAllowedMethods(java.util.Arrays.asList(corsProps.getAllowedMethods().split(",")));
        configuration.setAllowedHeaders(java.util.Arrays.asList(corsProps.getAllowedHeaders().split(",")));
        configuration.setAllowCredentials(corsProps.isAllowCredentials());
        configuration.setMaxAge(corsProps.getMaxAge());

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
