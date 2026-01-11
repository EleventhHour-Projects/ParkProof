package database

import (
	"context"

	"go.mongodb.org/mongo-driver/v2/bson"
)

type Image struct {
	ID          string `bson:"id" json:"id"`
	Data        []byte `bson:"data" json:"data"`
	ContentType string `bson:"content_type" json:"content_type"`
}

func SaveImage(img Image) error {
	ctx := context.TODO()
	_, err := imageCollection.InsertOne(ctx, img)
	return err
}

func GetImage(id string) (Image, error) {
	ctx := context.TODO()
	var img Image
	err := imageCollection.FindOne(ctx, bson.M{"id": id}).Decode(&img)
	return img, err
}
