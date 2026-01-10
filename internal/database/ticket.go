package database

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/v2/bson"
)

type Ticket struct {
	ID            primitive.ObjectID `bson:"_id"`
	ParkingLotID  primitive.ObjectID `bson:"parkingLotId"`
	VehicleNumber string             `bson:"vehicleNumber"`
	Status        string             `bson:"status"`
	VehicleType   string             `bson:"vehicleType"`
	Amount        int                `bson:"amount"`
	ValidTill     time.Time          `bson:"validTill"`
	CreatedAt     time.Time          `bson:"createdAt"`
	UsedAt        time.Time          `bson:"usedAt,omitempty"`
}

type ParkingLot struct {
	ID              primitive.ObjectID `bson:"_id,omitempty"`
	PID             string             `bson:"pid,omitempty"`
	Name            string             `bson:"name"`
	Area            string             `bson:"area"`
	Address         string             `bson:"address"`
	Location        string             `bson:"location,omitempty"`
	Capacity        int                `bson:"capacity"`
	Lng             float64            `bson:"lng"`
	Lat             float64            `bson:"lat"`
	HasEVCharger    bool               `bson:"hasEVCharger,omitempty"`
	Occupied        int                `bson:"occupied,omitempty"`
	ContractorPhone string             `bson:"contractorPhone,omitempty"`
}

func GetAllTickets() ([]Ticket, error) {
	cursor, err := ticketCollection.Find(
		context.TODO(),
		bson.D{{Key: "status", Value: "CREATED"}},
	)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(context.TODO())

	var tickets []Ticket
	if err := cursor.All(context.TODO(), &tickets); err != nil {
		return nil, err
	}

	return tickets, nil
}

func UpdateTicket(ticket Ticket) error {
	_, err := ticketCollection.UpdateOne(
		context.TODO(),
		bson.D{{Key: "_id", Value: ticket.ID}},
		bson.D{{Key: "$set", Value: bson.D{{Key: "status", Value: ticket.Status}}}},
	)
	if err != nil {
		return err
	}
	DecrementParkingOccpancy(ticket.ParkingLotID.String())
	return nil
}

func DecrementParkingOccpancy(parkingLotID string) {
	_, err := parkingLotCollection.UpdateOne(
		context.TODO(),
		bson.D{{Key: "_id", Value: parkingLotID}},
		bson.D{{Key: "$set", Value: bson.D{{Key: "occupied", Value: bson.D{{Key: "$inc", Value: -1}}}}}},
	)
	if err != nil {
		return
	}
}
