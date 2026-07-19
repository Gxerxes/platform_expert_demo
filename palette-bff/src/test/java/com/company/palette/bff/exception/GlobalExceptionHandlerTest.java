package com.company.palette.bff.exception;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class GlobalExceptionHandlerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void shouldReturn404ForUnknownEndpoint() throws Exception {
        mockMvc.perform(get("/palette/api/v1/nonexistent"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldReturn401ForUnauthenticatedAccess() throws Exception {
        mockMvc.perform(get("/palette/api/v1/context"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("PALETTE_UNAUTHORIZED"));
    }
}
