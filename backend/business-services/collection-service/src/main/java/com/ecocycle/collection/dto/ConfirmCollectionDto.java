package com.ecocycle.collection.dto;

public class ConfirmCollectionDto {
    private String photoUrl;
    private Double weight;
    private Boolean isValid;

    public ConfirmCollectionDto() {}
    public ConfirmCollectionDto(String photoUrl, Double weight) {
        this.photoUrl = photoUrl;
        this.weight = weight;
    }

    public String getPhotoUrl() { return photoUrl; }
    public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }

    public Double getWeight() { return weight; }
    public void setWeight(Double weight) { this.weight = weight; }

    public Boolean getIsValid() { return isValid; }
    public void setIsValid(Boolean isValid) { this.isValid = isValid; }
}
