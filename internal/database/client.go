package database

import (
	"context"
	"log"

	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

var queryCollection *mongo.Collection
var ticketCollection *mongo.Collection
var parkingLotCollection *mongo.Collection
var imageCollection *mongo.Collection
var reportCollection *mongo.Collection
var riskScoreCollection *mongo.Collection

var MongoDBURI string

func MongoDB() {
	uri := MongoDBURI
	serverAPI := options.ServerAPI(options.ServerAPIVersion1)
	client, err := mongo.Connect(options.Client().ApplyURI(uri).SetServerAPIOptions(serverAPI))
	if err != nil {
		log.Fatalf("Failed to create client: %v", err)
	}
	err = client.Ping(context.TODO(), nil)
	if err != nil {
		log.Fatalf("Failed to ping database: %v", err)
	}
	coll := client.Database("parkproof_db").Collection("queries")
	queryCollection = coll
	coll = client.Database("parkproof_db").Collection("tickets")
	ticketCollection = coll
	coll = client.Database("parkproof_db").Collection("parkingLots")
	parkingLotCollection = coll
	coll = client.Database("parkproof_db").Collection("images")
	imageCollection = coll
	coll = client.Database("parkproof_db").Collection("reports")
	reportCollection = coll
	coll = client.Database("parkproof_db").Collection("riskScores")
	riskScoreCollection = coll
	log.Println("MongoDB connected")
}
