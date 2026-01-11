package database

import (
	"context"
	"errors"
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

type QueryStatus string

const (
	QueryStatusAnswered QueryStatus = "ANSWERED"
	QueryStatusOpen     QueryStatus = "OPEN"
	QueryStatusExpired  QueryStatus = "EXPIRED"
)

type Query struct {
	ID               string      `json:"id" bson:"id"`
	Query            string      `json:"query" bson:"query"`
	ToParkingLot     string      `json:"to_parking_lot" bson:"to_parking_lot"`
	ResponseRequired bool        `json:"response_required" bson:"response_required"`
	Time             time.Time   `json:"time" bson:"time"`
	WithInTime       int         `json:"with_in_time" bson:"with_in_time"`
	Status           QueryStatus `json:"status" bson:"status"`
	Type             string      `json:"type" bson:"type"`
	Reply            string      `json:"reply" bson:"reply"`
	ReplyImage       string      `json:"reply_image" bson:"reply_image"`
	RepliedAt        time.Time   `json:"replied_at" bson:"replied_at"`
}

func AddQuery(q Query) error {
	if q.ToParkingLot == "" {
		return errors.New("Parking Lot ID can't be Empty")
	}
	if q.Query == "" {
		return errors.New("Query can't be Empty")
	}

	ctx := context.TODO()
	_, err := queryCollection.InsertOne(ctx, q)
	return err
}

func ReplyToQuery(id, reply, replyImage string) error {
	ctx := context.TODO()
	filter := bson.M{"id": id}
	update := bson.M{
		"$set": bson.M{
			"reply":       reply,
			"reply_image": replyImage,
			"replied_at":  time.Now(),
			"status":      QueryStatusAnswered,
		},
	}
	_, err := queryCollection.UpdateOne(ctx, filter, update)
	return err
}

func GetQueryByID(id string) (Query, error) {
	ctx := context.TODO()

	var q Query
	res := queryCollection.FindOne(ctx, bson.M{"id": id})
	err := res.Decode(&q)
	if err != nil {
		return q, err
	}
	return q, nil
}

func GetQueryByParkingLot(id string) ([]Query, error) {
	ctx := context.TODO()

	var q []Query
	// Pass a filter document, not a string
	res, err := queryCollection.Find(ctx, bson.M{"to_parking_lot": id})
	if err != nil {
		return q, err
	}
	err = res.All(ctx, &q)
	if err != nil {
		return q, err
	}
	return q, nil
}
