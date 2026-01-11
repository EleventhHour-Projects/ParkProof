package database

import (
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

type Report struct {
	ID           bson.ObjectID `bson:"_id"`
	ParkingLotID bson.ObjectID `bson:"parkingLotId"`
	UserID       bson.ObjectID `bson:"userId"`
	Type         string        `bson:"type"`
	Status       string        `bson:"status"`
	CreatedAt    time.Time     `bson:"createdAt"`
}

type RiskScore struct {
	ID           bson.ObjectID `bson:"_id,omitempty"`
	ParkingLotID bson.ObjectID `bson:"parkingLotId"`
	Score        int           `bson:"score"`
	Reason       string        `bson:"reason"`
	Level        string        `bson:"level,omitempty"`      // keeping as optional
	AnalyzedAt   time.Time     `bson:"analyzedAt,omitempty"` // keeping as optional
}
