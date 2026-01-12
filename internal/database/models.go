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

type TamperLog struct {
	ID            bson.ObjectID `bson:"_id,omitempty" json:"id"`
	VehicleNo     string        `bson:"vehicleNo" json:"vehicleNo"`
	VehicleType   string        `bson:"vehicleType" json:"vehicleType"`
	ParkingLotID  string        `bson:"parkingLotId" json:"parkingLotId"`
	EntryExitTime time.Time     `bson:"entryExitTime" json:"entryExitTime"`
	Hash          string        `bson:"hash" json:"hash"`
	PrevHash      string        `bson:"prevHash" json:"prevHash"`
	Action        string        `bson:"action" json:"action"` // "ENTRY" or "EXIT"
	CreatedAt     time.Time     `bson:"createdAt" json:"createdAt"`
}
