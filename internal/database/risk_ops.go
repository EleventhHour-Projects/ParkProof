package database

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

// GetReportsLast48Hours returns reports for a parking lot in the last 48 hours
func GetReportsLast48Hours(parkingLotID string) ([]Report, error) {
	objID, err := bson.ObjectIDFromHex(parkingLotID)
	if err != nil {
		return nil, err
	}

	filter := bson.D{
		{Key: "parkingLotId", Value: objID},
		{Key: "createdAt", Value: bson.D{{Key: "$gte", Value: time.Now().Add(-48 * time.Hour)}}},
	}

	cursor, err := reportCollection.Find(context.TODO(), filter)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(context.TODO())

	var reports []Report
	if err := cursor.All(context.TODO(), &reports); err != nil {
		return nil, err
	}
	return reports, nil
}

// GetTicketsLastWindow returns tickets created in the last duration window
func GetTicketsLastWindow(parkingLotID string, duration time.Duration) ([]Ticket, error) {
	objID, err := bson.ObjectIDFromHex(parkingLotID)
	if err != nil {
		return nil, err
	}

	filter := bson.D{
		{Key: "parkingLotId", Value: objID},
		{Key: "createdAt", Value: bson.D{{Key: "$gte", Value: time.Now().Add(-duration)}}},
	}

	cursor, err := ticketCollection.Find(context.TODO(), filter)
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

// GetAllParkingLotIDs returns all parking lot IDs
func GetAllParkingLotIDs() ([]string, error) {
	cursor, err := parkingLotCollection.Find(context.TODO(), bson.D{})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(context.TODO())

	var lots []ParkingLot
	if err := cursor.All(context.TODO(), &lots); err != nil {
		return nil, err
	}

	var ids []string
	for _, lot := range lots {
		ids = append(ids, lot.ID.Hex())
	}
	return ids, nil
}

// SaveRiskScore saves the risk analysis result
// SaveRiskScore updates or inserts the risk analysis result
func SaveRiskScore(score RiskScore) error {
	filter := bson.D{{Key: "parkingLotId", Value: score.ParkingLotID}}
	update := bson.D{{Key: "$set", Value: score}}
	opts := options.UpdateOne().SetUpsert(true)

	_, err := riskScoreCollection.UpdateOne(context.TODO(), filter, update, opts)
	return err
}
