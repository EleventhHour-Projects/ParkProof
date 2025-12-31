package database

import (
	"context"
	"errors"
	"time"
)

type QueryStatus string

const (
	QueryStatusAnswered QueryStatus = "ANSWERED"
	QueryStatusOpen     QueryStatus = "OPEN"
	QueryStatusExpired  QueryStatus = "EXPIRED"
)

type Query struct {
	ID               string      `json:"id"`
	Query            string      `json:"query"`
	ToParkingLot     string      `json:"to_parking_lot"`
	ResponseRequired bool        `json:"response_required"`
	Time             time.Time   `json:"time"`
	WithInTime       int         `json:"with_in_time"`
	Status           QueryStatus `json:"status"`
	Type             string      `json:"type"`
}

func AddQuery(q Query) error {
	if q.ToParkingLot == "" {
		return errors.New("Parking Lot ID can't be Empty")
	}
	if q.Query == "" {
		return errors.New("Query can't be Empty")
	}

	ctx := context.TODO()
	queryCollection.InsertOne(ctx, q)
	return nil
}

func GetQueryByID(id string) (Query, error) {
	ctx := context.TODO()

	var q Query
	res := queryCollection.FindOne(ctx, id)
	err := res.Decode(&q)
	if err != nil {
		return q, err
	}
	return q, nil
}

func GetQueryByParkingLot(id string) ([]Query, error) {
	ctx := context.TODO()

	var q []Query
	res, err := queryCollection.Find(ctx, id)
	if err != nil {
		return q, err
	}
	err = res.All(ctx, &q)
	if err != nil {
		return q, err
	}
	return q, nil
}
