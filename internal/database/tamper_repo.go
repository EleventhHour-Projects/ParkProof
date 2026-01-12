package database

import (
	"context"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

func GetLastTamperLog() (*TamperLog, error) {
	var lastLog TamperLog
	opts := options.FindOne().SetSort(bson.D{{Key: "_id", Value: -1}})
	err := tamperCollection.FindOne(context.TODO(), bson.D{}, opts).Decode(&lastLog)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil // No logs yet, this is fine
		}
		return nil, err
	}
	return &lastLog, nil
}

func InsertTamperLog(logData TamperLog) error {
	_, err := tamperCollection.InsertOne(context.TODO(), logData)
	return err
}

func GetAllTamperLogs() ([]TamperLog, error) {
	var logs []TamperLog
	cursor, err := tamperCollection.Find(context.TODO(), bson.D{})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(context.TODO())

	if err = cursor.All(context.TODO(), &logs); err != nil {
		return nil, err
	}
	return logs, nil
}
