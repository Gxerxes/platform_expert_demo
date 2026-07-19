package com.company.palette.bff.system;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class HealthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void livenessShouldReturnUp() throws Exception {
        mockMvc.perform(get("/palette/api/v1/system/health/live"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    void readinessShouldReturnUp() throws Exception {
        mockMvc.perform(get("/palette/api/v1/system/health/ready"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    void infoShouldReturnApplicationDetails() throws Exception {
        mockMvc.perform(get("/palette/api/v1/system/info"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.application").value("palette-bff"))
                .andExpect(jsonPath("$.version").value("1.0.0"))
                .andExpect(jsonPath("$.buildTime").exists());
    }
}
