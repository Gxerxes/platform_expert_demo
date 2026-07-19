package com.company.palette.bff.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Swagger UI static resources - map /swagger-ui/** to webjar resources
        registry.addResourceHandler("/swagger-ui/**")
                .addResourceLocations(
                    "classpath:/META-INF/resources/webjars/swagger-ui/5.17.14/",
                    "classpath:/META-INF/resources/webjars/swagger-ui/"
                );
    }
}
