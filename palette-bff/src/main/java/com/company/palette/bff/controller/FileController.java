package com.company.palette.bff.controller;

import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.company.palette.bff.common.ApiResponse;
import com.company.palette.bff.exception.ErrorCode;
import com.company.palette.bff.exception.PaletteException;

@RestController
@RequestMapping("/palette/api/v1/files")
public class FileController {

    @PostMapping
    public ApiResponse<Map<String, String>> upload(@RequestParam(value = "file", required = false) MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new PaletteException(ErrorCode.BAD_REQUEST, "File is required");
        }

        throw new PaletteException(ErrorCode.SERVICE_UNAVAILABLE, "File upload service not yet implemented");
    }

    @GetMapping("/{id}")
    public ApiResponse<Map<String, String>> download(@PathVariable String id) {
        throw new PaletteException(ErrorCode.SERVICE_UNAVAILABLE, "File download service not yet implemented");
    }
}
