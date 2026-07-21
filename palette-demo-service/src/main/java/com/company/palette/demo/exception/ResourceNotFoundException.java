package com.company.palette.demo.exception;

/**
 * Business exception for resource not found scenarios.
 */
public class ResourceNotFoundException extends RuntimeException {

    private final String resourceName;
    private final String resourceId;

    public ResourceNotFoundException(String resourceName, String resourceId) {
        super(String.format("%s not found with id: %s", resourceName, resourceId));
        this.resourceName = resourceName;
        this.resourceId = resourceId;
    }

    public String getResourceName() {
        return resourceName;
    }

    public String getResourceId() {
        return resourceId;
    }
}
