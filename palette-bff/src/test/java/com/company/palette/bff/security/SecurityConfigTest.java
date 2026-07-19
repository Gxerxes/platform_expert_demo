package com.company.palette.bff.security;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class SecurityConfigTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void healthLiveShouldBePublic() throws Exception {
        mockMvc.perform(get("/palette/api/v1/system/health/live"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    void healthReadyShouldBePublic() throws Exception {
        mockMvc.perform(get("/palette/api/v1/system/health/ready"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    void systemInfoShouldBePublic() throws Exception {
        mockMvc.perform(get("/palette/api/v1/system/info"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.application").value("palette-bff"));
    }

    @Test
    void authLoginShouldBePublic() throws Exception {
        mockMvc.perform(get("/palette/api/v1/auth/login"))
                .andExpect(status().isOk());
    }

    @Test
    void contextShouldRequireAuthentication() throws Exception {
        mockMvc.perform(get("/palette/api/v1/context"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void configShouldRequireAuthentication() throws Exception {
        mockMvc.perform(get("/palette/api/v1/config"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void backendGatewayShouldRequireAuthentication() throws Exception {
        mockMvc.perform(get("/palette/api/v1/backend/test"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldReturnJsonForUnauthenticated() throws Exception {
        mockMvc.perform(get("/palette/api/v1/context"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("PALETTE_UNAUTHORIZED"))
                .andExpect(jsonPath("$.message").exists())
                .andExpect(jsonPath("$.timestamp").exists());
    }
}
